// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DocumentationModal } from '../DocumentationModal';

describe('DocumentationModal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  it('renders modal with header and tabs when open', () => {
    render(<DocumentationModal {...baseProps} />);
    expect(screen.getByText('User Guide & Documentation')).not.toBeNull();
    expect(screen.getByText('Interactive Visual Guide')).not.toBeNull();
    expect(screen.getByText('Getting Started & Formats')).not.toBeNull();
    expect(screen.getByText('Spreadsheet & Editing')).not.toBeNull();
    expect(screen.getByText('Right-Click Context Menu')).not.toBeNull();
  });

  it('does not render content when isOpen is false', () => {
    render(<DocumentationModal {...baseProps} isOpen={false} />);
    expect(screen.queryByText('User Guide & Documentation')).toBeNull();
  });

  it('switches to Spreadsheet & Editing tab on click', () => {
    render(<DocumentationModal {...baseProps} />);
    const editingTab = screen.getByText('Spreadsheet & Editing');
    fireEvent.click(editingTab);

    expect(screen.getByText('Spreadsheet Navigation & Cell Editing')).not.toBeNull();
    expect(screen.getByText('Formula Bar (fx) Editing')).not.toBeNull();
  });

  it('switches to Right-Click Context Menu tab and displays cell actions', () => {
    render(<DocumentationModal {...baseProps} />);
    const contextTab = screen.getByText('Right-Click Context Menu');
    fireEvent.click(contextTab);

    expect(screen.getByText('Right-Click Cell Context Menu & Font Conversion')).not.toBeNull();
    expect(screen.getByText('Revert to original value')).not.toBeNull();
    expect(screen.getByText('Convert Zawgyi ➔ Unicode')).not.toBeNull();
  });

  it('switches to AI Auto-Translate tab and shows variable protection', () => {
    render(<DocumentationModal {...baseProps} />);
    const aiTab = screen.getByText('AI Auto-Translate');
    fireEvent.click(aiTab);

    expect(screen.getByText('AI Auto-Translate & Variable Protection')).not.toBeNull();
    expect(screen.getByText('Shielded Variables')).not.toBeNull();
  });

  it('switches to QA Linter tab and shows Missing filter explanation', () => {
    render(<DocumentationModal {...baseProps} />);
    const linterTab = screen.getByText('QA Linter & Scorecard');
    fireEvent.click(linterTab);

    expect(screen.getByText('QA Consistency Linter & Missing Filters')).not.toBeNull();
    expect(screen.getByText('Fix All Whitespace')).not.toBeNull();
  });

  it('switches to Keyboard Shortcuts tab', () => {
    render(<DocumentationModal {...baseProps} />);
    const shortcutsTab = screen.getByText('Keyboard Shortcuts');
    fireEvent.click(shortcutsTab);

    expect(screen.getByText('Keyboard Shortcuts & Pro Tips')).not.toBeNull();
    expect(screen.getByText('Cmd / Ctrl + K')).not.toBeNull();
    expect(screen.getByText('Cmd / Ctrl + H')).not.toBeNull();
  });

  it('filters tabs based on search input', () => {
    render(<DocumentationModal {...baseProps} />);
    const searchInput = screen.getByPlaceholderText('Search guide (ရှာဖွေရန်)...');
    fireEvent.change(searchInput, { target: { value: 'Shortcut' } });

    expect(screen.getByText('Keyboard Shortcuts')).not.toBeNull();
    expect(screen.queryByText('Getting Started & Formats')).toBeNull();
  });
});
