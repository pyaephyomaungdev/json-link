import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HorizontalScrollContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  scrollAmount?: number;
  className?: string;
  wrapperClassName?: string;
  gradientFrom?: string;
  showArrows?: boolean;
}

/**
 * HorizontalScrollContainer
 * Project-wide reusable horizontal scroll component.
 * - Completely hides browser horizontal scrollbars (WebKit & Firefox).
 * - Displays smooth left/right arrow buttons with gradient masks when content overflows.
 * - Supports native trackpad/mousewheel scrolling and smooth click-to-scroll.
 */
export const HorizontalScrollContainer = React.forwardRef<
  HTMLDivElement,
  HorizontalScrollContainerProps
>(
  (
    {
      children,
      scrollAmount = 160,
      className,
      wrapperClassName,
      gradientFrom = 'from-background',
      showArrows = true,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const scrollRef = (forwardedRef as React.RefObject<HTMLDivElement>) || internalRef;

    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
      const el = scrollRef.current;
      if (!el) return;
      const { scrollLeft, scrollWidth, clientWidth } = el;
      // Allow a 2px tolerance for fractional pixel sub-pixel rounding
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    }, [scrollRef]);

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;

      checkScroll();

      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);

      let ro: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => checkScroll());
        ro.observe(el);
        if (el.firstElementChild) {
          ro.observe(el.firstElementChild);
        }
      }

      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        ro?.disconnect();
      };
    }, [checkScroll, scrollRef]);

    const handleScrollLeft = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (scrollRef.current) {
        scrollRef.current.scrollBy({
          left: -scrollAmount,
          behavior: 'smooth',
        });
      }
    };

    const handleScrollRight = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (scrollRef.current) {
        scrollRef.current.scrollBy({
          left: scrollAmount,
          behavior: 'smooth',
        });
      }
    };

    return (
      <div
        className={cn('relative w-full overflow-hidden group/hscroll', wrapperClassName)}
        {...props}
      >
        {/* Left Arrow & Fade Mask */}
        {showArrows && canScrollLeft && (
          <div
            className={cn(
              'absolute left-0 top-0 bottom-0 z-10 flex items-center justify-start pl-0.5 pr-3 bg-gradient-to-r via-background/90 to-transparent pointer-events-none transition-opacity duration-200',
              gradientFrom
            )}
          >
            <button
              type="button"
              onClick={handleScrollLeft}
              className="size-5 sm:size-6 rounded-full bg-background border border-border/80 shadow-xs hover:bg-muted text-foreground flex items-center justify-center cursor-pointer transition-all hover:scale-110 pointer-events-auto shrink-0"
              aria-label="Scroll left"
              title="Scroll left"
            >
              <ChevronLeft className="size-3 sm:size-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className={cn(
            'flex items-center overflow-x-auto overflow-y-hidden select-none no-scrollbar',
            '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0',
            className
          )}
        >
          {children}
        </div>

        {/* Right Arrow & Fade Mask */}
        {showArrows && canScrollRight && (
          <div
            className={cn(
              'absolute right-0 top-0 bottom-0 z-10 flex items-center justify-end pr-0.5 pl-3 bg-gradient-to-l via-background/90 to-transparent pointer-events-none transition-opacity duration-200',
              gradientFrom
            )}
          >
            <button
              type="button"
              onClick={handleScrollRight}
              className="size-5 sm:size-6 rounded-full bg-background border border-border/80 shadow-xs hover:bg-muted text-foreground flex items-center justify-center cursor-pointer transition-all hover:scale-110 pointer-events-auto shrink-0"
              aria-label="Scroll right"
              title="Scroll right"
            >
              <ChevronRight className="size-3 sm:size-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }
);

HorizontalScrollContainer.displayName = 'HorizontalScrollContainer';
