import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { pgTable, text, real, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.resolve(__dirname, '../.env');
let databaseUrl = process.env.DATABASE_URL || '';
let supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zfpsgycfqybgqytjmeck.supabase.co';
let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eUNn1NWvQhljdd2pirtZtw_sLFDHWy7';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const mDb = line.match(/^DATABASE_URL\s*=\s*(.*)$/);
    if (mDb && mDb[1].trim()) databaseUrl = mDb[1].trim().replace(/^["']|["']$/g, '');
    const mUrl = line.match(/^VITE_SUPABASE_URL\s*=\s*(.*)$/);
    if (mUrl && mUrl[1].trim()) supabaseUrl = mUrl[1].trim().replace(/^["']|["']$/g, '');
    const mKey = line.match(/^VITE_SUPABASE_ANON_KEY\s*=\s*(.*)$/);
    if (mKey && mKey[1].trim()) supabaseAnonKey = mKey[1].trim().replace(/^["']|["']$/g, '');
  }
}

console.log('=== GOLAB CLOUD DATA SEED TOOL ===');
console.log('Database URL:', databaseUrl ? '[Configured]' : '[Unset]');
console.log('Supabase URL:', supabaseUrl);

// 1. Load backup data
const defaultCatalogPath = path.resolve(__dirname, '../packages/shared/src/data/backup/defaultCatalog.ts');
const allergenCatalogPath = path.resolve(__dirname, '../packages/shared/src/data/backup/allergenCatalog.ts');
const nhiCatalogPath = path.resolve(__dirname, '../packages/shared/src/data/backup/nhiCatalog.ts');

console.log('Loading backup data files...');

// Sync to Supabase app_storage
async function syncToSupabaseStorage(key, data) {
  if (!supabaseUrl || !supabaseAnonKey) return;
  const cleanUrl = supabaseUrl.replace(/\/+$/, '');
  const headers = {
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates',
    'apikey': supabaseAnonKey,
    'Authorization': 'Bearer ' + supabaseAnonKey
  };

  const payload = {
    key,
    data,
    updated_at: new Date().toISOString()
  };

  try {
    const res = await fetch(cleanUrl + '/rest/v1/app_storage', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      console.log(`✓ [Supabase Storage] Đã đồng bộ bảng [${key}]: ${Array.isArray(data) ? data.length + ' mục' : '1 đối tượng'}`);
    } else {
      console.warn(`! [Supabase Storage] Lỗi đồng bộ [${key}]: HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn(`! [Supabase Storage] Lỗi kết nối [${key}]:`, err.message);
  }
}

async function main() {
  // Run seed
  console.log('\n--- Bắt đầu đồng bộ dữ liệu mẫu lên Cloud Database ---');
  
  // Also run seed-master-catalog if available
  const seedMasterScript = path.resolve(__dirname, 'seed-master-catalog.js');
  if (fs.existsSync(seedMasterScript)) {
    console.log('Chạy seed-master-catalog.js...');
    const { execSync } = await import('child_process');
    try {
      execSync(`node "${seedMasterScript}"`, { stdio: 'inherit' });
    } catch (e) {
      console.warn('Lỗi khi chạy seed-master-catalog:', e.message);
    }
  }

  console.log('\n=== Hoàn tất quá trình Seed dữ liệu lên Cloud ===');
}

main().catch(console.error);
