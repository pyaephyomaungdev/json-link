import { useState, useEffect, RefObject } from 'react';

export interface UseVirtualColumnsOptions {
  containerRef: RefObject<HTMLElement | null>;
  languages: string[];
  getColWidth: (lang: string) => number;
  frozenCount: number; // Number of leading languages that are frozen
  activeField?: string | null; // Currently focused/editing field to ensure never unmounted
  overscan?: number;
  enabled?: boolean;
}

export interface UseVirtualColumnsResult {
  isVirtual: boolean;
  visibleLanguages: string[];
  startIndex: number;
  endIndex: number;
  leftSpacerWidth: number;
  rightSpacerWidth: number;
  totalWidth: number;
}

const DEFAULT_OVERSCAN = 2;

/**
 * 2D Horizontal column virtualization hook for large spreadsheets (10+ languages).
 * Replaces off-screen columns with exact pixel-width spacer cells to keep DOM size constant.
 */
export function useVirtualColumns({
  containerRef,
  languages,
  getColWidth,
  frozenCount = 0,
  activeField,
  overscan = DEFAULT_OVERSCAN,
  enabled = true,
}: UseVirtualColumnsOptions): UseVirtualColumnsResult {
  const [scrollState, setScrollState] = useState<{ scrollLeft: number; viewportWidth: number }>({
    scrollLeft: 0,
    viewportWidth: 1200,
  });

  const isVirtual = enabled && languages.length > 8;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isVirtual) return;

    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (containerRef.current) {
          setScrollState({
            scrollLeft: containerRef.current.scrollLeft,
            viewportWidth: containerRef.current.clientWidth || 1200,
          });
        }
      });
    };

    // Initial measurement
    setScrollState({
      scrollLeft: container.scrollLeft,
      viewportWidth: container.clientWidth || 1200,
    });

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [containerRef, isVirtual]);

  // Total width of all language columns
  const colWidths = languages.map(l => getColWidth(l));
  const totalWidth = colWidths.reduce((acc, w) => acc + w, 0);

  if (!isVirtual) {
    return {
      isVirtual: false,
      visibleLanguages: languages,
      startIndex: 0,
      endIndex: languages.length,
      leftSpacerWidth: 0,
      rightSpacerWidth: 0,
      totalWidth,
    };
  }

  // Pre-calculate cumulative offsets
  const offsets: number[] = [0];
  for (let i = 0; i < languages.length; i++) {
    offsets.push(offsets[i] + colWidths[i]);
  }

  const { scrollLeft, viewportWidth } = scrollState;
  const viewLeft = Math.max(0, scrollLeft);
  const viewRight = viewLeft + viewportWidth;

  // Frozen columns are always rendered
  const safeFrozen = Math.min(frozenCount, languages.length);

  // Find start and end indices of visible scrollable columns
  let rawStart = safeFrozen;
  while (rawStart < languages.length && offsets[rawStart + 1] < viewLeft) {
    rawStart++;
  }

  let rawEnd = rawStart;
  while (rawEnd < languages.length && offsets[rawEnd] < viewRight) {
    rawEnd++;
  }

  const startIndex = Math.max(safeFrozen, rawStart - overscan);
  let endIndex = Math.min(languages.length, rawEnd + overscan);

  // Ensure active/editing language is never omitted from render
  if (activeField) {
    const activeIndex = languages.indexOf(activeField);
    if (activeIndex >= safeFrozen && activeIndex >= endIndex) {
      endIndex = activeIndex + 1;
    }
  }

  // Spacer widths
  let leftSpacerWidth = 0;
  for (let i = safeFrozen; i < startIndex; i++) {
    leftSpacerWidth += colWidths[i];
  }

  let rightSpacerWidth = 0;
  for (let i = endIndex; i < languages.length; i++) {
    rightSpacerWidth += colWidths[i];
  }

  // Resulting visible languages = frozen languages + visible slice
  const frozenLanguages = languages.slice(0, safeFrozen);
  const slicedLanguages = languages.slice(startIndex, endIndex);
  const visibleLanguages = [...frozenLanguages, ...slicedLanguages];

  return {
    isVirtual: true,
    visibleLanguages,
    startIndex,
    endIndex,
    leftSpacerWidth,
    rightSpacerWidth,
    totalWidth,
  };
}
