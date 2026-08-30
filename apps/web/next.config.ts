import type { NextConfig } from 'next';
import path from 'path';

// Map VITE_* env vars → import.meta.env.VITE_* at build time (webpack DefinePlugin)
// Keeps backward-compat with existing Vercel env var names (VITE_SUPABASE_URL, etc.)
function buildViteEnvShim(): Record<string, string> {
  const keys = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_API_BASE_URL',
    'VITE_ZALO_ENABLED',
    'VITE_ZALO_APP_ID',
    'VITE_ZALO_SECRET_KEY',
    'VITE_ZALO_OA_ID',
    'VITE_ZALO_ACCESS_TOKEN',
    'VITE_ZALO_REFRESH_TOKEN',
    'VITE_ZALO_TEMPLATE_ID',
    'VITE_ZALO_AUTO_SEND',
    'VITE_ZALO_PROXY_URL',
  ];
  const obj: Record<string, string> = {};
  for (const k of keys) {
    obj[k] = process.env[k] ?? '';
  }
  return obj;
}

const nextConfig: NextConfig = {
  // postgres uses native bindings — must be excluded from the client bundle
  serverExternalPackages: ['postgres'],

  webpack(config, { webpack }) {
    // 1. Polyfill import.meta.env for all existing VITE_ references in src/
    config.plugins.push(
      new webpack.DefinePlugin({
        'import.meta.env': JSON.stringify(buildViteEnvShim()),
      })
    );

    // 2. Resolve workspace path aliases (same as root tsconfig paths)
    const root = path.resolve(__dirname, '../..');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@domain': path.resolve(root, 'packages/shared/src/domain'),
      '@infra': path.resolve(__dirname, 'src/infrastructure'),
      '@data': path.resolve(root, 'packages/shared/src/data'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@api': path.resolve(root, 'apps/api/src'),
    };

    return config;
  },
};

export default nextConfig;
