import { useState, useRef, useEffect, useCallback } from 'react';
import { TranslationItem } from '@/types';
import {
  CollabSession,
  CollabPeerUser,
  initCollabSession,
  extractItemsFromYDoc,
  applyLocalChangeToYDoc,
  applyProjectNameToYDoc,
  extractProjectNameFromYDoc,
  getNextAvailablePeerColor,
  normalizeCollabRoomId,
} from '@/lib/collaboration';

export interface UseCollabSessionOptions {
  items: TranslationItem[];
  languages: string[];
  projectName?: string;
  localPeerProfile: { name: string; color: string };
  setLocalPeerProfile: React.Dispatch<React.SetStateAction<{ name: string; color: string }>>;
  onRemoteItemsChange: (items: TranslationItem[]) => void;
  onRemoteLanguagesChange: (languages: string[]) => void;
  onRemoteProjectNameChange?: (projectName: string) => void;
  onActivateWorkspace?: () => void;
  onDeactivateWorkspace?: () => void;
}

export function useCollabSession({
  items,
  languages,
  projectName,
  localPeerProfile,
  setLocalPeerProfile,
  onRemoteItemsChange,
  onRemoteLanguagesChange,
  onRemoteProjectNameChange,
  onActivateWorkspace,
  onDeactivateWorkspace,
}: UseCollabSessionOptions) {
  const [collabSession, setCollabSession] = useState<CollabSession | null>(null);
  const [collabPeers, setCollabPeers] = useState<CollabPeerUser[]>([]);
  const [collabPassword, setCollabPassword] = useState<string | null>(null);
  const [pendingCollabRoomId, setPendingCollabRoomId] = useState<string | null>(null);
  const [collabAuthError, setCollabAuthError] = useState<string | null>(null);
  const [isCollabConnecting, setIsCollabConnecting] = useState<boolean>(false);

  const prevItemsRef = useRef<TranslationItem[]>(items);
  const prevLanguagesRef = useRef<string[]>(languages);
  const prevProjectNameRef = useRef<string | undefined>(projectName);
  const isRemoteCollabUpdateRef = useRef<boolean>(false);

  const collabSessionRef = useRef<CollabSession | null>(null);
  const currentRoomIdRef = useRef<string | null>(null);
  const connectTimeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemsRef = useRef<TranslationItem[]>(items);
  const languagesRef = useRef<string[]>(languages);
  const projectNameRef = useRef<string | undefined>(projectName);
  const lastPointerSentRef = useRef<number>(0);
  const pointerIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    collabSessionRef.current = collabSession;
    itemsRef.current = items;
    languagesRef.current = languages;
    projectNameRef.current = projectName;
  }, [collabSession, items, languages, projectName]);

  const handleCollabAuthFailure = useCallback(
    (errorMessage: string) => {
      if (connectTimeoutTimerRef.current) {
        clearTimeout(connectTimeoutTimerRef.current);
        connectTimeoutTimerRef.current = null;
      }
      setIsCollabConnecting(false);

      const failedRoomId =
        collabSessionRef.current?.roomId || currentRoomIdRef.current || pendingCollabRoomId;

      if (collabSessionRef.current) {
        collabSessionRef.current.destroy();
        collabSessionRef.current = null;
        setCollabSession(null);
      }
      setCollabPeers([]);
      setCollabPassword(null);

      // Revert workspace if empty to prevent showing empty grid on auth failure
      if (itemsRef.current.length === 0) {
        onDeactivateWorkspace?.();
      }

      if (failedRoomId) {
        setPendingCollabRoomId(failedRoomId);
        setCollabAuthError(errorMessage);
        if (typeof window !== 'undefined') {
          window.history.replaceState(
            null,
            '',
            `${window.location.pathname}#collab=${failedRoomId}`
          );
        }
      }
    },
    [pendingCollabRoomId, onDeactivateWorkspace]
  );

  const handleCollabAuthFailureRef = useRef(handleCollabAuthFailure);
  useEffect(() => {
    handleCollabAuthFailureRef.current = handleCollabAuthFailure;
  }, [handleCollabAuthFailure]);

  const clearCollabAuthError = useCallback(() => {
    setCollabAuthError(null);
  }, []);

  const startCollabSession = useCallback(
    (roomId: string, password: string | null, userName: string, isInitiator = false) => {
      const cleanRoomId = normalizeCollabRoomId(roomId);
      currentRoomIdRef.current = cleanRoomId;

      if (connectTimeoutTimerRef.current) {
        clearTimeout(connectTimeoutTimerRef.current);
        connectTimeoutTimerRef.current = null;
      }

      if (collabSessionRef.current) {
        if (
          normalizeCollabRoomId(collabSessionRef.current.roomId) === cleanRoomId &&
          !collabSessionRef.current.ydoc.isDestroyed
        ) {
          return;
        }
        collabSessionRef.current.destroy();
        collabSessionRef.current = null;
      }

      const cleanUserName = userName.trim() || localPeerProfile.name;
      setLocalPeerProfile(prev => ({ ...prev, name: cleanUserName }));

      if (!isInitiator) {
        setIsCollabConnecting(true);
        connectTimeoutTimerRef.current = setTimeout(() => {
          if (!collabSessionRef.current?.isEstablished) {
            handleCollabAuthFailureRef.current(
              'Unable to connect to room host. Please verify room link or ensure host is online.'
            );
          }
        }, 12000);
      } else {
        setIsCollabConnecting(false);
      }

      const session = initCollabSession(cleanRoomId, {
        password: password || null,
        initialItems: isInitiator ? itemsRef.current : undefined,
        initialLanguages: isInitiator ? languagesRef.current : undefined,
        initialProjectName: isInitiator ? projectNameRef.current : undefined,
        isInitiator,
        onAuthError: (msg: string) => handleCollabAuthFailureRef.current(msg),
      });

      collabSessionRef.current = session;

      // Initialize peer awareness
      const awareness = session.provider.awareness;
      awareness.setLocalStateField('user', {
        name: cleanUserName,
        color: localPeerProfile.color,
        activeCell: null,
      });

      const handleAwarenessChange = () => {
        const states = awareness.getStates();
        const peers: CollabPeerUser[] = [];
        const takenColors: string[] = [];

        states.forEach((state: any, clientID: number) => {
          if (clientID !== awareness.clientID && state.user) {
            peers.push(state.user);
            if (state.user.color) {
              takenColors.push(state.user.color);
            }
          }
        });

        // Ensure distinct colors: resolve collision
        const myLocalState = awareness.getLocalState()?.user;
        if (myLocalState && myLocalState.color) {
          const myColorLower = myLocalState.color.toLowerCase();
          let shouldYield = false;
          states.forEach((state: any, clientID: number) => {
            if (
              clientID < awareness.clientID &&
              state.user?.color?.toLowerCase() === myColorLower
            ) {
              shouldYield = true;
            }
          });

          if (shouldYield) {
            const nextColor = getNextAvailablePeerColor(takenColors);
            if (nextColor.toLowerCase() !== myColorLower) {
              setLocalPeerProfile(prev => ({ ...prev, color: nextColor }));
              awareness.setLocalStateField('user', {
                ...myLocalState,
                color: nextColor,
              });
            }
          }
        }

        setCollabPeers(prevPeers => {
          if (
            prevPeers.length === peers.length &&
            prevPeers.every(
              (p, i) =>
                p.name === peers[i]?.name &&
                p.color === peers[i]?.color &&
                p.activeCell?.key === peers[i]?.activeCell?.key &&
                p.activeCell?.field === peers[i]?.activeCell?.field &&
                p.pointer?.x === peers[i]?.pointer?.x &&
                p.pointer?.y === peers[i]?.pointer?.y
            )
          ) {
            return prevPeers;
          }
          return peers;
        });
      };

      awareness.on('change', handleAwarenessChange);
      session.provider.on('peers', handleAwarenessChange);

      const onConnectionEstablished = () => {
        if (!session.isEstablished) {
          session.isEstablished = true;
        }
        if (connectTimeoutTimerRef.current) {
          clearTimeout(connectTimeoutTimerRef.current);
          connectTimeoutTimerRef.current = null;
        }
        setIsCollabConnecting(false);
        setPendingCollabRoomId(null);
        setCollabAuthError(null);
        onActivateWorkspace?.();
      };

      // Synchronize Yjs document data to React state
      const syncDocToReact = () => {
        const { items: remoteItems, languages: remoteLangs } = extractItemsFromYDoc(session.ydoc);
        const remoteProjectName = extractProjectNameFromYDoc(session.ydoc);

        if (remoteProjectName && onRemoteProjectNameChange) {
          if (prevProjectNameRef.current !== remoteProjectName) {
            prevProjectNameRef.current = remoteProjectName;
            onRemoteProjectNameChange(remoteProjectName);
          }
        }

        if (remoteItems.length > 0 || session.yKeys.length > 0) {
          onConnectionEstablished();
          isRemoteCollabUpdateRef.current = true;
          prevItemsRef.current = remoteItems;
          onRemoteItemsChange(remoteItems);
          if (remoteLangs.length > 0) {
            prevLanguagesRef.current = remoteLangs;
            onRemoteLanguagesChange(remoteLangs);
          }
          setTimeout(() => {
            isRemoteCollabUpdateRef.current = false;
          }, 100);
        }
      };

      const handleDocChange = (_events: any, transaction: any) => {
        if (transaction && transaction.origin === 'local') return;
        syncDocToReact();
      };

      session.yTranslations.observeDeep(handleDocChange);
      session.yKeys.observe(handleDocChange);
      session.yLanguages.observe(handleDocChange);
      session.yMeta?.observe(handleDocChange);

      const handleYDocUpdate = (_update: Uint8Array, origin: any) => {
        if (origin !== 'local') {
          syncDocToReact();
        }
      };
      session.ydoc.on('update', handleYDocUpdate);

      const handleProviderSynced = (event: any) => {
        if (event && event.synced) {
          syncDocToReact();
          handleAwarenessChange();
        }
      };
      session.provider.on('synced', handleProviderSynced);

      syncDocToReact();
      handleAwarenessChange();

      const heartbeatTimer = setInterval(() => {
        if (session.provider.connected || session.provider.room) {
          awareness.setLocalStateField('user', {
            name: cleanUserName,
            color: localPeerProfile.color,
            activeCell: awareness.getLocalState()?.user?.activeCell || null,
            lastSeen: Date.now(),
          });
        }
      }, 10000);

      const handleWindowFocus = () => {
        if (session.provider.connected || session.provider.room) {
          awareness.setLocalStateField('user', {
            name: cleanUserName,
            color: localPeerProfile.color,
            activeCell: awareness.getLocalState()?.user?.activeCell || null,
            lastSeen: Date.now(),
          });
        }
      };
      window.addEventListener('focus', handleWindowFocus);
      window.addEventListener('online', handleWindowFocus);

      const originalDestroy = session.destroy;
      session.destroy = () => {
        if (connectTimeoutTimerRef.current) {
          clearTimeout(connectTimeoutTimerRef.current);
          connectTimeoutTimerRef.current = null;
        }
        if (pointerIdleTimerRef.current) {
          clearTimeout(pointerIdleTimerRef.current);
          pointerIdleTimerRef.current = null;
        }
        clearInterval(heartbeatTimer);
        window.removeEventListener('focus', handleWindowFocus);
        window.removeEventListener('online', handleWindowFocus);
        originalDestroy();
      };

      setCollabSession(session);
      setCollabPassword(password || null);
      if (isInitiator) {
        onActivateWorkspace?.();
      }
    },
    [localPeerProfile.name, localPeerProfile.color, setLocalPeerProfile, onRemoteItemsChange, onRemoteLanguagesChange, onRemoteProjectNameChange, onActivateWorkspace]
  );

  const endCollabSession = useCallback(() => {
    if (collabSessionRef.current) {
      collabSessionRef.current.destroy();
      collabSessionRef.current = null;
      setCollabSession(null);
    }
    setCollabPeers([]);
    setCollabPassword(null);
    if (typeof window !== 'undefined' && window.location.hash.includes('collab=')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    return () => {
      collabSessionRef.current?.destroy();
      collabSessionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!collabSession) {
      prevItemsRef.current = items;
      prevLanguagesRef.current = languages;
      prevProjectNameRef.current = projectName;
      return;
    }

    if (isRemoteCollabUpdateRef.current) {
      prevItemsRef.current = items;
      prevLanguagesRef.current = languages;
      prevProjectNameRef.current = projectName;
      return;
    }

    const itemsChanged = prevItemsRef.current !== items;
    const languagesChanged = prevLanguagesRef.current !== languages;
    const projectNameChanged = projectName !== undefined && prevProjectNameRef.current !== projectName;

    prevItemsRef.current = items;
    prevLanguagesRef.current = languages;
    if (projectName !== undefined) {
      prevProjectNameRef.current = projectName;
    }

    if (itemsChanged || languagesChanged) {
      applyLocalChangeToYDoc(collabSession.ydoc, items, languages, 'local');
    }
    if (projectNameChanged && projectName) {
      applyProjectNameToYDoc(collabSession.ydoc, projectName, 'local');
    }
  }, [items, languages, projectName, collabSession]);

  const handleActiveCellChange = useCallback(
    (key: string | null, field: string | null) => {
      if (!collabSessionRef.current) return;
      const awareness = collabSessionRef.current.provider.awareness;
      const currentUser = awareness.getLocalState()?.user;
      const nextActiveCell = key && field ? { key, field } : null;

      if (
        currentUser?.activeCell?.key === nextActiveCell?.key &&
        currentUser?.activeCell?.field === nextActiveCell?.field
      ) {
        return;
      }

      awareness.setLocalStateField('user', {
        ...(currentUser || localPeerProfile),
        activeCell: nextActiveCell,
        lastSeen: Date.now(),
      });
    },
    [localPeerProfile]
  );

  const handlePointerMove = useCallback(
    (x: number, y: number) => {
      if (!collabSessionRef.current) return;
      const now = Date.now();
      // Throttle to ~30fps (33ms) to maintain high performance with minimal bandwidth
      if (now - lastPointerSentRef.current < 33) return;
      lastPointerSentRef.current = now;

      const awareness = collabSessionRef.current.provider.awareness;
      const currentUser = awareness.getLocalState()?.user;

      awareness.setLocalStateField('user', {
        ...(currentUser || localPeerProfile),
        pointer: { x: Math.round(x), y: Math.round(y) },
        lastSeen: now,
      });

      // Clear pointer after 3 seconds of inactivity
      if (pointerIdleTimerRef.current) {
        clearTimeout(pointerIdleTimerRef.current);
      }
      pointerIdleTimerRef.current = setTimeout(() => {
        if (!collabSessionRef.current) return;
        const current = awareness.getLocalState()?.user;
        if (current?.pointer) {
          awareness.setLocalStateField('user', {
            ...current,
            pointer: null,
          });
        }
      }, 3000);
    },
    [localPeerProfile]
  );

  const handlePointerLeave = useCallback(() => {
    if (!collabSessionRef.current) return;
    if (pointerIdleTimerRef.current) {
      clearTimeout(pointerIdleTimerRef.current);
      pointerIdleTimerRef.current = null;
    }
    const awareness = collabSessionRef.current.provider.awareness;
    const currentUser = awareness.getLocalState()?.user;
    if (currentUser?.pointer) {
      awareness.setLocalStateField('user', {
        ...currentUser,
        pointer: null,
      });
    }
  }, []);

  const startCollabSessionRef = useRef(startCollabSession);
  useEffect(() => {
    startCollabSessionRef.current = startCollabSession;
  }, [startCollabSession]);

  const localPeerNameRef = useRef(localPeerProfile.name);
  useEffect(() => {
    localPeerNameRef.current = localPeerProfile.name;
  }, [localPeerProfile.name]);

  const joinCollabWithPin = useCallback(
    (pin: string | null) => {
      if (!pendingCollabRoomId) return;
      const roomId = normalizeCollabRoomId(pendingCollabRoomId);
      const cleanPin = pin?.trim() || null;
      setCollabAuthError(null);
      setIsCollabConnecting(true);
      if (typeof window !== 'undefined') {
        if (cleanPin) {
          window.location.hash = `#collab=${roomId}&key=${encodeURIComponent(cleanPin)}`;
        } else {
          window.location.hash = `#collab=${roomId}`;
        }
      }
      startCollabSession(roomId, cleanPin, localPeerNameRef.current, false);
    },
    [pendingCollabRoomId, startCollabSession]
  );

  const cancelCollabPin = useCallback(() => {
    if (connectTimeoutTimerRef.current) {
      clearTimeout(connectTimeoutTimerRef.current);
      connectTimeoutTimerRef.current = null;
    }
    setIsCollabConnecting(false);
    currentRoomIdRef.current = null;
    if (collabSessionRef.current) {
      collabSessionRef.current.destroy();
      collabSessionRef.current = null;
      setCollabSession(null);
    }
    setCollabPeers([]);
    setPendingCollabRoomId(null);
    setCollabAuthError(null);
    if (typeof window !== 'undefined' && window.location.hash.includes('collab=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // URL hash listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkCollabHash = () => {
      const hash = window.location.hash;
      if (hash && (hash.startsWith('#collab=') || hash.startsWith('#/collab='))) {
        const match = hash.match(/^#\/?collab=([^&]+)(?:&key=([^&]+))?/);
        if (match) {
          const roomId = normalizeCollabRoomId(decodeURIComponent(match[1]));
          const rawKey = match[2] ? decodeURIComponent(match[2]).trim() : '';
          const key = rawKey.length > 0 ? rawKey : null;

          if (collabSessionRef.current && normalizeCollabRoomId(collabSessionRef.current.roomId) === roomId) {
            return;
          }

          if (key) {
            setPendingCollabRoomId(roomId);
            setCollabAuthError(null);
            setIsCollabConnecting(true);
            startCollabSessionRef.current(roomId, key, localPeerNameRef.current, false);
          } else {
            // No key in hash -> prompt for PIN code with clean error state
            setPendingCollabRoomId(roomId);
            setCollabAuthError(null);
            setIsCollabConnecting(false);
          }
        }
      } else {
        setPendingCollabRoomId(null);
        setCollabAuthError(null);
        setIsCollabConnecting(false);
      }
    };

    checkCollabHash();
    window.addEventListener('hashchange', checkCollabHash);
    return () => window.removeEventListener('hashchange', checkCollabHash);
  }, []);

  return {
    collabSession,
    collabPeers,
    collabPassword,
    pendingCollabRoomId,
    collabAuthError,
    isCollabConnecting,
    clearCollabAuthError,
    startCollabSession,
    endCollabSession,
    joinCollabWithPin,
    cancelCollabPin,
    handleActiveCellChange,
    handlePointerMove,
    handlePointerLeave,
  };
}
