import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Sparkles,
  Table2,
  MousePointerClick,
  Activity,
  Keyboard,
  CheckCircle2,
  Search,
  Upload,
  ShieldCheck,
  Copy,
  Download,
  RotateCcw,
  Languages,
} from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAiTranslate?: () => void;
  onOpenLinter?: () => void;
  onOpenScorecard?: () => void;
}

type GuideTab = 'overview' | 'editing' | 'context-menu' | 'ai-translate' | 'qa-linter' | 'shortcuts';

export const DocumentationModal: React.FC<DocumentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: { id: GuideTab; label: string; mmLabel: string; icon: React.ReactNode }[] = [
    {
      id: 'overview',
      label: 'Getting Started & Formats',
      mmLabel: 'ဖိုင်များ စတင်ထည့်သွင်းခြင်း',
      icon: <Upload className="size-4 text-emerald-500" />,
    },
    {
      id: 'editing',
      label: 'Spreadsheet & Editing',
      mmLabel: 'ဇယားကွက်နှင့် စာသားပြင်ဆင်ခြင်း',
      icon: <Table2 className="size-4 text-blue-500" />,
    },
    {
      id: 'context-menu',
      label: 'Right-Click Context Menu',
      mmLabel: 'ညာကလစ် Menu & ဇော်ဂျီ',
      icon: <MousePointerClick className="size-4 text-purple-500" />,
    },
    {
      id: 'ai-translate',
      label: 'AI Auto-Translate',
      mmLabel: 'AI ဘာသာပြန်စနစ်',
      icon: <Sparkles className="size-4 text-amber-500" />,
    },
    {
      id: 'qa-linter',
      label: 'QA Linter & Scorecard',
      mmLabel: 'အရည်အသွေးစစ်ဆေးခြင်း',
      icon: <Activity className="size-4 text-rose-500" />,
    },
    {
      id: 'shortcuts',
      label: 'Keyboard Shortcuts',
      mmLabel: 'ဖြတ်လမ်းကီးများ',
      icon: <Keyboard className="size-4 text-cyan-500" />,
    },
  ];

  const filteredTabs = tabs.filter(
    t =>
      !searchQuery ||
      t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.mmLabel.includes(searchQuery)
  );

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl sm:max-w-5xl h-[90vh] sm:h-[86vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 py-3.5 border-b border-border bg-card/50 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <BookOpen className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                User Guide & Documentation
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal border-primary/30 text-primary">
                  Interactive Visual Guide
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                အသေးစိတ်အသုံးပြုနည်းလမ်းညွှန်နှင့် ရှင်းလင်းချက်များ
              </DialogDescription>
            </div>
          </div>

          <div className="w-48 sm:w-60 mr-8 hidden sm:block">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search guide (ရှာဖွေရန်)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-7.5 pl-8 pr-2.5 text-xs rounded-lg bg-background"
              />
            </div>
          </div>
        </DialogHeader>

        {/* Body Layout: Left Sidebar Tabs + Right Scrollable Guide */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Navigation Bar / Sidebar */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-muted/20 p-2 md:p-3 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto">
            {filteredTabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all shrink-0 md:w-full cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span className={`shrink-0 ${isActive ? 'text-primary-foreground' : ''}`}>
                    {tab.icon}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{tab.label}</span>
                    <span
                      className={`text-[10px] truncate ${
                        isActive ? 'text-primary-foreground/80' : 'text-muted-foreground/70'
                      }`}
                    >
                      {tab.mmLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Guide Content Viewer */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {activeTab === 'overview' && <OverviewGuide />}
            {activeTab === 'editing' && <EditingGuide />}
            {activeTab === 'context-menu' && <ContextMenuGuide />}
            {activeTab === 'ai-translate' && <AiTranslateGuide />}
            {activeTab === 'qa-linter' && <QaLinterGuide />}
            {activeTab === 'shortcuts' && <ShortcutsGuide />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* =========================================================================
   Tab 1: Getting Started & Formats (ဖိုင်များထည့်သွင်းခြင်းနှင့် Formats)
   ========================================================================= */
function OverviewGuide() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
            Step 1
          </Badge>
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            Getting Started & Supported File Formats
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          ဖိုင်များအား အလွယ်တကူ drag-and-drop ပြုလုပ်၍ စတင်နိုင်ပြီး Flutter ARB အပါအဝင် formats 10+ မျိုးကို အပြန်အလှန် (Roundtrip) အသုံးပြုနိုင်ပါသည်။
        </p>
      </div>

      {/* Visual Annotated Mockup: Landing Hero */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs relative overflow-hidden">
        <div className="text-[11px] font-semibold text-muted-foreground mb-3 flex items-center justify-between">
          <span>VISUAL GUIDE: LANDING PAGE UPLOAD AREA</span>
          <span className="text-[10px] text-primary">Hover or tap numbered pins for instructions</span>
        </div>

        {/* Mockup UI */}
        <div className="border-2 border-dashed border-primary/40 rounded-xl bg-primary/5 p-6 text-center relative flex flex-col items-center justify-center min-h-[220px]">
          {/* Annotation Pin 1: Drop Area Ring */}
          <div className="absolute inset-2 border-2 border-rose-500 rounded-lg pointer-events-none opacity-80 animate-pulse" />
          <div className="absolute top-3 left-3 bg-rose-600 text-white rounded-full size-6 flex items-center justify-center font-bold text-xs shadow-md">
            1
          </div>

          <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
            <Upload className="size-5" />
          </div>
          <h4 className="text-sm font-bold text-foreground">
            Drag & drop your translation files here
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Or click to browse files from your computer (JSON, ARB, Excel, CSV, YAML, XML, Strings)
          </p>

          {/* Supported Format Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 max-w-md relative">
            {/* Annotation Pin 2: Format Pills */}
            <div className="absolute -top-3 -right-2 bg-amber-500 text-white rounded-full size-6 flex items-center justify-center font-bold text-xs shadow-md z-10">
              2
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/15 text-emerald-600 font-semibold">.jsonlink</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-primary/15 text-primary font-semibold">JSON (.json)</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-semibold ring-1 ring-cyan-500/40">
              Flutter ARB (.arb)
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/15 text-emerald-600">Excel (.xlsx)</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/15 text-blue-600">CSV (.csv)</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/15 text-purple-600">Android (.xml)</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/15 text-amber-600">iOS (.strings)</span>
          </div>
        </div>

        {/* Explanatory Step Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border">
            <span className="bg-rose-600 text-white rounded-full size-5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </span>
            <div>
              <h5 className="text-xs font-bold text-foreground">
                Drop Multiple Language Files (ဖိုင်များဆွဲထည့်ပါ)
              </h5>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Drag multiple files together (e.g. <code className="font-mono text-primary">en.json</code> and <code className="font-mono text-primary">my.json</code>, or Flutter <code className="font-mono text-primary">app_en.arb</code> and <code className="font-mono text-primary">app_my.arb</code>). They automatically align side-by-side!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border">
            <span className="bg-amber-500 text-white rounded-full size-5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </span>
            <div>
              <h5 className="text-xs font-bold text-foreground">
                Flutter ARB Support (Flutter အသုံးပြုသူများအတွက်)
              </h5>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Full 2-way Flutter ARB support. Preserves <code className="font-mono text-cyan-600 dark:text-cyan-400">@key</code> descriptions, placeholders, and allows 1-click single <code className="font-mono text-cyan-600 dark:text-cyan-400">app_lang.arb</code> download from column headers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   Tab 2: Spreadsheet & Editing (ဇယားကွက်နှင့် စာသားပြင်ဆင်ခြင်း)
   ========================================================================= */
function EditingGuide() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">
            Step 2
          </Badge>
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            Spreadsheet Navigation & Cell Editing
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Excel သဖွယ် Formula Bar နှင့် Inline Editing ဖြင့် လျင်မြန်စွာ ပြင်ဆင်နိုင်ပုံ
        </p>
      </div>

      {/* Visual Annotated Mockup: Spreadsheet & Formula Bar */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs relative">
        <div className="text-[11px] font-semibold text-muted-foreground mb-3 flex items-center justify-between">
          <span>VISUAL GUIDE: FORMULA BAR & SPREADSHEET ROW</span>
          <span className="text-[10px] text-primary">Arrow markers highlight primary click zones</span>
        </div>

        {/* Formula Bar Simulation */}
        <div className="border border-border rounded-lg bg-background p-2 flex items-center gap-2 mb-3 relative">
          <div className="absolute -top-3 left-4 bg-rose-600 text-white rounded-full size-5 flex items-center justify-center font-bold text-[10px] shadow z-10">
            1
          </div>
          <span className="font-mono text-xs font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 shrink-0">
            fx
          </span>
          <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border shrink-0">
            C2 [my]
          </span>
          <div className="flex-1 text-xs font-mono text-foreground truncate bg-muted/30 px-2 py-1 rounded border border-border/60">
            ကြိုဆိုပါသည် {`{username}`}!
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
            <span>Enter to save · Esc to cancel</span>
          </div>
        </div>

        {/* Table Simulation */}
        <div className="border border-border rounded-lg overflow-hidden bg-background">
          <div className="grid grid-cols-12 bg-muted/60 text-[11px] font-bold text-muted-foreground border-b border-border py-1.5 px-3">
            <span className="col-span-1">#</span>
            <span className="col-span-3">Key</span>
            <span className="col-span-4">English (en)</span>
            <span className="col-span-4 flex items-center justify-between">
              <span>Myanmar (my)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-600 px-1 rounded">Unicode</span>
            </span>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-12 text-xs py-2 px-3 border-b border-border/50 items-center hover:bg-muted/20">
            <span className="col-span-1 font-mono text-muted-foreground">1</span>
            <span className="col-span-3 font-mono font-medium text-foreground">app.title</span>
            <span className="col-span-4 text-foreground">JSON Link Studio</span>
            <span className="col-span-4 text-foreground">ဂျေစန် လင့်ခ် စတူဒီယို</span>
          </div>

          {/* Row 2 (Active/Target) */}
          <div className="grid grid-cols-12 text-xs py-2 px-3 items-center bg-primary/5 relative">
            <span className="col-span-1 font-mono text-primary font-bold">2</span>
            <span className="col-span-3 font-mono font-medium text-foreground">welcome.message</span>
            <span className="col-span-4 text-foreground">Welcome {`{username}`}!</span>
            
            {/* Active Cell with Red Ring Annotation */}
            <div className="col-span-4 relative">
              <div className="p-1 rounded ring-2 ring-rose-500 bg-background shadow-xs flex items-center justify-between">
                <span className="text-foreground">ကြိုဆိုပါသည် {`{username}`}!</span>
                <span className="size-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="absolute -top-3 -right-2 bg-rose-600 text-white rounded-full size-5 flex items-center justify-center font-bold text-[10px] shadow z-10">
                2
              </div>
            </div>
          </div>
        </div>

        {/* Steps Explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border">
            <span className="bg-rose-600 text-white rounded-full size-5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </span>
            <div>
              <h5 className="text-xs font-bold text-foreground">
                Formula Bar (fx) Editing
              </h5>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Click any cell to inspect or edit long texts in the full-width Formula Bar above. Perfect for multiline strings and variable formatting.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border">
            <span className="bg-rose-600 text-white rounded-full size-5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </span>
            <div>
              <h5 className="text-xs font-bold text-foreground">
                Double-Click Direct Editing (တိုက်ရိုက်ပြင်ဆင်ခြင်း)
              </h5>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Double-click any cell or press <kbd className="px-1 py-0.5 bg-muted rounded border text-[10px]">Enter</kbd> to edit inline. Press <kbd className="px-1 py-0.5 bg-muted rounded border text-[10px]">Tab</kbd> to jump to the next language column!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   Tab 3: Right-Click Context Menu (ညာကလစ် Context Menu)
   ========================================================================= */
function ContextMenuGuide() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs">
            Step 3
          </Badge>
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            Right-Click Cell Context Menu & Font Conversion
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          မည်သည့် cell ကိုမဆို Right-Click (ညာကလစ်) နှိပ်၍ Copy, Paste, Zawgyi ⇄ Unicode convert နှင့် 1-Click Revert လုပ်ဆောင်နိုင်ပုံ
        </p>
      </div>

      {/* Visual Annotated Mockup: Context Menu Floating Popup */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs relative">
        <div className="text-[11px] font-semibold text-muted-foreground mb-3 flex items-center justify-between">
          <span>VISUAL GUIDE: RIGHT-CLICK CELL ACTIONS</span>
          <span className="text-[10px] text-rose-500 font-medium">Right-click any translation cell</span>
        </div>

        {/* Simulation Grid with Floating Dropdown */}
        <div className="relative border border-border rounded-lg bg-background p-4 min-h-[260px] flex items-center justify-center">
          {/* Background blurred cell */}
          <div className="absolute top-6 left-6 p-2 rounded border border-primary/40 bg-primary/5 text-xs font-mono">
            <span>auth.login_button: </span>
            <span className="text-primary font-semibold">အကောင့်ဝင်ရန်</span>
          </div>

          {/* Context Menu Mockup */}
          <div className="w-64 rounded-xl border border-border bg-popover p-1.5 shadow-xl text-xs space-y-0.5 relative z-20">
            {/* Header label */}
            <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Cell Actions</span>
              <span className="font-mono text-primary font-semibold">auth.login_button</span>
            </div>

            {/* Copy Item */}
            <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
              <span className="flex items-center gap-2 text-foreground">
                <Copy className="size-3.5 text-blue-500" /> Copy cell text
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">Cmd+C</span>
            </div>

            {/* Paste Item */}
            <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
              <span className="flex items-center gap-2 text-foreground">
                <Download className="size-3.5 text-emerald-500" /> Paste from clipboard
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">Cmd+V</span>
            </div>

            {/* Revert Cell: Highlighted Target 1 */}
            <div className="relative">
              <div className="flex items-center justify-between px-2 py-1.5 rounded bg-rose-500/10 border border-rose-500/40 text-rose-600 dark:text-rose-400 font-semibold cursor-pointer">
                <span className="flex items-center gap-2">
                  <RotateCcw className="size-3.5 text-rose-500" /> Revert to original value
                </span>
                <span className="size-2 rounded-full bg-rose-500 animate-ping" />
              </div>
              <div className="absolute -right-3 -top-2 bg-rose-600 text-white rounded-full size-5 flex items-center justify-center font-bold text-[10px] shadow z-30">
                1
              </div>
            </div>

            {/* Zawgyi Convert: Highlighted Target 2 */}
            <div className="relative mt-1">
              <div className="flex items-center justify-between px-2 py-1.5 rounded bg-amber-500/10 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-semibold cursor-pointer">
                <span className="flex items-center gap-2">
                  <Languages className="size-3.5 text-amber-500" /> Convert Zawgyi ➔ Unicode
                </span>
                <Badge variant="warning" className="text-[9px] py-0 px-1">Rabbit</Badge>
              </div>
              <div className="absolute -right-3 -top-2 bg-amber-500 text-white rounded-full size-5 flex items-center justify-center font-bold text-[10px] shadow z-30">
                2
              </div>
            </div>

            {/* AI Translate Row */}
            <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-violet-600 dark:text-violet-400 font-medium">
              <span className="flex items-center gap-2">
                <Sparkles className="size-3.5" /> AI Translate this row
              </span>
            </div>
          </div>
        </div>

        {/* Explanations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border">
            <span className="bg-rose-600 text-white rounded-full size-5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </span>
            <div>
              <h5 className="text-xs font-bold text-foreground">
                1-Click Revert Cell (မူလတန်ဖိုးသို့ ပြန်ထားခြင်း)
              </h5>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                If you made a typo or want to undo changes to a specific cell, right-click and pick "Revert to original value" to instantly restore the original loaded file text.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500 text-white rounded-full size-5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
            2
          </div>
          <div>
            <h5 className="text-xs font-bold text-foreground">
              Smart Zawgyi ⇄ Unicode Converter (ဇော်ဂျီ ⇄ ယူနီကုဒ်)
            </h5>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Real-time detection highlights Zawgyi fonts. Converts with 100% fidelity using the lossless Rabbit algorithm without breaking placeholder variables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   Tab 4: AI Auto-Translate & Glossary (AI ဘာသာပြန်စနစ်)
   ========================================================================= */
function AiTranslateGuide() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
            Step 4
          </Badge>
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            AI Auto-Translate & Variable Protection
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          OpenRouter API (BYOK) ဖြင့် မပြည့်စုံသေးသော (Missing) စာသားများကို Variable မပျက်စေဘဲ အလိုအလျောက် ဘာသာပြန်ဆိုပုံ
        </p>
      </div>

      {/* Visual Annotated Mockup: AI Translation Dialog */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs relative">
        <div className="text-[11px] font-semibold text-muted-foreground mb-3 flex items-center justify-between">
          <span>VISUAL GUIDE: AI TRANSLATION MODAL CONTROLS</span>
          <span className="text-[10px] text-primary">Open via Toolbar "AI Translate" or Cmd+K</span>
        </div>

        <div className="border border-border rounded-xl bg-background p-4 space-y-3.5">
          {/* Scope selection toggle */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-medium text-foreground">Translation Scope</span>
            <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5 relative">
              {/* Highlight Target 1: Missing Keys Only */}
              <button className="px-2.5 py-1 text-xs font-bold rounded-md bg-primary text-primary-foreground shadow-xs">
                Missing Keys Only (အသစ်များသာ)
              </button>
              <button className="px-2.5 py-1 text-xs font-medium text-muted-foreground">
                All Rows (အကုန်လုံး)
              </button>
              <div className="absolute -top-3 -right-2 bg-rose-600 text-white rounded-full size-5 flex items-center justify-center font-bold text-[10px] shadow z-10">
                1
              </div>
            </div>
          </div>

          {/* Model & Variable notice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg border border-border bg-card">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">AI Model</span>
              <p className="text-xs font-bold text-foreground mt-0.5">Google: Gemini 2.5 Flash</p>
              <p className="text-[10px] text-muted-foreground">Fast, ultra low cost, highly accurate</p>
            </div>

            {/* Highlight Target 2: Protected Variables */}
            <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 relative">
              <span className="text-[10px] text-emerald-600 uppercase font-semibold flex items-center gap-1">
                <ShieldCheck className="size-3" /> Shielded Variables
              </span>
              <p className="text-xs font-mono text-foreground font-bold mt-0.5">{`{user}`}, %s, {`{{count}}`}</p>
              <p className="text-[10px] text-muted-foreground">Interpolation parameters never corrupted</p>
              <div className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full size-5 flex items-center justify-center font-bold text-[10px] shadow z-10">
                2
              </div>
            </div>
          </div>

          {/* BYOK Key Field */}
          <div className="p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">OpenRouter API Key (BYOK)</p>
              <p className="text-[10px] text-muted-foreground">
                Key stays 100% in your browser. Encrypted with AES-GCM 256-bit client-side.
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">sk-or-v1-••••</Badge>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border">
            <span className="bg-rose-600 text-white rounded-full size-5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </span>
            <div>
              <h5 className="text-xs font-bold text-foreground">
                Missing Keys Only (ကျန်ရှိသော အကွက်များသာ ဘာသာပြန်ခြင်း)
              </h5>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                By default, AI only translates empty cells. Your existing human translations are never overwritten.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border">
            <span className="bg-rose-600 text-white rounded-full size-5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </span>
            <div>
              <h5 className="text-xs font-bold text-foreground">
                Termbase Glossary & Variable Protection
              </h5>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Brand names defined in Glossary ("Keep Original") and code interpolation variables are protected automatically during prompt generation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   Tab 5: QA Linter & Scorecard (အရည်အသွေးစစ်ဆေးခြင်း)
   ========================================================================= */
function QaLinterGuide() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-xs">
            Step 5
          </Badge>
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            QA Consistency Linter & Missing Filters
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Missing ဖြစ်နေသော စာကြောင်းများကို Filter နှိပ်၍ တစ်ချက်တည်း ကြည့်ရှုနိုင်ခြင်းနှင့် QA Linter ဖြင့် စစ်ဆေးပြင်ဆင်ပုံ
        </p>
      </div>

      {/* Visual Annotated Mockup: Missing Pill Filter & Linter Panel */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs relative">
        <div className="text-[11px] font-semibold text-muted-foreground mb-3 flex items-center justify-between">
          <span>VISUAL GUIDE: TOOLBAR FILTERS & 1-CLICK FIX</span>
          <span className="text-[10px] text-amber-500 font-medium">Clear contrast between All and Missing</span>
        </div>

        {/* Toolbar Simulation */}
        <div className="border border-border rounded-lg bg-background p-2.5 flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">Filter:</span>
            {/* Filter Pill: High contrast styling simulation */}
            <div className="flex items-center rounded-md border border-border/80 p-0.5 bg-muted/60 h-7 relative">
              <button className="px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground">
                All
              </button>
              {/* Target 1: Missing Filter Pill */}
              <button className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-500 text-white shadow-xs">
                Missing
              </button>
              <div className="absolute -top-3 -right-2 bg-rose-600 text-white rounded-full size-5 flex items-center justify-center font-bold text-[10px] shadow z-10">
                1
              </div>
            </div>
          </div>

          {/* Linter & Scorecard Buttons */}
          <div className="flex items-center gap-2">
            {/* Target 2: Linter Button */}
            <div className="relative">
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1.5">
                <Sparkles className="size-3 text-amber-500" />
                <span>Linter</span>
                <span className="text-[10px] bg-amber-500/15 text-amber-600 px-1.5 rounded-full font-bold">
                  3
                </span>
              </Button>
              <div className="absolute -top-3 -right-2 bg-rose-600 text-white rounded-full size-5 flex items-center justify-center font-bold text-[10px] shadow z-10">
                2
              </div>
            </div>

            <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1.5">
              <Activity className="size-3 text-emerald-500" />
              <span>Scorecard</span>
            </Button>
          </div>
        </div>

        {/* Linter Drawer Simulation */}
        <div className="border border-border rounded-lg bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-xs font-bold text-foreground">Detected Quality Issues (3)</span>
            {/* Target 3: Fix All Whitespace Button */}
            <div className="relative">
              <Button size="sm" className="h-6.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                <CheckCircle2 className="size-3" /> Fix All Whitespace
              </Button>
              <div className="absolute -top-2.5 -right-2 bg-rose-600 text-white rounded-full size-5 flex items-center justify-center font-bold text-[10px] shadow z-10">
                3
              </div>
            </div>
          </div>

          <div className="p-2 rounded bg-background border border-border text-xs flex items-center justify-between">
            <span className="font-mono text-muted-foreground">nav.settings: Trailing whitespace in 'my'</span>
            <Badge variant="outline" className="text-[10px] text-amber-600">Auto-fixable</Badge>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border border-border">
            <span className="bg-rose-600 text-white rounded-full size-5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </span>
            <div>
              <h5 className="text-xs font-bold text-foreground">Missing Filter (မပြည့်သေးသည်များ)</h5>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Click "Missing" to instantly filter only rows that lack translations. Solid amber pill clearly confirms active mode.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-600 text-white rounded-full size-5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
            2
          </div>
          <div>
            <h5 className="text-xs font-bold text-foreground">QA Linter Scans (အရည်အသွေးစစ်)</h5>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Audits whitespaces, variable mismatches, duplicate values, and text expansion &gt; 40%.
            </p>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-600 text-white rounded-full size-5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
            3
          </div>
          <div>
            <h5 className="text-xs font-bold text-foreground">1-Click Auto Fix (တချက်တည်းပြင်ရန်)</h5>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Click "Fix All Whitespace" to trim leading and trailing spaces across every language column automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   Tab 6: Keyboard Shortcuts (ဖြတ်လမ်းကီးများ)
   ========================================================================= */
function ShortcutsGuide() {
  const shortcuts = [
    { key: 'Cmd / Ctrl + K', action: 'Open Command Palette (ရှာဖွေရန် / အမိန့်များ)', category: 'Navigation' },
    { key: 'Cmd / Ctrl + H', action: 'Find & Replace Across Languages (ရှာပြီး အစားထိုးရန်)', category: 'Editing' },
    { key: 'Cmd / Ctrl + Z', action: 'Undo last change (ပြန်ပြင်ရန်)', category: 'History' },
    { key: 'Cmd / Ctrl + Y', action: 'Redo change (ရှေ့သို့ပြန်သွားရန်)', category: 'History' },
    { key: 'Arrow Keys', action: 'Navigate between spreadsheet cells (အကွက်ရွှေ့ရန်)', category: 'Grid' },
    { key: 'Enter / F2', action: 'Edit selected cell (စာသားပြင်ရန်)', category: 'Editing' },
    { key: 'Tab / Shift+Tab', action: 'Move to next / previous column (နောက်အကွက်သို့)', category: 'Grid' },
    { key: 'Escape', action: 'Cancel cell edit / Close dialog (ပိတ်ရန်)', category: 'General' },
    { key: 'Right-Click Cell', action: 'Cell Context Menu: Copy, Paste, Zawgyi ⇄ Unicode, Revert', category: 'Mouse' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20 text-xs">
            Step 6
          </Badge>
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            Keyboard Shortcuts & Pro Tips
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          လုပ်ငန်းပိုမိုမြန်ဆန်စေရန် ကီးဘုတ်ဖြတ်လမ်းများနှင့် အကြံပြုချက်များ
        </p>
      </div>

      {/* Shortcut Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="grid grid-cols-12 bg-muted/60 px-4 py-2 text-xs font-bold text-muted-foreground border-b border-border">
          <span className="col-span-4 sm:col-span-3">Shortcut</span>
          <span className="col-span-6 sm:col-span-7">Action & Description</span>
          <span className="col-span-2 hidden sm:block text-right">Category</span>
        </div>

        <div className="divide-y divide-border/60">
          {shortcuts.map(s => (
            <div key={s.key} className="grid grid-cols-12 px-4 py-2.5 text-xs items-center hover:bg-muted/20">
              <div className="col-span-4 sm:col-span-3">
                <kbd className="px-2 py-1 rounded bg-muted border border-border font-mono text-[11px] font-semibold text-foreground shadow-2xs">
                  {s.key}
                </kbd>
              </div>
              <span className="col-span-6 sm:col-span-7 text-foreground font-medium">
                {s.action}
              </span>
              <span className="col-span-2 hidden sm:block text-right text-[11px] text-muted-foreground">
                {s.category}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pro Tips Box */}
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 flex items-start gap-3">
        <Sparkles className="size-4.5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-foreground">Pro Tip: Single Flutter ARB & JSON Download</h4>
          <p className="text-muted-foreground leading-relaxed">
            Did you know? You can click the dropdown arrow on any language column header (e.g. <code className="font-mono text-cyan-600 dark:text-cyan-400">my</code>) to download only that language as <code className="font-mono text-cyan-600 dark:text-cyan-400">app_my.arb</code> or <code className="font-mono text-primary">my.json</code> in 1 click!
          </p>
        </div>
      </div>
    </div>
  );
}
