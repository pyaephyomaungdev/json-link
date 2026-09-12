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

  it('renders modal with title and tabs', async () => {
    render(<ShareModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Share & Handoff Workspace' })).not.toBeNull();
    expect(screen.getByText('Instant URL Link')).not.toBeNull();
    expect(screen.getByText('Team Handoff (.jsonlink)')).not.toBeNull();
  });

  it('switches between URL and File tabs and triggers export', async () => {
    render(<ShareModal {...defaultProps} />);
    
    // Switch to file handoff tab
    const fileTab = screen.getByText('Team Handoff (.jsonlink)');
    fireEvent.click(fileTab);

    expect(screen.getByText(/Zero size restrictions/i)).not.toBeNull();

    const downloadBtn = screen.getByRole('button', { name: /Download \.jsonlink/i });
    fireEvent.click(downloadBtn);

    expect(projectLib.exportProjectFile).toHaveBeenCalledWith(
      'my-app',
      defaultProps.items,
      defaultProps.languages
    );
  });

  it('closes when close button is clicked', () => {
    render(<ShareModal {...defaultProps} />);
    const closeBtns = screen.getAllByRole('button', { name: 'Close' });
    fireEvent.click(closeBtns[0]);
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not jump to file tab when password protection is toggled', () => {
    render(<ShareModal {...defaultProps} />);
    const checkbox = screen.getByLabelText(/Protect with Password/i);
    fireEvent.click(checkbox);
    expect(screen.getByPlaceholderText(/Enter link password/i)).not.toBeNull();
    expect(screen.getByRole('button', { name: /Copy Link/i })).not.toBeNull();
  });
});
