// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ScorecardModal } from '../ScorecardModal';
import { TranslationItem } from '@/types';

describe('ScorecardModal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockItems: TranslationItem[] = [
    {
      key: 'welcome',
      description: 'Welcome message',
      en: 'Hello, {name}!',
      my: 'မင်္ဂလာပါ {name}!',
    },
    {
      key: 'farewell',
      description: 'Goodbye message',
      en: 'See you {user}!',
      my: '', // missing translation
    },
    {
      key: 'alert',
      description: 'Alert message with variable mismatch',
      en: 'Warning: {count} errors found',
      my: 'သတိပေးချက် အမှားတွေ့ရှိသည်', // missing {count}
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    items: mockItems,
    languages: ['en', 'my'],
    sourceLanguage: 'en',
    onTranslateMissing: vi.fn(),
  };

  it('renders scorecard modal heading and health metrics', () => {
    render(<ScorecardModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Localization Health & Scorecard' })).not.toBeNull();
    expect(screen.getByText('Overall Completion')).not.toBeNull();
    expect(screen.getByText('Missing Translations')).not.toBeNull();
    expect(screen.getByText('Variable Integrity')).not.toBeNull();
  });

  it('calculates metrics correctly for completion tab', () => {
    render(<ScorecardModal {...defaultProps} />);
    expect(screen.getByText('Overall Completion')).not.toBeNull();
    expect(screen.getByText('Missing Translations')).not.toBeNull();
    expect(screen.getByText('Variable Warnings (1)')).not.toBeNull();
  });

  it('switches to variables tab and shows variable mismatch details', () => {
    render(<ScorecardModal {...defaultProps} />);
    const varsTab = screen.getByRole('button', { name: /Variable Warnings/i });
    fireEvent.click(varsTab);

    expect(screen.getByText('alert')).not.toBeNull();
    expect(screen.getByText('{count}')).not.toBeNull();
  });

  it('calls onTranslateMissing when AI Translate button is clicked for missing keys', () => {
    render(<ScorecardModal {...defaultProps} />);
    const translateBtn = screen.getByRole('button', { name: /Translate \(1\)/i });
    fireEvent.click(translateBtn);

    expect(defaultProps.onTranslateMissing).toHaveBeenCalledWith('my');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ScorecardModal {...defaultProps} />);
    const closeButtons = screen.getAllByRole('button', { name: /Close/i });
    fireEvent.click(closeButtons[0]);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
