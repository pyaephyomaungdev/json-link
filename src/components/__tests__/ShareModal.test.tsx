// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ShareModal } from '../ShareModal';
import * as projectLib from '@/lib/project';

vi.mock('@/lib/project', () => ({
  exportProjectFile: vi.fn(),
}));

describe('ShareModal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    items: [
      { key: 'common.welcome', en: 'Welcome', my: 'ကြိုဆိုပါတယ်' },
      { key: 'common.cancel', en: 'Cancel', my: 'မလုပ်တော့ပါ' },
    ],
    languages: ['en', 'my'],
    projectName: 'my-app',
  };

  it('renders modal with title and defaults to Team Handoff tab', async () => {
    render(<ShareModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Share & Handoff Workspace' })).not.toBeNull();
    expect(screen.getByText('Team Handoff (.jsonlink)')).not.toBeNull();
    expect(screen.getByText('Instant URL Link')).not.toBeNull();
    expect(screen.getByText(/Zero size restrictions/i)).not.toBeNull();
  });

  it('allows downloading .jsonlink directly from default primary tab', async () => {
    render(<ShareModal {...defaultProps} />);
    const downloadBtn = screen.getByRole('button', { name: /Download \.jsonlink/i });
    fireEvent.click(downloadBtn);

    expect(projectLib.exportProjectFile).toHaveBeenCalledWith(
      'my-app',
      defaultProps.items,
      defaultProps.languages,
      undefined
    );
  });

  it('closes when close button is clicked', () => {
    render(<ShareModal {...defaultProps} />);
    const closeBtns = screen.getAllByRole('button', { name: 'Close' });
    fireEvent.click(closeBtns[0]);
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('validates password and confirmation on file handoff tab', () => {
    render(<ShareModal {...defaultProps} />);
    const checkbox = screen.getByLabelText(/Protect with Password/i);
    fireEvent.click(checkbox);

    const downloadBtn = screen.getByRole('button', { name: /Download/i });
    expect(downloadBtn).toHaveProperty('disabled', true);
    expect(screen.getByText(/Password is required to encrypt this handoff file/i)).not.toBeNull();

    const pwInput = screen.getByPlaceholderText(/Enter file encryption password/i);
    fireEvent.change(pwInput, { target: { value: 'SecureTeamPass123' } });

    expect(screen.getByText(/Strength:/i)).not.toBeNull();
    expect(downloadBtn).toHaveProperty('disabled', true);

    const confirmInput = screen.getByPlaceholderText(/Confirm encryption password/i);
    fireEvent.change(confirmInput, { target: { value: 'WrongPass' } });
    expect(screen.getByText(/Passwords do not match/i)).not.toBeNull();
    expect(downloadBtn).toHaveProperty('disabled', true);

    fireEvent.change(confirmInput, { target: { value: 'SecureTeamPass123' } });
    expect(downloadBtn).toHaveProperty('disabled', false);
  });

  it('switches to Instant URL tab and validates confirm password', () => {
    render(<ShareModal {...defaultProps} />);
    const urlTab = screen.getByText('Instant URL Link');
    fireEvent.click(urlTab);

    const checkbox = screen.getByLabelText(/Protect with Password/i);
    fireEvent.click(checkbox);

    expect(screen.getByPlaceholderText(/Enter link password/i)).not.toBeNull();
    const copyBtn = screen.getByRole('button', { name: /Copy Link/i });
    expect(copyBtn).toHaveProperty('disabled', true);

    const pwInput = screen.getByPlaceholderText(/Enter link password/i);
    fireEvent.change(pwInput, { target: { value: 'UrlPass123' } });

    const confirmInput = screen.getByPlaceholderText(/Confirm link password/i);
    fireEvent.change(confirmInput, { target: { value: 'Mismatch' } });
    expect(screen.getByText(/Passwords do not match/i)).not.toBeNull();
    expect(copyBtn).toHaveProperty('disabled', true);

    fireEvent.change(confirmInput, { target: { value: 'UrlPass123' } });
    expect(screen.queryByText(/Passwords do not match/i)).toBeNull();
  });
});
