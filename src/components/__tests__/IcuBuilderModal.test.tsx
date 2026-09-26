// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { IcuBuilderModal } from '../IcuBuilderModal';

describe('IcuBuilderModal', () => {
  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    targetKey: 'cart.items_count',
    targetField: 'en',
    initialValue: '',
    onInsert: vi.fn(),
  };

  it('renders modal and generates plural expression by default', () => {
    render(<IcuBuilderModal {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /Visual ICU Message Builder/i })).not.toBeNull();
    expect(screen.getByText('cart.items_count (en)')).not.toBeNull();
    expect(screen.getByText('Plural Cases')).not.toBeNull();

    // Check generated ICU contains plural clauses
    expect(screen.getByText(/\{count, plural,/i)).not.toBeNull();
  });

  it('allows switching to select format', () => {
    render(<IcuBuilderModal {...defaultProps} />);

    const selectBtn = screen.getByRole('button', { name: /Select Format/i });
    fireEvent.click(selectBtn);

    expect(screen.getByText('Select Choices')).not.toBeNull();
    expect(screen.getAllByText(/\{gender, select,/i).length).toBeGreaterThan(0);
  });

  it('evaluates and renders preview in live sandbox', () => {
    render(<IcuBuilderModal {...defaultProps} />);

    expect(screen.getByText(/Live Test Sandbox/i)).not.toBeNull();
    expect(screen.getByText('no items')).not.toBeNull();
  });

  it('calls onInsert and onClose when Apply to Cell is clicked', () => {
    const onInsert = vi.fn();
    const onClose = vi.fn();
    render(<IcuBuilderModal {...defaultProps} onInsert={onInsert} onClose={onClose} />);

    const applyBtn = screen.getByRole('button', { name: /Apply to Cell/i });
    fireEvent.click(applyBtn);

    expect(onInsert).toHaveBeenCalledWith(expect.stringContaining('{count, plural,'));
    expect(onClose).toHaveBeenCalled();
  });
});
