// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVirtualColumns } from '../useVirtualColumns';

describe('useVirtualColumns', () => {
  const mockLanguages = [
    'en', 'my', 'ja', 'ko', 'zh', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'hi',
  ];

  it('disables virtualization when language count is <= 8', () => {
    const containerRef = { current: null };
    const { result } = renderHook(() =>
      useVirtualColumns({
        containerRef,
        languages: ['en', 'my', 'ja'],
        getColWidth: () => 200,
        frozenCount: 0,
      })
    );

    expect(result.current.isVirtual).toBe(false);
    expect(result.current.visibleLanguages).toEqual(['en', 'my', 'ja']);
    expect(result.current.leftSpacerWidth).toBe(0);
    expect(result.current.rightSpacerWidth).toBe(0);
  });

  it('virtualizes columns for > 8 languages and calculates spacers', () => {
    const mockElement = {
      scrollLeft: 600, // scrolled 3 columns to the right (assuming 200px each)
      clientWidth: 800, // fits 4 columns
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as HTMLElement;

    const containerRef = { current: mockElement };

    const { result } = renderHook(() =>
      useVirtualColumns({
        containerRef,
        languages: mockLanguages,
        getColWidth: () => 200,
        frozenCount: 1, // 'en' is frozen
        overscan: 1,
      })
    );

    expect(result.current.isVirtual).toBe(true);
    // Frozen column 'en' must be included
    expect(result.current.visibleLanguages).toContain('en');
    // Left and right spacers should account for unrendered columns
    expect(result.current.totalWidth).toBe(mockLanguages.length * 200);
  });
});
