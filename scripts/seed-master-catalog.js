import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env
const envPath = path.resolve(__dirname, '../.env');
let supabaseUrl = 'https://zfpsgycfqybgqytjmeck.supabase.co';
let supabaseAnonKey = 'sb_publishable_eUNn1NWvQhljdd2pirtZtw_sLFDHWy7';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const matchUrl = line.match(/^VITE_SUPABASE_URL\s*=\s*(.*)$/);
    if (matchUrl && matchUrl[1].trim()) supabaseUrl = matchUrl[1].trim();
    const matchKey = line.match(/^VITE_SUPABASE_ANON_KEY\s*=\s*(.*)$/);
    if (matchKey && matchKey[1].trim()) supabaseAnonKey = matchKey[1].trim();
  }
}

console.log('--- SUPABASE MASTER 182 CATALOG SEED SCRIPT ---');
console.log('Supabase URL:', supabaseUrl);

async function syncTable(key, data) {
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

  const res = await fetch(cleanUrl + '/rest/v1/app_storage', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to sync ${key}: HTTP ${res.status} - ${txt}`);
  }
  console.log(`✓ Đồng bộ thành công bảng [${key}]: ${Array.isArray(data) ? data.length + ' bản ghi' : '1 đối tượng'}`);
  return true;
}

async function verifyTable(key) {
  const cleanUrl = supabaseUrl.replace(/\/+$/, '');
  const headers = {
    'Content-Type': 'application/json',
    'apikey': supabaseAnonKey,
    'Authorization': 'Bearer ' + supabaseAnonKey
  };

  const res = await fetch(cleanUrl + '/rest/v1/app_storage?key=eq.' + encodeURIComponent(key) + '&select=data', {
    method: 'GET',
    headers
  });

  if (!res.ok) {
    throw new Error(`Verify failed for ${key}: HTTP ${res.status}`);
  }

  const rows = await res.json();
  if (Array.isArray(rows) && rows.length > 0) {
    const len = Array.isArray(rows[0].data) ? rows[0].data.length : Object.keys(rows[0].data).length;
    console.log(`✓ Xác thực Cloud DB [${key}]: Hiện có ${len} bản ghi trên Supabase.`);
    return rows[0].data;
  }
  return null;
}

async function run() {
  try {
    // 1. Read master catalog
    const tsFile = path.resolve(__dirname, '../src/data/masterCatalog182.ts');
    const tsContent = fs.readFileSync(tsFile, 'utf8');

    const jsonLike = tsContent
      .replace(/import\s+[\s\S]*?;/g, '')
      .replace(/\/\*\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/export\s+const\s+MASTER_182_CATALOG\s*:\s*CatalogItem\[\]\s*=\s*/, 'const MASTER_182_CATALOG = ')
      + '\nreturn MASTER_182_CATALOG;';

    const catalogData = new Function(jsonLike)();
    console.log(`Đã đọc ${catalogData.length} chỉ số từ masterCatalog182.ts`);

    if (catalogData.length !== 182) {
      console.warn(`CẢNH BÁO: Số lượng chỉ số là ${catalogData.length} (kỳ vọng 182)`);
    }

    // 2. Read allergen database
    const allergenFile = path.resolve(__dirname, '../src/data/allergenCatalog.ts');
    const allergenTs = fs.readFileSync(allergenFile, 'utf8');
    const allergenCode = allergenTs
      .replace(/export\s+interface[\s\S]*?\}/g, '')
      .replace(/export\s+const\s+ALLERGEN_91_DATABASE\s*:\s*AllergenDatabaseItem\[\]\s*=\s*/, 'const ALLERGEN_91_DATABASE = ')
      + '\nreturn ALLERGEN_91_DATABASE;';
    const allergenList = new Function(allergenCode)();

    // 3. Read defaultCatalog equipments & groups
    const defaultEquipmentsFile = path.resolve(__dirname, '../src/data/defaultCatalog.ts');
    const defaultCatalogTs = fs.readFileSync(defaultEquipmentsFile, 'utf8');

    const eqMatch = defaultCatalogTs.match(/export const DEFAULT_EQUIPMENTS: TestEquipment\[\] = (\[[\s\S]*?\]);/);
    const grpMatch = defaultCatalogTs.match(/export const DEFAULT_TEST_GROUPS: TestGroup\[\] = (\[[\s\S]*?\]);/);
    const pkgMatch = defaultCatalogTs.match(/export const TEST_PACKAGES: TestPackage\[\] = (\[[\s\S]*?\]);/);

    const equipments = eqMatch ? new Function('return ' + eqMatch[1])() : [];
    const groups = grpMatch ? new Function('return ' + grpMatch[1])() : [];
    const packages = pkgMatch ? new Function('ALLERGEN_91_DATABASE', 'return ' + pkgMatch[1])(allergenList) : [];

    console.log(`- Thiết bị: ${equipments.length} máy`);
    console.log(`- Nhóm xét nghiệm: ${groups.length} nhóm`);
    console.log(`- Gói xét nghiệm: ${packages.length} gói`);

    console.log('\nĐang tải dữ liệu lên Supabase...');
    await syncTable('catalog_data', catalogData);
    await syncTable('equipments_catalog', equipments);
    await syncTable('test_groups', groups);
    await syncTable('test_packages', packages);

    console.log('\n--- KIỂM TRA & XÁC THỰC TRÊN SUPABASE CLOUD ---');
    const cloudCatalog = await verifyTable('catalog_data');
    await verifyTable('equipments_catalog');
    await verifyTable('test_groups');
    await verifyTable('test_packages');

    console.log('\n🎉 HOÀN TẤT ĐƯA 182 CHỈ SỐ LÊN SUPABASE CLOUD DB THÀNH CÔNG RỰC RỠ!');
  } catch (err) {
    console.error('LỖI KHI SEED DATABASE:', err);
    process.exit(1);
  }
}

run();
