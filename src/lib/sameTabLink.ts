import type { MouseEvent } from 'react';

/** Keep normal clicks in the SPA. Modified clicks follow the real href. */
export function onSameTabLinkClick(
  event: MouseEvent<HTMLAnchorElement>,
  navigate: () => void,
) {
  if (event.defaultPrevented) return;
  if (event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate();
}
