// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { StatsBar } from '../StatsBar';
import { TranslationItem } from '@/types';

describe('StatsBar', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockItems: TranslationItem[] = [
    { key: 'app.title', en: 'Hello World', my: 'မင်္ဂလာပါ' },
    { key: 'app.desc', en: 'A welcome description', my: '' },
    { key: 'app.footer', en: 'All rights reserved', my: 'မူပိုင်ခွင့်ရပြီး' },
  ];
  const mockLangs = ['en', 'my'];

  it('renders nothing when there are no items', () => {
    const { container } = render(
      <StatsBar
        items={[]}
        languages={mockLangs}
        activeFilter="all"
        onFilterChange={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders total keys and overall completion counts', () => {
    render(
      <StatsBar
        items={mockItems}
        languages={mockLangs}
        activeFilter="all"
        onFilterChange={vi.fn()}
      />
    );

    expect(screen.getByText('Total Keys')).not.toBeNull();
    expect(screen.getByText('3')).not.toBeNull();
  });

  it('calculates completion percentages for languages accurately', () => {
    render(
      <StatsBar
        items={mockItems}
        languages={mockLangs}
        activeFilter="all"
        onFilterChange={vi.fn()}
      />
    );

    // EN has 3/3 = 100%
    expect(screen.getByText('100%')).not.toBeNull();
    // MY has 2/3 = 67%
    expect(screen.getByText('67%')).not.toBeNull();
  });

  it('allows clicking missing filter pill to toggle onFilterChange', () => {
    const onFilterChange = vi.fn();
    render(
      <StatsBar
        items={mockItems}
        languages={mockLangs}
        activeFilter="all"
        onFilterChange={onFilterChange}
      />
    );

    const missingBtn = screen.getByRole('button', { name: /missing/i });
    fireEvent.click(missingBtn);

    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith('missing');
  });

  it('clicking active missing filter toggles back to all', () => {
    const onFilterChange = vi.fn();
    render(
      <StatsBar
        items={mockItems}
        languages={mockLangs}
        activeFilter="missing"
        onFilterChange={onFilterChange}
      />
    );

    const missingBtn = screen.getByRole('button', { name: /missing/i });
    fireEvent.click(missingBtn);

    expect(onFilterChange).toHaveBeenCalledWith('all');
  });
});
