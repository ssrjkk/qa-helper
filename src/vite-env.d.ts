/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_MODEL?: string;
  readonly VITE_MAX_TOKENS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
