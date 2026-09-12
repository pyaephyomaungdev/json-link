// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { GlossaryModal } from '../GlossaryModal';

describe('GlossaryModal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  it('renders correctly when open', () => {
    render(<GlossaryModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'AI Translation Glossary & Terminology' })).not.toBeNull();
    expect(screen.getByPlaceholderText('e.g. KBZPay, Sign In')).not.toBeNull();
    expect(screen.getByPlaceholderText('e.g. အကောင့်ဝင်ပါ')).not.toBeNull();
  });

  it('adds a translation term rule and calls onSave', () => {
    render(<GlossaryModal {...defaultProps} />);
    const termInput = screen.getByPlaceholderText('e.g. KBZPay, Sign In');
    const targetInput = screen.getByPlaceholderText('e.g. အကောင့်ဝင်ပါ');
    const addBtn = screen.getByRole('button', { name: 'Add Rule' });

    fireEvent.change(termInput, { target: { value: 'Login' } });
    fireEvent.change(targetInput, { target: { value: 'အကောင့်ဝင်ရန်' } });
    fireEvent.click(addBtn);

    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Login')).not.toBeNull();
    expect(screen.getByText('အကောင့်ဝင်ရန်')).not.toBeNull();
  });

  it('adds a do-not-translate brand rule', () => {
    render(<GlossaryModal {...defaultProps} />);
    const termInput = screen.getByPlaceholderText('e.g. KBZPay, Sign In');
    const checkbox = screen.getByRole('checkbox');

    fireEvent.change(termInput, { target: { value: 'WavePay' } });
    fireEvent.click(checkbox);

    expect(screen.getByText('Keep original as-is (Do not translate)')).not.toBeNull();

    const addBtn = screen.getByRole('button', { name: 'Add Rule' });
    fireEvent.click(addBtn);

    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
    expect(screen.getByText('WavePay')).not.toBeNull();
    expect(screen.getByText('KEEP AS-IS')).not.toBeNull();
  });

  it('deletes an existing rule with accessible button and confirmation flow', () => {
    render(<GlossaryModal {...defaultProps} />);
    const termInput = screen.getByPlaceholderText('e.g. KBZPay, Sign In');
    const targetInput = screen.getByPlaceholderText('e.g. အကောင့်ဝင်ပါ');
    const addBtn = screen.getByRole('button', { name: 'Add Rule' });

    fireEvent.change(termInput, { target: { value: 'To Delete' } });
    fireEvent.change(targetInput, { target: { value: 'Target' } });
    fireEvent.click(addBtn);

    expect(screen.getByText('To Delete')).not.toBeNull();

    // 1. Check accessible name of the delete button
    const deleteBtn = screen.getByRole('button', { name: 'Delete glossary rule for To Delete' });
    expect(deleteBtn).not.toBeNull();
    fireEvent.click(deleteBtn);

    // 2. Inline confirmation appears
    const confirmBtn = screen.getByRole('button', { name: 'Confirm delete glossary rule for To Delete' });
    expect(confirmBtn).not.toBeNull();
    fireEvent.click(confirmBtn);

    expect(screen.queryByText('To Delete')).toBeNull();
  });
});
