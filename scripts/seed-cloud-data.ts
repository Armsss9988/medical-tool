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
  await syncToSupabaseStorage('catalog_item_equipments', DEFAULT_CATALOG.filter(c => c.equipment || c.referenceRangeId || c.scaleId).map(c => ({
    id: `cie_${c.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${c.equipment ? 'eq_' + c.equipment.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'eq_default'}`,
    catalogCode: c.code,
    equipmentId: c.equipment ? 'eq_' + c.equipment.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'eq_default',
    referenceRangeId: c.referenceRangeId || null,
    scaleId: c.scaleId || null,
    isDefault: true
  })));

  // 2. Sync to PostgreSQL Direct Tables (Drizzle / Postgres.js) if DATABASE_URL is configured
  if (databaseUrl) {
    console.log('\n[2/2] Đồng bộ qua PostgreSQL Direct Connection...');
    try {
      const sql = postgres(databaseUrl, { max: 1, prepare: false });

      // Create / verify tables
      await sql`
        CREATE TABLE IF NOT EXISTS "reference_ranges" (
          "id" text PRIMARY KEY,
          "name" text NOT NULL,
          "ref_min" real,
          "ref_max" real,
          "unit" text NOT NULL DEFAULT '',
          "ref_text" text NOT NULL DEFAULT '',
          "gender" text,
          "age_group" text,
          "note" text,
          "updated_at" timestamp NOT NULL DEFAULT now()
        );
      `;
      await sql`ALTER TABLE "reference_ranges" ADD COLUMN IF NOT EXISTS "gender" text;`;
      await sql`ALTER TABLE "reference_ranges" ADD COLUMN IF NOT EXISTS "age_group" text;`;
      await sql`ALTER TABLE "reference_ranges" ADD COLUMN IF NOT EXISTS "note" text;`;
      await sql`ALTER TABLE "reference_ranges" ADD COLUMN IF NOT EXISTS "ref_min" real;`;
      await sql`ALTER TABLE "reference_ranges" ADD COLUMN IF NOT EXISTS "ref_max" real;`;
      await sql`ALTER TABLE "reference_ranges" ADD COLUMN IF NOT EXISTS "unit" text NOT NULL DEFAULT '';`;
      await sql`ALTER TABLE "reference_ranges" ADD COLUMN IF NOT EXISTS "ref_text" text NOT NULL DEFAULT '';`;

      await sql`
        CREATE TABLE IF NOT EXISTS "catalog_items" (
          "code" text PRIMARY KEY,
          "category" text NOT NULL,
          "name" text NOT NULL,
          "ref_min" real,
          "ref_max" real,
          "unit" text NOT NULL DEFAULT '',
          "ref_text" text NOT NULL DEFAULT '',
          "price" real NOT NULL DEFAULT 0,
          "scientific" text,
          "equipment" text,
          "evaluation_type" text,
          "reference_range_id" text,
          "scale_id" text,
          "updated_at" timestamp NOT NULL DEFAULT now()
        );
      `;
      await sql`ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "scientific" text;`;
      await sql`ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "equipment" text;`;
      await sql`ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "evaluation_type" text;`;
      await sql`ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "reference_range_id" text;`;
      await sql`ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "scale_id" text;`;

      await sql`
        CREATE TABLE IF NOT EXISTS "catalog_item_equipments" (
          "id" text PRIMARY KEY,
          "catalog_code" text NOT NULL,
          "equipment_id" text NOT NULL,
          "reference_range_id" text,
          "scale_id" text,
          "is_default" boolean NOT NULL DEFAULT false,
          "updated_at" timestamp NOT NULL DEFAULT now()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS "test_packages" (
          "id" text PRIMARY KEY,
          "name" text NOT NULL,
          "items" jsonb NOT NULL DEFAULT '[]'::jsonb,
          "price" real NOT NULL DEFAULT 0,
          "updated_at" timestamp NOT NULL DEFAULT now()
        );
      `;
      await sql`ALTER TABLE "test_packages" ADD COLUMN IF NOT EXISTS "items" jsonb NOT NULL DEFAULT '[]'::jsonb;`;
      await sql`ALTER TABLE "test_packages" DROP COLUMN IF EXISTS "codes";`;

      await sql`
        CREATE TABLE IF NOT EXISTS "test_groups" (
          "id" text PRIMARY KEY,
          "name" text NOT NULL,
          "updated_at" timestamp NOT NULL DEFAULT now()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS "equipments" (
          "id" text PRIMARY KEY,
          "name" text NOT NULL,
          "code" text,
          "updated_at" timestamp NOT NULL DEFAULT now()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS "doctors" (
          "id" text PRIMARY KEY,
          "name" text NOT NULL,
          "specialty" text,
          "phone" text,
          "updated_at" timestamp NOT NULL DEFAULT now()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS "clinic_info" (
          "id" text PRIMARY KEY DEFAULT 'default',
          "name" text NOT NULL DEFAULT '',
          "address" text NOT NULL DEFAULT '',
          "phone" text NOT NULL DEFAULT '',
          "website" text,
          "default_doctor" text NOT NULL DEFAULT '',
          "logo_url" text,
          "stamp_url" text,
          "bank_id" text,
          "bank_name" text,
          "bank_account_no" text,
          "bank_account_name" text,
          "bank_branch" text,
          "bank_qr_image_url" text,
          "cashier_name" text,
          "accountant_name" text,
          "updated_at" timestamp NOT NULL DEFAULT now()
        );
      `;

      // Clear dependent catalog_items first
      await sql`DELETE FROM "catalog_items"`;
      await sql`DELETE FROM "catalog_item_equipments"`;

      // 1. Reference Ranges
      await sql`DELETE FROM "reference_ranges"`;
      const refRows = DEFAULT_REFERENCE_RANGES.map((r) => ({
        id: r.id,
        name: r.name,
        ref_min: r.refMin ?? null,
        ref_max: r.refMax ?? null,
        unit: r.unit || '',
        ref_text: r.refText || '',
        gender: r.gender || null,
        age_group: r.ageGroup || null,
        note: r.note || null
      }));
      if (refRows.length > 0) {
        await sql`INSERT INTO "reference_ranges" ${sql(refRows)}`;
      }

      // 2. Test Groups
      await sql`DELETE FROM "test_groups"`;
      const grpMap = new Map<string, { id: string; name: string }>();
      for (const g of DEFAULT_TEST_GROUPS) grpMap.set(g.name, g);
      for (const c of DEFAULT_CATALOG) {
        if (c.category && !grpMap.has(c.category)) {
          grpMap.set(c.category, { id: 'grp_' + Math.random().toString(36).slice(2, 9), name: c.category });
        }
      }
      const grpRows = Array.from(grpMap.values());
      if (grpRows.length > 0) {
        await sql`INSERT INTO "test_groups" ${sql(grpRows)}`;
      }

      // 3. Equipments
      await sql`DELETE FROM "equipments"`;
      const eqMap = new Map<string, { id: string; name: string; code?: string }>();
      for (const e of DEFAULT_EQUIPMENTS) eqMap.set(e.name, e);
      for (const c of DEFAULT_CATALOG) {
        if (c.equipment && !eqMap.has(c.equipment)) {
          eqMap.set(c.equipment, {
            id: 'eq_' + Math.random().toString(36).slice(2, 9),
            name: c.equipment,
            code: c.equipment.toUpperCase().replace(/\s+/g, '_').slice(0, 15)
          });
        }
      }
      const eqRows = Array.from(eqMap.values()).map((e) => ({ id: e.id, name: e.name, code: e.code || null }));
      if (eqRows.length > 0) {
        await sql`INSERT INTO "equipments" ${sql(eqRows)}`;
      }

      // 4. Catalog Items
      const catRows = DEFAULT_CATALOG.map((c) => ({
        code: c.code,
        category: c.category || '',
        name: c.name,
        ref_min: c.refMin ?? null,
        ref_max: c.refMax ?? null,
        unit: c.unit || '',
        ref_text: c.refText || '',
        price: c.price ?? 0,
        scientific: c.scientific || null,
        evaluation_type: c.evaluationType || null
      }));
      if (catRows.length > 0) {
        await sql`INSERT INTO "catalog_items" ${sql(catRows)}`;
      }

      // 4b. Catalog Item Equipments Links
      const cieRows: Array<{
        id: string;
        catalog_code: string;
        equipment_id: string;
        reference_range_id: string | null;
        scale_id: string | null;
        is_default: boolean;
      }> = [];
      for (const c of DEFAULT_CATALOG) {
        if (c.equipment || c.referenceRangeId || c.scaleId) {
          const matchedEq = eqRows.find((e) => e.name === c.equipment || e.code === c.equipment);
          const eqId = matchedEq ? matchedEq.id : (c.equipment ? 'eq_' + c.equipment.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'eq_default');
          cieRows.push({
            id: `cie_${c.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${eqId}`,
            catalog_code: c.code,
            equipment_id: eqId,
            reference_range_id: c.referenceRangeId || null,
            scale_id: c.scaleId || null,
            is_default: true
          });
        }
      }
      if (cieRows.length > 0) {
        await sql`INSERT INTO "catalog_item_equipments" ${sql(cieRows)}`;
      }

      // 5. Test Packages
      await sql`DELETE FROM "test_packages"`;
      const pkgRows = TEST_PACKAGES.map((p) => ({
        id: p.id,
        name: p.name,
        items: sql.json(p.items || (p.codes || []).map((c) => ({ code: c, equipmentId: null }))),
        price: p.price ?? 0
      }));
      if (pkgRows.length > 0) {
        await sql`INSERT INTO "test_packages" ${sql(pkgRows)}`;
      }

      // 6. Doctors
      await sql`DELETE FROM "doctors"`;
      const docRows = defaultDoctors.map((d) => ({
        id: d.id,
        name: d.name,
        specialty: d.specialty || null,
        phone: d.phone || null
      }));
      if (docRows.length > 0) {
        await sql`INSERT INTO "doctors" ${sql(docRows)}`;
      }

      // 7. Clinic Info
      await sql`DELETE FROM "clinic_info"`;
      await sql`
        INSERT INTO "clinic_info" ("id", "name", "address", "phone", "website", "default_doctor", "bank_id", "bank_name", "bank_account_no", "bank_account_name", "bank_branch", "cashier_name", "accountant_name")
        VALUES (
          'default',
          ${defaultClinic.name},
          ${defaultClinic.address},
          ${defaultClinic.phone},
          ${defaultClinic.website},
          ${defaultClinic.defaultDoctor},
          ${defaultClinic.bankId},
          ${defaultClinic.bankName},
          ${defaultClinic.bankAccountNo},
          ${defaultClinic.bankAccountName},
          ${defaultClinic.bankBranch},
          ${defaultClinic.cashierName},
          ${defaultClinic.accountantName}
        )
        ON CONFLICT ("id") DO NOTHING;
      `;

      console.log('✓ [PostgreSQL] Đã ghi toàn bộ bảng PostgreSQL thành công 100%!');
      await sql.end();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('! [PostgreSQL Direct] Lỗi nạp bảng trực tiếp:', msg);
    }
  }

  console.log('\n=== Hoàn tất quá trình Seed dữ liệu lên Cloud ===');
}

main().catch(console.error);