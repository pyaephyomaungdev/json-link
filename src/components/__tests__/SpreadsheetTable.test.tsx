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

  it('renders empty grid state when no items and triggers onOpenImport', () => {
    render(<SpreadsheetTable {...defaultProps} items={[]} />);
    expect(screen.getByRole('heading', { name: 'Empty Translation Grid' })).not.toBeNull();
    expect(screen.getByText('KEY')).not.toBeNull();

    const uploadBtn = screen.getByRole('button', { name: /Upload Translation Files/i });
    fireEvent.click(uploadBtn);
    expect(defaultProps.onOpenImport).toHaveBeenCalledTimes(1);

    const addFirstBtn = screen.getByRole('button', { name: /Add First Key/i });
    fireEvent.click(addFirstBtn);
    expect(defaultProps.onAddRow).toHaveBeenCalledTimes(1);
  });

  it('triggers onOpenAddLanguage from empty grid when provided', () => {
    const onOpenAddLanguage = vi.fn();
    render(<SpreadsheetTable {...defaultProps} items={[]} onOpenAddLanguage={onOpenAddLanguage} />);
    const addLangBtn = screen.getByRole('button', { name: /Add Language/i });
    fireEvent.click(addLangBtn);
    expect(onOpenAddLanguage).toHaveBeenCalledTimes(1);
  });

  it('renders active filter banner and allows clearing when filterMissingLang is provided', () => {
    const onToggleFilterMissingLang = vi.fn();
    render(
      <SpreadsheetTable
        {...defaultProps}
        filterMissingLang="my"
        totalItemCount={10}
        onToggleFilterMissingLang={onToggleFilterMissingLang}
      />
    );

    expect(screen.getByText(/Filtering missing keys in/i)).not.toBeNull();
    const showAllBtn = screen.getByRole('button', { name: 'Show All Keys' });
    fireEvent.click(showAllBtn);
    expect(onToggleFilterMissingLang).toHaveBeenCalledWith('my');
  });

  it('supports row multi-select and triggers bulk approve and bulk review', () => {
    const onBulkUpdateStatus = vi.fn();
    const onOpenAiTranslate = vi.fn();
    render(
      <SpreadsheetTable
        {...defaultProps}
        onBulkUpdateStatus={onBulkUpdateStatus}
        onOpenAiTranslate={onOpenAiTranslate}
      />
    );

    // Initial state: no bulk actions bar
    expect(screen.queryByTestId('bulk-actions-bar')).toBeNull();

    // Select first row checkbox
    const rowCheckboxes = screen.getAllByRole('checkbox');
    // Index 0 is master checkbox, Index 1 is first row, Index 2 is second row
    expect(rowCheckboxes.length).toBe(3);

    fireEvent.click(rowCheckboxes[1]);
    const bulkBar = screen.getByTestId('bulk-actions-bar');
    expect(bulkBar).not.toBeNull();
    expect(bulkBar.textContent).toContain('1 key selected');

    // Select second row as well
    fireEvent.click(rowCheckboxes[2]);
    expect(bulkBar.textContent).toContain('2 keys selected');

    // Click Approve button in bulk actions bar
    const approveBtn = screen.getByRole('button', { name: /^Approve$/i });
    fireEvent.click(approveBtn);
    expect(onBulkUpdateStatus).toHaveBeenCalledWith(['auth.login', 'auth.logout'], 'approved');

    // Selection should be cleared after bulk action
    expect(screen.queryByTestId('bulk-actions-bar')).toBeNull();
  });

  it('supports select-all master checkbox and bulk AI translate', () => {
    const onOpenAiTranslate = vi.fn();
    render(
      <SpreadsheetTable
        {...defaultProps}
        onOpenAiTranslate={onOpenAiTranslate}
      />
    );

    const masterCheckbox = screen.getByRole('checkbox', { name: /Select all rows/i });
    fireEvent.click(masterCheckbox);

    const bulkBar = screen.getByTestId('bulk-actions-bar');
    expect(bulkBar).not.toBeNull();
    expect(bulkBar.textContent).toContain('2 keys selected');

    // Click AI Translate button
    const aiTranslateBtn = screen.getByRole('button', { name: /AI Translate/i });
    fireEvent.click(aiTranslateBtn);
    expect(onOpenAiTranslate).toHaveBeenCalledWith(undefined, undefined, ['auth.login', 'auth.logout']);

    // Deselect all
    const deselectBtn = screen.getByRole('button', { name: /Deselect all rows/i });
    fireEvent.click(deselectBtn);
    expect(screen.queryByTestId('bulk-actions-bar')).toBeNull();
  });
});
