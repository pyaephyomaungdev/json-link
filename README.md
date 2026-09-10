# JSON Link 🌐

A modern, high-performance web application designed for multilingual localization (`i18n`) workflows. View, edit, and translate your JSON localization files side-by-side in an authentic, edge-to-edge Microsoft Excel spreadsheet interface, with full roundtrip support for Excel (`.xlsx`), CSV, JSON files, YAML, Android XML, iOS Strings, TypeScript definitions, and portable `.jsonlink` project files.

> **Developed with ❤️ by Pyae Phyo Maung**  
> **Repository:** [https://github.com/pyaephyomaungdev/json-link](https://github.com/pyaephyomaungdev/json-link)

---

## ✨ Features

### 📊 Authentic MS Excel Spreadsheet Interface
- **Edge-to-Edge Full-Bleed Grid**: Full viewport spreadsheet with zero outer margins or padding, clean Excel gridlines, row numbers (`1, 2, 3...`), and column letters (`A, B, C...`).
- **Dynamic Freeze Panes**:
  - **Sticky Top**: Column headers stay pinned at the top while scrolling vertically.
  - **Freeze Left**: Index (`#`) and Translation Key columns stay pinned at the left while scrolling horizontally through languages.
  - **Custom Freeze / Unfreeze**: Pin any language column with 1 click from the header dropdown menu.
- **Formula Bar (`fx`)**: Name box displaying active cell address (e.g. `B14 [EN]`) with a full-width text inspector and editor.
- **Inline Cell Editing**: Double-click or click to edit text directly. Full native font support for English, Myanmar Unicode (Pyidaungsu / Noto Sans), Thai, Japanese, Chinese, and RTL languages without character clipping.
- **Multi-Cell Copy & Paste**: Paste tab-separated or newline-separated values from Google Sheets / Excel directly into cells.
- **Undo / Redo History**: Full state time-machine (`Cmd+Z` / `Ctrl+Z`, `Cmd+Y` / `Ctrl+Y`) supporting up to 50 historical snapshots.

---

### 🛡️ i18n Quality & Variable Protection (Crash Prevention)
- **Variable / Interpolation Highlighter**:
  - Automatically tokenizes and renders visual color badges for parameter placeholders:
    - **ICU MessageFormat / Braces**: `{name}`, `{count}`, `{0}`
    - **Mustache / Handlebars**: `{{username}}`, `{{total}}`
    - **Printf / C / Python / PHP format**: `%s`, `%d`, `%1$s`, `%(name)s`
    - **Positional parameters**: `$1`, `$2`
- **Missing Variable Warning (⚠️)**:
  - If a translator or AI accidentally deletes a variable or translates inside braces (e.g. changing `{username}` to `{နာမည်}`), an immediate alert badge (⚠️) appears in the cell with a tooltip detailing the exact missing placeholder, preventing app crashes at runtime.

---

### 🤖 AI Auto-Translate (OpenRouter BYOK)
- **Batch Translation**: Translate missing or all keys automatically in configurable batches while strictly preserving interpolation variables.
- **Any OpenRouter Model**: Select from popular models (Gemini 2.5 Flash, DeepSeek V3, GPT-4o Mini, Claude 3.5 Haiku) or search the live OpenRouter catalog and input any custom model ID.
- **Searchable ISO 639-1 Language Picker**: Search languages by standard code, English name, or native script (e.g. မြန်မာ, ภาษาไทย, 日本語, 한국어, Español, Français).

#### 🔒 BYOK Security & Privacy Architecture
- **Session-Only Storage by Default**: Your API key is stored in browser session memory (`sessionStorage`) and is **automatically wiped** when you close the tab or window.
- **Web Crypto AES-GCM 256-bit Encryption**: If you choose the *"Remember key on this device"* option, your key is client-side encrypted using the browser's native **Web Crypto API (SubtleCrypto)** before saving to `localStorage`. The raw plain-text key is never written to disk.
- **Zero Backend Server**: JSON Link is a 100% client-side Single Page Application (SPA). Requests are dispatched directly from your browser to OpenRouter's official API (`https://openrouter.ai/api/v1/`). Your keys and translation strings never transit through any third-party proxy or intermediary server.
- **1-Click Disconnect**: Instantly wipe and revoke all stored credentials across session and local storage with a single click on the `Clear` button.
- **Usage Recommendation**: We advise creating a dedicated, scoped API key with a strict spending limit (e.g., $1.00 - $2.00) in your OpenRouter dashboard.

---

### 💾 `.jsonlink` Project Save & Restore
- **Portable Project File**: Save your complete workspace state (all keys, active language columns, translations, and metadata) as a single `.jsonlink` file (e.g. `translations.jsonlink`).
- **Exit Protection Dialog**: Navigating away or clicking the home logo while working prompts you to save your project file so you never lose unsaved work.
- **Instant Restore**: Drag and drop any `.jsonlink` file into the upload dropzone to instantly restore your workspace.
- **Auto-Save Drafts**: Work is automatically drafted locally so a sudden refresh never wipes your progress.

---

### 📤 Universal Exporters (All Major Frameworks)
- **Flutter & Ruby on Rails**: Indented YAML (`.yaml` ZIP archive) with language-prefix stripping option.
- **Android**: `res/values/strings.xml` and `res/values-<lang>/strings.xml` (XML-escaped ZIP archive).
- **iOS**: Apple Xcode `<lang>.lproj/Localizable.strings` (escaped `.strings` ZIP archive).
- **TypeScript**: `translations.d.ts` declaration file featuring strongly-typed union types (`type TranslationKey = ...`) for complete IDE autocomplete.
- **Microsoft Excel (`.xlsx`)**: Formatted multi-column workbook with header styling, dynamic column width auto-fit, and full Unicode rendering.
- **CSV (`.csv`)**: Embedded with **UTF-8 BOM (`\uFEFF`)** to guarantee flawless opening in Excel (Windows & Mac) without Unicode character corruption.
- **JSON (ZIP & Single Combined)**: Export individual JSON files (`en.json`, `my.json`, etc.) in a ZIP archive or as a single combined multi-language object (`{ "en": {...}, "my": {...} }`), with flat or nested dot-notation unflattening options.

---

### 📥 Bidirectional Import & Smart Diff / Merge
- **Drag-and-Drop Any Format**: Import `.jsonlink`, `.json`, `.xlsx`, `.csv`, `.yaml`, Android `strings.xml`, or iOS `Localizable.strings`.
- **Smart Diff / Merge Comparison**:
  - Automatically compares incoming files against your existing spreadsheet.
  - Interactive Diff Modal displays new keys, modified keys, and unchanged counts.
  - **3 Merge Modes**:
    1. **Full Merge**: Update existing keys and append new keys.
    2. **Add New Keys Only**: Keep existing translations intact; only add missing keys.
    3. **Overwrite / Replace**: Cleanly replace with incoming file.

---

### ⚡ Keyboard Shortcuts & Command Palette (`Cmd+K` / `Ctrl+K`)
- `Cmd + K` / `Ctrl + K`: Open Command Palette to search commands, add keys, add languages, switch models, export, or toggle theme.
- `Cmd + Z` / `Ctrl + Z`: Undo last action.
- `Cmd + Y` / `Ctrl + Y` (or `Cmd + Shift + Z`): Redo last action.
- `Cmd + S` / `Ctrl + S`: Save `.jsonlink` project file.
- `Esc`: Close open modal dialogs.
- `Enter` / `Double Click`: Edit selected cell.

---

## 🧪 Automated Testing & Continuous Integration

Quality and stability are guaranteed through a comprehensive test suite and continuous integration pipeline:

- **Testing Framework**: [Vitest](https://vitest.dev/) (Native Vite integration, ultra-fast test runner).
- **Test Coverage**: **71 Unit Tests across 7 suites** testing 100% of core engines:
  - `parser.test.ts`: Object flattening/unflattening, JSON, Android XML, iOS strings, YAML, and binary Excel/CSV parsing.
  - `exporter.test.ts`: JSON, YAML, Android strings.xml, iOS Localizable.strings, CSV (BOM), and TypeScript declarations.
  - `variables.test.ts`: ICU, Mustache, Printf, positional tokenization and missing variable validation.
  - `crypto.test.ts`: Web Crypto AES-GCM 256-bit encryption, decryption, and corruption resilience.
  - `openrouter.test.ts`: BYOK client, session storage isolation, encrypted local persistence, and validation.
  - `project.test.ts`: `.jsonlink` project file validation and local storage draft persistence.
  - `languages.test.ts`: ISO 639-1 dataset consistency and language code lookup.
- **GitHub Actions CI (`.github/workflows/ci.yml`)**:
  - Automated workflow triggers on every push and pull request to `main`.
  - Runs clean install (`npm ci`), full test execution (`npm test`), and production TypeScript build (`npm run build`).

---

## 🛠 Tech Stack

- **Framework**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **UI Components**: `shadcn/ui` design system & Radix UI primitives
- **Icons**: `lucide-react`
- **Spreadsheet & Compression**: `xlsx` (SheetJS) & `jszip`
- **Testing**: Vitest 5.0
- **CI/CD**: GitHub Actions

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.0.0` or higher (LTS recommended)
- **npm**, **pnpm**, or **bun**

### Installation

```bash
# Clone repository
git clone https://github.com/pyaephyomaungdev/json-link.git
cd json-link

# Install dependencies
npm install
```

### Development

```bash
# Start local development server
npm run dev
```

Open your browser at `http://localhost:5173` to start using JSON Link.

### Run Unit Tests

```bash
# Run unit test suite once
npm test

# Run tests in interactive watch mode
npm run test:watch
```

### Production Build

```bash
# Build TypeScript and bundle production assets
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 License

MIT License © 2026 Developed with ❤️ by **Pyae Phyo Maung**
