import { useState, useEffect, useCallback, RefObject } from 'react';

export interface UseVirtualRowsOptions {
  containerRef: RefObject<HTMLElement | null>;
  totalItems: number;
  rowHeight?: number;
  overscan?: number;
  enabled?: boolean;
}

export interface UseVirtualRowsResult {
  startIndex: number;
  endIndex: number;
  topSpacerHeight: number;
  bottomSpacerHeight: number;
  isVirtual: boolean;
  scrollToIndex: (index: number) => void;
}

export const DEFAULT_ROW_HEIGHT = 38;
export const DEFAULT_OVERSCAN = 12;

/**
 * Zero-dependency virtual windowing hook for table rows.
 * Keeps DOM node count constant even with 5,000+ items.
 */
export function useVirtualRows({
  containerRef,
  totalItems,
  rowHeight = DEFAULT_ROW_HEIGHT,
  overscan = DEFAULT_OVERSCAN,
  enabled = true,
}: UseVirtualRowsOptions): UseVirtualRowsResult {
  const [scrollState, setScrollState] = useState<{ scrollTop: number; viewportHeight: number }>({
    scrollTop: 0,
    viewportHeight: 600,
  });

  const isVirtual = enabled && totalItems > 50;

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
            scrollTop: containerRef.current.scrollTop,
            viewportHeight: containerRef.current.clientHeight || 600,
          });
        }
      });
    };

    // Initial measurement
    setScrollState({
      scrollTop: container.scrollTop,
      viewportHeight: container.clientHeight || 600,
    });

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [containerRef, isVirtual, totalItems]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container || index < 0 || index >= totalItems) return;

      const targetTop = index * rowHeight;
      const targetBottom = targetTop + rowHeight;
      const currentTop = container.scrollTop;
      const currentBottom = currentTop + container.clientHeight;

      if (targetTop < currentTop) {
        container.scrollTop = targetTop;
      } else if (targetBottom > currentBottom) {
        container.scrollTop = targetBottom - container.clientHeight;
      }
    },
    [containerRef, rowHeight, totalItems]
  );

  if (!isVirtual || totalItems === 0) {
    return {
      startIndex: 0,
      endIndex: totalItems,
      topSpacerHeight: 0,
      bottomSpacerHeight: 0,
      isVirtual: false,
      scrollToIndex,
    };
  }

  const { scrollTop, viewportHeight } = scrollState;
  const rawStart = Math.floor(scrollTop / rowHeight);
  const rawEnd = Math.ceil((scrollTop + viewportHeight) / rowHeight);

  const startIndex = Math.max(0, rawStart - overscan);
  const endIndex = Math.min(totalItems, rawEnd + overscan);

  const topSpacerHeight = startIndex * rowHeight;
  const bottomSpacerHeight = Math.max(0, (totalItems - endIndex) * rowHeight);

  return {
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight,
    isVirtual: true,
    scrollToIndex,
  };
}
