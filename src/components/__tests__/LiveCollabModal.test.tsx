// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LiveCollabModal } from '../LiveCollabModal';

describe('LiveCollabModal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const localUser = {
    name: 'Panda-42',
    color: '#10b981',
  };

  it('renders connect form when not connected', () => {
    render(
      <LiveCollabModal
        isOpen={true}
        onClose={vi.fn()}
        isConnected={false}
        currentRoomId={null}
        peers={[]}
        localUser={localUser}
        onStartSession={vi.fn()}
        onEndSession={vi.fn()}
      />
    );

    expect(screen.getByText('P2P Live Collaboration')).not.toBeNull();
    expect(screen.getByText('Start / Join Room')).not.toBeNull();
  });

  it('renders active room info and peers list when connected', () => {
    const peers = [
      { name: 'Falcon-88', color: '#3b82f6' },
      { name: 'Otter-19', color: '#8b5cf6' },
    ];

    render(
      <LiveCollabModal
        isOpen={true}
        onClose={vi.fn()}
        isConnected={true}
        currentRoomId="collab-abc"
        currentRoomPassword="secret-key"
        peers={peers}
        localUser={localUser}
        onStartSession={vi.fn()}
        onEndSession={vi.fn()}
      />
    );

    expect(screen.getByText('collab-abc')).not.toBeNull();
    expect(screen.getByText('secret-key')).not.toBeNull();
    expect(screen.getByText('Falcon-88')).not.toBeNull();
    expect(screen.getByText('Otter-19')).not.toBeNull();
    expect(screen.getByRole('button', { name: /Leave Room/i })).not.toBeNull();
  });

  it('triggers onEndSession when Leave Room is clicked', () => {
    const onEndSession = vi.fn();
    const onClose = vi.fn();

    render(
      <LiveCollabModal
        isOpen={true}
        onClose={onClose}
        isConnected={true}
        currentRoomId="collab-abc"
        peers={[]}
        localUser={localUser}
        onStartSession={vi.fn()}
        onEndSession={onEndSession}
      />
    );

    const leaveBtn = screen.getByRole('button', { name: /Leave Room/i });
    fireEvent.click(leaveBtn);

    expect(onEndSession).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
