# create-jsonlink

The official starter and initialization CLI for **[JSON Link](https://json-link.pages.dev)**.

Scaffold a high-performance React + Vite + TypeScript application preconfigured with the JSON Link localization workspace, or initialize JSON Link into any existing React project with a single command.

---

## Usage

### Option 1: Create a New Localized App (Zero Setup)

```bash
npm create jsonlink my-i18n-app
# or
npx create-jsonlink my-i18n-app
```

Then start your app:

```bash
cd my-i18n-app
npm install
npm run dev
```

- **App**: `http://localhost:5173`
- **JSON Link Live Dashboard**: `http://localhost:5173/__jsonlink`

---

### Option 2: Initialize in an Existing Vite Project

Run inside any existing React + Vite repository root:

```bash
npx create-jsonlink
```

This will automatically:
1. Detect your package manager (`npm`, `pnpm`, `bun`, `yarn`).
2. Inject `jsonLink()` into your `vite.config.ts`.
3. Add `@jsonlink/vite-plugin` to `devDependencies`.
4. Scaffold `src/locales/` (`en.json`, `my.json`, `translations.d.ts`, `i18n.ts`).

---

## What is Included?

- **Vite Devtool Plugin**: Two-way disk synchronization with instant Vite HMR.
- **Embedded Dev Dashboard**: Full spreadsheet localization table at `http://localhost:5173/__jsonlink`.
- **Zero Runtime Overhead**: The devtool runs strictly during `vite dev` and tree-shakes completely out of production builds.
- **Type-Safe Autocomplete**: Full TypeScript definition generation (`translations.d.ts`) for key names and variable interpolations.
- **Lossless Myanmar Support**: Built-in Unicode and Zawgyi font handling.

---

## License

MIT © [Pyae Phyo Maung](https://github.com/pyaephyomaungdev/json-link)
