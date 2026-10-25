# Security Policy

## Supported Versions

JSON Link takes the security of our application, cryptographic client vaults, and users seriously. We actively maintain and patch the latest version on the default branch.

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Architecture & Security Model

JSON Link is engineered with strict client-side data sovereignty:

1. **Zero-Knowledge Architecture**: Your localization keys and values are processed entirely in-memory within your browser. There is no remote database storing translation data.
2. **Client-Side Cryptography**: 
   - Project sharing URLs put a compressed payload in the URL fragment (`#share=...`). **AES-GCM (256-bit)** via **PBKDF2** (100,000 iterations, SHA-256) is applied only when the sender sets a password. Without a password, anyone with the link can decompress the strings.
   - Hash fragments are not sent to HTTP servers in request lines, so the payload does not appear in web hosting logs.
3. **Secrets Isolation**:
   - OpenRouter API keys are held in `sessionStorage` by default (auto-cleared when the browser tab closes) and only persisted if explicitly remembered. Remembered keys are AES-GCM encrypted with a device-local, non-extractable CryptoKey in IndexedDB — this is not a user-chosen password.
   - GitHub Personal Access Tokens (PAT) use the same device-local vault and are used exclusively for client-to-GitHub direct REST API calls.
4. **Locales Guardrails**: All GitHub branch/PR synchronization operations enforce strict deny-lists preventing modification to any non-localization files (code, configs, workflows, and dotfiles are blocked).

## Reporting a Vulnerability

If you discover a security vulnerability or suspect an issue within JSON Link, please report it privately. **Do not disclose vulnerabilities publicly via GitHub issues or discussions until they have been reviewed and remediated.**

### Contact

Please send your vulnerability report via email to:

📧 **[contact@pyaephyomaung.dev](mailto:contact@pyaephyomaung.dev)**

### What to Include

To help us investigate and triage your report promptly, please include:
- A clear description of the vulnerability and its potential security impact.
- Step-by-step instructions to reproduce the issue (proof-of-concept, payload examples, or environment details).
- The browser version, operating system, or Node.js environment where the behavior occurs.
- Any proposed remediations or patches if you have identified one.

### Response Timelines

- **Initial Response & Acknowledgment**: Within 24–48 hours.
- **Triage & Severity Assessment**: Within 3 business days.
- **Fix & Disclosure Coordination**: We work to patch confirmed issues as rapidly as possible and will coordinate public disclosure or release credit with you.

### Security Disclosures & Standards

Our RFC 9116 vulnerability disclosure metadata is available at:
`https://json-link.pages.dev/.well-known/security.txt`
