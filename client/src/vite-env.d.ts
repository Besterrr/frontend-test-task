/// <reference types="vite/client" />

import '@tanstack/react-query';

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      suppressGlobalError?: boolean;
    };
    queryMeta: {
      suppressGlobalError?: boolean;
    };
  }
}
