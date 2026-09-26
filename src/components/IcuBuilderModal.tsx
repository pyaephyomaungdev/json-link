import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Code2, Sparkles, Plus, Trash2, Check, Copy } from 'lucide-react';
import { evaluateIcuMessage } from '@/lib/icuEvaluator';

interface IcuBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue?: string;
  targetKey?: string;
  targetField?: string;
  onInsert: (icuString: string) => void;
}

type IcuMode = 'plural' | 'select';

interface PluralClause {
  category: string; // e.g. '=0', 'one', 'other', 'few', 'many'
  text: string;
}

interface SelectClause {
  caseValue: string; // e.g. 'female', 'male', 'other'
  text: string;
}

export const IcuBuilderModal: React.FC<IcuBuilderModalProps> = ({
  isOpen,
  onClose,
  initialValue = '',
  targetKey = '',
  targetField = '',
  onInsert,
}) => {
  const [mode, setMode] = useState<IcuMode>('plural');
  const [varName, setVarName] = useState<string>('count');
  const [prefixText, setPrefixText] = useState<string>('');
  const [suffixText, setSuffixText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Plural clauses
  const [pluralClauses, setPluralClauses] = useState<PluralClause[]>([
    { category: '=0', text: 'no items' },
    { category: 'one', text: '1 item' },
    { category: 'other', text: '# items' },
  ]);

  // Select clauses
  const [selectClauses, setSelectClauses] = useState<SelectClause[]>([
    { caseValue: 'female', text: 'She liked your post.' },
    { caseValue: 'male', text: 'He liked your post.' },
    { caseValue: 'other', text: 'They liked your post.' },
  ]);

  // Sandbox test value
  const [testNumber, setTestNumber] = useState<number>(0);
  const [testChoice, setTestChoice] = useState<string>('female');

  // Reset or initialize state
  useEffect(() => {
    if (isOpen) {
      if (initialValue && initialValue.includes('select')) {
        setMode('select');
        setVarName('gender');
      } else {
        setMode('plural');
        setVarName('count');
      }
    }
  }, [isOpen, initialValue]);

  // Build generated ICU expression
  const generatedIcu = useMemo(() => {
    const trimmedVar = varName.trim() || 'count';
    const prefix = prefixText ? `${prefixText}` : '';
    const suffix = suffixText ? `${suffixText}` : '';

    if (mode === 'plural') {
      const clausesStr = pluralClauses
        .filter(c => c.category.trim())
        .map(c => `${c.category.trim()}{${c.text}}`)
        .join(' ');
      return `${prefix}{${trimmedVar}, plural, ${clausesStr}}${suffix}`;
    } else {
      const clausesStr = selectClauses
        .filter(c => c.caseValue.trim())
        .map(c => `${c.caseValue.trim()}{${c.text}}`)
        .join(' ');
      return `${prefix}{${trimmedVar}, select, ${clausesStr}}${suffix}`;
    }
  }, [mode, varName, prefixText, suffixText, pluralClauses, selectClauses]);

  // Live evaluation test result
  const testEvaluated = useMemo(() => {
    try {
      const params = mode === 'plural' ? { [varName.trim() || 'count']: testNumber } : { [varName.trim() || 'gender']: testChoice };
      const evalRes = evaluateIcuMessage(generatedIcu, params);
      return evalRes.formattedText;
    } catch {
      return generatedIcu;
    }
  }, [generatedIcu, mode, varName, testNumber, testChoice]);

  // Handlers for Plural
  const handleUpdatePluralClause = (index: number, field: 'category' | 'text', val: string) => {
    setPluralClauses(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleAddPluralClause = () => {
    setPluralClauses(prev => [...prev, { category: 'many', text: '# items' }]);
  };

  const handleRemovePluralClause = (index: number) => {
    if (pluralClauses.length <= 1) return;
    setPluralClauses(prev => prev.filter((_, i) => i !== index));
  };

  // Handlers for Select
  const handleUpdateSelectClause = (index: number, field: 'caseValue' | 'text', val: string) => {
    setSelectClauses(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleAddSelectClause = () => {
    setSelectClauses(prev => [...prev, { caseValue: 'custom', text: 'custom text' }]);
  };

  const handleRemoveSelectClause = (index: number) => {
    if (selectClauses.length <= 1) return;
    setSelectClauses(prev => prev.filter((_, i) => i !== index));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedIcu);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleApply = () => {
    onInsert(generatedIcu);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Code2 className="size-4.5 text-primary" />
            <span>Visual ICU Message Builder</span>
            {targetKey && (
              <Badge variant="outline" className="text-[10px] font-mono font-normal">
                {targetKey} {targetField ? `(${targetField})` : ''}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Generate error-free ICU plural and select expressions with live testing and interactive clauses.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 text-xs">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <button
              type="button"
              onClick={() => {
                setMode('plural');
                if (varName === 'gender') setVarName('count');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                mode === 'plural'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Plural Format (Numbers & Quantities)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('select');
                if (varName === 'count') setVarName('gender');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                mode === 'select'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Select Format (Gender & Variants)
            </button>
          </div>

          {/* Variable & Surrounding Text */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                Prefix Text (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g. You have "
                value={prefixText}
                onChange={e => setPrefixText(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                Variable Name
              </label>
              <Input
                type="text"
                placeholder={mode === 'plural' ? 'count' : 'gender'}
                value={varName}
                onChange={e => setVarName(e.target.value)}
                className="h-8 text-xs font-mono bg-background"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                Suffix Text (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g. in your inbox."
                value={suffixText}
                onChange={e => setSuffixText(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>

          {/* Clauses Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                {mode === 'plural' ? 'Plural Cases' : 'Select Choices'}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={mode === 'plural' ? handleAddPluralClause : handleAddSelectClause}
                className="h-7 text-xs gap-1 cursor-pointer"
              >
                <Plus className="size-3" />
                <span>Add Case</span>
              </Button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {mode === 'plural' ? (
                pluralClauses.map((clause, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={clause.category}
                      onChange={e => handleUpdatePluralClause(idx, 'category', e.target.value)}
                      placeholder="=0, one, other..."
                      className="w-24 h-8 text-xs font-mono font-medium bg-background shrink-0"
                    />
                    <Input
                      type="text"
                      value={clause.text}
                      onChange={e => handleUpdatePluralClause(idx, 'text', e.target.value)}
                      placeholder="Rendered message text (# replaced by count)"
                      className="h-8 text-xs bg-background flex-1"
                    />
                    <button
                      type="button"
                      disabled={pluralClauses.length <= 1}
                      onClick={() => handleRemovePluralClause(idx)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded disabled:opacity-30 cursor-pointer"
                      title="Remove case"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                selectClauses.map((clause, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={clause.caseValue}
                      onChange={e => handleUpdateSelectClause(idx, 'caseValue', e.target.value)}
                      placeholder="female, male, other..."
                      className="w-28 h-8 text-xs font-mono font-medium bg-background shrink-0"
                    />
                    <Input
                      type="text"
                      value={clause.text}
                      onChange={e => handleUpdateSelectClause(idx, 'text', e.target.value)}
                      placeholder="Rendered message text for this choice"
                      className="h-8 text-xs bg-background flex-1"
                    />
                    <button
                      type="button"
                      disabled={selectClauses.length <= 1}
                      onClick={() => handleRemoveSelectClause(idx)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded disabled:opacity-30 cursor-pointer"
                      title="Remove case"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            {mode === 'plural' && (
              <p className="text-[11px] text-muted-foreground">
                Tip: Use <code className="bg-muted px-1 py-0.5 rounded font-mono">#</code> inside plural text to automatically display the formatted number.
              </p>
            )}
          </div>

          {/* Generated Expression Preview */}
          <div className="space-y-1.5 border-t border-border pt-3">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>Generated ICU Expression:</span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-2.5 bg-muted/60 border border-border rounded-lg font-mono text-xs break-all select-all text-foreground font-medium">
              {generatedIcu}
            </div>
          </div>

          {/* Interactive Live Testing Sandbox */}
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                <span>Live Test Sandbox:</span>
              </span>
              <div className="flex items-center gap-2">
                {mode === 'plural' ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground font-mono">{varName || 'count'} =</span>
                    <input
                      type="number"
                      value={testNumber}
                      onChange={e => setTestNumber(Number(e.target.value) || 0)}
                      className="w-16 h-7 px-2 text-xs bg-background border border-input rounded font-mono"
                    />
                    <div className="flex gap-1 ml-1">
                      {[0, 1, 2, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setTestNumber(n)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer border ${
                            testNumber === n
                              ? 'bg-primary text-primary-foreground border-primary font-bold'
                              : 'bg-background border-border text-foreground hover:bg-muted'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground font-mono">{varName || 'gender'} =</span>
                    <select
                      value={testChoice}
                      onChange={e => setTestChoice(e.target.value)}
                      className="h-7 px-2 text-xs bg-background border border-input rounded font-medium cursor-pointer"
                    >
                      {selectClauses.map((c, i) => (
                        <option key={i} value={c.caseValue}>{c.caseValue}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="p-2 bg-background border border-border rounded font-sans text-xs text-foreground font-medium flex items-center gap-2">
              <span className="text-muted-foreground text-[11px]">Renders as:</span>
              <span className="text-primary font-semibold">{testEvaluated}</span>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Cancel
          </Button>

          <Button type="button" size="sm" onClick={handleApply} className="h-8 text-xs font-semibold gap-1.5 cursor-pointer">
            <Check className="size-3.5" />
            <span>Apply to Cell</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
