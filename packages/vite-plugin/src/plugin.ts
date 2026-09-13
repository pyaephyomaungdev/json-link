import type { Plugin, ViteDevServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { JsonLinkPluginOptions, LocalesDataResponse, SaveLocalesRequest } from './types.js';
import { readLocalesFromDisk, writeLocalesToDisk } from './fsUtils.js';
import { getDashboardHtml } from './dashboardHtml.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findClientDir(rootDir: string): string | null {
  const candidates = [
    path.resolve(__dirname, '../client'),
    path.resolve(__dirname, '../../dist'),
    path.resolve(rootDir, 'dist'),
    path.resolve(rootDir, 'node_modules/@jsonlink/vite-plugin/client'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html'))) {
      return dir;
    }
  }
  return null;
}

export function jsonLink(options: JsonLinkPluginOptions = {}): Plugin {
  const localesDir = options.localesDir || './src/locales';
  const route = (options.route || '/__jsonlink').replace(/\/$/, '');
  const indent = options.indent ?? 2;
  const nested = options.nested ?? false;

  let rootDir = process.cwd();

  return {
    name: 'vite-plugin-json-link',
    apply: 'serve', // Strictly runs in development mode, zero overhead in production build

    configResolved(config) {
      rootDir = config.root || process.cwd();
    },

    configureServer(server: ViteDevServer) {
      const resolvedLocalesDir = path.resolve(rootDir, localesDir);

      // Middleware hook
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = (req.url || '').split('?')[0];

        // 1. Read Locales API
        if (url === `${route}/api/locales` && req.method === 'GET') {
          try {
            const data = readLocalesFromDisk(resolvedLocalesDir, nested);
            const response: LocalesDataResponse = {
              success: true,
              localesDir: path.relative(rootDir, resolvedLocalesDir),
              languages: data.languages,
              records: data.records,
            };
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(response));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
          return;
        }

        // 2. Write Locales API
        if (url === `${route}/api/locales` && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body) as SaveLocalesRequest;
              const records = payload.records || [];
              const languages = payload.languages || [];

              const { updatedFiles } = writeLocalesToDisk(
                resolvedLocalesDir,
                records,
                languages,
                nested,
                indent
              );

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, updatedFiles }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // 3. Redirect route without trailing slash so relative assets resolve properly
        if (url === route) {
          res.statusCode = 302;
          res.setHeader('Location', `${route}/`);
          res.end();
          return;
        }

        const clientDir = findClientDir(rootDir);

        // 4. Serve Dashboard UI (Full SPA index.html or fallback)
        if (url === `${route}/` || url === `${route}/index.html`) {
          if (clientDir) {
            const htmlPath = path.join(clientDir, 'index.html');
            let html = fs.readFileSync(htmlPath, 'utf-8');
            const devConfigScript = `<script>window.__JSONLINK_DEV_MODE__ = { isDevServer: true, route: "${route}", apiBase: "${route}/api/locales", localesDir: "${path.relative(rootDir, resolvedLocalesDir)}" };</script>`;
            html = html.replace('<head>', `<head>\n    ${devConfigScript}`);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(html);
            return;
          } else {
            // Graceful fallback to lightweight dashboard if client bundle not yet built
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(getDashboardHtml(route, path.basename(resolvedLocalesDir)));
            return;
          }
        }

        // 5. Serve client static assets (JS, CSS, icons, fonts)
        if (clientDir && url.startsWith(`${route}/`)) {
          const subPath = url.slice(`${route}/`.length);
          const filePath = path.resolve(clientDir, subPath);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes: Record<string, string> = {
              '.js': 'application/javascript; charset=utf-8',
              '.mjs': 'application/javascript; charset=utf-8',
              '.css': 'text/css; charset=utf-8',
              '.svg': 'image/svg+xml',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.webp': 'image/webp',
              '.ico': 'image/x-icon',
              '.woff2': 'font/woff2',
              '.woff': 'font/woff',
              '.ttf': 'font/ttf',
              '.json': 'application/json; charset=utf-8',
            };
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }

        // 6. Fallback for root-relative font requests (e.g. /fonts/noto-sans-myanmar.woff2)
        if (clientDir && url.startsWith('/fonts/')) {
          const fontPath = path.resolve(clientDir, url.slice(1));
          if (fs.existsSync(fontPath) && fs.statSync(fontPath).isFile()) {
            res.setHeader('Content-Type', 'font/woff2');
            fs.createReadStream(fontPath).pipe(res);
            return;
          }
        }

        next();
      });

      // Print banner in dev server console
      const _printUrls = server.printUrls;
      server.printUrls = () => {
        _printUrls();
        const color = (str: string) => `\x1b[36m${str}\x1b[0m`;
        const dim = (str: string) => `\x1b[2m${str}\x1b[0m`;
        console.log(`  ${color('➜')}  ${dim('JSON Link:')} ${color(`http://localhost:${server.config.server.port || 5173}${route}`)}`);
      };
    },
  };
}
