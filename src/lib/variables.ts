/**
 * Variable extraction, tokenization and validation for i18n localization.
 *
 * Facade adapter delegating to the unified Translation Quality Engine (translationEngine.ts).
 * Maintained for backward compatibility with existing callers.
 */

export type { TokenPart, VariableValidationResult } from './translationEngine';

export {
  extractVariables,
  tokenizeVariables,
  validateVariables,
  isPlaceholderOnly,
  isEffectivelyMissing,
} from './translationEngine';
