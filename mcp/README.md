# JSON Link Model Context Protocol (MCP) Server

An official **Model Context Protocol (MCP)** server for **JSON Link**, allowing AI assistants (Claude Desktop, Cursor, Antigravity, Cline, Windsurf) to directly parse, lint, validate, convert, and export software localization files.

---

## Capabilities & Tools

| Tool | Description |
| :--- | :--- |
| `convert_zawgyi` | Lossless Rabbit converter between Myanmar Zawgyi font encoding and international Myanmar Unicode standard with automatic detection. |
| `validate_variables` | Ensures all interpolation variables (`{username}`, `%s`, `{{count}}`, `$name`) from source strings are preserved in translations without syntax damage. |
| `lint_translations` | Comprehensive QA scanner checking for leading/trailing whitespace, missing keys, variable mismatches, text expansion risk, and Zawgyi font issues. |
| `read_translations` | Parses translation files (`.json`, `.jsonlink`, `.yaml`, `.xml`, `.strings`) into normalized JSON Link records. |
| `export_bundle` | Generates framework-ready localization files (`Next.js / React JSON`, `Flutter ARB`, `iOS Localizable.strings`, `Android strings.xml`, `TypeScript d.ts`). |

---

## Installation & Setup

### 1. Build the Server

Ensure the MCP server is compiled to JavaScript:

```bash
cd mcp
npm run build
```

The executable is located at `mcp/dist/index.js`.

---

### 2. Configure in Claude Desktop

Add this entry to your Claude Desktop configuration file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "json-link": {
      "command": "node",
      "args": [
        "/absolute/path/to/json-link/mcp/dist/index.js"
      ]
    }
  }
}
```

Restart Claude Desktop. You will now see the hammer icon 🔨 with `json-link` tools available in your conversations.

---

### 3. Configure in Cursor

Add the server to your project's `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "json-link": {
      "command": "node",
      "args": ["${workspaceFolder}/mcp/dist/index.js"]
    }
  }
}
```

---

### 4. Configure in Antigravity

Add to `~/.gemini/antigravity/mcp_config.json`:

```json
{
  "mcpServers": {
    "json-link": {
      "command": "node",
      "args": ["/Users/pyaephyomaung/Development/Project/PPM/json-link/mcp/dist/index.js"]
    }
  }
}
```

---

## Example AI Prompts

Once configured, you can prompt your AI assistant naturally:

- *"Check if our mobile app's Myanmar translations in `locales/my.json` contain any Zawgyi font encoding and convert them to standard Unicode."*
- *"Audit `locales/` for missing variables or trailing whitespaces using JSON Link linter."*
- *"Validate whether `{username}` and `{count}` were correctly preserved in this translation."*
- *"Export our translations into Flutter ARB and iOS Localizable.strings."*

---

## Testing via CLI

You can test the MCP server manually using Node.js:

```bash
node -e '
const { spawn } = require("child_process");
const proc = spawn("node", ["mcp/dist/index.js"]);

proc.stdout.on("data", (d) => console.log(d.toString()));

proc.stdin.write(JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "convert_zawgyi",
    arguments: { text: "မဂၤလာပါ" }
  }
}) + "\n");
'
```

---

## License

MIT © [Pyae Phyo Maung](https://github.com/PyaePhyoM)
