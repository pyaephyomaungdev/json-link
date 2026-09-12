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
});
