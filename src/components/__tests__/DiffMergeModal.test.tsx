// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DiffMergeModal, DiffResult } from '../DiffMergeModal';

describe('DiffMergeModal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockDiff: DiffResult = {
    newKeys: [
      { key: 'auth.forgot_password', en: 'Forgot Password?', my: 'စကားဝှက်မေ့နေပါသလား' },
    ],
    modifiedKeys: [
      {
        key: 'auth.login',
        oldItem: { key: 'auth.login', en: 'Sign In' },
        newItem: { key: 'auth.login', en: 'Log In' },
        changedLangs: ['en'],
      },
    ],
    unchangedCount: 5,
    allIncomingLanguages: ['en', 'my'],
    incomingItems: [],
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    diff: mockDiff,
    onConfirmMerge: vi.fn(),
  };

  it('renders null when diff is null', () => {
    const { container } = render(<DiffMergeModal {...defaultProps} diff={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders diff comparison summary stats', () => {
    render(<DiffMergeModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Import Comparison & Merge Preview' })).not.toBeNull();
    expect(screen.getByText('Keys not in current')).not.toBeNull();
    expect(screen.getByText('Altered translations')).not.toBeNull();
    expect(screen.getByText('Identical in both')).not.toBeNull();
  });

  it('switches between new and modified tabs', () => {
    render(<DiffMergeModal {...defaultProps} />);
    // By default 'new' tab is selected
    expect(screen.getByText('+ auth.forgot_password')).not.toBeNull();

    // Click on modified tab card
    const modifiedCard = screen.getByText('Altered translations').closest('div')!;
    fireEvent.click(modifiedCard);

    expect(screen.getByText('~ auth.login')).not.toBeNull();
    expect(screen.getByText('Sign In')).not.toBeNull();
    expect(screen.getByText('Log In')).not.toBeNull();
  });

  it('triggers merge callback when merge buttons are clicked', () => {
    render(<DiffMergeModal {...defaultProps} />);
    const mergeBtn = screen.getByRole('button', { name: /Merge & Update/i });
    fireEvent.click(mergeBtn);
    expect(defaultProps.onConfirmMerge).toHaveBeenCalledWith('merge');

    const addNewBtn = screen.getByRole('button', { name: /Add New \(\+1\)/i });
    fireEvent.click(addNewBtn);
    expect(defaultProps.onConfirmMerge).toHaveBeenCalledWith('add-only');

    const overwriteBtn = screen.getByRole('button', { name: /Overwrite/i });
    fireEvent.click(overwriteBtn);
    expect(defaultProps.onConfirmMerge).toHaveBeenCalledWith('replace');
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(<DiffMergeModal {...defaultProps} />);
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
