<div align="center">
  <img src="public/icon-512.svg" width="84" height="84" alt="JSON Link Logo" />
  <h1>JSON Link</h1>
  <p><strong>The Local-First Localization Workspace for Software Teams & AI Coding Assistants</strong></p>
  <p>Zero-backend spreadsheet studio, two-way disk synchronization, lossless AST variable protection, and native Model Context Protocol (MCP) server.</p>

  <p>
    <a href="https://json-link.pages.dev"><img src="https://img.shields.io/badge/Live_Demo-json--link.pages.dev-blue?style=for-the-badge&logo=cloudflarepages&logoColor=white" alt="Live Demo" /></a>
    <a href="https://www.npmjs.com/package/create-jsonlink"><img src="https://img.shields.io/npm/v/create-jsonlink?style=for-the-badge&logo=npm&color=CB3837" alt="npm version" /></a>
    <a href="https://github.com/pyaephyomaungdev/json-link/actions"><img src="https://img.shields.io/badge/Tests-398%20Passed-emerald?style=for-the-badge&logo=vitest&logoColor=white" alt="Tests" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-amber?style=for-the-badge" alt="License" /></a>
    <a href="https://github.com/pyaephyomaungdev/json-link"><img src="https://img.shields.io/badge/Zero--Backend-100%25%20Private-purple?style=for-the-badge" alt="Privacy" /></a>
  </p>

  <p>
    <a href="#-quickstart-3-seconds">Quickstart</a> •
    <a href="#-why-json-link-comparison">Why JSON Link?</a> •
    <a href="#-core-ecosystem">Ecosystem Packages</a> •
    <a href="#-interactive-feature-tour">Feature Tour</a> •
    <a href="#-developer-integration-react--vite">Developer Guide</a> •
    <a href="#-testing--verification">Tests & CI</a>
  </p>
</div>

---

<p align="center">
  <img src="public/hero-screenshot.png" alt="JSON Link Spreadsheet Studio" width="100%" style="border-radius: 12px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);" />
</p>

---

## ⚡ Quickstart (3 Seconds)

Choose how you want to run JSON Link:

### 1. Scaffold a New Localized React App
```bash
npm create jsonlink my-app
# or
npx create-jsonlink my-app
```
*Creates a production-ready React 19 + TypeScript + Vite project preconfigured with bilingual switching (`en`, `my`) and the live translation devtool at `http://localhost:5173/__jsonlink`.*

### 2. Inject into an Existing React + Vite Project
```bash
npx create-jsonlink
```
*Auto-detects your `vite.config.ts`, patches `jsonLink()` devtool, and scaffolds `src/locales/` with zero configuration.*

### 3. Connect AI Assistants via Model Context Protocol (MCP)
Add this 1-line configuration to **Claude Desktop**, **Cursor** (`.cursor/mcp.json`), or **Antigravity**:
```json
{
  "mcpServers": {
    "json-link": {
      "command": "npx",
      "args": ["-y", "@jsonlink/mcp"]
    }
  }
}
```

### 4. Or Launch the Web Studio in Any Browser
👉 **[Open json-link.pages.dev](https://json-link.pages.dev)** *(100% client-side, zero backend, works offline)*

---

## ⚔️ Why JSON Link? (Comparison)

| Capability | Google Sheets / Excel | Cloud SaaS ($50–$400/mo) | ⚡ JSON Link (Open Source) |
| :--- | :---: | :---: | :---: |
| **Interpolation Safety** (`{user}`, `%s`) | ❌ Translators corrupt variables | ⚠️ Complex regex setups | **✅ AST-locked visual chips & live linter** |
| **Local Disk Sync & HMR** | ❌ Manual export & copy-paste | ❌ CLI polling / webhooks | **✅ Direct disk write (`Cmd+S`) with instant Vite HMR** |
| **Developer Overhead** | ❌ Heavy glue scripts | ❌ Vendor lock-in & SDK bloat | **✅ Zero-dependency reactive client (<2KB)** |
| **AI Translation (BYOK)** | ❌ None | ⚠️ High per-token markup | **✅ Direct OpenRouter (Gemini, Claude, DeepSeek)** |
| **Data Privacy & Storage** | ⚠️ Plaintext on external cloud | ⚠️ Third-party server hosting | **✅ 100% Client-Side AES-GCM 256 + Zero Backend** |
| **AI Coding Assistant Tools** | ❌ None | ❌ None | **✅ Native Model Context Protocol (MCP) server** |
| **Myanmar Font Support** | ❌ Garbled Zawgyi rendering | ❌ Unsupported | **✅ Heuristic Rabbit Zawgyi ⇄ Unicode converter** |
| **Pricing** | Free with manual pain | Expensive recurring seat fees | **🆓 Free forever (MIT License)** |

---

## 📦 Core Ecosystem

| Package | npm | Role |
| :--- | :--- | :--- |
| **[`create-jsonlink`](packages/create-jsonlink/)** | `npm create jsonlink` | Zero-setup project starter and existing repo initializer |
| **[`@jsonlink/vite-plugin`](packages/vite-plugin/)** | `npm i -D @jsonlink/vite-plugin` | Vite dev middleware serving `/__jsonlink` with direct disk synchronization |
| **[`@jsonlink/mcp`](mcp/)** | `npx -y @jsonlink/mcp` | stdio JSON-RPC 2.0 MCP server for Cursor, Claude Desktop, and Antigravity |

---

## 🔍 Interactive Feature Tour

<details>
<summary><strong>📊 1. Authentic Spreadsheet Grid & Keyboard Navigation</strong> (Click to expand)</summary>

* **Edge-to-Edge Grid**: Full viewport spreadsheet with zero outer margins, clean gridlines, row numbers (`1, 2, 3...`), and column letters (`A, B, C...`).
* **Freeze Panes**:
  * Sticky Top: Headers stay pinned during vertical scrolling.
  * Freeze Left: Key column stays fixed while scrolling horizontally across languages.
  * Custom Pinning: Pin any language column with 1 click from the header dropdown.
* **Formula Bar (`fx`)**: Inspect active cell coordinates (e.g., `B14 [en]`) with full-width multiline editing.
* **Keyboard Navigation**: Familiar Excel arrow keys (`↑`, `↓`, `←`, `→`), `Tab` / `Shift+Tab` cell jump, and `Enter` to commit and advance.
* **1-Click Revert Chip (`↺`)**: Modified or newly translated cells show an interactive rollback chip to revert back to disk/imported state.
* **Multi-Cell Copy & Paste**: Paste tab-separated or newline-delimited text from Google Sheets or Excel seamlessly.
* **Time Machine**: 50-step historical snapshot engine (`Cmd+Z` / `Cmd+Shift+Z`).

</details>

<details>
<summary><strong>🛡️ 2. AST Tokenizer & Real-time QA Consistency Linter</strong> (Click to expand)</summary>

* **Token Protection Engine**: Automatically tokenizes interpolation variables into indestructible visual chips:
  * ICU MessageFormat: `{name}`, `{count, plural, one{# item} other{# items}}`
  * Mustache / Handlebars: `{{username}}`, `{{total}}`
  * Printf syntax: `%s`, `%1$s`, `%(user)d`
  * Positional variables: `$1`, `$2`
* **Real-time QA Linter**:
  * **Missing Variables**: Flags any translation missing variables present in source strings.
  * **Whitespace Cleaner**: 1-click "Fix All Whitespace" trims leading/trailing spaces across all keys.
  * **Text Expansion Warning**: Highlights translations exceeding 2.5x source length to prevent mobile UI button clipping.
  * **Untranslated & Duplicate Detector**: Pinpoints identical strings and unmigrated keys.
  * **Jump to Cell**: Click any issue row in the linter modal to automatically select and focus that cell in the grid.

</details>

<details>
<summary><strong>⚡ 3. Two-Way Disk Synchronization & Instant Vite HMR</strong> (Click to expand)</summary>

* **Native File System Access API**: Connects directly to local folders (`src/locales/` or `assets/l10n/`).
* **Instant Disk Sync**: Press `Cmd+S` or `Ctrl+S` — changes write directly to `.json` files on your local drive with zero download prompts.
* **Zero Production Overhead**: The devtool runs exclusively in `vite dev` (`apply: 'serve'`). In production builds (`npm run build`), zero runtime bytes from JSON Link are bundled.
* **Live Type Generation**: Every disk save regenerates `translations.d.ts` with strict TypeScript literal union types.

</details>

<details>
<summary><strong>🤖 4. Model Context Protocol (MCP) Server for AI Assistants</strong> (Click to expand)</summary>

Connects directly to **Claude Desktop**, **Cursor**, **Windsurf**, and **Google Antigravity** via stdio JSON-RPC 2.0:

* `validate_variables`: Verifies interpolation token integrity across files.
* `convert_zawgyi`: Lossless Rabbit encoding conversion.
* `lint_translations`: Automated headless QA audit for CI or chat prompts.
* `read_translations`: Unified parser across JSON, ARB, XML, Strings, YAML, and CSV.
* `export_bundle`: Multi-platform code generation.

**Configuration in `.cursor/mcp.json` or Claude Desktop:**
```json
{
  "mcpServers": {
    "json-link": {
      "command": "npx",
      "args": ["-y", "@jsonlink/mcp"]
    }
  }
}
```

</details>

<details>
<summary><strong>🔒 5. Zero-Knowledge E2EE Sharing & Team Handoff (.jsonlink)</strong> (Click to expand)</summary>

* **Zero-Storage URL Fragment Sharing (`#share=...`)**:
  * Entire multi-language workspace states are compressed in-browser via DEFLATE (`pako`) and encoded into the URL hash fragment.
  * Zero server storage, zero database overhead. Plaintext data never transits an intermediary server.
* **Client-Side AES-GCM 256-bit Password Encryption**:
  * Optional password protection using PBKDF2-SHA256 (100,000 iterations), 16-byte cryptographic salt, and 12-byte IV.
  * Available across URL shares, standalone `.jsonlink` file backups, and workspace exit guards.
* **Automated Decryption Dialog**: Opening an encrypted URL triggers password prompts with cryptographic authentication tag verification.

</details>

<details>
<summary><strong>🇲🇲 6. Lossless Myanmar Zawgyi ⇄ Unicode Engine</strong> (Click to expand)</summary>

* **Heuristic Font Detector**: Analyzes text ordering, vowel markers, and medials to automatically detect legacy Zawgyi encoding.
* **Warning Header Badges**: Displays a Zawgyi warning pill on affected language columns.
* **Rabbit Transcoder**:
  * **Zawgyi → Unicode**: One-click conversion reordering syllables to international Myanmar Unicode standards.
  * **Unicode → Zawgyi**: Transcodes clean Unicode back to Zawgyi for testing on legacy Android forks.

</details>

<details>
<summary><strong>📦 7. Universal Multi-Platform Exporters</strong> (Click to expand)</summary>

One-click multi-format bundle exporter transpiling simultaneously into:
* **Web & Next.js**: `locales/{lang}.json` (flat or nested)
* **Flutter**: `flutter-l10n/app_{lang}.arb` (preserves `@key` descriptions & placeholders)
* **iOS / Xcode**: `ios-strings/{lang}.lproj/Localizable.strings` (with C-style comments)
* **Android**: `android-res/values-{lang}/strings.xml` (with XML resource comments)
* **TypeScript**: `translations.d.ts` (strict type-safe unions)
* **Spreadsheets**: Excel `.xlsx` (auto-sized columns) and UTF-8 BOM `.csv`
* **Server**: YAML `.yaml`

</details>

<details>
<summary><strong>🐙 8. GitHub Branch Discovery & Automated Pull Requests</strong> (Click to expand)</summary>

* **Zero-Setup Client-Side Sync**: Connects to public or private repositories using a GitHub Personal Access Token (stored only in browser `localStorage`).
* **Git Tree Locales Discovery**: Recursively scans repo branches to detect existing localization files (`locales/`, `i18n/`, `values-*/`, etc.).
* **Automated Feature Branch & PR Creation**: Commits updated translations to a dedicated branch (`jsonlink/translations-...`) and opens a Pull Request with a clear markdown diff summary.
* **Safety Guardrails**: Security filters permanently block read/write operations outside translation paths (e.g., blocking `src/`, `.env*`, `.github/`).

</details>

---

## 💻 Developer Integration (React + Vite)

JSON Link provides an ultra-lightweight, zero-dependency reactive client loader (`i18n.ts`):

```tsx
// src/App.tsx
import { useTranslation } from './locales/i18n';

export function App() {
  const { t, language, setLanguage, languages } = useTranslation();

  return (
    <div>
      {/* Type-safe key autocomplete with variable interpolation */}
      <h1>{t('app.title')}</h1>
      <p>{t('auth.welcome', { username: 'Developer' })}</p>

      {/* Reactive language switcher */}
      <div className="flex gap-2">
        {languages.map((lang) => (
          <button
            key={lang}
            className={language === lang ? 'active' : ''}
            onClick={() => setLanguage(lang)}
          >
            {lang === 'en' ? 'English' : 'မြန်မာ'}
          </button>
        ))}
      </div>
    </div>
  );
}
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { jsonLink } from '@jsonlink/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    jsonLink({
      localesDir: './src/locales',
      route: '/__jsonlink', // open devtool at http://localhost:5173/__jsonlink
    }),
  ],
});
```

---

## 🧪 Testing & Verification

Quality and zero-regression architecture are guaranteed via automated test suites in Vitest:

```bash
npm test
```

```
 ✓ src/components/__tests__/SpreadsheetTable.test.tsx (8 tests)
 ✓ src/lib/__tests__/variables.test.ts (31 tests)
 ✓ src/lib/__tests__/linter.test.ts (20 tests)
 ✓ src/lib/__tests__/myanmarFont.test.ts (16 tests)
 ✓ src/lib/__tests__/exporter.test.ts (23 tests)
 ✓ packages/vite-plugin/src/__tests__/init.test.ts (12 tests)
 ✓ packages/create-jsonlink/src/__tests__/create.test.ts (2 tests)
 ...

 Test Files  52 passed (52)
      Tests  398 passed (398)
```

---

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/pyaephyomaungdev/json-link.git
cd json-link

# Install dependencies
npm install

# Start development server
npm run dev

# Build all packages (Web app, Vite Plugin, MCP Server, Starter CLI)
npm run build
npm run plugin:build
npm run mcp:build
npm run create:build
```

---

## 📄 License

MIT © [Pyae Phyo Maung](https://github.com/pyaephyomaungdev) — Free and open-source for developers and teams worldwide.

