# Contributing to JSON Link

Thank you for your interest in contributing to **JSON Link**! We welcome bug fixes, performance improvements, format parsers, and localization features that uphold our core philosophy: **zero-latency client-side processing, strict data sovereignty, and robust type safety**.

---

## Code of Conduct

All contributors are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) in all project interactions.

---

## Getting Started

### Prerequisites

- **Node.js**: `v20.x` or later (tested on Node 22+).
- **Package Manager**: `npm` (v10+).

### Development Setup

1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/<your-username>/json-link.git
   cd json-link
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local Vite development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Architecture & Directory Layout

- `src/` — React 19 single-page application and UI components.
  - `src/lib/` — Pure client-side algorithms, format parsers, encryption utilities, and translation engine.
  - `src/components/` — UI modals, tables, and dialogs built with Tailwind CSS v4 and Radix UI.
  - `src/types/` — Shared TypeScript type definitions.
- `packages/` — Monorepo ecosystem tools:
  - `packages/vite-plugin/` — `@jsonlink/vite-plugin` for two-way disk sync and Vite HMR.
  - `packages/create-jsonlink/` — CLI scaffolding tool.
- `mcp/` — JSON-RPC 2.0 Model Context Protocol server.
- `public/` — Static assets, Web App Manifest, Service Worker, and web compliance files (`_headers`, `security.txt`, `llms.txt`, etc.).

---

## Quality Assurance & Verification Standards

Before submitting a Pull Request, verify that your changes pass all quality checks:

```bash
# 1. Run ultra-fast linting (oxlint)
npm run lint

# 2. Strict TypeScript typechecking
npm run typecheck

# 3. Unit test suite (Vitest)
npm run test

# 4. Production build verification
npm run build
```

> [!NOTE]
> All Pull Requests must maintain **0 lint warnings**, **0 TypeScript errors**, and **100% test pass rate**.

---

## Pull Request Guidelines

1. **Branch Naming**:
   - `feat/<feature-name>` for new features.
   - `fix/<bug-description>` for bug fixes.
   - `perf/<optimization>` for performance enhancements.
   - `docs/<topic>` for documentation updates.

2. **Commit Conventions**:
   We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
   - `feat(...)`: A new feature or parser format.
   - `fix(...)`: A bug fix or security patch.
   - `perf(...)`: Code change that improves performance.
   - `test(...)`: Adding or updating test cases.
   - `docs(...)`: Documentation changes only.

3. **Self-Contained Changes**:
   Keep Pull Requests focused and cohesive. If proposing a substantial architectural shift, open an issue first to discuss the design.

---

## Reporting Issues

- **Bug Reports**: Use our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.yml).
- **Feature Proposals**: Use our [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.yml).
- **Security Vulnerabilities**: Do not file public issues. Follow [SECURITY.md](SECURITY.md).
