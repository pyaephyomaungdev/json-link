// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVirtualRows } from '../useVirtualRows';

describe('useVirtualRows', () => {
  it('disables virtualization for small lists (<= 50 items)', () => {
    const containerRef = { current: null };
    const { result } = renderHook(() =>
      useVirtualRows({
        containerRef,
        totalItems: 30,
        rowHeight: 38,
      })
    );

    expect(result.current.isVirtual).toBe(false);
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(30);
    expect(result.current.topSpacerHeight).toBe(0);
    expect(result.current.bottomSpacerHeight).toBe(0);
  });

  it('enables virtualization for lists with > 50 items and calculates slice', () => {
    const mockElement = {
      scrollTop: 380, // scrolled 10 rows down
      clientHeight: 380, // viewport fits 10 rows
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as HTMLElement;

    const containerRef = { current: mockElement };

    const { result } = renderHook(() =>
      useVirtualRows({
        containerRef,
        totalItems: 200,
        rowHeight: 38,
        overscan: 5,
        enabled: true,
      })
    );

    expect(result.current.isVirtual).toBe(true);
    // rawStart = 10, rawEnd = 20. With overscan 5:
    // startIndex = 10 - 5 = 5, endIndex = 20 + 5 = 25
    expect(result.current.startIndex).toBe(5);
    expect(result.current.endIndex).toBe(25);
    expect(result.current.topSpacerHeight).toBe(5 * 38);
    expect(result.current.bottomSpacerHeight).toBe((200 - 25) * 38);
  });

  it('scrolls container to target row index correctly', () => {
    const mockElement = {
      scrollTop: 0,
      clientHeight: 380,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as HTMLElement;

    const containerRef = { current: mockElement };

    const { result } = renderHook(() =>
      useVirtualRows({
        containerRef,
        totalItems: 100,
        rowHeight: 38,
      })
    );

    act(() => {
      result.current.scrollToIndex(20); // targetTop = 760
    });

    expect(mockElement.scrollTop).toBe(760 + 38 - 380); // targetBottom - clientHeight
  });
});
