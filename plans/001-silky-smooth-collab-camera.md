# Plan 001: Eliminate Follow Mode Jitter and Implement Figma-Grade Camera Tracking

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. Commit your work in the worktree following the plan's git workflow section.
>
> **Drift check (run first)**: `git diff --stat b924fc3..HEAD -- src/components/SpreadsheetTable.tsx src/hooks/useCollabSession.ts src/App.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `b924fc3`, 2026-09-19

## Why this matters

When following a collaborator in multi-user collaboration mode, the follower's viewport and cursor experience noticeable jitter, vibration, and stuttering. This happens because:
1. Dual competing scroll animations fight for control of the same scroll container (`cellEl.scrollIntoView({ behavior: 'smooth' })` triggered on every mouse move while a 60fps rAF loop is concurrently driving `container.scrollLeft / scrollTop`).
2. A margin clamping calculation bug causes the target horizontal scroll to oscillate by over 200px whenever the leader's cursor is near the frozen Key column.
3. CSS `transition-[transform] 75ms ease-out` on high-frequency WebRTC pointer coordinates causes interpolation interruptions and micro-judder.
4. Programmatic camera scrolls fire DOM `onScroll` events that echo scroll updates back across the WebRTC network.

Fixing this will make the follow camera and remote cursors buttery smooth, stable, and responsive, matching the standard of Figma multiplayer canvas navigation.

## Current state

The relevant files:
- `src/components/SpreadsheetTable.tsx` — Spreadsheet grid UI; contains the follow auto-scroll effects (lines 408-566) and remote cursor DOM rendering (lines 2384-2430).
- `src/hooks/useCollabSession.ts` — WebRTC session manager; handles awareness broadcast throttling (`handleScroll`, lines 467-485).
- `src/components/__tests__/SpreadsheetTable.test.tsx` — Test suite for table interactions, follow mode, and scrolling.

### Existing Code Excerpts

In `src/components/SpreadsheetTable.tsx:408-453`:
```tsx
  // Follow Mode: smooth auto-scroll to the followed peer's active cell whenever it moves
  useEffect(() => {
    if (!followingPeerName || !collabPeers || collabPeers.length === 0) return;
    const targetPeer = collabPeers.find(p => p.name === followingPeerName);
    if (!targetPeer?.activeCell?.key) return;
    ...
      // Find cell element using data attributes and smooth scroll
      requestAnimationFrame(() => {
        const cellEl = tableContainerRef.current?.querySelector(
          `[data-cell-key="${CSS.escape(targetKey)}"][data-cell-field="${CSS.escape(targetField)}"]`
        ) as HTMLElement | null;

        if (cellEl) {
          cellEl.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
          });
        }
      });
  }, [followingPeerName, collabPeers, items, languages, showDescription]);
```
*Problem*: `collabPeers` in dependency array causes this effect to fire on every single mouse move, repeatedly triggering `cellEl.scrollIntoView({ behavior: 'smooth' })` simultaneously with the rAF camera engine.

In `src/components/SpreadsheetTable.tsx:485-517`:
```tsx
    if (typeof followedScrollLeft === 'number' && !isNaN(followedScrollLeft)) {
      desiredLeft = followedScrollLeft;
    }
    ...
      if (followedPointerX < desiredLeft + SAFE_LEFT) {
        desiredLeft = Math.max(0, followedPointerX - SAFE_LEFT);
      }
```
*Problem*: If `followedPointerX` is anywhere inside the sticky column zone `[desiredLeft, desiredLeft + SAFE_LEFT]`, `desiredLeft` is pulled back to `followedPointerX - SAFE_LEFT`. When the next scroll update arrives, `desiredLeft` jumps back to `followedScrollLeft`, creating a severe thrashing loop.

In `src/components/SpreadsheetTable.tsx:2397`:
```tsx
className="absolute top-0 left-0 pointer-events-none z-30 select-none will-change-transform [transform:translate3d(var(--pointer-x),var(--pointer-y),0)] transition-[transform,opacity] duration-75 ease-out"
```
*Problem*: `transition-[transform,opacity]` with `duration-75 ease-out` causes visible stutter and lagging overshoot with WebRTC updates arriving at 30-60Hz.

## Out of scope

- Do not modify WebRTC peer connection or signaling logic in `src/lib/collaboration.ts`.
- Do not modify encryption, PIN authentication, or room joining logic in `CollabPinDialog.tsx` or `useCollabSession.ts`.
- Do not touch translation editing, AI translation, or table filtering logic.

## Conventions to follow

- Functional React components with strict TypeScript types.
- Oxlint and TypeScript `tsc -b --noEmit` must remain 100% clean with zero errors/warnings.
- Vitest tests using `@testing-library/react`.
- Preserve existing comments and docstrings.

## Step-by-step implementation

### Step 1: Remove Competing `scrollIntoView` and Unify Follow Mode in `SpreadsheetTable.tsx`

1. In `src/components/SpreadsheetTable.tsx`, remove `cellEl.scrollIntoView({ behavior: 'smooth' })` from the `activeCell` effect (lines 408-453).
2. The `activeCell` effect should only synchronize `selectedCell` state (so the blue selection border highlights the peer's selected cell), without triggering browser native smooth scroll.
3. Track the previous `activeCell` key and field using a ref (`lastFollowedCellRef`) so selection state only recalculates when the peer actually selects a different cell, NOT on every mouse move.

### Step 2: Fix Safe Margin Clamping and Scroll Sync in Camera Tracking Engine

In `src/components/SpreadsheetTable.tsx` (lines 465-566):
1. Distinguish between leader-driven scroll synchronization and cursor safe margins:
   - When `followedScrollLeft` and `followedScrollTop` are provided, they represent the leader's actual camera. Follower should align to them as primary camera targets.
   - Pointer coordinates `followedPointerX` and `followedPointerY` are in `tableWrapperRef` space.
   - Do NOT clamp `desiredLeft` backwards when `followedPointerX` is simply within the leader's view or over the sticky column!
   - Only nudge `desiredLeft` if the follower's viewport is smaller than the leader's and the cursor would be off-screen to the right (`followedPointerX > desiredLeft + clientWidth - SAFE_RIGHT`) or off-screen to the bottom (`followedPointerY > desiredTop + clientHeight - SAFE_BOTTOM`).
   - If the leader has NOT reported scroll position, then and only then should the camera center on the cursor position with a comfortable margin.
2. Polish the rAF exponential lerp loop:
   - Add a hysteresis deadzone: if `Math.abs(diffX) < 1.5 && Math.abs(diffY) < 1.5`, finish the animation cleanly without single-pixel jitter.
   - Keep `factor = 0.18` or `0.2` for fluid, organic dampening.

### Step 3: Prevent Programmatic Scroll Echo Back to Awareness

In `src/components/SpreadsheetTable.tsx`:
1. Maintain `isProgrammaticScrollRef = useRef(false)`.
2. Before setting `c.scrollLeft` or `c.scrollTop` in `runScrollLoop`, set `isProgrammaticScrollRef.current = true`.
3. In `tableContainerRef`'s `onScroll` handler (line 1225):
   ```tsx
   onScroll={(e) => {
     if (isProgrammaticScrollRef.current) {
       isProgrammaticScrollRef.current = false;
       return;
     }
     if (e.currentTarget.scrollLeft > 20 && !hasScrolledX) {
       setHasScrolledX(true);
     }
     onScrollPositionChange?.(e.currentTarget.scrollLeft, e.currentTarget.scrollTop);
   }}
   ```
   This ensures only true user-initiated scrolling (trackpad, mouse wheel, scrollbar drag) broadcasts to the collaboration session.

### Step 4: Remove CSS Transform Transition on Remote Cursors

In `src/components/SpreadsheetTable.tsx` (line 2397):
1. Change:
   `transition-[transform,opacity] duration-75 ease-out`
   to:
   `transition-opacity duration-150 ease-out`
2. Keep `will-change-transform` and `[transform:translate3d(var(--pointer-x),var(--pointer-y),0)]`.
   This ensures hardware-accelerated, instantaneous 60fps cursor movement without CSS interpolation shudder.

## Verification Gates

1. Run `npx oxlint` -> Must report 0 warnings and 0 errors.
2. Run `npx tsc -b --noEmit` -> Must report 0 errors.
3. Run `npm test` -> All 60 test suites and 459+ tests must pass.
4. Run `npm run build` -> Production build must complete successfully.

## STOP conditions

- If `git diff --stat b924fc3..HEAD` shows changes in files outside `SpreadsheetTable.tsx`, `useCollabSession.ts`, or `App.tsx`, STOP and report.
- If existing unit tests fail for reasons unrelated to follow mode, STOP and report.
- Never run `git push`.
