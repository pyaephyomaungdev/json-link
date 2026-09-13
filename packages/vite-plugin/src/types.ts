export interface JsonLinkPluginOptions {
  /**
   * Directory containing translation JSON files.
   * @default './src/locales'
   */
  localesDir?: string;

  /**
   * Subpath route on the Vite dev server to host the JSON Link dashboard.
   * @default '/__jsonlink'
   */
  route?: string;

  /**
   * JSON indentation spacing when writing back to disk.
   * @default 2
   */
  indent?: number;

  /**
   * Whether to support nested JSON objects (e.g. { auth: { title: "..." } })
   * @default false
   */
  nested?: boolean;
}

export interface TranslationRecord {
  key: string;
  [languageCode: string]: string;
}

export interface LocalesDataResponse {
  success: boolean;
  localesDir: string;
  languages: string[];
  records: TranslationRecord[];
  error?: string;
}

export interface SaveLocalesRequest {
  records: TranslationRecord[];
  languages?: string[];
}
