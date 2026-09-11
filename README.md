# JSON Link

A modern, high-performance web application designed for multilingual localization (i18n) workflows. View, edit, validate, and translate your localization files side-by-side in an authentic, edge-to-edge spreadsheet interface, with roundtrip support for Excel (.xlsx), CSV, JSON, YAML, Android XML, iOS Strings, TypeScript definitions, and portable .jsonlink project files.

> Developed by Pyae Phyo Maung  
> Repository: https://github.com/pyaephyomaungdev/json-link

---

## Features

### Authentic Spreadsheet Interface
- Edge-to-Edge Grid: Full viewport spreadsheet with zero outer margins, clean gridlines, row numbers (1, 2, 3...), and column letters (A, B, C...).
- Dynamic Freeze Panes:
  - Sticky Top: Column headers stay pinned at the top while scrolling vertically.
  - Freeze Left: Index (#) and Translation Key columns stay pinned at the left while scrolling horizontally through languages.
  - Custom Freeze and Unfreeze: Pin any language column with one click from the header dropdown menu.
- Formula Bar (fx): Displays active cell address (e.g. B14 [en]) with a full-width text inspector and editor.
- Excel-like Drag Column Resizing: Drag divider handles on Key, Context, and Language headers with widths smoothly constrained between 120px and 900px. Preserved locally in `localStorage` with a 1-click "Reset Widths" button in the status bar.
- Excel Keyboard Navigation: Seamless arrow key navigation across the grid (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`), `Tab` / `Shift+Tab` cell advancement, and `Enter` to edit or commit and jump to the row below.
- Translation Diff and 1-Click Revert: Modified or newly translated cells display an interactive `[↺ Revert]` chip to instantly roll back changes to prior values.
- Header Missing Keys Badges: Column headers display an amber badge showing the count of missing keys for that language; clicking isolates missing rows with 1 click.
- Inline Cell Editing: Click or double-click to edit text directly. Full native font rendering for English, Myanmar Unicode (Pyidaungsu / Noto Sans), Thai, Japanese, Chinese, and Right-to-Left languages.
- Multi-Cell Copy and Paste: Paste tab-separated or newline-separated values from Google Sheets or Microsoft Excel directly into cells.
- Undo and Redo History: Full state time-machine (Cmd+Z / Ctrl+Z, Cmd+Y / Ctrl+Y) supporting up to 50 historical snapshots.

---

### Cell Right-Click Context Menu
- Right-Click Action Trigger: Right-click any translation cell to open a dedicated context menu:
  - Copy cell value directly to the clipboard (`Cmd+C` / `Ctrl+C`).
  - Paste clipboard content into the targeted cell (`Cmd+V` / `Ctrl+V`).
  - Clear cell content with full undo support.
  - 1-Click Revert to Original Value: Instantly restores the cell back to its initial imported or saved value.
  - Zawgyi ⇄ Unicode Converter: Converts cell encoding on demand with Rabbit algorithm accuracy.
  - AI Translate This Row: Batch translates the active key across any missing target languages with variable safety.

---

### Myanmar Unicode and Zawgyi Auto-Detector and Converter
- Real-Time Font Detection: Automatically analyzes text in columns to detect legacy Zawgyi encoding patterns (e.g., pre-posed vowel e ordering, Zawgyi medial consonants).
- Warning Badge: Displays a Zawgyi indicator on language headers when Zawgyi text is detected.
- One-Click Conversion:
  - Zawgyi to Unicode Converter: Accurately converts legacy Zawgyi encodings to standard Myanmar Unicode with proper syllable and consonant reordering.
  - Unicode to Zawgyi Converter: Allows exporting or preparing legacy strings when required for older devices.

---

### AI Translation Glossary and Termbase
- Strict AI Terminology Enforcement: Define custom brand names, technical terms, and product names that must be preserved or translated in a specific way.
- Rule Types:
  - Keep Original: Strict instruction to the AI model never to translate or alter brand names (e.g., "JSON Link" remains "JSON Link").
  - Custom Target Translation: Explicit definition of the exact target term the AI must output.
- Dedicated Management Modal: Add, remove, and review terms directly from the AI Translation modal or the top navigation bar.

---

### Pseudolocalization (Layout Stress Testing)
- One-Click Pseudolocale Generation (qps-ploc): Automatically transforms source language strings into accented, lengthened pseudolocalized strings.
- Visual Inspection:
  - Homoglyph Accent Expansion: Maps ASCII letters to accented characters (e.g., "Settings" becomes "[!!! Šééttîîññĝš !!!]").
  - 35 Percent Length Padding: Tests whether UI buttons and card components wrap or truncate when text expands in languages like German or Myanmar.
  - Delimiter Wrapping: Surrounds strings with markers to detect untranslated, hardcoded strings in codebases.
  - Variable Preservation: All interpolation placeholders ({name}, {{count}}, %s) remain completely intact and uncorrupted.

---

### Find and Replace Across Languages
- Dedicated Modal and Shortcut (Cmd+H / Ctrl+H): Rapidly search and replace strings across the entire translation dataset.
- Granular Scopes:
  - All Languages and Fields
  - Translation Keys Only
  - Developer Context / Description Only
  - Specific Language Column
- Search Criteria:
  - Match Case (case sensitive)
  - Whole Word
  - Regular Expressions (Regex) with capture group replacement ($1, $2)
- Match Statistics: Displays real-time count of matching occurrences and affected rows before executing replacements.
- Safe Execution: Every replace action registers with the history manager for instant undo.

---

### Developer Context and Description Column
- Context per Translation Key: Add explanations, button locations, and formatting notes for human translators and AI models.
- AI Context Injection: Descriptions are automatically supplied to OpenRouter AI prompts to produce more accurate, context-aware translations.
- Comment Export Support:
  - Android strings.xml: Exported as XML comments above resource entries.
  - iOS Localizable.strings: Exported as C-style block comments above string keys.
  - Excel and CSV: Exported as a dedicated Description column.
- Toggleable Visibility: Show or hide the context column directly from the Formula Bar or Key column dropdown menu.

---

### Localization Health and Completion Scorecard
- Real-Time Completion Tracking: Visual dashboard displaying completion percentages across all active languages.
- Metrics and Diagnostics:
  - Overall project completion percentage.
  - Number of missing translations per language.
  - Number of variable integrity warnings.
- Quick AI Batch Translation: One-click button on each language row to launch AI translation targeting only missing keys.
- Variable Integrity Audit: Lists all keys where translations miss source interpolation parameters.

---

### Localization QA and Consistency Linter
- Automated Quality Scans: Real-time scan across all languages for common localization pitfalls:
  - Whitespace: Leading or trailing whitespace in keys or translation values.
  - Variable Mismatches: Target translations missing source placeholders ({name}, %s, {{count}}).
  - Length Expansion: Text expansion (>2.5x source length) that may clip in mobile buttons and labels.
  - Duplicates: Identical translations reused across multiple distinct keys.
  - Untranslated: Target translations identical to English source text.
  - Missing: Unfilled translation keys.
- One-Click Auto-Fixer: "Fix All Whitespace" cleans all keys and translations in 1 click.
- Jump Navigation: Direct "Jump" button on any issue selects and focuses the exact cell in the spreadsheet.
- Tab Category Filtering: Scorecard-style underline tabs with live per-category counts.

---

### Row Review Workflow Statuses
- Editorial Status Tracking: Tag each translation key with a workflow status:
  - Draft (gray): New or in-progress translation.
  - Needs Review (amber): Automatically applied to AI-translated rows or flagged content.
  - Approved (emerald): Human-reviewed and verified for release.
- Status Filter: Instant toolbar filtering by status (All, Needs Review, Approved, Draft).

---

### Native Right-to-Left (RTL) Language Layout
- Automatic Script Direction: Automatically applies dir="rtl" and right text alignment for RTL languages (Arabic, Hebrew, Persian, Urdu).
- Bidirectional Formula Bar: When an RTL cell is selected, the formula inspector bar adapts its direction to RTL automatically.

---

### Variable and Interpolation Protection
- Parameter Highlighter:
  - Automatically tokenizes and renders visual tags for interpolation placeholders:
    - ICU MessageFormat: {name}, {count}, {0}
    - Mustache / Handlebars: {{username}}, {{total}}
    - Printf format: %s, %d, %1$s, %(name)s
    - Positional parameters: $1, $2
- Missing Variable Validation:
  - Alert badges identify translations missing expected placeholders, preventing runtime application crashes.

---

### AI Auto-Translate (OpenRouter BYOK)
- Multi-Language Batch AI Translation: Translate across all configured target languages sequentially with live percentage progress (`Translating Thai (TH) (3/10 keys)... [Overall: 35%]`).
- Translation Scope Control: Clean segmented toggle switching between **Missing Keys Only** (fills empty cells) and **All Rows (Overwrite)**.
- Automatic Review Tagging: AI-translated rows are automatically tagged as `Needs Review` for human QA signoff.
- Any OpenRouter Model: Select recommended models (Gemini 2.5 Flash, DeepSeek V3, GPT-4o Mini, Claude 3.5 Haiku) or provide any custom model ID.
- Searchable ISO 639-1 Language Picker: Filter languages by standard code, English name, or native script.

#### BYOK Security Architecture
- Session-Only Storage by Default: API keys are stored in browser session memory (sessionStorage) and wiped upon closing the browser tab.
- Web Crypto AES-GCM 256-bit Encryption: Optional "Remember key on this device" encrypts keys client-side before storing in localStorage.
- Zero Intermediary Server: Client-side Single Page Application. Requests travel directly from the browser to OpenRouter (https://openrouter.ai/api/v1/).

---

### Universal Exporters
- 1-Click Multi-Framework Project Bundle (ZIP): Export a complete, production-ready localization archive containing:
  - `web-locales/{lang}.json` (Web, Next.js, React)
  - `flutter-l10n/app_{lang}.arb` (Flutter ARB)
  - `ios-strings/{lang}.lproj/Localizable.strings` (iOS Xcode Swift/Obj-C)
  - `android-res/values-{lang}/strings.xml` (Android strings.xml)
  - `typescript/translations.d.ts` (TypeScript type declarations)
- Flutter ARB (.arb):
  - Two-way roundtrip preserving `@key` descriptions and variable placeholder parameters.
  - Dedicated ARB ZIP archive (`app_en.arb`, `app_my.arb`, etc.).
  - 1-Click single-file download (`Download app_<lang>.arb`) directly from any spreadsheet language column header dropdown menu.
- Flutter and Ruby on Rails: Indented YAML (.yaml ZIP archive) with language-prefix stripping options.
- Android: res/values/strings.xml and res/values-<lang>/strings.xml with XML comments.
- iOS: Apple Xcode <lang>.lproj/Localizable.strings with comments.
- TypeScript: translations.d.ts declaration file with union types for TranslationKey and SupportedLanguage.
- Microsoft Excel (.xlsx): Multi-column workbook with header formatting, dynamic column auto-sizing, and Unicode support.
- CSV (.csv): Prefixed with UTF-8 BOM (\uFEFF) for seamless opening in Excel on Windows and macOS.
- JSON (ZIP and Single Combined): Export individual JSON files or single combined files with flat or unflattened nested structures.

---

### Model Context Protocol (MCP) Server for AI Assistants
- Native AI Integration: Connect JSON Link directly to Claude Desktop, Cursor, or Google Antigravity.
- Stdio JSON-RPC 2.0: Located in `mcp/` with 5 exposed tools:
  - `convert_zawgyi`: Lossless Rabbit converter between Zawgyi and Unicode.
  - `validate_variables`: Checks variable interpolation placeholder integrity.
  - `lint_translations`: Automated localization scanner.
  - `read_translations`: File parser for JSON, ARB, XML, Strings.
  - `export_bundle`: Multi-platform code generation.
- Build & Run:
  ```bash
  npm run mcp:build
  npm run mcp:start
  ```

---

### Bidirectional Import and Smart Diff / Merge
- Supported Formats: `.jsonlink`, `.arb` (Flutter ARB), `.json`, `.xlsx`, `.csv`, `.yaml`, Android `.xml`, iOS `.strings`.
- Smart Diff Inspection:
  - Compares incoming files against existing spreadsheet contents.
  - Interactive modal displays new keys, modified keys, and unchanged counts.
  - Merge Modes: Full Merge, Add New Keys Only, or Overwrite.

---

### Keyboard Shortcuts and Command Palette (Cmd+K / Ctrl+K)
- Cmd+K / Ctrl+K: Open Command Palette.
- Cmd+H / Ctrl+H: Open Find and Replace dialog.
- Cmd+Z / Ctrl+Z: Undo last action.
- Cmd+Y / Ctrl+Y (or Cmd+Shift+Z): Redo last action.
- Cmd+S / Ctrl+S: Save .jsonlink project file.
- Esc: Close open modal dialogs / cancel cell editing.
- Enter / Double Click: Edit active cell.

---

### Interactive User Guide and Visual Documentation
- Header Access: Dedicated "Docs" button in the top navigation bar and searchable via the Command Palette (`Cmd+K`).
- Visual Annotations: Annotated diagrams with numbered step pins (`1`, `2`, `3`), high-contrast focus rings, and directional callout arrows pointing to key UI controls.
- Bilingual Instructions: Clear step-by-step guidance in both English and Myanmar for maximum clarity.
- Interactive Topic Guides:
  - Getting Started: Multi-file drag-and-drop, format badges, and project restoration.
  - Spreadsheet & Formula Bar: Inline double-click editing, Formula Bar (`fx`) inspector, and keyboard navigation.
  - Right-Click Context Menu: Fast cell actions, 1-click snapshot revert, and Zawgyi/Unicode conversions.
  - AI Auto-Translate: Scope selection (Missing Keys vs. All Rows), BYOK security, and termbase rules.
  - QA Linter & Scorecard: Health completion audits, 1-click "Fix All Whitespace", and high-contrast Missing/All filter toggles.
  - Keyboard Shortcuts & Pro Tips: Complete shortcuts cheat sheet and column header quick downloads.

---

## Automated Testing and CI

Quality, stability, and zero-regression architecture are verified with an extensive automated test suite:

- Testing Framework: Vitest (Vite-native runner) with `@testing-library/react`.
- Test Coverage: 267 Automated Tests across 32 test files:
  - 12 Core Library Test Suites (173 unit tests):
    - `linter.test.ts`: Whitespace detection, variable mismatch, length expansion, auto-fixer.
    - `findReplace.test.ts`: Search, scope filtering, whole-word matching, regex replacement.
    - `myanmarFont.test.ts`: Zawgyi detection heuristics, Rabbit Zawgyi-to-Unicode and Unicode-to-Zawgyi converters.
    - `glossary.test.ts`: Termbase storage, serialization, and prompt formatting.
    - `pseudoloc.test.ts`: Homoglyph mapping, expansion padding, variable preservation.
    - `exporter.test.ts`: Flutter ARB (`app_<lang>.arb` & bundle ZIP), JSON, YAML, Android strings.xml, iOS Localizable.strings, CSV BOM, TypeScript d.ts.
    - `parser.test.ts`: Object flattening/unflattening, Flutter ARB, JSON, Android XML, iOS strings, YAML, Excel, CSV with descriptions.
    - `openrouter.test.ts`: BYOK translation, glossary prompt injection, response recovery, JSON repair.
    - `crypto.test.ts`: AES-GCM 256-bit encryption, decryption, and key derivation.
    - `variables.test.ts`: ICU, Mustache, Printf tokenization and validation.
    - `languages.test.ts`: ISO definitions, labels, and RTL language detection.
    - `project.test.ts`: .jsonlink serialization and workspace restoration.
  - 20 UI Component Test Suites (94 component integration tests):
    - `DocumentationModal.test.tsx`: User guide modal, visual annotations, tab navigation, search filtering.
    - `SpreadsheetTable.test.tsx`: Grid headers, row keys, empty state, and column actions.
    - `Toolbar.test.tsx`: Search, namespace, status, and high-contrast All/Missing filter segmented buttons.
    - `LinterModal.test.tsx`: QA issue categories, 1-click whitespace cleanup, jump-to-cell navigation.
    - `ScorecardModal.test.tsx`: Language health breakdown, completion progress, variable mismatch audit.
    - `AiTranslateModal.test.tsx`: OpenRouter BYOK validation, missing keys batch translation.
    - `GlossaryModal.test.tsx`: Termbase rule creation, editing, and persistence.
    - `ExportModal.test.tsx`: Flutter ARB, Excel, CSV, JSON, and full project bundle generation.
    - `ImportModal.test.tsx`: File dropzone, format pills, and multi-file ingestion.
    - `FindReplaceModal.test.tsx`: Search & replace execution across languages and keys.
    - `CommandPalette.test.tsx`: Quick command navigation, keyboard shortcuts, and filtering.
    - `DiffMergeModal.test.tsx`: Smart import diff calculation and collision resolution.
    - `AddKeyDialog.test.tsx` & `AddLanguageDialog.test.tsx`: Modal key and language addition workflows.
    - `ConfirmDialog.test.tsx` & `ExitConfirmDialog.test.tsx`: Destructive action guards.
    - `SaveProjectModal.test.tsx`, `AboutPage.test.tsx`, `StatsBar.test.tsx`, `Logo.test.tsx`.
- Continuous Integration: GitHub Actions workflow running typecheck and tests on every push and pull request.

---

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher

### Installation
```bash
git clone https://github.com/pyaephyomaungdev/json-link.git
cd json-link
npm install
```

### Development Server
```bash
npm run dev
```

### Running Automated Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```

### Model Context Protocol (MCP) Server
```bash
# Build the MCP server
npm run mcp:build

# Start MCP server via stdio (connect to Claude Desktop or Cursor)
npm run mcp:start
```

---

## License

MIT License. Free and open source for individuals and teams worldwide.
