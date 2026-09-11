// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DocsPage } from '../DocsPage';

describe('DocsPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const baseProps = {
    onBack: vi.fn(),
    isDark: false,
    onToggleTheme: vi.fn(),
  };

  it('renders documentation header, version badge, and sections list', () => {
    render(<DocsPage {...baseProps} />);
    expect(screen.getByText('Documentation & User Guide')).not.toBeNull();
    expect(screen.getByText('Quick Start & Formats')).not.toBeNull();
    expect(screen.getByText('Spreadsheet & Formula Bar')).not.toBeNull();
    expect(screen.getByText('Cell Context Menu & Fonts')).not.toBeNull();
    expect(screen.getByText('AI Auto-Translate & Glossary')).not.toBeNull();
  });

  it('calls onBack when back button is clicked', () => {
    render(<DocsPage {...baseProps} />);
    const backBtn = screen.getByTitle('Back to Workspace (Esc)');
    fireEvent.click(backBtn);

    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleTheme when theme toggle is clicked', () => {
    render(<DocsPage {...baseProps} />);
    const themeBtn = screen.getByTitle('Dark Mode');
    fireEvent.click(themeBtn);

    expect(baseProps.onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('switches to Spreadsheet & Formula Bar section and renders embedded spreadsheet', () => {
    render(<DocsPage {...baseProps} />);
    const spreadsheetTopic = screen.getByText('Spreadsheet & Formula Bar');
    fireEvent.click(spreadsheetTopic);

    expect(screen.getByText('The Spreadsheet Grid & Live Formula Bar')).not.toBeNull();
    expect(screen.getByText('Formula Bar (fx)')).not.toBeNull();
    expect(screen.getAllByText('JSON Link Studio').length).toBeGreaterThanOrEqual(1);
  });

  it('switches to Cell Context Menu & Fonts section', () => {
    render(<DocsPage {...baseProps} />);
    const contextTopic = screen.getByText('Cell Context Menu & Fonts');
    fireEvent.click(contextTopic);

    expect(screen.getByText('Cell Right-Click Context Menu & Font Tools')).not.toBeNull();
    expect(screen.getByText('1-Click Revert')).not.toBeNull();
    expect(screen.getByText('Zawgyi ⇄ Unicode')).not.toBeNull();
  });

  it('switches to AI Auto-Translate section and displays BYOK encryption', () => {
    render(<DocsPage {...baseProps} />);
    const aiTopic = screen.getByText('AI Auto-Translate & Glossary');
    fireEvent.click(aiTopic);

    expect(screen.getByText('AI Auto-Translate, BYOK & Termbase Glossary')).not.toBeNull();
    expect(screen.getByText('BYOK Privacy & AES-GCM 256-bit Encryption')).not.toBeNull();
  });

  it('switches to Keyboard Shortcuts section and shows shortcut list', () => {
    render(<DocsPage {...baseProps} />);
    const shortcutsTopic = screen.getByText('Shortcuts & Power Tips');
    fireEvent.click(shortcutsTopic);

    expect(screen.getByText('Keyboard Shortcuts & Power User Tips')).not.toBeNull();
    expect(screen.getByText('Cmd / Ctrl + K')).not.toBeNull();
    expect(screen.getByText('Cmd / Ctrl + H')).not.toBeNull();
  });

  it('filters topics by search query', () => {
    render(<DocsPage {...baseProps} />);
    const searchInput = screen.getByPlaceholderText('Search documentation...');
    fireEvent.change(searchInput, { target: { value: 'Shortcuts' } });

    expect(screen.getByText('Shortcuts & Power Tips')).not.toBeNull();
    expect(screen.queryByText('Quick Start & Formats')).toBeNull();
  });

  it('handles Escape key to trigger onBack', () => {
    render(<DocsPage {...baseProps} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });
});
