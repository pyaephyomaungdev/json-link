export interface TranslationItem {
  key: string;
  description?: string; // Developer context, usage notes, or translator comment
  [lang: string]: string | undefined; // e.g. en: "Retry", my: "ထပ်ကြိုးစားမည်"
}

export interface LanguageMeta {
  code: string;
  name: string;
  flag?: string;
  isRtl?: boolean;
}

export type ExportFormat =
  | 'excel'
  | 'xlsx'
  | 'csv'
  | 'json-zip'
  | 'json-combined'
  | 'yaml-zip'
  | 'android-xml'
  | 'ios-strings'
  | 'typescript-dts';

export interface ExportOptions {
  format: ExportFormat;
  nested: boolean; // if true, unflatten dot notation like auth.login.title -> { auth: { login: { title: "..." } } }
  indent: number; // JSON indent spacing (e.g. 2 spaces)
  includeMissing: boolean; // whether to include empty keys
  prefix?: string;
  filename?: string;
}

export interface ImportSummary {
  totalKeys: number;
  newKeysCount: number;
  languagesDetected: string[];
  sampleKeys: string[];
}

export interface JsonLinkProject {
  format: 'jsonlink';
  version: string;
  name: string;
  updatedAt: string;
  languages: string[];
  items: TranslationItem[];
}
