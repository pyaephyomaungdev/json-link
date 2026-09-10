# JSON Link — Project Overview & Documentation (English)

> Complete overview of JSON Link features, architecture, and developer workflow.
> Live Demo: https://json-link.pages.dev · GitHub: https://github.com/pyaephyomaungdev/json-link

---

## 🚀 The Free, Open-Source Localization Workspace Built for Developers — "JSON Link"

If you build multilingual apps in React, Next.js, Flutter, Android, or iOS, you already know the pain:

* 🤯 Juggling dozens of separate `en.json`, `my.json`, `th.json` files trying to spot missing keys.
* 📋 Getting a bloated translator spreadsheet and spending hours converting it back to nested JSON.
* 💥 A translator accidentally deletes `{username}` or `%s` — and your app crashes in production.
* 🤖 AI translates your brand name "KBZPay" into a completely made-up local word.
* 💸 Enterprise SaaS localization platforms charging hundreds of dollars a month for things you can do in a browser.

**JSON Link** solves all of this. It's a 100% client-side, open-source localization spreadsheet and AI-powered translation workspace — built specifically for developers and dev teams. No backend. No subscription. No lock-in.

---

## 🌟 Key Features

### 1. 📊 Authentic Spreadsheet Interface
* **Edge-to-Edge Grid**: Full-viewport spreadsheet with row numbers, column letters (A, B, C…), clean gridlines, and zero outer margins — just like Excel.
* **Formula Bar (fx)**: Displays active cell address (e.g. `B14 [en]`) with a full-width text inspector and editor.
* **Freeze Panes**: Sticky column headers, freeze-left for Key and Language columns. Toggle freeze with one click.
* **Excel-Like Drag Column Resizing**: Drag divider handles on any column header. Widths persist in `localStorage`. One-click "Reset Widths" to restore defaults.
* **Keyboard Navigation**: `ArrowUp/Down/Left/Right` grid navigation, `Tab`/`Shift+Tab` cell advancement, `Enter` to edit and jump to next row.
* **Translation Diff & 1-Click Revert**: Modified or AI-translated cells display a `[↺ Revert]` chip to instantly roll back to prior values.
* **Missing Key Badges**: Column headers display amber count badges for missing translations. Click to filter to missing rows instantly.
* **Horizontal Scroll Indicators**: Hidden scrollbars — instead, left/right arrow chevrons appear automatically when content overflows.

---

### 2. 🔤 Myanmar Unicode ⇄ Zawgyi Auto-Detector & Converter
* **Essential for Myanmar/SEA projects**: Automatically analyzes columns for legacy Zawgyi encoding patterns.
* **Warning Badge**: Excel-style ⚠ exclamation mark indicator on column headers when Zawgyi is detected.
* **1-Click Bidirectional Conversion**: Zawgyi → Unicode using the Rabbit algorithm. Unicode → Zawgyi for legacy device support.

---

### 3. 🤖 Multi-Language AI Auto-Translate (OpenRouter BYOK)
* **Batch Translate**: Translate across all configured target languages sequentially with live per-language percentage progress.
* **Scope Toggle**: Clean segmented toggle — **Missing Keys Only** (fill empty cells) or **All Rows (Overwrite)** with count badges.
* **Variable Safety**: Preserves `{name}`, `{{count}}`, `%s`, and all ICU / Mustache / Printf placeholders intact — never garbled.
* **AI Translation Glossary & Termbase**: Define brand names and technical terms that must stay untranslated or use a specific translation. Inject into every AI prompt automatically.
* **Any OpenRouter Model**: Gemini 2.5 Flash, DeepSeek V3, GPT-4o Mini, Claude 3.5 Haiku, or any custom model ID.
* **Automatic Review Tagging**: AI-translated rows are automatically tagged `Needs Review` for human QA signoff.

---

### 4. 🔎 Localization QA & Consistency Linter
* **Automated Quality Scans** across all languages in real time:
  * **Whitespace**: Leading or trailing whitespace in keys or values.
  * **Variable Mismatches**: Missing source placeholders (`{name}`, `%s`, `{{count}}`).
  * **Length Expansion**: Text expanding >2.5× source length — risks clipping in mobile buttons.
  * **Duplicates**: Same translation reused across multiple distinct keys.
  * **Untranslated**: Target values identical to English source.
  * **Missing**: Unfilled translation keys.
* **One-Click Auto-Fix**: "Fix All Whitespace" cleans all keys and translations in 1 click.
* **Jump Navigation**: Direct "Jump" button on any issue selects and focuses the exact cell in the spreadsheet.
* **Scorecard-Style Tabs**: Underline tab bar with live per-category counts (`All Issues (12)`, `Whitespace (3)`…).

---

### 5. 🏥 Localization Health & Scorecard
* **Real-Time Dashboard**: Completion percentage per language, missing translation count, variable warning count.
* **Quick Batch Translate**: One-click "Translate Missing" per language row to launch AI targeting only empty keys.
* **Variable Integrity Audit**: Lists every key where translations are missing source interpolation parameters.

---

### 6. ✅ Row Review Workflow Statuses
* **Three editorial states per key**:
  * 🩶 **Draft** — New or in-progress translation.
  * 🟡 **Needs Review** — Auto-applied to AI-translated rows or flagged content.
  * 🟢 **Approved** — Human-reviewed and ready for release.
* **Toolbar Filter**: Instantly filter the grid to a specific status (All / Needs Review / Approved / Draft).

---

### 7. 🧪 Pseudolocalization (Layout Stress Testing)
* **1-Click `qps-ploc` Generation**: Transforms source strings into accented, lengthened pseudostrings (`[!!! Šééttîîññĝš !!!]`).
* Catches text clipping, button overflow, and font rendering issues before translations arrive.
* All interpolation placeholders remain 100% intact.

---

### 8. 🔄 Universal Import & Export (Every Platform)
* **1-Click Multi-Platform Bundle ZIP**: Export a complete production-ready localization archive containing:
  * `web-locales/{lang}.json` — Web / Next.js / React
  * `flutter-l10n/app_{lang}.arb` — Flutter
  * `ios-strings/{lang}.lproj/Localizable.strings` — iOS Xcode
  * `android-res/values-{lang}/strings.xml` — Android
  * `typescript/translations.d.ts` — TypeScript type declarations
* **Individual Exports**: Excel `.xlsx`, CSV `.csv` (UTF-8 BOM), JSON (flat or nested), YAML (Flutter / Rails), Android XML, iOS Strings.
* **Smart Diff Merge**: Import files and inspect new vs. modified vs. unchanged keys before merging.

---

### 9. 🤝 Model Context Protocol (MCP) Server for AI Assistants
* **Native AI Integration**: Connect JSON Link directly to Claude Desktop, Cursor, or Google Antigravity via stdio JSON-RPC 2.0.
* **5 Exposed MCP Tools**:
  * `convert_zawgyi` — Lossless Myanmar font conversion.
  * `validate_variables` — Placeholder integrity check.
  * `lint_translations` — Automated localization scanner.
  * `read_translations` — File parser for JSON, ARB, XML, Strings.
  * `export_bundle` — Multi-platform code generation.
* Located in `mcp/`. Build and run with `npm run mcp:build && npm run mcp:start`.

---

### 10. 🔍 Find & Replace Across All Languages
* **Cmd+H** opens a dedicated modal with scope filtering: All Languages, Keys Only, Context Only, or Specific Language.
* Supports Match Case, Whole Word, and **Regex** with capture group replacement (`$1`, `$2`).
* Real-time match count before executing. Every replace registers with Undo history.

---

### 11. 🔒 100% Client-Side Privacy (Zero Server)
* No backend. No database. No tracking. Everything runs in your browser.
* API keys stored with **AES-GCM 256-bit client-side encryption**. Session-only or optional remember-on-device.
* Auto-save draft restoration — page reload or tab close never wipes your work.

---

### 12. ⌨️ Power-User Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Cmd+K` | Command Palette |
| `Cmd+H` | Find & Replace |
| `Cmd+Z` | Undo |
| `Cmd+Y` | Redo |
| `Cmd+S` | Save .jsonlink project file |
| `Enter` / Double Click | Edit active cell |
| `Esc` | Close modal |
| Arrow Keys | Navigate grid |

---

## 🧪 Automated Testing

**107 unit tests across 12 test suites** — verified on every push via GitHub Actions CI.

| Test Suite | Coverage |
|---|---|
| `linter.test.ts` | Whitespace, variable mismatch, length expansion, auto-fixer |
| `myanmarFont.test.ts` | Zawgyi detection, Rabbit Zawgyi↔Unicode converter |
| `exporter.test.ts` | Bundle ZIP, Android XML, iOS Strings, CSV BOM, TypeScript d.ts |
| `parser.test.ts` | JSON flatten/unflatten, YAML, Excel, XML, iOS strings |
| `openrouter.test.ts` | BYOK translation, glossary prompt injection, JSON repair |
| `variables.test.ts` | ICU, Mustache, Printf tokenization and validation |
| `findReplace.test.ts` | Search scopes, whole-word, regex replacement |
| `glossary.test.ts` | Termbase storage, serialization, prompt formatting |
| `crypto.test.ts` | AES-GCM encryption, decryption, key derivation |
| `pseudoloc.test.ts` | Homoglyph mapping, expansion, variable preservation |
| `languages.test.ts` | ISO definitions, labels, RTL detection |
| `project.test.ts` | .jsonlink serialization and workspace restoration |

---

## 🚀 Getting Started

```bash
# Clone & install
git clone https://github.com/pyaephyomaungdev/json-link.git
cd json-link
npm install

# Dev server
npm run dev

# Run tests
npm test

# Production build
npm run build

# MCP Server (for Claude Desktop / Cursor / Antigravity)
npm run mcp:build
npm run mcp:start
```

---

## 🌐 Links

* 🌍 **Live Web App**: https://json-link.pages.dev
* ⭐ **GitHub Repo**: https://github.com/pyaephyomaungdev/json-link
* 🤖 **MCP Docs**: `mcp/README.md`

---

## 📣 Product Hunt / dev.to Post Content

### 🏷️ Tagline
> Free, open-source AI-powered i18n workspace for developers — spreadsheet UX, Myanmar Zawgyi converter, MCP server, and multi-platform export. Zero backend.

### 📋 Short Description (Product Hunt / Intro)
JSON Link is a free, open-source, 100% browser-based localization workspace for developers building multilingual apps.

**What makes it different:**
- 📊 Full spreadsheet UX — drag resize, freeze panes, formula bar, keyboard navigation
- 🤖 AI batch translation across all languages at once (OpenRouter BYOK, 20+ models)
- 🔤 Myanmar Zawgyi ⇄ Unicode auto-detector and 1-click converter (Rabbit algorithm)
- 🔎 Localization QA Linter — whitespace, variable mismatches, duplicates, untranslated
- ✅ Row review workflow — Draft / Needs Review / Approved statuses
- 📦 1-click multi-platform bundle ZIP (Web JSON, Flutter ARB, Android XML, iOS Strings, TypeScript d.ts)
- 🤝 MCP server for Claude Desktop, Cursor, and Antigravity integration
- 🔒 Zero backend — all data stays in your browser, AES-256 encrypted API keys
- 107 unit tests, GitHub Actions CI, fully open source (MIT)

🌐 https://json-link.pages.dev
⭐ https://github.com/pyaephyomaungdev/json-link

### 🏷️ Tags / Topics
`i18n` `localization` `translation` `react` `open-source` `developer-tools` `myanmar` `ai` `mcp` `flutter` `android` `ios` `json` `typescript` `spreadsheet`

---

## License

MIT License — Free and open source for individuals and teams worldwide.
