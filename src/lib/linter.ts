/**
 * Localization Linter & Consistency Checker
 *
 * Facade adapter delegating to the unified Translation Quality Engine (translationEngine.ts).
 * Maintained for backward compatibility with existing callers.
 */

export type {
  LintSeverity,
  LintCategory,
  LintIssue,
  LintReport,
} from './translationEngine';

export {
  runLocalizationLinter,
  fixAllWhitespaceIssues,
} from './translationEngine';
