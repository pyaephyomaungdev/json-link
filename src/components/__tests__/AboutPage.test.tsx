// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AboutPage } from '../AboutPage';

describe('AboutPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const baseProps = {
    onBack: vi.fn(),
    isDark: false,
    onToggleTheme: vi.fn(),
    onOpenDocs: vi.fn(),
  };

  it('renders application version, highlights, and back button', () => {
    render(<AboutPage {...baseProps} />);
    expect(screen.getAllByText('v1.0.0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Authentic Spreadsheet UX')).not.toBeNull();
    expect(screen.getByText('10+ Formats & Flutter ARB')).not.toBeNull();
    expect(screen.getByText('Cell Context Menu & 1-Click Revert')).not.toBeNull();
    expect(screen.getByText('AI Auto-Translate')).not.toBeNull();
    expect(screen.getByText('Zawgyi ⇄ Unicode')).not.toBeNull();
    expect(screen.getByText('266 Automated Tests')).not.toBeNull();
  });

  it('calls onOpenDocs when User Guide button is clicked', () => {
    render(<AboutPage {...baseProps} />);
    const docsBtn = screen.getByText('User Guide & Docs');
    fireEvent.click(docsBtn);

    expect(baseProps.onOpenDocs).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when back button is clicked', () => {
    render(<AboutPage {...baseProps} />);
    const backBtn = screen.getByTitle('Back to Workspace (Esc)');
    fireEvent.click(backBtn);

    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleTheme when theme toggle button is clicked', () => {
    render(<AboutPage {...baseProps} />);
    const themeBtn = screen.getByTitle('Dark Mode');
    fireEvent.click(themeBtn);

    expect(baseProps.onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('handles Escape key to go back', () => {
    render(<AboutPage {...baseProps} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });
});
