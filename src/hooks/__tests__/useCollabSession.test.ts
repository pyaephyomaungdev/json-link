// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCollabSession } from '../useCollabSession';
import * as collabLib from '@/lib/collaboration';

import * as Y from 'yjs';

vi.mock('@/lib/collaboration', async () => {
  const actual = await vi.importActual<any>('@/lib/collaboration');
  return {
    ...actual,
    initCollabSession: vi.fn().mockImplementation((roomId, _opts) => {
      const ydoc = new Y.Doc();
      const yTranslations = ydoc.getMap<any>('translations');
      const yKeys = ydoc.getArray<string>('keys');
      const yLanguages = ydoc.getArray<string>('languages');
      const yMeta = ydoc.getMap<any>('metadata');

      const provider = {
        awareness: {
          clientID: 1,
          getStates: vi.fn().mockReturnValue(new Map()),
          getLocalState: vi.fn().mockReturnValue({ user: { name: 'Alice', color: '#10b981' } }),
          setLocalStateField: vi.fn(),
          on: vi.fn(),
          off: vi.fn(),
        },
        connected: true,
        on: vi.fn(),
        off: vi.fn(),
        destroy: vi.fn(),
      };

      return {
        roomId,
        ydoc,
        provider,
        yTranslations,
        yKeys,
        yLanguages,
        yMeta,
        destroy: vi.fn(() => {
          ydoc.destroy();
        }),
      };
    }),
  };
});

describe('useCollabSession', () => {
  beforeEach(() => {
    window.location.hash = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.location.hash = '';
  });

  it('initializes with disconnected state and null pendingCollabRoomId', () => {
    const { result } = renderHook(() =>
      useCollabSession({
        items: [],
        languages: ['en'],
        localPeerProfile: { name: 'Alice', color: '#10b981' },
        setLocalPeerProfile: vi.fn(),
        onRemoteItemsChange: vi.fn(),
        onRemoteLanguagesChange: vi.fn(),
      })
    );

    expect(result.current.collabSession).toBeNull();
    expect(result.current.collabPeers).toEqual([]);
    expect(result.current.collabPassword).toBeNull();
    expect(result.current.pendingCollabRoomId).toBeNull();
  });

  it('auto-connects directly to room as public room when URL hash has room without key', () => {
    window.location.hash = '#collab=8swaabm6';

    const { result } = renderHook(() =>
      useCollabSession({
        items: [],
        languages: ['en'],
        localPeerProfile: { name: 'Alice', color: '#10b981' },
        setLocalPeerProfile: vi.fn(),
        onRemoteItemsChange: vi.fn(),
        onRemoteLanguagesChange: vi.fn(),
      })
    );

    expect(result.current.pendingCollabRoomId).toBe('8swaabm6');
    expect(result.current.isCollabConnecting).toBe(true);
    expect(result.current.collabSession).not.toBeNull();
    expect(collabLib.initCollabSession).toHaveBeenCalledWith(
      '8swaabm6',
      expect.objectContaining({ password: null, isInitiator: false })
    );
  });

  it('auto-connects and enters connecting state when URL hash includes both room and key', () => {
    window.location.hash = '#collab=8swaabm6&key=1234';
    const onActivateWorkspace = vi.fn();

    const { result } = renderHook(() =>
      useCollabSession({
        items: [],
        languages: ['en'],
        localPeerProfile: { name: 'Alice', color: '#10b981' },
        setLocalPeerProfile: vi.fn(),
        onRemoteItemsChange: vi.fn(),
        onRemoteLanguagesChange: vi.fn(),
        onActivateWorkspace,
      })
    );

    expect(result.current.pendingCollabRoomId).toBe('8swaabm6');
    expect(result.current.isCollabConnecting).toBe(true);
    expect(collabLib.initCollabSession).toHaveBeenCalledWith(
      '8swaabm6',
      expect.objectContaining({ password: '1234', isInitiator: false })
    );
    // Guest should NOT prematurely activate workspace until data or peers arrive!
    expect(onActivateWorkspace).not.toHaveBeenCalled();
  });

  it('allows joining with PIN via joinCollabWithPin, sets isCollabConnecting, and updates URL hash', () => {
    window.location.hash = '#collab=8swaabm6';
    const onActivateWorkspace = vi.fn();

    const { result } = renderHook(() =>
      useCollabSession({
        items: [],
        languages: ['en'],
        localPeerProfile: { name: 'Alice', color: '#10b981' },
        setLocalPeerProfile: vi.fn(),
        onRemoteItemsChange: vi.fn(),
        onRemoteLanguagesChange: vi.fn(),
        onActivateWorkspace,
      })
    );

    expect(result.current.pendingCollabRoomId).toBe('8swaabm6');

    act(() => {
      result.current.joinCollabWithPin('1234');
    });

    expect(result.current.isCollabConnecting).toBe(true);
    expect(collabLib.initCollabSession).toHaveBeenCalledWith(
      '8swaabm6',
      expect.objectContaining({ password: '1234', isInitiator: false })
    );
    expect(window.location.hash).toBe('#collab=8swaabm6&key=1234');
    // Guest does NOT prematurely enter empty grid before sync
    expect(onActivateWorkspace).not.toHaveBeenCalled();
  });

  it('allows joining public room without PIN via joinCollabWithPin(null)', () => {
    window.location.hash = '#collab=8swaabm6';

    const { result } = renderHook(() =>
      useCollabSession({
        items: [],
        languages: ['en'],
        localPeerProfile: { name: 'Alice', color: '#10b981' },
        setLocalPeerProfile: vi.fn(),
        onRemoteItemsChange: vi.fn(),
        onRemoteLanguagesChange: vi.fn(),
      })
    );

    act(() => {
      result.current.joinCollabWithPin(null);
    });

    expect(result.current.isCollabConnecting).toBe(true);
    expect(collabLib.initCollabSession).toHaveBeenCalledWith(
      '8swaabm6',
      expect.objectContaining({ password: null, isInitiator: false })
    );
    expect(window.location.hash).toBe('#collab=8swaabm6');
  });

  it('activates workspace immediately when user is host (isInitiator: true)', () => {
    const onActivateWorkspace = vi.fn();
    const { result } = renderHook(() =>
      useCollabSession({
        items: [{ key: 'app.title', en: 'Hello' }],
        languages: ['en'],
        localPeerProfile: { name: 'Alice', color: '#10b981' },
        setLocalPeerProfile: vi.fn(),
        onRemoteItemsChange: vi.fn(),
        onRemoteLanguagesChange: vi.fn(),
        onActivateWorkspace,
      })
    );

    act(() => {
      result.current.startCollabSession('yfq-khjt-efn', '1234', 'Alice', true);
    });

    expect(onActivateWorkspace).toHaveBeenCalled();
    expect(result.current.isCollabConnecting).toBe(false);
  });

  it('cancels pending collab and clears hash on cancelCollabPin', () => {
    window.location.hash = '#collab=8swaabm6';

    const { result } = renderHook(() =>
      useCollabSession({
        items: [],
        languages: ['en'],
        localPeerProfile: { name: 'Alice', color: '#10b981' },
        setLocalPeerProfile: vi.fn(),
        onRemoteItemsChange: vi.fn(),
        onRemoteLanguagesChange: vi.fn(),
      })
    );

    expect(result.current.pendingCollabRoomId).toBe('8swaabm6');

    act(() => {
      result.current.cancelCollabPin();
    });

    expect(result.current.pendingCollabRoomId).toBeNull();
    expect(window.location.hash).toBe('');
  });

  it('handles endCollabSession safely when not connected', () => {
    const { result } = renderHook(() =>
      useCollabSession({
        items: [],
        languages: ['en'],
        localPeerProfile: { name: 'Alice', color: '#10b981' },
        setLocalPeerProfile: vi.fn(),
        onRemoteItemsChange: vi.fn(),
        onRemoteLanguagesChange: vi.fn(),
      })
    );

    act(() => {
      result.current.endCollabSession();
    });

    expect(result.current.collabSession).toBeNull();
    expect(result.current.collabPeers).toEqual([]);
  });

  it('handles collab auth error, destroys session, resets workspace, and populates collabAuthError', () => {
    let capturedOnAuthError: ((msg: string) => void) | undefined;
    vi.mocked(collabLib.initCollabSession).mockImplementationOnce((roomId, opts: any) => {
      capturedOnAuthError = opts?.onAuthError;
      const ydoc = new Y.Doc();
      return {
        roomId,
        ydoc,
        provider: {
          awareness: {
            clientID: 1,
            getStates: vi.fn().mockReturnValue(new Map()),
            getLocalState: vi.fn().mockReturnValue({ user: { name: 'Alice', color: '#10b981' } }),
            setLocalStateField: vi.fn(),
            on: vi.fn(),
            off: vi.fn(),
          },
          connected: true,
          on: vi.fn(),
          off: vi.fn(),
          destroy: vi.fn(),
        } as any,
        yTranslations: ydoc.getMap('translations'),
        yKeys: ydoc.getArray('keys'),
        yLanguages: ydoc.getArray('languages'),
        yMeta: ydoc.getMap('metadata'),
        destroy: vi.fn(() => ydoc.destroy()),
      };
    });

    window.location.hash = '#collab=mlh-phgb-fby&key=wrongpass';
    const onDeactivateWorkspace = vi.fn();

    const { result } = renderHook(() =>
      useCollabSession({
        items: [],
        languages: ['en'],
        localPeerProfile: { name: 'Alice', color: '#10b981' },
        setLocalPeerProfile: vi.fn(),
        onRemoteItemsChange: vi.fn(),
        onRemoteLanguagesChange: vi.fn(),
        onDeactivateWorkspace,
      })
    );

    expect(capturedOnAuthError).toBeDefined();

    act(() => {
      capturedOnAuthError!('Incorrect room PIN or password. Please verify and try again.');
    });

    expect(result.current.collabSession).toBeNull();
    expect(result.current.collabAuthError).toBe('Incorrect room PIN or password. Please verify and try again.');
    expect(result.current.pendingCollabRoomId).toBe('mlh-phgb-fby');
    expect(onDeactivateWorkspace).toHaveBeenCalled();

    act(() => {
      result.current.clearCollabAuthError();
    });
    expect(result.current.collabAuthError).toBeNull();
  });
});
