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
    expect(screen.getAllByText('Quick Start').length).toBeGreaterThanOrEqual(1);
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

  it('switches to GitHub Sync section and shows security guardrail', () => {
    render(<DocsPage {...baseProps} />);
    const githubTopic = screen.getByText('GitHub Sync & PRs');
    fireEvent.click(githubTopic);

    expect(screen.getByText('GitHub Localization Sync & Automated Pull Requests')).not.toBeNull();
    expect(screen.getByText('Strict Locales-Only Safety Guardrail')).not.toBeNull();
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
    expect(screen.queryByRole('button', { name: 'Quick Start' })).toBeNull();
  });

  it('handles Escape key to trigger onBack', () => {
    render(<DocsPage {...baseProps} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('switches to Visual ICU Message Builder section', () => {
    render(<DocsPage {...baseProps} />);
    const icuTopic = screen.getByText('Visual ICU Message Builder');
    fireEvent.click(icuTopic);

    expect(screen.getByText('Visual ICU Message Builder & Syntax Tester')).not.toBeNull();
    expect(screen.getAllByText('Plural Equation Builder').length).toBeGreaterThanOrEqual(1);
  });

  it('switches to XLIFF & GNU gettext PO enterprise section', () => {
    render(<DocsPage {...baseProps} />);
    const enterpriseTopic = screen.getByText('XLIFF 1.2 & GNU gettext PO');
    fireEvent.click(enterpriseTopic);

    expect(screen.getByText('Enterprise Standards: XLIFF 1.2 & GNU gettext PO')).not.toBeNull();
    expect(screen.getByText('XLIFF 1.2 (XML Localization Interchange File Format)')).not.toBeNull();
  });

  it('handles feedback widget submission', () => {
    render(<DocsPage {...baseProps} />);
    const yesBtn = screen.getByText('Yes');
    fireEvent.click(yesBtn);

    expect(screen.getByText('Thank you for your feedback!')).not.toBeNull();
  });
});

