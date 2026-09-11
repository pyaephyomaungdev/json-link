// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SpreadsheetTable } from '../SpreadsheetTable';
import { TranslationItem } from '@/types';

describe('SpreadsheetTable', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockItems: TranslationItem[] = [
    {
      key: 'auth.login',
      description: 'Login label',
      en: 'Sign In',
      my: 'အကောင့်ဝင်ရန်',
      status: 'approved',
    },
    {
      key: 'auth.logout',
      description: 'Logout label',
      en: 'Sign Out',
      my: 'ထွက်ရန်',
      status: 'draft',
    },
  ];

  const defaultProps = {
    items: mockItems,
    languages: ['en', 'my'],
    onUpdateCell: vi.fn(),
    onUpdateKey: vi.fn(),
    onDeleteRow: vi.fn(),
    onAddRow: vi.fn(),
    onOpenImport: vi.fn(),
    onDuplicateRow: vi.fn(),
    onOpenAiTranslate: vi.fn(),
    onUpdateRowStatus: vi.fn(),
  };

  it('renders spreadsheet headers and row keys', () => {
    render(<SpreadsheetTable {...defaultProps} />);
    expect(screen.getByText('KEY')).not.toBeNull();
    expect(screen.getByText('EN')).not.toBeNull();
    expect(screen.getByText('MY')).not.toBeNull();
    expect(screen.getByText('auth.login')).not.toBeNull();
    expect(screen.getByText('auth.logout')).not.toBeNull();
  });

  it('selects cell on click', () => {
    render(<SpreadsheetTable {...defaultProps} />);
    const cell = screen.getByText('Sign In');
    fireEvent.click(cell);

    expect(cell.closest('td')).not.toBeNull();
  });

  it('renders empty state when no items and triggers onOpenImport', () => {
    render(<SpreadsheetTable {...defaultProps} items={[]} />);
    expect(screen.getByRole('heading', { name: 'No translation spreadsheet loaded' })).not.toBeNull();

    const uploadBtn = screen.getByRole('button', { name: /Upload Translation Files/i });
    fireEvent.click(uploadBtn);
    expect(defaultProps.onOpenImport).toHaveBeenCalledTimes(1);

    const addFirstBtn = screen.getByRole('button', { name: /Add First Key/i });
    fireEvent.click(addFirstBtn);
    expect(defaultProps.onAddRow).toHaveBeenCalledTimes(1);
  });
});
