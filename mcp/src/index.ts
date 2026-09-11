#!/usr/bin/env node

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import {
  isZawgyi,
  zawgyiToUnicode,
  unicodeToZawgyi,
  validateVariables,
  lintTranslations,
  exportFormat,
  TranslationItem,
} from './tools.js';

interface JsonRpcRequest {
  jsonrpc: string;
  id?: number | string;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

const ALLOWED_FILE_EXTENSIONS = ['.json', '.jsonlink', '.arb', '.xml', '.strings', '.yaml', '.yml', '.csv'];

function isSafeFilePath(filePath: string): boolean {
  const p = path.resolve(filePath);
  const base = path.basename(p);
  if (base.startsWith('.')) return false;
  const ext = path.extname(p).toLowerCase();
  return ALLOWED_FILE_EXTENSIONS.includes(ext);
}

const TOOLS_MANIFEST = [
  {
    name: 'read_translations',
    description: 'Read and parse an i18n translation file (JSON, YAML, Android XML, iOS strings) into structured items.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Absolute or relative path to the translation file (e.g. locales/en.json or project.jsonlink)',
        },
        content: {
          type: 'string',
          description: 'Raw string content of the translation file (if not reading from disk)',
        },
      },
    },
  },
  {
    name: 'lint_translations',
    description: 'Audit translations for missing keys, trailing whitespace, variable mismatches, Zawgyi font encoding, and text expansion.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Path to a JSON Link project file (.jsonlink) or locale JSON file',
        },
        items: {
          type: 'array',
          description: 'Array of translation item objects with key, description, and language fields',
          items: { type: 'object' },
        },
        languages: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of language codes in dataset (e.g. ["en", "my", "th"])',
        },
        sourceLang: {
          type: 'string',
          description: 'Source reference language (default: "en")',
        },
      },
    },
  },
  {
    name: 'convert_zawgyi',
    description: 'Losslessly convert text between legacy Myanmar Zawgyi font encoding and international Myanmar Unicode standard.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Myanmar text to convert or inspect',
        },
        direction: {
          type: 'string',
          enum: ['zawgyi_to_unicode', 'unicode_to_zawgyi', 'auto'],
          description: 'Conversion direction. "auto" detects Zawgyi font encoding automatically (default).',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'validate_variables',
    description: 'Verify that interpolation variables ({name}, %s, {{count}}, $user) from the source string exist in the translated string.',
    inputSchema: {
      type: 'object',
      properties: {
        sourceText: {
          type: 'string',
          description: 'Original source sentence (e.g. "Welcome, {username}!")',
        },
        targetText: {
          type: 'string',
          description: 'Translated sentence to validate (e.g. "ကြိုဆိုပါသည် {username}!")',
        },
      },
      required: ['sourceText', 'targetText'],
    },
  },
  {
    name: 'export_bundle',
    description: 'Generate multi-platform localization files (Next.js JSON, Flutter ARB, iOS strings, Android XML, TypeScript d.ts).',
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'Array of translation item objects',
          items: { type: 'object' },
        },
        language: {
          type: 'string',
          description: 'Target language code (e.g. "en", "my", "ja")',
        },
        format: {
          type: 'string',
          enum: ['json-flat', 'json-nested', 'flutter-arb', 'android-xml', 'ios-strings', 'typescript-dts'],
          description: 'Target export file format',
        },
      },
      required: ['items', 'language', 'format'],
    },
  },
];

function handleToolCall(name: string, args: any): any {
  switch (name) {
    case 'convert_zawgyi': {
      const text = args.text || '';
      const isZg = isZawgyi(text);
      const direction = args.direction || 'auto';

      let converted = text;
      let actionTaken = 'none';

      if (direction === 'unicode_to_zawgyi') {
        converted = unicodeToZawgyi(text);
        actionTaken = 'unicode_to_zawgyi';
      } else if (direction === 'zawgyi_to_unicode' || (direction === 'auto' && isZg)) {
        converted = zawgyiToUnicode(text);
        actionTaken = 'zawgyi_to_unicode';
      }

      return {
        original: text,
        converted,
        isZawgyiDetected: isZg,
        actionTaken,
      };
    }

    case 'validate_variables': {
      const result = validateVariables(args.sourceText || '', args.targetText || '');
      return result;
    }

    case 'lint_translations': {
      let items: TranslationItem[] = args.items || [];
      let languages: string[] = args.languages || [];

      if (args.filePath) {
        if (!isSafeFilePath(args.filePath)) {
          return { error: `Access denied: only translation files (${ALLOWED_FILE_EXTENSIONS.join(', ')}) can be accessed.` };
        }
        const p = path.resolve(args.filePath);
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf8');
          try {
            const parsed = JSON.parse(content);
            if (parsed.format === 'jsonlink' && Array.isArray(parsed.items)) {
              items = parsed.items;
              languages = parsed.languages || [];
            } else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
              // Single locale json
              const langMatch = path.basename(p).replace(/\.json$/i, '');
              languages = [langMatch || 'en'];
              items = Object.entries(parsed).map(([key, val]) => ({
                key,
                [langMatch || 'en']: String(val),
              }));
            }
          } catch (e: any) {
            return { error: `Failed to parse JSON at ${args.filePath}: ${e.message}` };
          }
        } else {
          return { error: `File not found: ${args.filePath}` };
        }
      }

      if (languages.length === 0 && items.length > 0) {
        const langSet = new Set<string>();
        items.forEach(i => {
          Object.keys(i).forEach(k => {
            if (k !== 'key' && k !== 'description' && k !== 'status') {
              langSet.add(k);
            }
          });
        });
        languages = Array.from(langSet);
      }

      const report = lintTranslations(items, languages, args.sourceLang || 'en');
      return {
        totalKeys: items.length,
        languages,
        ...report,
      };
    }

    case 'export_bundle': {
      const items: TranslationItem[] = args.items || [];
      const lang: string = args.language || 'en';
      const format = args.format || 'json-nested';
      const output = exportFormat(items, lang, format);
      return {
        language: lang,
        format,
        fileContent: output,
      };
    }

    case 'read_translations': {
      let raw = args.content || '';
      if (args.filePath) {
        if (!isSafeFilePath(args.filePath)) {
          return { error: `Access denied: only translation files (${ALLOWED_FILE_EXTENSIONS.join(', ')}) can be accessed.` };
        }
        const p = path.resolve(args.filePath);
        if (fs.existsSync(p)) {
          raw = fs.readFileSync(p, 'utf8');
        } else {
          return { error: `File not found: ${args.filePath}` };
        }
      }

      // 1. Android strings.xml
      if (raw.includes('<resources') || raw.includes('<string name=')) {
        const regex = /<string\s+[^>]*?name="([^"]+)"[^>]*>([\s\S]*?)<\/string>/gi;
        const items: Array<{ key: string; value: string }> = [];
        let match;
        while ((match = regex.exec(raw)) !== null) {
          items.push({ key: match[1].trim(), value: match[2].trim() });
        }
        return {
          type: 'android-xml',
          totalKeys: items.length,
          items,
        };
      }

      // 2. iOS Localizable.strings
      if (/"([^"\\]*(?:\\.[^"\\]*)*)"\s*=\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*;/.test(raw)) {
        const regex = /"([^"\\]*(?:\\.[^"\\]*)*)"\s*=\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*;/g;
        const items: Array<{ key: string; value: string }> = [];
        let match;
        while ((match = regex.exec(raw)) !== null) {
          items.push({ key: match[1], value: match[2] });
        }
        return {
          type: 'ios-strings',
          totalKeys: items.length,
          items,
        };
      }

      // 3. JSON, JSONLink, and Flutter ARB
      try {
        const parsed = JSON.parse(raw);
        if (parsed.format === 'jsonlink') {
          return {
            type: 'jsonlink-project',
            name: parsed.name,
            languages: parsed.languages,
            totalKeys: parsed.items.length,
            items: parsed.items,
          };
        } else if (parsed['@@locale'] || Object.keys(parsed).some(k => k.startsWith('@'))) {
          const lang = parsed['@@locale'] || 'en';
          const descriptions: Record<string, string> = {};
          for (const [k, v] of Object.entries(parsed)) {
            if (k.startsWith('@') && !k.startsWith('@@') && typeof v === 'object' && v !== null) {
              if ((v as any).description) descriptions[k.slice(1)] = (v as any).description;
            }
          }
          const items: TranslationItem[] = [];
          for (const [k, v] of Object.entries(parsed)) {
            if (!k.startsWith('@')) {
              const it: TranslationItem = { key: k, [lang]: String(v ?? '') };
              if (descriptions[k]) it.description = descriptions[k];
              items.push(it);
            }
          }
          return {
            type: 'flutter-arb',
            locale: lang,
            totalKeys: items.length,
            items,
          };
        } else {
          return {
            type: 'json-object',
            keysCount: Object.keys(parsed).length,
            data: parsed,
          };
        }
      } catch (err: any) {
        return { error: `Failed to parse translation content: ${err.message}` };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Setup JSON-RPC over stdio
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', line => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const req: JsonRpcRequest = JSON.parse(trimmed);

    // Handle MCP protocol methods
    if (req.method === 'initialize') {
      const resp: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'json-link-mcp',
            version: '1.0.0',
            description: 'Model Context Protocol server for JSON Link i18n & Myanmar translation tools',
          },
        },
      };
      process.stdout.write(JSON.stringify(resp) + '\n');
      return;
    }

    if (req.method === 'notifications/initialized') {
      // Client confirmed initialized, no reply needed
      return;
    }

    if (req.method === 'ping') {
      const resp: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: req.id,
        result: {},
      };
      process.stdout.write(JSON.stringify(resp) + '\n');
      return;
    }

    if (req.method === 'tools/list') {
      const resp: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          tools: TOOLS_MANIFEST,
        },
      };
      process.stdout.write(JSON.stringify(resp) + '\n');
      return;
    }

    if (req.method === 'tools/call') {
      const toolName = req.params?.name;
      const toolArgs = req.params?.arguments || {};

      try {
        const result = handleToolCall(toolName, toolArgs);
        const resp: JsonRpcResponse = {
          jsonrpc: '2.0',
          id: req.id,
          result: {
            content: [
              {
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
              },
            ],
          },
        };
        process.stdout.write(JSON.stringify(resp) + '\n');
      } catch (err: any) {
        const resp: JsonRpcResponse = {
          jsonrpc: '2.0',
          id: req.id,
          error: {
            code: -32000,
            message: err?.message || 'Tool execution error',
          },
        };
        process.stdout.write(JSON.stringify(resp) + '\n');
      }
      return;
    }

    // Default error for unsupported method
    if (req.id !== undefined) {
      const resp: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: req.id,
        error: {
          code: -32601,
          message: `Method '${req.method}' not implemented`,
        },
      };
      process.stdout.write(JSON.stringify(resp) + '\n');
    }
  } catch (err: any) {
    process.stderr.write(`Failed to parse JSON-RPC line: ${err.message}\n`);
  }
});

process.stderr.write('JSON Link MCP Server started (stdio JSON-RPC 2.0)\n');
