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

vi.mock('@/lib/project', () => ({
  decryptProjectFile: vi.fn(),
}));

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

  it('unlocks encrypted file content when provided', async () => {
    const projectLib = await import('@/lib/project');
    const mockFileProj = {
      format: 'jsonlink' as const,
      version: '1.0.0',
      name: 'file-project',
      updatedAt: '2026-01-01',
      languages: ['en'],
      items: [{ key: 'file.key', en: 'Val' }],
    };
    vi.mocked(projectLib.decryptProjectFile).mockResolvedValueOnce(mockFileProj);

    const onUnlocked = vi.fn();
    render(
      <UnlockShareDialog
        open={true}
        onOpenChange={vi.fn()}
        encryptedFileContent='{"encrypted":true}'
        onUnlocked={onUnlocked}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Encrypted Project File' })).not.toBeNull();
    const input = screen.getByPlaceholderText('Enter workspace password...');
    fireEvent.change(input, { target: { value: 'file-pw' } });

    const unlockBtn = screen.getByRole('button', { name: /Unlock Workspace/i });
    fireEvent.click(unlockBtn);

    await waitFor(() => {
      expect(onUnlocked).toHaveBeenCalledWith({
        projectName: 'file-project',
        languages: ['en'],
        items: [{ key: 'file.key', en: 'Val' }],
      });
    });
  });

  it('shows error message when incorrect password is typed for encrypted file', async () => {
    const projectLib = await import('@/lib/project');
    vi.mocked(projectLib.decryptProjectFile).mockRejectedValueOnce(new Error('INCORRECT_PASSWORD'));

    const onUnlocked = vi.fn();
    render(
      <UnlockShareDialog
        open={true}
        onOpenChange={vi.fn()}
        encryptedFileContent='{"encrypted":true}'
        onUnlocked={onUnlocked}
        onCancel={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Enter workspace password...');
    fireEvent.change(input, { target: { value: 'wrong-file-pw' } });

    const unlockBtn = screen.getByRole('button', { name: /Unlock Workspace/i });
    fireEvent.click(unlockBtn);

    await waitFor(() => {
      expect(screen.getByText(/Incorrect password\. Please verify and try again\./i)).not.toBeNull();
    });
    expect(onUnlocked).not.toHaveBeenCalled();
  });
});
