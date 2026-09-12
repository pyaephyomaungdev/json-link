// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TranslationMemoryModal } from '../TranslationMemoryModal';
import { clearTranslationMemory } from '@/lib/translationMemory';
import { TranslationItem } from '@/types';

describe('TranslationMemoryModal', () => {
  afterEach(() => {
    cleanup();
    clearTranslationMemory();
  });

  const baseItems: TranslationItem[] = [
    { key: 'btn.save', en: 'Save', my: 'သိမ်းဆည်းပါ' },
    { key: 'btn.cancel', en: 'Cancel', my: 'ပယ်ဖျက်ပါ' },
  ];

  it('renders modal with title and empty message', () => {
    render(
      <TranslationMemoryModal
        isOpen={true}
        onClose={vi.fn()}
        items={baseItems}
        languages={['en', 'my']}
      />
    );

    expect(screen.getByText('Translation Memory (TM Cache)')).not.toBeNull();
    expect(screen.getByText('No translation memory entries found.')).not.toBeNull();
  });

  it('indexes active workspace when Index button is clicked', () => {
    render(
      <TranslationMemoryModal
        isOpen={true}
        onClose={vi.fn()}
        items={baseItems}
        languages={['en', 'my']}
      />
    );

    const indexBtn = screen.getByText('Index Active Workspace');
    fireEvent.click(indexBtn);

    expect(screen.getByText('“Save”')).not.toBeNull();
    expect(screen.getByText('“Cancel”')).not.toBeNull();
    expect(screen.getByText('သိမ်းဆည်းပါ')).not.toBeNull();
  });

  it('opens custom ConfirmDialog when Clear button is clicked and clears memory on confirmation', () => {
    render(
      <TranslationMemoryModal
        isOpen={true}
        onClose={vi.fn()}
        items={baseItems}
        languages={['en', 'my']}
      />
    );

    // Index first so entries exist
    fireEvent.click(screen.getByText('Index Active Workspace'));
    expect(screen.getByText('“Save”')).not.toBeNull();

    // Click trash button
    const clearBtn = screen.getByTitle('Clear all memory');
    fireEvent.click(clearBtn);

    // Custom confirm dialog should open with title and description
    expect(screen.getByText('Clear Translation Memory')).not.toBeNull();
    expect(
      screen.getAllByText(
        'Are you sure you want to clear all stored Translation Memory entries? This action cannot be undone.'
      ).length
    ).toBeGreaterThan(0);

    // Confirm the dialog
    const confirmBtn = screen.getByRole('button', { name: 'Clear All' });
    fireEvent.click(confirmBtn);

    // Should show empty state
    expect(screen.getByText('No translation memory entries found.')).not.toBeNull();
  });
});
