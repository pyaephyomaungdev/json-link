import type { Plugin, ViteDevServer } from 'vite';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { JsonLinkPluginOptions, LocalesDataResponse, SaveLocalesRequest } from './types.js';
import { readLocalesFromDisk, writeLocalesToDisk } from './fsUtils.js';
import { getDashboardHtml } from './dashboardHtml.js';

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

        // 1. Dashboard UI Route
        if (url === route || url === `${route}/`) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(getDashboardHtml(route, path.basename(resolvedLocalesDir)));
          return;
        }

        // 2. Read Locales API
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

        // 3. Write Locales API
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
