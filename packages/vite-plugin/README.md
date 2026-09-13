# @jsonlink/vite-plugin

The official Vite plugin & CLI for **[JSON Link](https://json-link.pages.dev)**.

Turn any React + Vite project into an instant, local-first localization workspace with zero extra ports, zero daemons, and two-way disk synchronization with instant Vite HMR.

---

## Quick Start (1 Command)

In your existing React + Vite project root, run:

```bash
npx json-link init
```

This will automatically:
1. Detect your package manager (`pnpm`, `bun`, `yarn`, `npm`).
2. Configure `jsonLink()` inside your `vite.config.ts`.
3. Scaffold `src/locales/` (`en.json`, `my.json`, `translations.d.ts`, and reactive `i18n.ts`).

---

## Development Dashboard

Start your app:

```bash
npm run dev
```

Open your browser to:
👉 **`http://localhost:5173/__jsonlink`**

- **Live Spreadsheet Table**: Inspect and edit all your translation keys side-by-side.
- **Two-Way Disk Sync**: Press `Ctrl+S` / `Cmd+S` or click "Save to Disk" — changes are written directly to your `.json` files on disk.
- **Instant HMR**: Active browser tabs update automatically without page reload.
- **Zero Production Overhead**: The plugin only runs during `vite dev` (`apply: 'serve'`). In production builds (`npm run build`), zero runtime code from JSON Link is bundled.

---

## Manual Configuration

If you prefer to configure manually:

```bash
npm i -D @jsonlink/vite-plugin
```

In `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { jsonLink } from '@jsonlink/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    jsonLink({
      localesDir: './src/locales', // path to translation files
      route: '/__jsonlink',        // dashboard route
      indent: 2,                   // JSON spacing
      nested: false,               // flat keys vs nested objects
    }),
  ],
});
```

---

## License

MIT © [JSON Link Team](https://github.com/pyaephyomaungdev/json-link)
