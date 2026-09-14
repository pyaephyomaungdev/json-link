/**
 * Lightweight ICU MessageFormat & Plural Evaluator
 *
 * Facade adapter delegating to the unified Translation Quality Engine (translationEngine.ts).
 * Maintained for backward compatibility with existing callers.
 */

export type { IcuEvaluationResult } from './translationEngine';

export {
  extractVariableNames as extractVariables,
  isIcuPlural,
  evaluateIcuMessage,
} from './translationEngine';
