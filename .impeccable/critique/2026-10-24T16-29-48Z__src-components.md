---
target: src/components
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:/Users/pyaephyomaung/Development/Project/PPM/json-link/src/components"
timestamp: 2026-10-24T16-29-48Z
slug: src-components
---
Method: dual-agent (A: eac8efd7-2c2c-4623-999e-7baa71f5f5cd · B: 7a72a58e-bfb9-4bf7-9049-79299d91fd42)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Header can show `32 keys` / `100% translated` while a Missing-filter footer reads `0 keys`. `Tools 2` is a lint count with no noun. Draft auto-save is silent. |
| 2 | Match System / Real World | 3 | Spreadsheet metaphor is fluent (`fx`, freeze, A1). Landing/docs still lead with PAT, MCP, AST, “variable shielding.” |
| 3 | User Control and Freedom | 3 | Undo/redo, Keep Editing, Esc on marketing pages. **Reset to Sample** uses `setItemsWithoutHistory` — no undo. |
| 4 | Consistency and Standards | 2 | `Home` vs **Back to Workspace** vs **Back to Studio**. Share lives in File *and* as a sibling button. Bulk delete uses `window.confirm`; other destructives use `ConfirmDialog`. |
| 5 | Error Prevention | 2 | Exit, Clear All, delete-column, reload-from-disk are guarded. **Reset to Sample** has no confirm. Single-row Delete Row has none. Home save-prompt fires on untouched sample. |
| 6 | Recognition Rather Than Recall | 3 | File/Tools labeled with subcopy. Format logos are title-only. `Tools 2` unexplained. Sample rows all `draft` with no in-view legend. |
| 7 | Flexibility and Efficiency | 3 | ⌘K, ⌘H, arrows, freeze, multi-cell paste. Tools is 8 items; chrome cannot be hidden. |
| 8 | Aesthetic and Minimalist Design | 3 | Refine held: no gradient text, no glass on landing/studio, editorial `dl` instead of icon-feature grids. Remaining noise is header chrome and a packed 36px toolbar. Live overlay still flags 10px UI labels. |
| 9 | Error Recovery | 3 | Missing empty state and 404 copy are strong. Reset to Sample cannot be undone. |
| 10 | Help and Documentation | 2 | Docs is searchable (13 sections) but Quick Start opens on `TranslationItem` TypeScript / AST schema. Studio Shortcuts exists; no in-grid first-edit coach. |
| **Total** | | **27/40** | **Acceptable** |

#### Design Specificity Verdict

**Start here.** Authored for this product — a localization spreadsheet with IBM Plex, JetBrains Mono, Noto Myanmar, and teal grid chrome — not a category-swap SaaS shell.

**LLM assessment**: Tokens in `src/index.css` actually show up. The landing hero is a real grid mockup (`en.json` ↔ `my.json` ↔ `ja.json`, ICU `{count, plural…}`, Myanmar in `font-myanmar`) plus a definition list of product facts. Studio is the same metaphor at full fidelity: freeze Key, `fx` formula bar, A1 name box. About repeats the landing `dl`; 404 recovery is three icon-cards; Legal still uses a 3-up summary row. Header chrome is identical on landing and studio, so the marketing page can feel like the app with the grid ripped out. Hover overlay on the hero mockup covers the one artifact that proves the product.

**Deterministic scan**: CLI `impeccable detect --json src/components src/App.tsx` returned `[]` (exit 0) — no gradient-text, glass, or icon-card-grid slop in source. Live overlay on computed styles found **10** hits on `/` (studio grid), **32** on `/about`, **23** on `/docs`, **9** on 404. Dominant live rules: `low-contrast`, `undersized-ui-text` / `tiny-text`, `skipped-heading`. Many 4.49:1 muted-on-background hits are rounding at the AA boundary (false positives). Verified live issues: **3.7:1 white on `#009966` Save**, **10px** `[key]` / `KEY` / `(✕)` / Copy / Next, **11px docs body**, heading skips (h1→h3 on About/404, h2→h4 in Docs). 404 `icon-tile-stack` matches a slop heuristic on a legitimate recovery-card layout (false positive as a defect; still a sameness note). About `text-occlusion` on overlay labels is self-interference.

**Visual overlays**: Overlays ran in a **[Human]** tab (`[Human] JSON Link overlay …`) with gold labels on live UI. Studio-as-a-separate-route was not injected; `/` was the spreadsheet workspace and was scanned.

#### Overall Impression

The refine stuck. This no longer reads as purple-AI / Inter-default SaaS. The single biggest remaining opportunity is **trust and first-run path**: Reset to Sample can wipe work without undo, Docs greets translators with an AST, and the Save control fails WCAG AA contrast — while the grid itself is the most specific, shippable surface in the product.

#### What's Working

1. **`SpreadsheetTable` is the identity.** Formula bar (`A1 [key]` + `fx`), freeze Key, ICU-looking cells, Noto Myanmar. This cannot be a generic dashboard.
2. **Landing refine actually landed.** Solid `h1`, feature `dl` about ICU/Zawgyi/disk, mockup of the product — CLI detector agrees the old slop families are gone.
3. **Empty/error persuasion is specific.** Missing filter: “All translations complete” + Show All Keys. 404: “Lost in Translation?” + real path + workspace-safe. Exit dialog names `.jsonlink`.

#### Priority Issues

**[P1] Reset to Sample is unprotected and un-undoable**
- **What**: `handleResetToSample` in `App.tsx` calls `setItemsWithoutHistory` with no `ConfirmDialog`. It sits in Tools next to Clear All (which *is* confirmed).
- **Why it matters**: A misclick replaces a real catalog and skips the undo stack. Worse than Clear All.
- **Fix**: Same confirm pattern as Clear All, or keep Reset only on the landing sample link.
- **Suggested command**: `/impeccable harden`

**[P1] Studio decision load — File 5, Tools 8, Share twice**
- **What**: Right cluster is Key / Lang / Translate / File / Tools / Share / Export. File already contains Share & Handoff. Tools mixes QA, Find, ICU, duplicates, ⌘K, Reset, Clear. Badge is `2` with no noun.
- **Why it matters**: Power users hunt; first-timers never open Tools. Status heuristic breaks (`Tools 2` vs `100% translated`).
- **Fix**: One Share. Tools = quality + find. Destructive workspace actions out of Tools. Badge `2 issues`. Do not regroup the File/Tools split.
- **Suggested command**: `/impeccable distill`

**[P1] Docs “Quick Start” is an AST lecture**
- **What**: First Docs section is Quick Start; first body is `TranslationItem` TypeScript and “In-Memory AST Normalization Schema.” Overlay also flags skipped headings (h2 → h4) and 11px body text.
- **Why it matters**: A translator looking for “how do I edit a cell” hits compiler types. Help exists and still fails the first session.
- **Fix**: Lead with drop-file → edit cell → export. Move AST to a Developer appendix. Restore heading order; bump docs body above 11px.
- **Suggested command**: `/impeccable clarify`

**[P1] Primary Save contrast fails WCAG AA**
- **What**: Live overlay measured **3.7:1** `#ffffff` on `#009966` for the Save control on the studio header. About also has 3.3–3.5:1 green-on-muted pairs that are real, unlike the 4.49:1 rounding hits.
- **Why it matters**: Low-vision users cannot reliably read the primary persistence action. CLI missed this because it does not compute contrast.
- **Fix**: Darken `--primary` for white-on-primary buttons, or use a darker teal ink on the Save chip until ≥4.5:1.
- **Suggested command**: `/impeccable audit`

**[P2] Missing-filter status lie + 10px chrome type**
- **What**: Empty overlay says 32 keys complete; footer says **0 keys**. Overlay also flags 10px `[key]`, `KEY`, `(✕)` as undersized functional text.
- **Why it matters**: Users distrust the grid after a successful filter. 10px labels fail readability at 200% zoom.
- **Fix**: Footer `32 keys · 0 shown`. Floor functional chrome at 12px.
- **Suggested command**: `/impeccable polish`

#### Persona Red Flags

**Alex (power user / localization engineer)** — open sample → edit → export / GitHub PR
- Completes the core loop in under 60s. ⌘K, freeze, paste, formula bar work.
- Red flags: Home save dialog on unmodified sample. `Tools 2` unexplained. Share duplicated. Reset to Sample in the same menu as Linter, no confirm. Save chip contrast.

**Jordan (first-timer translator)** — understand landing → open sheet → change a string
- First 5 seconds: Product Hunt, long headline, Browse vs Empty vs sample vs `npx` vs 8 mystery logos. Sample is the right door and reads like a footnote.
- Help: Docs Quick Start = TypeScript. FAQ = servers, MCP, PAT. Will abandon at Docs, not at the grid.

**Casey (mobile, 390×844)** — land, decide, maybe open files
- Browse / Empty stack full-width (works). Header is five ~28px icons, not thumb zone. Hero mockup is a clipped strip. Format logos unlabeled. Studio File/Tools collapse into a 15+ item `More` menu — landing should not pretend this is a one-handed product.

#### Minor Observations

- YAML logo wraps alone under the format row on desktop.
- Formula-bar `Context` still uses `text-blue-500` in `SpreadsheetTable.tsx`.
- Legal header still `backdrop-blur-md`; Privacy 3-up icons use `text-blue-500` / `text-purple-500`.
- Cookie policy cites a “Clear Draft” control in settings — no settings surface in chrome.
- 404 three cards + primary button = four recoveries (at the 4-item ceiling). Overlay `icon-tile-stack` here is a slop false positive.
- About heading skip: h1 then h3 (“Privacy by architecture”).
- Star on GitHub is visually louder than Docs on the landing header.

#### Questions to Consider

- If the landing had **one** door — Open spreadsheet — and sample / empty / npx appeared after that click, would developers bounce?
- Why is Reset to Sample easier (no confirm, no undo) than Clear All Keys (confirm + undo copy)?
- Who is Docs for if Quick Start is an AST schema — and what would a translator’s first page be if it had to be one screenshot of the grid plus three sentences?
