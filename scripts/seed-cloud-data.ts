import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../apps/web/lib/schema';
import {
  DEFAULT_CATALOG,
  TEST_PACKAGES,
  DEFAULT_TEST_GROUPS,
  DEFAULT_EQUIPMENTS
} from '../packages/shared/src/data/backup/defaultCatalog';
import { DEFAULT_REFERENCE_RANGES } from '../packages/shared/src/data/backup/referenceRangesCatalog';

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

const defaultClinic = {
  name: 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH',
  address: 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị',
  phone: '032.855.3773',
  website: 'golab.com.vn',
  defaultDoctor: 'Nguyễn Thị Thành Trung',
  bankId: 'VBA',
  bankName: 'Agribank',
  bankAccountNo: '8888876781225',
  bankAccountName: 'LE PHAN ANH',
  bankBranch: 'Agribank - Chi nhánh Lý Thái Tổ - Quảng Bình',
  cashierName: 'Lê Phan Anh',
  accountantName: 'Trần Thị Thanh Hương'
};

const defaultDoctors = [
  {
    id: 'doc_1',
    name: 'BS. Nguyễn Thị Thành Trung',
    specialty: 'Bác sĩ Phụ Trách Xét Nghiệm',
    phone: '032.855.3773'
  },
  {
    id: 'doc_2',
    name: 'BS. Lê Phan Anh',
    specialty: 'Bác sĩ Lâm Sàng',
    phone: '090.555.8888'
  }
];

// Sync to Supabase app_storage
async function syncToSupabaseStorage(key: string, data: unknown) {
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
      const errText = await res.text();
      console.warn(`! [Supabase Storage] Lỗi đồng bộ [${key}]: HTTP ${res.status} - ${errText}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`! [Supabase Storage] Lỗi kết nối [${key}]:`, msg);
  }
}

async function main() {
  console.log('\n--- Bắt đầu nạp dữ liệu mẫu từ Backup lên Cloud ---');
  console.log(`- Chỉ số xét nghiệm: ${DEFAULT_CATALOG.length} chỉ số`);
  console.log(`- Gói xét nghiệm: ${TEST_PACKAGES.length} gói`);
  console.log(`- Nhóm xét nghiệm: ${DEFAULT_TEST_GROUPS.length} nhóm`);
  console.log(`- Thiết bị xét nghiệm: ${DEFAULT_EQUIPMENTS.length} máy`);
  console.log(`- Bảng tham chiếu: ${DEFAULT_REFERENCE_RANGES.length} bộ tham chiếu`);
  console.log(`- Bác sĩ mặc định: ${defaultDoctors.length} bác sĩ`);

  // 1. Sync to Supabase Storage (REST)
  console.log('\n[1/2] Đồng bộ qua Supabase Storage REST API...');
  await syncToSupabaseStorage('catalog_data', DEFAULT_CATALOG);
  await syncToSupabaseStorage('test_packages', TEST_PACKAGES);
  await syncToSupabaseStorage('test_groups', DEFAULT_TEST_GROUPS);
  await syncToSupabaseStorage('equipments_catalog', DEFAULT_EQUIPMENTS);
  await syncToSupabaseStorage('reference_ranges', DEFAULT_REFERENCE_RANGES);
  await syncToSupabaseStorage('doctors_list', defaultDoctors);
  await syncToSupabaseStorage('clinic_info', defaultClinic);

  // 2. Sync to PostgreSQL Direct Tables (Drizzle) if DATABASE_URL is configured
  if (databaseUrl) {
    console.log('\n[2/2] Đồng bộ qua PostgreSQL Direct Connection (Drizzle)...');
    try {
      const queryClient = postgres(databaseUrl, { max: 1, prepare: false });
      const db = drizzle(queryClient, { schema });

      await db.transaction(async (tx) => {
        // Catalog Items in batches of 25
        await tx.delete(schema.catalogItems);
        const batchSize = 25;
        for (let i = 0; i < DEFAULT_CATALOG.length; i += batchSize) {
          const batch = DEFAULT_CATALOG.slice(i, i + batchSize);
          await tx.insert(schema.catalogItems).values(batch.map((c) => ({
            code: c.code,
            category: c.category || '',
            name: c.name,
            refMin: c.refMin ?? null,
            refMax: c.refMax ?? null,
            unit: c.unit || '',
            refText: c.refText || '',
            price: c.price ?? 0,
            scientific: c.scientific || null,
            equipment: c.equipment || null,
            evaluationType: c.evaluationType || null,
            referenceRangeId: c.referenceRangeId || null,
            scaleId: c.scaleId || null
          }))).onConflictDoNothing();
        }

        // Test Packages
        await tx.delete(schema.testPackages);
        if (TEST_PACKAGES.length > 0) {
          await tx.insert(schema.testPackages).values(TEST_PACKAGES.map((p) => ({
            id: p.id,
            name: p.name,
            codes: p.codes || [],
            price: p.price ?? 0
          }))).onConflictDoNothing();
        }

        // Test Groups
        await tx.delete(schema.testGroups);
        if (DEFAULT_TEST_GROUPS.length > 0) {
          await tx.insert(schema.testGroups).values(DEFAULT_TEST_GROUPS.map((g) => ({
            id: g.id,
            name: g.name
          }))).onConflictDoNothing();
        }

        // Equipments
        await tx.delete(schema.equipments);
        if (DEFAULT_EQUIPMENTS.length > 0) {
          await tx.insert(schema.equipments).values(DEFAULT_EQUIPMENTS.map((e) => ({
            id: e.id,
            name: e.name,
            code: e.code || null
          }))).onConflictDoNothing();
        }

        // Reference Ranges
        await tx.delete(schema.referenceRanges);
        if (DEFAULT_REFERENCE_RANGES.length > 0) {
          await tx.insert(schema.referenceRanges).values(DEFAULT_REFERENCE_RANGES.map((r) => ({
            id: r.id,
            name: r.name,
            refMin: r.refMin ?? null,
            refMax: r.refMax ?? null,
            unit: r.unit || '',
            refText: r.refText || '',
            gender: r.gender || null,
            ageGroup: r.ageGroup || null,
            note: r.note || null
          }))).onConflictDoNothing();
        }

        // Doctors
        await tx.delete(schema.doctors);
        if (defaultDoctors.length > 0) {
          await tx.insert(schema.doctors).values(defaultDoctors.map((d) => ({
            id: d.id,
            name: d.name,
            specialty: d.specialty || null,
            phone: d.phone || null
          }))).onConflictDoNothing();
        }

        // Clinic Info
        await tx.delete(schema.clinicInfo);
        await tx.insert(schema.clinicInfo).values({
          id: 'default',
          ...defaultClinic
        }).onConflictDoNothing();
      });

      console.log('✓ [PostgreSQL] Đã ghi toàn bộ bảng PostgreSQL thành công rực rỡ!');
      await queryClient.end();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('! [PostgreSQL Direct] Lỗi nạp bảng trực tiếp:', msg);
    }
  }

  console.log('\n=== Hoàn tất quá trình Seed dữ liệu lên Cloud ===');
}

main().catch(console.error);