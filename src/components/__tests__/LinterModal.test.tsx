// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LinterModal } from '../LinterModal';
import { TranslationItem } from '@/types';

describe('LinterModal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockItems: TranslationItem[] = [
    {
      key: 'auth.login',
      en: '  Log In  ', // whitespace issue
      my: 'အကောင့်ဝင်ရန်',
    },
    {
      key: 'alert.error',
      en: 'Error code: {code}',
      my: 'အမှားကုဒ်', // variable mismatch
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    items: mockItems,
    languages: ['en', 'my'],
    onApplyItems: vi.fn(),
    onJumpToCell: vi.fn(),
  };

  it('renders correctly with issues and category filters', () => {
    render(<LinterModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Localization QA & Consistency Linter' })).not.toBeNull();
    expect(screen.getByText('Total Issues')).not.toBeNull();
    expect(screen.getByText('Errors')).not.toBeNull();
    expect(screen.getByText('Whitespace')).not.toBeNull();
  });

  it('fixes all whitespace issues when clicking Fix All Whitespace', () => {
    render(<LinterModal {...defaultProps} />);
    const fixWhitespaceBtn = screen.getByRole('button', { name: /Fix All Whitespace/i });
    fireEvent.click(fixWhitespaceBtn);

    expect(defaultProps.onApplyItems).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Cleaned whitespace in/i)).not.toBeNull();
  });

  it('filters issues when clicking on category tab', () => {
    render(<LinterModal {...defaultProps} />);
    const whitespaceCategoryTab = screen.getByRole('button', { name: /^Whitespace/i });
    fireEvent.click(whitespaceCategoryTab);

    // Only whitespace issue shown, variables tab issue should not be in list
    expect(screen.getByText('auth.login')).not.toBeNull();
  });

  it('calls onJumpToCell and closes when Jump button is clicked', () => {
    render(<LinterModal {...defaultProps} />);
    const jumpBtns = screen.getAllByRole('button', { name: /Jump/i });
    expect(jumpBtns.length).toBeGreaterThan(0);
    fireEvent.click(jumpBtns[0]);

    expect(defaultProps.onJumpToCell).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes dialog on Close button click', () => {
    render(<LinterModal {...defaultProps} />);
    const closeButtons = screen.getAllByRole('button', { name: /Close/i });
    fireEvent.click(closeButtons[0]);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
