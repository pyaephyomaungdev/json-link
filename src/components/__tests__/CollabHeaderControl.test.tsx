// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CollabHeaderControl } from '../CollabHeaderControl';

describe('CollabHeaderControl', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  it('renders Live button when not connected', () => {
    const onOpenCollab = vi.fn();
    render(
      <CollabHeaderControl
        isCollabConnected={false}
        collabPeerCount={1}
        onOpenCollab={onOpenCollab}
      />
    );

    const liveBtn = screen.getByRole('button', { name: /live/i });
    expect(liveBtn).not.toBeNull();
    fireEvent.click(liveBtn);
    expect(onOpenCollab).toHaveBeenCalledTimes(1);
  });

  it('renders connected state with peer count and local/remote avatars', () => {
    const onOpenCollab = vi.fn();
    render(
      <CollabHeaderControl
        isCollabConnected={true}
        collabPeerCount={2}
        onOpenCollab={onOpenCollab}
        localPeerProfile={{ name: 'Hawk-30', color: '#3b82f6' }}
        collabPeers={[{ name: 'Fox-12', color: '#ef4444' }]}
      />
    );

    expect(screen.getByText('Live (2)')).not.toBeNull();
    // Local avatar initials "HA"
    expect(screen.getByText('HA')).not.toBeNull();
    // Remote avatar initials "FO"
    expect(screen.getByText('FO')).not.toBeNull();
  });

  it('renders eye badge directly at arc tip when following a peer', () => {
    render(
      <CollabHeaderControl
        isCollabConnected={true}
        collabPeerCount={2}
        onOpenCollab={vi.fn()}
        localPeerProfile={{ name: 'Hawk-30', color: '#3b82f6' }}
        collabPeers={[{ name: 'Fox-12', color: '#ef4444' }]}
        followingPeerName="Fox-12"
      />
    );

    // Eye indicator badge should be rendered at the arc tip seamlessly
    const eyeAtArcTip = screen.getByTestId('follow-arc-eye');
    expect(eyeAtArcTip).not.toBeNull();
    const circle = eyeAtArcTip.querySelector('circle');
    expect(circle).not.toBeNull();
    expect(circle?.getAttribute('fill')).toBe('currentColor');

    // Eye path should be white
    const eyePath = eyeAtArcTip.querySelector('path');
    expect(eyePath?.getAttribute('stroke')).toBe('#ffffff');
  });

  it('renders arc and eye at bottom center when following a middle peer', () => {
    render(
      <CollabHeaderControl
        isCollabConnected={true}
        collabPeerCount={3}
        onOpenCollab={vi.fn()}
        localPeerProfile={{ name: 'Hawk-30', color: '#3b82f6' }}
        collabPeers={[
          { name: 'Falcon-21', color: '#10b981' }, // middle peer (idx 0 out of 2)
          { name: 'Otter-67', color: '#f59e0b' },  // last peer (idx 1 out of 2)
        ]}
        followingPeerName="Falcon-21"
      />
    );

    const eyeAtArcTip = screen.getByTestId('follow-arc-eye');
    expect(eyeAtArcTip).not.toBeNull();
    // Middle peer has eye centered at bottom (16, 30.5)
    expect(eyeAtArcTip.getAttribute('transform')).toBe('translate(16, 30.5)');
  });
});

