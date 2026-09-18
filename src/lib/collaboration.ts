import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { TranslationItem } from '@/types';

export interface CollabPeerUser {
  name: string;
  color: string;
  activeCell?: { key: string; field: string } | null;
}

export interface CollabSession {
  roomId: string;
  ydoc: Y.Doc;
  provider: WebrtcProvider;
  yTranslations: Y.Map<any>;
  yKeys: Y.Array<string>;
  yLanguages: Y.Array<string>;
  destroy: () => void;
}

export const DEFAULT_SIGNALING_SERVERS = [
  'wss://y-webrtc.fly.dev',
  'wss://y-webrtc-signaling.fly.dev',
];

/**
 * Resolves the optimal signaling servers for the current environment.
 * In local development (localhost), it prepends the Vite dev signaling server endpoint.
 */
export function getEffectiveSignalingServers(customServers?: string[]): string[] {
  if (customServers && customServers.length > 0) {
    return customServers;
  }
  const servers = [...DEFAULT_SIGNALING_SERVERS];
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      servers.unshift(`${proto}//${window.location.host}/_y_signaling`);
    }
  }
  return servers;
}

export const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

const AVATAR_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
];

const ANIMAL_NAMES = [
  'Panda',
  'Falcon',
  'Otter',
  'Fox',
  'Dolphin',
  'Koala',
  'Lynx',
  'Hawk',
  'Cheetah',
  'Penguin',
];

/**
 * Generates an 8-character random room ID
 */
export function generateCollabRoomId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Generates a random peer username and distinct avatar color
 */
export function generateRandomPeerProfile(): { name: string; color: string } {
  const animal = ANIMAL_NAMES[Math.floor(Math.random() * ANIMAL_NAMES.length)];
  const num = Math.floor(10 + Math.random() * 90);
  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  return {
    name: `${animal}-${num}`,
    color,
  };
}

/**
 * Initializes a peer-to-peer WebRTC collaboration session
 */
export function initCollabSession(
  roomId: string,
  options?: {
    password?: string | null;
    signalingServers?: string[];
    initialItems?: TranslationItem[];
    initialLanguages?: string[];
    isInitiator?: boolean;
  }
): CollabSession {
  const ydoc = new Y.Doc();
  const roomName = `jsonlink-collab-${roomId.trim().toLowerCase()}`;
  const signaling = getEffectiveSignalingServers(options?.signalingServers);

  const provider = new WebrtcProvider(roomName, ydoc, {
    signaling,
    password: options?.password ? options.password.trim() : undefined,
    peerOpts: {
      config: {
        iceServers: DEFAULT_ICE_SERVERS,
      },
    },
  });

  const yTranslations = ydoc.getMap<any>('translations');
  const yKeys = ydoc.getArray<string>('keys');
  const yLanguages = ydoc.getArray<string>('languages');

  // Seed with initial items ONLY if initiator AND doc is empty and initial data provided
  if (
    options?.isInitiator !== false &&
    options?.initialItems &&
    options.initialItems.length > 0 &&
    yKeys.length === 0 &&
    yTranslations.size === 0
  ) {
    ydoc.transact(() => {
      const langs = options.initialLanguages || ['en', 'my'];
      yLanguages.push(langs);

      const keys: string[] = [];
      for (const item of options.initialItems!) {
        keys.push(item.key);
        const cellData: Record<string, string> = {};
        for (const [k, v] of Object.entries(item)) {
          if (k !== 'key') {
            cellData[k] = v || '';
          }
        }
        yTranslations.set(item.key, cellData);
      }
      yKeys.push(keys);
    });
  }

  return {
    roomId,
    ydoc,
    provider,
    yTranslations,
    yKeys,
    yLanguages,
    destroy: () => {
      try {
        provider.destroy();
        ydoc.destroy();
      } catch {
        // Safe disposal
      }
    },
  };
}

/**
 * Extracts TranslationItem[] and languages[] from a Yjs document
 */
export function extractItemsFromYDoc(ydoc: Y.Doc): {
  items: TranslationItem[];
  languages: string[];
} {
  const yTranslations = ydoc.getMap<any>('translations');
  const yKeys = ydoc.getArray<string>('keys');
  const yLanguages = ydoc.getArray<string>('languages');

  const languages = Array.from(yLanguages.toArray());
  const keys = Array.from(yKeys.toArray());
  const items: TranslationItem[] = [];

  for (const key of keys) {
    const itemData = yTranslations.get(key) || {};
    const item: TranslationItem = {
      key,
      description: itemData.description || '',
    };
    for (const lang of languages) {
      item[lang] = itemData[lang] || '';
    }
    items.push(item);
  }

  return { items, languages };
}

/**
 * Syncs local items change to Yjs doc
 */
export function applyLocalChangeToYDoc(
  ydoc: Y.Doc,
  items: TranslationItem[],
  languages: string[],
  origin: any = 'local'
) {
  const yTranslations = ydoc.getMap<any>('translations');
  const yKeys = ydoc.getArray<string>('keys');
  const yLanguages = ydoc.getArray<string>('languages');

  ydoc.transact(() => {
    // 1. Sync languages list
    const currentLangs = yLanguages.toArray();
    if (
      currentLangs.length !== languages.length ||
      !languages.every((l, idx) => l === currentLangs[idx])
    ) {
      yLanguages.delete(0, yLanguages.length);
      yLanguages.push(languages);
    }

    // 2. Sync keys order
    const currentKeys = yKeys.toArray();
    const newKeys = items.map(i => i.key);
    if (
      currentKeys.length !== newKeys.length ||
      !newKeys.every((k, idx) => k === currentKeys[idx])
    ) {
      yKeys.delete(0, yKeys.length);
      yKeys.push(newKeys);
    }

    // 3. Remove deleted keys from map
    const newKeySet = new Set(newKeys);
    for (const key of currentKeys) {
      if (!newKeySet.has(key)) {
        yTranslations.delete(key);
      }
    }

    // 4. Sync cell values
    for (const item of items) {
      const existing = yTranslations.get(item.key) || {};
      let changed = false;
      const updated: Record<string, string> = { ...existing };

      for (const [k, v] of Object.entries(item)) {
        if (k !== 'key' && existing[k] !== v) {
          updated[k] = v || '';
          changed = true;
        }
      }

      if (changed || !yTranslations.has(item.key)) {
        yTranslations.set(item.key, updated);
      }
    }
  }, origin);
}
