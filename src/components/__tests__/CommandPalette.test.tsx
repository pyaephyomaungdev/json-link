// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CommandPalette, CommandItem } from '../CommandPalette';

describe('CommandPalette', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockCommands: CommandItem[] = [
    {
      id: 'ai-translate',
      category: 'AI',
      title: 'AI Auto-Translate Missing Keys',
      description: 'Run batch translation',
      icon: <span data-testid="icon-ai" />,
      action: vi.fn(),
    },
    {
      id: 'export-json',
      category: 'Export',
      title: 'Export Multi-language JSON',
      description: 'Download json files',
      icon: <span data-testid="icon-export" />,
      action: vi.fn(),
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    commands: mockCommands,
  };

  it('renders commands when open', () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.getByPlaceholderText('Type a command or search action...')).not.toBeNull();
    expect(screen.getByText('AI Auto-Translate Missing Keys')).not.toBeNull();
    expect(screen.getByText('Export Multi-language JSON')).not.toBeNull();
  });

  it('filters commands based on search input', () => {
    render(<CommandPalette {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Type a command or search action...');

    fireEvent.change(searchInput, { target: { value: 'Export' } });

    expect(screen.getByText('Export Multi-language JSON')).not.toBeNull();
    expect(screen.queryByText('AI Auto-Translate Missing Keys')).toBeNull();
  });

  it('executes command action on click and closes palette', () => {
    render(<CommandPalette {...defaultProps} />);
    const cmdItem = screen.getByText('AI Auto-Translate Missing Keys');
    fireEvent.click(cmdItem);

    expect(mockCommands[0].action).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('navigates with keyboard and executes with Enter', () => {
    render(<CommandPalette {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Type a command or search action...');

    // Arrow down to second command (Export)
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(mockCommands[1].action).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on clicking close button', () => {
    render(<CommandPalette {...defaultProps} />);
    const closeBtn = screen.getByTitle('Close (Esc)');
    fireEvent.click(closeBtn);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
