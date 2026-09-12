import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Variable, Hash } from 'lucide-react';
import { TranslationItem } from '@/types';
import { evaluateIcuMessage, extractVariables, isIcuPlural } from '@/lib/icuEvaluator';

interface IcuTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TranslationItem[];
  languages: string[];
}

const SAMPLE_TEMPLATES = [
  {
    name: 'Item Pluralizer',
    template: '{count, plural, =0{No items} one{1 item} other{# items}}',
  },
  {
    name: 'Cart with Username',
    template: '{username} has {count, plural, =0{no items} one{1 item} other{# items}} in their cart.',
  },
  {
    name: 'Notifications',
    template: '{count, plural, =0{You have no new notifications} one{You have 1 new notification} other{You have # new notifications}}',
  },
];

export function IcuTesterModal({
  isOpen,
  onClose,
  items,
  languages,
}: IcuTesterModalProps) {
  const [selectedKey, setSelectedKey] = useState<string>('custom');
  const [customMessage, setCustomMessage] = useState<string>(SAMPLE_TEMPLATES[0].template);
  const [countValue, setCountValue] = useState<number>(1);
  const [customParams, setCustomParams] = useState<Record<string, string>>({
    username: 'John',
    name: 'Alice',
  });

  const activeMessage = useMemo(() => {
    if (selectedKey === 'custom') return customMessage;
    const found = items.find(i => i.key === selectedKey);
    return found ? (found[languages[0]] || found.key) : customMessage;
  }, [selectedKey, customMessage, items, languages]);

  const detectedVars = useMemo(() => {
    return extractVariables(activeMessage);
  }, [activeMessage]);

  const isPluralDetected = useMemo(() => {
    return isIcuPlural(activeMessage);
  }, [activeMessage]);

  const mergedParams = useMemo(() => {
    const p: Record<string, string | number> = { ...customParams, count: countValue };
    return p;
  }, [customParams, countValue]);

  const handleParamChange = (name: string, val: string) => {
    setCustomParams(prev => ({ ...prev, [name]: val }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            ICU Plural & Variable Tester
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Test complex ICU plural forms ({`{count, plural, =0{...} one{...} other{...}}`}) and interpolation placeholders interactively across your languages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Key Selection or Templates */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Source:</span>
              <select
                value={selectedKey}
                onChange={e => setSelectedKey(e.target.value)}
                className="px-2.5 py-1 text-xs bg-muted/40 border border-border rounded-lg outline-none cursor-pointer"
              >
                <option value="custom">Custom Message</option>
                {items.slice(0, 30).map(i => (
                  <option key={i.key} value={i.key}>
                    Key: {i.key}
                  </option>
                ))}
              </select>
            </div>

            {selectedKey === 'custom' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Templates:</span>
                {SAMPLE_TEMPLATES.map(t => (
                  <button
                    key={t.name}
                    onClick={() => setCustomMessage(t.template)}
                    className="text-[11px] px-2 py-0.5 rounded bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border transition-colors cursor-pointer"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message Input if custom */}
          {selectedKey === 'custom' && (
            <div className="space-y-1">
              <textarea
                rows={2}
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="Enter ICU plural message..."
                className="w-full p-2.5 text-xs font-mono bg-muted/20 border border-border rounded-lg outline-none focus:border-primary resize-y"
              />
            </div>
          )}

          {/* Interactive Controllers (Count & Parameters) */}
          <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Variable className="size-3.5 text-primary" />
              <span>Interactive Test Parameters</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Count Stepper / Slider */}
              <div className="p-2.5 rounded-lg border border-border bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    <Hash className="size-3 text-cyan-500" />
                    <span>Count variable:</span>
                  </span>
                  <span className="font-mono font-bold text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">
                    {countValue}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={countValue}
                    onChange={e => setCountValue(Number(e.target.value))}
                    className="flex-1 accent-primary cursor-pointer"
                  />
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 5, 21].map(n => (
                      <button
                        key={n}
                        onClick={() => setCountValue(n)}
                        className={`size-5 rounded text-[10px] font-mono flex items-center justify-center border transition-colors cursor-pointer ${
                          countValue === n
                            ? 'bg-primary text-primary-foreground border-primary font-bold'
                            : 'bg-muted/60 border-border hover:bg-muted'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Other Variables */}
              <div className="space-y-1.5">
                {detectedVars
                  .filter(v => v !== 'count')
                  .map(v => (
                    <div
                      key={v}
                      className="p-2 rounded-lg border border-border bg-muted/20 flex items-center justify-between gap-2"
                    >
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {`{${v}}`}:
                      </span>
                      <input
                        type="text"
                        value={customParams[v] || ''}
                        onChange={e => handleParamChange(v, e.target.value)}
                        placeholder={`Value for ${v}`}
                        className="flex-1 px-2 py-0.5 text-xs bg-background border border-border rounded outline-none"
                      />
                    </div>
                  ))}
                {detectedVars.filter(v => v !== 'count').length === 0 && (
                  <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground italic border border-dashed border-border/80 rounded-lg p-3">
                    No extra string parameters detected
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Live Evaluated Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-500" />
                <span>Live Evaluated Result</span>
              </h4>
              {isPluralDetected && (
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20 text-[10px]">
                  ICU Plural Active
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {languages.map(lang => {
                let msgForLang = activeMessage;
                if (selectedKey !== 'custom') {
                  const found = items.find(i => i.key === selectedKey);
                  msgForLang = (found && found[lang]) || activeMessage;
                }

                const evalResult = evaluateIcuMessage(msgForLang, mergedParams, lang);

                return (
                  <div
                    key={lang}
                    className="p-3 rounded-xl border border-border bg-card shadow-2xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-[10px] uppercase">
                        {lang}
                      </Badge>
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                      {evalResult.formattedText}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
