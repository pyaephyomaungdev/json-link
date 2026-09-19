import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { TranslationItem } from '@/types';

export interface CollabPeerUser {
  name: string;
  color: string;
  activeCell?: { key: string; field: string } | null;
  pointer?: { x: number; y: number } | null;
  scroll?: { left: number; top: number } | null;
  clientID?: number;
  lastSeen?: number;
}

/**
 * Returns a 2-character uppercase initials badge for a peer (e.g., 'HA' for 'Hawk-30')
 */
export function getPeerInitials(name: string): string {
  if (!name) return '??';
  const clean = name.trim();
  const letterParts = clean.split(/[\s-_]+/).filter(p => /[A-Za-z]/.test(p));
  if (letterParts.length >= 2 && letterParts[0] && letterParts[1]) {
    return (letterParts[0][0] + letterParts[1][0]).toUpperCase();
  }
  const justAlpha = clean.replace(/[^A-Za-z]/g, '');
  if (justAlpha.length >= 2) {
    return justAlpha.slice(0, 2).toUpperCase();
  }
  const alphanumeric = clean.replace(/[^A-Za-z0-9]/g, '');
  if (alphanumeric.length >= 1) {
    return alphanumeric.slice(0, 2).toUpperCase();
  }
  return '??';
}

export interface CollabSession {
  roomId: string;
  ydoc: Y.Doc;
  provider: WebrtcProvider;
  yTranslations: Y.Map<any>;
  yKeys: Y.Array<string>;
  yLanguages: Y.Array<string>;
  yMeta: Y.Map<any>;
  destroy: () => void;
  isEstablished?: boolean;
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

export const COLLAB_PALETTE = [
  '#3b82f6', // 1. Blue
  '#10b981', // 2. Emerald
  '#f97316', // 3. Orange
  '#8b5cf6', // 4. Violet
  '#ec4899', // 5. Pink
  '#06b6d4', // 6. Cyan
  '#f59e0b', // 7. Amber
  '#14b8a6', // 8. Teal
  '#e11d48', // 9. Rose
  '#6366f1', // 10. Indigo
  '#84cc16', // 11. Lime
  '#a855f7', // 12. Purple
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
 * Finds the first unused color from the palette to guarantee distinct colors for up to 12 peers
 */
export function getNextAvailablePeerColor(usedColors: string[] = []): string {
  const usedSet = new Set(usedColors.map(c => c.toLowerCase()));
  for (const color of COLLAB_PALETTE) {
    if (!usedSet.has(color.toLowerCase())) {
      return color;
    }
  }
  // Fallback if room exceeds palette size: cycle deterministically
  return COLLAB_PALETTE[usedColors.length % COLLAB_PALETTE.length];
}

/**
 * Normalizes room IDs by stripping extra spaces, converting to lowercase.
 * If 10 alpha characters are provided without hyphens, formats into canonical 'xxx-xxxx-xxx'.
 */
export function normalizeCollabRoomId(roomId: string): string {
  const trimmed = roomId.trim().toLowerCase();
  const alphanumericOnly = trimmed.replace(/[^a-z0-9]/g, '');
  if (alphanumericOnly.length === 10 && /^[a-z]+$/.test(alphanumericOnly)) {
    return `${alphanumericOnly.slice(0, 3)}-${alphanumericOnly.slice(3, 7)}-${alphanumericOnly.slice(7, 10)}`;
  }
  return trimmed.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Generates a cryptographically secure, human-friendly 3-4-3 segmented room format (e.g. 'yfq-khjt-efn')
 */
export function generateCollabRoomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const part = (len: number) => {
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars.charAt(bytes[i] % chars.length);
    }
    return res;
  };
  return `${part(3)}-${part(4)}-${part(3)}`;
}

/**
 * Generates a random peer username and distinct avatar color using cryptographically secure random values
 */
export function generateRandomPeerProfile(usedColors: string[] = []): { name: string; color: string } {
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  const animal = ANIMAL_NAMES[bytes[0] % ANIMAL_NAMES.length];
  const num = 10 + (bytes[1] % 90);
  const color = getNextAvailablePeerColor(usedColors);
  return {
    name: `${animal}-${num}`,
    color,
  };
}

// Internal registry of active collaboration sessions to avoid duplicate WebrtcProvider errors
const activeSessions = new Map<string, CollabSession>();

/**
 * Returns an existing active session for a given room, if open
 */
export function getActiveCollabSession(roomId: string): CollabSession | undefined {
  const cleanRoomId = normalizeCollabRoomId(roomId);
  const roomName = `jsonlink-collab-${cleanRoomId}`;
  return activeSessions.get(roomName);
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
    initialProjectName?: string;
    isInitiator?: boolean;
    onAuthError?: (errorMessage: string) => void;
  }
): CollabSession {
  const cleanRoomId = normalizeCollabRoomId(roomId);
  const roomName = `jsonlink-collab-${cleanRoomId}`;

  // If a session for this exact room is already active, reuse it to prevent "already exists" error
  const existing = activeSessions.get(roomName);
  if (existing) {
    if (!existing.ydoc.isDestroyed) {
      return existing;
    }
    try {
      existing.destroy();
    } catch {
      // Safe disposal
    }
    activeSessions.delete(roomName);
  }

  const ydoc = new Y.Doc();
  const signaling = getEffectiveSignalingServers(options?.signalingServers);
  const cleanPassword = options?.password ? options.password.trim() : null;

  const provider = new WebrtcProvider(roomName, ydoc, {
    signaling,
    password: cleanPassword || undefined,
    peerOpts: {
      config: {
        iceServers: DEFAULT_ICE_SERVERS,
      },
    },
  });

  const isInitiator = options?.isInitiator !== false;
  const isEstablished = isInitiator;

  let authErrorFired = false;
  const triggerAuthError = (msg: string) => {
    if (authErrorFired) return;
    authErrorFired = true;
    options?.onAuthError?.(msg);
  };

  // 1. Detect AES-GCM decryption failure (DOMException: OperationError in unhandled rejection)
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const isCryptoError =
      reason?.name === 'OperationError' ||
      (reason instanceof DOMException && reason.name === 'OperationError') ||
      (typeof reason?.message === 'string' &&
        (reason.message.toLowerCase().includes('decrypt') ||
         reason.message.toLowerCase().includes('operation-specific')));

    if (isCryptoError) {
      try {
        event.preventDefault();
      } catch {
        // Safe ignore
      }

      if (session.isEstablished) {
        // Host or established peer: someone else sent invalid ciphertext.
        // Broadcast auth rejection via signaling to notify the connecting guest without killing our own session!
        const rejectMsg = {
          type: 'publish',
          topic: roomName,
          data: {
            type: 'auth-rejected',
            roomId: cleanRoomId,
            reason: 'invalid_password',
          },
        };
        provider.signalingConns.forEach(conn => {
          try {
            conn.send(rejectMsg);
          } catch {
            // Safe ignore
          }
        });
      } else {
        // Guest attempting to join who cannot decrypt room data
        triggerAuthError(
          cleanPassword
            ? 'Incorrect room PIN or password. Please verify and try again.'
            : 'This room is password-protected. Please enter the room PIN code.'
        );
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
  }

  // 2. Detect password presence mismatches on the signaling server
  const handleSignalingMessage = (m: any) => {
    if (m && m.type === 'publish' && m.topic === roomName && m.data) {
      if (m.data.type === 'auth-rejected') {
        if (!session.isEstablished) {
          triggerAuthError('Incorrect room PIN or password. Please verify and try again.');
        }
        return;
      }
      if (cleanPassword) {
        // Local peer provided a password, but remote peer sent an unencrypted plain announce
        if (typeof m.data === 'object' && m.data.type === 'announce') {
          triggerAuthError('This room is public and does not require a PIN code.');
        }
      } else {
        // Local peer provided NO password, but remote peer sent a base64 ciphertext string
        if (typeof m.data === 'string' && m.data.length > 20) {
          triggerAuthError('This room is password-protected. Please enter the room PIN code.');
        }
      }
    }
  };

  provider.signalingConns.forEach(conn => {
    conn.on('message', handleSignalingMessage);
  });

  const yTranslations = ydoc.getMap<any>('translations');
  const yKeys = ydoc.getArray<string>('keys');
  const yLanguages = ydoc.getArray<string>('languages');
  const yMeta = ydoc.getMap<any>('metadata');

  // Seed with initial items and metadata ONLY if initiator AND doc is empty
  if (options?.isInitiator !== false) {
    if (
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

    if (options?.initialProjectName && !yMeta.has('projectName')) {
      yMeta.set('projectName', options.initialProjectName);
    }
  }

  const session: CollabSession = {
    roomId: cleanRoomId,
    ydoc,
    provider,
    yTranslations,
    yKeys,
    yLanguages,
    yMeta,
    isEstablished,
    destroy: () => {
      try {
        if (typeof window !== 'undefined') {
          window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        }
        provider.signalingConns.forEach(conn => {
          conn.off('message', handleSignalingMessage);
        });
        activeSessions.delete(roomName);
        provider.destroy();
        ydoc.destroy();
      } catch {
        // Safe disposal
      }
    },
  };

  activeSessions.set(roomName, session);
  return session;
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
    if (itemData.status) {
      item.status = itemData.status;
    }
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

    // 4. Sync cell values and status
    for (const item of items) {
      const existing = yTranslations.get(item.key) || {};
      let changed = false;
      const updated: Record<string, string> = { ...existing };

      for (const [k, v] of Object.entries(item)) {
        if (k !== 'key' && existing[k] !== (v || '')) {
          updated[k] = v || '';
          changed = true;
        }
      }

      // Handle status removal or clearing
      if (existing.status && !item.status) {
        delete updated.status;
        changed = true;
      }

      if (changed || !yTranslations.has(item.key)) {
        yTranslations.set(item.key, updated);
      }
    }
  }, origin);
}

/**
 * Syncs project name changes to Yjs doc metadata
 */
export function applyProjectNameToYDoc(
  ydoc: Y.Doc,
  projectName: string,
  origin: any = 'local'
) {
  const yMeta = ydoc.getMap<any>('metadata');
  if (yMeta.get('projectName') !== projectName) {
    ydoc.transact(() => {
      yMeta.set('projectName', projectName);
    }, origin);
  }
}

/**
 * Extracts project name from Yjs doc metadata
 */
export function extractProjectNameFromYDoc(ydoc: Y.Doc): string | undefined {
  const yMeta = ydoc.getMap<any>('metadata');
  const name = yMeta.get('projectName');
  return typeof name === 'string' && name.trim().length > 0 ? name : undefined;
}
