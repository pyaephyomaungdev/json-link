import { useState, useEffect } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Moon,
  Sun,
  ShieldCheck,
  Cookie,
  Lock,
  HardDrive,
  EyeOff,
  Scale,
  ExternalLink,
} from 'lucide-react';

export type LegalTab = 'privacy' | 'terms' | 'cookies';

interface LegalPageProps {
  initialTab?: LegalTab;
  onBack: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onNavigateTab?: (tab: LegalTab) => void;
}

export function LegalPage({
  initialTab = 'privacy',
  onBack,
  isDark,
  onToggleTheme,
  onNavigateTab,
}: LegalPageProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const handleSelectTab = (tab: LegalTab) => {
    setActiveTab(tab);
    onNavigateTab?.(tab);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Studio</span>
          </Button>
          <span className="text-border hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-2">
            <Logo size="sm" showText={true} />
            <Badge variant="outline" className="text-[10px] font-mono uppercase text-muted-foreground border-border/60">
              Legal
            </Badge>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60 text-xs">
          <button
            type="button"
            onClick={() => handleSelectTab('privacy')}
            className={`px-3 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck className="size-3.5" />
            <span>Privacy</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectTab('terms')}
            className={`px-3 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'terms'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Scale className="size-3.5" />
            <span>Terms</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectTab('cookies')}
            className={`px-3 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cookies'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Cookie className="size-3.5" />
            <span>Cookies</span>
          </button>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="size-8 p-0 cursor-pointer"
        >
          {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-slate-700" />}
        </Button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* ========================================================================= */}
        {/* 1. PRIVACY POLICY */}
        {/* ========================================================================= */}
        {activeTab === 'privacy' && (
          <article className="space-y-8 animate-in fade-in-50 duration-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
                <span>Effective Date: September 2026</span>
                <span>•</span>
                <span>Version 1.0</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                <ShieldCheck className="size-8 text-emerald-500 shrink-0" />
                Privacy Policy
              </h1>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                JSON Link is designed with a fundamental architectural principle: <strong>Privacy by architecture, not by policy promise</strong>. All localization parsing, spreadsheet editing, and data modifications execute 100% locally inside your browser runtime.
              </p>
            </div>

            {/* Architecture Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <HardDrive className="size-4 text-blue-500" />
                  <span>Zero Server Storage</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your locale files, translations, and project files never touch any backend server or cloud database.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Lock className="size-4 text-emerald-500" />
                  <span>AES-GCM 256 Encrypted</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Encrypted share links use PBKDF2 with 100,000 iterations. Hash payloads are never sent to web servers.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <EyeOff className="size-4 text-purple-500" />
                  <span>No Tracking / Telemetry</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Zero Google Analytics, zero session recorders, zero fingerprinting, and zero advertising trackers.
                </p>
              </div>
            </div>

            {/* Detailed Clauses */}
            <section className="space-y-4 pt-2 border-t border-border/60">
              <h2 className="text-xl font-bold text-foreground">1. Information We Do Not Collect</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Unlike traditional SaaS localization platforms, JSON Link does not maintain user accounts, databases, or cloud sync servers. When you use the web application:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5 pl-2">
                <li>We do not collect personal identifying information (PII).</li>
                <li>We do not store, inspect, or log your translation keys, source strings, or exported bundles.</li>
                <li>We do not record session replays, mouse clicks, or analytics events.</li>
              </ul>
            </section>

            <section className="space-y-4 pt-2 border-t border-border/60">
              <h2 className="text-xl font-bold text-foreground">2. Local File System Access API</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When you connect a local folder via the Folder Sync feature, the browser prompts you for explicit permission using the standardized Web File System Access API. The browser grants JSON Link direct read and write access to your local folder on disk. This connection occurs strictly between the web application running in your browser memory and your local operating system. No folder contents are transmitted across the network.
              </p>
            </section>

            <section className="space-y-4 pt-2 border-t border-border/60">
              <h2 className="text-xl font-bold text-foreground">3. Bring Your Own Key (BYOK) AI Translations</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you choose to use the AI Translation feature:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5 pl-2">
                <li>Your API key is stored strictly in your browser's private session memory or encrypted local storage.</li>
                <li>Translation requests are transmitted directly from your client browser to the configured provider (e.g., OpenRouter or OpenAI) via encrypted HTTPS.</li>
                <li>Requests never traverse any intermediate proxy or server managed by JSON Link.</li>
              </ul>
            </section>

            <section className="space-y-4 pt-2 border-t border-border/60">
              <h2 className="text-xl font-bold text-foreground">4. Client-Side Share Links</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When generating a shareable link, the project payload is compressed and encoded into the URL hash fragment (<code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">#share=...</code>). By standard HTTP specification (RFC 3986), URL fragments are processed exclusively by the browser and are <strong>never transmitted in HTTP requests</strong> to web servers or CDN edge nodes. When password protection is enabled, payloads are encrypted with authenticated AES-GCM 256-bit cryptography before hash serialization.
              </p>
            </section>

            <section className="space-y-4 pt-2 border-t border-border/60">
              <h2 className="text-xl font-bold text-foreground">5. Security Contact & Vulnerability Reporting</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you discover a security vulnerability or have questions about security practices, please consult our published <a href="/.well-known/security.txt" className="text-foreground underline underline-offset-4 hover:text-emerald-500 font-medium">security.txt</a> or contact us directly at <a href="mailto:contact@pyaephyomaung.dev" className="text-foreground underline underline-offset-4 hover:text-emerald-500 font-medium">contact@pyaephyomaung.dev</a>.
              </p>
            </section>
          </article>
        )}

        {/* ========================================================================= */}
        {/* 2. TERMS OF SERVICE */}
        {/* ========================================================================= */}
        {activeTab === 'terms' && (
          <article className="space-y-8 animate-in fade-in-50 duration-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
                <span>Effective Date: September 2026</span>
                <span>•</span>
                <span>Version 1.0</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                <Scale className="size-8 text-blue-500 shrink-0" />
                Terms of Service
              </h1>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                By accessing or using the JSON Link web application, Model Context Protocol (MCP) server, or Vite plugin, you agree to be bound by the following terms.
              </p>
            </div>

            <section className="space-y-4 pt-2 border-t border-border/60">
              <h2 className="text-xl font-bold text-foreground">1. Open-Source License & Use</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                JSON Link is free and open-source software licensed under the <strong>MIT License</strong>. You are granted permission to view, run, modify, fork, and distribute the software for commercial, proprietary, academic, or personal purposes, subject to the conditions of the MIT License:
              </p>
              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 font-mono text-xs text-muted-foreground leading-relaxed">
                Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software...
              </div>
            </section>

            <section className="space-y-4 pt-2 border-t border-border/60">
              <h2 className="text-xl font-bold text-foreground">2. Acceptable Use</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Because JSON Link runs client-side on your local hardware and browser, you maintain complete ownership and responsibility for the content, translation strings, and localization files you create or modify. You agree not to use the software for unlawful acts, distribution of malicious payloads, or violation of third-party intellectual property rights.
              </p>
            </section>

            <section className="space-y-4 pt-2 border-t border-border/60">
              <h2 className="text-xl font-bold text-foreground">3. Third-Party AI Services & Costs</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                JSON Link provides optional integration with third-party LLM providers (e.g. OpenRouter). You are responsible for acquiring and securing your own API keys, monitoring token usage, and complying with the respective provider's terms of service and billing agreements. JSON Link is not liable for third-party API rate limits, charges, or service outages.
              </p>
            </section>

            <section className="space-y-4 pt-2 border-t border-border/60">
              <h2 className="text-xl font-bold text-foreground">4. Disclaimer of Warranties & Limitation of Liability</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
              </p>
            </section>

            <section className="space-y-4 pt-2 border-t border-border/60">
              <h2 className="text-xl font-bold text-foreground">5. Modifications</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                These terms may be updated from time to time to reflect improvements or standard legal requirements. Continued use of the platform constitutes acceptance of updated terms.
              </p>
            </section>
          </article>
        )}

        {/* ========================================================================= */}
        {/* 3. COOKIE & STORAGE POLICY */}
        {/* ========================================================================= */}
        {activeTab === 'cookies' && (
          <article className="space-y-8 animate-in fade-in-50 duration-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
                <span>Effective Date: September 2026</span>
                <span>•</span>
                <span>Version 1.0</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                <Cookie className="size-8 text-amber-500 shrink-0" />
                Cookie & Storage Policy
              </h1>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                JSON Link <strong>does not use tracking cookies</strong> or third-party advertising cookies. We only utilize standard web storage technologies (<code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">localStorage</code> and <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">IndexedDB</code>) strictly for essential local functionality.
              </p>
            </div>

            <section className="space-y-4 pt-2 border-t border-border/60">
              <h2 className="text-xl font-bold text-foreground">1. Zero Third-Party Advertising Cookies</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We do not serve third-party ads, tracking pixels, cross-site beacons, or analytics scripts. Consequently, there are zero tracking cookies stored on your device when using JSON Link.
              </p>
            </section>

            <section className="space-y-4 pt-2 border-t border-border/60">
              <h2 className="text-xl font-bold text-foreground">2. Transparent Local Storage Inventory</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The following browser storage keys are used strictly for client-side user experience:
              </p>

              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-muted/40 border-b border-border/60 text-foreground font-semibold">
                    <tr>
                      <th className="p-3">Storage Key</th>
                      <th className="p-3">Mechanism</th>
                      <th className="p-3">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-muted-foreground">
                    <tr>
                      <td className="p-3 font-bold text-foreground">jsonlink_theme</td>
                      <td className="p-3">localStorage</td>
                      <td className="p-3 font-sans">Remembers user preference for Light or Dark theme.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-foreground">jsonlink_draft</td>
                      <td className="p-3">localStorage</td>
                      <td className="p-3 font-sans">Emergency autosave recovery draft to protect against accidental browser close.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-foreground">jsonlink_glossary</td>
                      <td className="p-3">localStorage</td>
                      <td className="p-3 font-sans">Stores custom terms and forbidden words defined by user for localization consistency.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-foreground">jsonlink_translation_memory</td>
                      <td className="p-3">localStorage</td>
                      <td className="p-3 font-sans">Locally caches approved translation segment pairs for instant auto-suggestions.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-4 pt-2 border-t border-border/60">
              <h2 className="text-xl font-bold text-foreground">3. How to Clear Stored Data</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Since all stored data resides solely in your browser on your computer, you can remove all data at any time by clearing your browser's site data/cookies for <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">json-link.pages.dev</code>, or by using the "Clear Draft" button in the application settings.
              </p>
            </section>
          </article>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-4 sm:px-8 border-t border-border/60 bg-muted/20 text-xs text-muted-foreground mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size="sm" showText={true} />
            <span className="text-muted-foreground/60">•</span>
            <span>Local-First i18n Studio</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <button
              onClick={() => handleSelectTab('privacy')}
              className={`hover:text-foreground transition cursor-pointer ${
                activeTab === 'privacy' ? 'text-foreground underline underline-offset-4' : ''
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => handleSelectTab('terms')}
              className={`hover:text-foreground transition cursor-pointer ${
                activeTab === 'terms' ? 'text-foreground underline underline-offset-4' : ''
              }`}
            >
              Terms of Service
            </button>
            <button
              onClick={() => handleSelectTab('cookies')}
              className={`hover:text-foreground transition cursor-pointer ${
                activeTab === 'cookies' ? 'text-foreground underline underline-offset-4' : ''
              }`}
            >
              Cookie Policy
            </button>
            <a
              href="https://github.com/pyaephyomaungdev/json-link"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition inline-flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
