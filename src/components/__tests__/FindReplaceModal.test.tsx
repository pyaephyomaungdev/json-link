// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { FindReplaceModal } from '../FindReplaceModal';
import { TranslationItem } from '@/types';

describe('FindReplaceModal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockItems: TranslationItem[] = [
    {
      key: 'auth.login',
      description: 'Login button text',
      en: 'Sign in to account',
      my: 'အကောင့်ဝင်ရန်',
    },
    {
      key: 'auth.logout',
      description: 'Logout button text',
      en: 'Sign out',
      my: 'ထွက်ရန်',
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    items: mockItems,
    languages: ['en', 'my'],
    onApplyReplace: vi.fn(),
  };

  it('renders correctly when open', () => {
    render(<FindReplaceModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Find & Replace Across Languages' })).not.toBeNull();
    expect(screen.getByPlaceholderText('Search term or regex...')).not.toBeNull();
    expect(screen.getByPlaceholderText('Replacement text...')).not.toBeNull();
    expect(screen.getByText('Enter search term')).not.toBeNull();
  });

  it('updates match counter when query is entered', () => {
    render(<FindReplaceModal {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search term or regex...');

    fireEvent.change(searchInput, { target: { value: 'Sign' } });
    expect(screen.getByText(/2 matches in 2 rows/i)).not.toBeNull();

    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    expect(screen.getByText('No matches found')).not.toBeNull();
  });

  it('disables Replace All button when no query or no matches', () => {
    render(<FindReplaceModal {...defaultProps} />);
    const replaceBtn = screen.getByRole('button', { name: /Replace All/i }) as HTMLButtonElement;
    expect(replaceBtn.disabled).toBe(true);

    const searchInput = screen.getByPlaceholderText('Search term or regex...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    expect(replaceBtn.disabled).toBe(true);
  });

  it('calls onApplyReplace with updated items when Replace All is clicked', () => {
    render(<FindReplaceModal {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search term or regex...');
    const replaceInput = screen.getByPlaceholderText('Replacement text...');

    fireEvent.change(searchInput, { target: { value: 'Sign' } });
    fireEvent.change(replaceInput, { target: { value: 'Log' } });

    const replaceBtn = screen.getByRole('button', { name: /Replace All/i }) as HTMLButtonElement;
    expect(replaceBtn.disabled).toBe(false);

    fireEvent.click(replaceBtn);

    expect(defaultProps.onApplyReplace).toHaveBeenCalledTimes(1);
    const [updatedItems, count] = defaultProps.onApplyReplace.mock.calls[0];
    expect(count).toBe(2);
    expect(updatedItems[0].en).toBe('Log in to account');
    expect(updatedItems[1].en).toBe('Log out');
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(<FindReplaceModal {...defaultProps} />);
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('switches to Find tab, displays matching list entries, and supports jumping to key', () => {
    const onJumpToKey = vi.fn();
    const onFilterTable = vi.fn();

    render(
      <FindReplaceModal
        {...defaultProps}
        initialTab="find"
        onJumpToKey={onJumpToKey}
        onFilterTable={onFilterTable}
      />
    );

    // Verify Find tab active
    const searchInput = screen.getByPlaceholderText('Search term or regex...');
    fireEvent.change(searchInput, { target: { value: 'Sign' } });

    // Should display matching entries list
    expect(screen.getByText(/Matching Entries \(2\)/i)).toBeDefined();
    expect(screen.getByText('auth.login')).toBeDefined();
    expect(screen.getByText('auth.logout')).toBeDefined();

    // Click Jump button on first occurrence
    const jumpBtns = screen.getAllByRole('button', { name: /Jump/i });
    expect(jumpBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(jumpBtns[0]);

    expect(onJumpToKey).toHaveBeenCalledWith('auth.login');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('filters table when Filter Table button is clicked in Find tab', () => {
    const onFilterTable = vi.fn();

    render(
      <FindReplaceModal
        {...defaultProps}
        initialTab="find"
        onFilterTable={onFilterTable}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search term or regex...');
    fireEvent.change(searchInput, { target: { value: 'Sign' } });

    const filterBtn = screen.getByRole('button', { name: /Filter Table/i });
    fireEvent.click(filterBtn);

    expect(onFilterTable).toHaveBeenCalledWith('Sign');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
