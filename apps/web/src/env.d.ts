interface ImportMetaEnv {
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
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
