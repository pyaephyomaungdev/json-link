// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DuplicateFinderModal } from '../DuplicateFinderModal';
import { TranslationItem } from '@/types';

describe('DuplicateFinderModal', () => {
  afterEach(() => {
    cleanup();
  });

  const items: TranslationItem[] = [
    { key: 'btn.save', en: 'Save', my: 'သိမ်းမည်' },
    { key: 'btn.confirm', en: 'Save', my: 'အတည်ပြုမည်' },
  ];

  it('renders modal with title and duplicate count', () => {
    render(
      <DuplicateFinderModal
        isOpen={true}
        onClose={vi.fn()}
        items={items}
        languages={['en', 'my']}
      />
    );

    expect(screen.getByText('Duplicate Value Finder')).not.toBeNull();
    expect(screen.getByText('“Save”')).not.toBeNull();
    expect(screen.getByText('2 keys share this')).not.toBeNull();
  });

  it('calls onSelectKey and closes when a key tag is clicked', () => {
    const onSelectKey = vi.fn();
    const onClose = vi.fn();

    render(
      <DuplicateFinderModal
        isOpen={true}
        onClose={onClose}
        items={items}
        languages={['en', 'my']}
        onSelectKey={onSelectKey}
      />
    );

    const keyBtn = screen.getByText('btn.save');
    fireEvent.click(keyBtn);

    expect(onSelectKey).toHaveBeenCalledWith('btn.save');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
