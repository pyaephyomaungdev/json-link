// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { UnlockShareDialog } from '../UnlockShareDialog';
import * as shareUrlLib from '@/lib/shareUrl';

vi.mock('@/lib/shareUrl', async () => {
  const actual = await vi.importActual<typeof shareUrlLib>('@/lib/shareUrl');
  return {
    ...actual,
    decodeSharePayload: vi.fn(),
  };
});

describe('UnlockShareDialog', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    shareHash: 'dummy-encrypted-hash',
    onUnlocked: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders password input, no recovery notice, and unlock button', () => {
    render(<UnlockShareDialog {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Password Protected Workspace' })).not.toBeNull();
    expect(screen.getByPlaceholderText('Enter workspace password...')).not.toBeNull();
    expect(screen.getByText('No Recovery Mechanism')).not.toBeNull();
    expect(screen.getByRole('button', { name: /Unlock Workspace/i })).not.toBeNull();
  });

  it('shows error message when incorrect password is typed', async () => {
    vi.mocked(shareUrlLib.decodeSharePayload).mockRejectedValueOnce(new Error('INCORRECT_PASSWORD'));

    render(<UnlockShareDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText('Enter workspace password...');
    fireEvent.change(input, { target: { value: 'wrong-pass' } });

    const unlockBtn = screen.getByRole('button', { name: /Unlock Workspace/i });
    fireEvent.click(unlockBtn);

    await waitFor(() => {
      expect(screen.getByText(/Incorrect password\. Please verify and try again\./i)).not.toBeNull();
    });
    expect(defaultProps.onUnlocked).not.toHaveBeenCalled();
  });

  it('calls onUnlocked when password is correct', async () => {
    const mockData = {
      projectName: 'my-vault',
      languages: ['en', 'my'],
      items: [{ key: 'hello', en: 'Hello', my: 'မင်္ဂလာပါ' }],
    };
    vi.mocked(shareUrlLib.decodeSharePayload).mockResolvedValueOnce(mockData);

    render(<UnlockShareDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText('Enter workspace password...');
    fireEvent.change(input, { target: { value: 'correct-password' } });

    const unlockBtn = screen.getByRole('button', { name: /Unlock Workspace/i });
    fireEvent.click(unlockBtn);

    await waitFor(() => {
      expect(defaultProps.onUnlocked).toHaveBeenCalledWith(mockData);
    });
  });

  it('calls onCancel when Cancel is clicked', () => {
    render(<UnlockShareDialog {...defaultProps} />);
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });
});
