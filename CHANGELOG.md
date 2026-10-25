# Changelog

All notable changes to **JSON Link** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-10-25

### Added
- **XLIFF 1.2 & 2.0 Bidirectional Support**: Complete parser and generator for `.xlf` and `.xliff` translation formats, preserving translation unit IDs, sources, targets, and developer comments for professional CAT tools.
- **GNU gettext PO / POT Support with Developer Key Round-Tripping**: Full parser (`parsePoFile`) and generator (`generatePo`) supporting multi-line strings, escaped sequences, and preserving developer keys via `#: ${item.key}` reference comments.
- **Non-Destructive CRDT Positional Array Diffing (`syncYArray`)**: Replaced full array recreation (`delete(0, len)`) with targeted O(N) common prefix/suffix positional diffing across Yjs `yKeys` and `yLanguages` arrays, eliminating race conditions and duplicate keys during concurrent live collaboration.
- **ICU MessageFormat Plural `#` Token Support**: Balanced brace depth detection and tokenization for nested `#` number substitution placeholders inside ICU `plural` and `selectordinal` expressions. Added QA linter verification flagging when target translations omit `#`.
- **Visual ICU Message Builder Modal**: Interactive builder dialog accessible from cell context menus, enabling visual creation of plural and select branches with live preview and parameter inputs.
- **Keyboard Shortcuts Modal (`⌘/` / `Ctrl+/`)**: Quick reference dialog cataloging all navigation, editing, formatting, and file synchronization shortcuts.
- **IndexedDB Non-Extractable CryptoKey Vault (v2)**: High-security storage for OpenRouter API keys and GitHub PATs using device-local Web Crypto `AES-GCM` keys persisted in IndexedDB, completely removing dependence on origin seeds.
- **Monotonic Draft Timestamp Reconciliation (`pickNewerDraft`)**: Smart reconciliation between IndexedDB and localStorage based on `updatedAt` timestamps, preventing stale draft restoration upon storage quota limits.
- **Self-Hosted Zero-Telemetry WebFonts**: Integrated self-hosted `IBM Plex Sans` and `Noto Sans Myanmar` WOFF2 fonts with `font-display: swap`, removing Google Fonts CDN network calls.
- **MCP Server Format Parity (@jsonlink/mcp)**: Added `.xlf`, `.xliff`, `.po`, and `.pot` file extensions to `ALLOWED_FILE_EXTENSIONS`, with native parsing in `read_translations` and export formats `'xliff'` and `'gettext-po'` in `export_bundle`.

### Changed
- **Initial Bundle Code-Splitting**: Converted `LandingPage` to a lazy-loaded dynamic import in `src/App.tsx`, reducing primary JavaScript bundle size from 609 kB to 577 kB.
- **Figma-Grade Follow Camera Tracking**: Smooth follow banner, Esc exit, manual scroll break, and peer disconnect handling in live collaboration follow mode.
- **Consolidated Toolbar Quality Tools**: Streamlined navigation header by integrating Quality Scorecard and Linter badges into the unified Tools dropdown.
- Test suite expanded to 66 test files and 540 passing tests (100% Vitest pass rate, 0 oxlint warnings).

---

## [1.1.0] - 2026-09-19

### Added
- **Serverless WebRTC Live Collaboration**: Instant multi-user co-authoring powered by Yjs Conflict-Free Replicated Data Types (CRDT) and direct WebRTC DataChannels (`useCollabSession`), using lightweight signaling relays for initial connection negotiation.
- **Optional End-to-End Room Encryption (E2EE)**: Client-side AES-GCM 256-bit encryption derived via PBKDF2-SHA256 (100,000 iterations) from optional room passwords. Open rooms remain unencrypted for frictionless sharing.
- **Segmented Room Identifiers**: Human-friendly 3-4-3 segmented room format (`yfq-khjt-efn`) with canonical hyphenated room codes and smart alphanumeric normalization.
- **Live Peer Awareness & Follow Mode**: Deterministic 12-color avatar palette, peer initials badges, real-time active cell cursor markers, and one-click Follow Mode viewport synchronization.
- **Figma-Style Live Multiplayer Cursors**: Fluid real-time peer pointer tracking (~33fps over WebRTC DataChannels) with colored SVG pointers, name badges, and native sticky header z-index layering.
- **Project Name Metadata Synchronization**: Multi-user real-time synchronization of project names across all active peers via Yjs metadata.
- **Multi-Stage Collab Dialog**: Redesigned `CollabPinDialog` with 3 dedicated modal screens (PIN Input, Connecting with spinner, and Authentication Failed with auto-focus "Try Again").
- **Spreadsheet DOM Virtualization (`useVirtualRows`)**: Zero-dependency windowing hook rendering 5,000+ keys with sub-500 active DOM elements at 60fps.
- **Bounded AI Translation Batching**: Added `chunkArray` (size 25) and bounded concurrency in OpenRouter translation engine to eliminate token limit overflows.

### Fixed
- **False-Alarm PIN Error**: Resolved stale error persistence when opening collaboration links without keys.
- **Premature Workspace Activation**: Gated guest workspace activation until remote translation items or peers are verified, preventing empty grid states on join.
- **Host Session Protection**: Host nodes now emit `{ type: 'auth-rejected' }` signaling messages instead of dropping sessions when receiving undecryptable guest packets.
- **Modal Focus Ring Elimination**: Removed Chromium default white focus ring on dialog containers via `outline-none focus:outline-none ring-0`.
- **Fail-Closed Security**: Prevented unencrypted plaintext GitHub token storage when encryption fails.
- **Accessibility Remediation**: Resolved 100+ a11y lint warnings across table divider handles, keyboard handlers, and modal form attributes.

### Changed
- Test suite expanded to 60 test files and 456 passing tests (100% Vitest pass rate).
- Complete zero-warning codebase compliance across 155 files with 128 oxlint rules.

---

## [1.0.0] - 2026-09-01

### Added
- Initial public release of JSON Link.
- Zero-backend spreadsheet studio with edge-to-edge grid and keyboard navigation.
- Two-way disk synchronization via File System Access API with instant Vite HMR.
- AST Tokenizer with ICU MessageFormat, Mustache, and Printf variable protection.
- Rabbit Zawgyi ⇄ Unicode transcoding engine.
- Model Context Protocol (MCP) server for Cursor, Claude Desktop, and Antigravity.
- Multi-platform export (Web JSON, Flutter ARB, iOS Strings, Android XML, TypeScript, Excel, CSV, YAML).
- Client-side zero-knowledge encrypted URL fragment sharing (`#share=...`).
