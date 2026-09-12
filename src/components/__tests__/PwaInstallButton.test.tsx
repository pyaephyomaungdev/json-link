// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { PwaInstallButton } from '../PwaInstallButton';

describe('PwaInstallButton', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing by default when beforeinstallprompt has not fired', () => {
    const { container } = render(<PwaInstallButton />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Install button when beforeinstallprompt event fires', () => {
    render(<PwaInstallButton />);

    const mockPromptEvent = new Event('beforeinstallprompt');
    (mockPromptEvent as any).prompt = vi.fn().mockResolvedValue(undefined);
    (mockPromptEvent as any).userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });

    act(() => {
      window.dispatchEvent(mockPromptEvent);
    });

    const installBtn = screen.getByTitle('Install JSON Link as an offline Desktop application');
    expect(installBtn).not.toBeNull();

    fireEvent.click(installBtn);
    expect((mockPromptEvent as any).prompt).toHaveBeenCalledTimes(1);
  });
});
