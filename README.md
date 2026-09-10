# JSON Link 🌐

A modern, high-performance web application designed for multilingual localization (`i18n`) workflows. View, edit, and translate your JSON localization files side-by-side in an authentic, edge-to-edge Microsoft Excel spreadsheet interface, with full roundtrip support for Excel (`.xlsx`), CSV, JSON files, and portable `.jsonlink` project files.

> **Developed with ❤️ by Pyae Phyo Maung**

---

## ✨ Features

### 📊 Authentic MS Excel Spreadsheet Interface
- **Edge-to-Edge Full-Bleed Grid**: Full viewport spreadsheet with zero outer margins or padding, clean Excel gridlines, row numbers (`1, 2, 3...`), and column letters (`A, B, C...`).
- **Freeze Panes**:
  - **Sticky Top**: Column headers stay pinned at the top while scrolling vertically.
  - **Freeze Left**: Index (`#`) and Translation Key columns stay pinned at the left while scrolling horizontally through languages.
- **Formula Bar (`fx`)**: Name box displaying active cell address (e.g. `B14 [EN]`) with a full-width text inspector and editor.
- **Inline Cell Editing**: Double-click or click to edit text directly. Full support for English and Myanmar Unicode without font clipping or stacked character distortion.

### 💾 `.jsonlink` Project Save & Restore
- **Portable Project File**: Save your complete project state (all keys, active language columns, translations, and metadata) as a single `.jsonlink` file (e.g. `translations.jsonlink`).
- **Exit Protection Dialog**: Clicking the Logo or navigating away while working prompts you to save your `.jsonlink` project file so you never lose unsaved changes.
- **Instant Restore**: Drag and drop any `.jsonlink` file into the upload dropzone to instantly restore your workspace.

### 📤 Multi-Format Export Options
- **Microsoft Excel (`.xlsx`)**: Formatted workbook with header styling, dynamic column width auto-fit, and full Unicode support.
- **CSV (`.csv`)**: Embedded with **UTF-8 BOM (`\uFEFF`)** to guarantee flawless opening in Excel (Windows & Mac) without character corruption.
- **Individual JSON Files (ZIP)**: Download a clean `.zip` archive containing separate language files (`en.json`, `my.json`, etc.).
- **Single Combined JSON**: Export as a unified multi-language JSON object (`{ "en": {...}, "my": {...} }`).
- **Flat vs Nested Object Option**: Toggle dot-notation unflattening (`auth.login.title` → `{ auth: { login: { title: "..." } } }`) with real-time live preview.

### 📥 Drag-and-Drop Bidirectional Import
- Drag and drop multiple files simultaneously: `.jsonlink`, `.json`, `.xlsx`, or `.csv`.
- Automatic language detection from filenames (e.g. `en.json`, `my.json`).
- Merge with existing spreadsheet data or replace completely.

### 🎯 Search & Custom Dropdown Actions
- **Real-Time Search**: Filter keys and translations instantly.
- **Missing Only Filter**: Filter untranslated keys across any language in one click.
- **Namespace Filter**: Group and view keys by module prefix (`auth`, `common`, `nav`, `settings`).
- **Custom Dropdown Menus**: Custom shadcn action menus for every row (`Copy Key`, `Copy All Translations`, `Duplicate Row`, `Delete Row`) and every column header (`Download {lang}.json`, `Copy All Text`, `Remove Column`).

---

## 🛠 Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **UI Components**: `shadcn/ui` design system & Radix UI primitives
- **Icons**: `lucide-react`
- **Spreadsheet & Data Engine**: `xlsx` (SheetJS) & `jszip`

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm** or **pnpm** or **bun**

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd json-link

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Open your browser at `http://localhost:5173` to start using JSON Link.

### Production Build

```bash
npm run build
npm run preview
```

---

## 📄 License

MIT License © 2026 Developed with ❤️ by Pyae Phyo Maung
