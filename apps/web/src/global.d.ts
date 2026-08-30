/// <reference types="react" />
/// <reference types="react-dom" />

// Shim for import.meta.env (Vite-style) used across the codebase.
// next.config.ts injects these values via webpack DefinePlugin at build time.
interface ImportMeta {
  readonly env: {
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_ZALO_ENABLED?: string;
    readonly VITE_ZALO_APP_ID?: string;
    readonly VITE_ZALO_SECRET_KEY?: string;
    readonly VITE_ZALO_OA_ID?: string;
    readonly VITE_ZALO_ACCESS_TOKEN?: string;
    readonly VITE_ZALO_REFRESH_TOKEN?: string;
    readonly VITE_ZALO_TEMPLATE_ID?: string;
    readonly VITE_ZALO_AUTO_SEND?: string;
    readonly VITE_ZALO_PROXY_URL?: string;
    readonly MODE?: string;
    readonly DEV?: boolean;
    readonly PROD?: boolean;
    readonly [key: string]: string | boolean | undefined;
  };
}

// Electron bridge (optional, only present in Electron builds)
interface ElectronAPI {
  openDataFolder?: () => void;
  [key: string]: unknown;
}

interface Window {
  electronAPI?: ElectronAPI;
}
