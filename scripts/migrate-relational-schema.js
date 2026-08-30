import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env
const envPath = path.resolve(__dirname, '../.env');
let dbUrl = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^DATABASE_URL\s*=\s*(.*)$/);
    if (match && match[1].trim()) {
      dbUrl = match[1].trim();
      break;
    }
  }
}

if (!dbUrl) {
  console.error('LỖI: Chưa tìm thấy biến DATABASE_URL trong file .env');
  process.exit(1);
}

// Strip query params like sslmode=require to avoid SSL certificate validation error with node-pg
dbUrl = dbUrl.replace('?sslmode=require', '').replace('&sslmode=require', '');

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('--- KHỞI TẠO BẢNG QUAN HỆ (RELATIONAL SCHEMA & FOREIGN KEYS) TRÊN POSTGRESQL SUPABASE ---');
    await client.connect();
    console.log('✓ Đã kết nối thành công tới PostgreSQL Supabase!');

    // 1. DDL: Tạo các bảng quan hệ
    console.log('\n1. Đang thực thi DDL tạo cấu trúc bảng & Ràng buộc khóa ngoại...');

    // 1.1 test_groups
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_groups (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'test_groups_name_key') THEN
          ALTER TABLE test_groups ADD CONSTRAINT test_groups_name_key UNIQUE (name);
        END IF;
      END $$;
    `);

    // 1.2 equipments
    await client.query(`
      CREATE TABLE IF NOT EXISTS equipments (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        code TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipments_name_key') THEN
          ALTER TABLE equipments ADD CONSTRAINT equipments_name_key UNIQUE (name);
        END IF;
      END $$;
    `);

    // 1.3 reference_ranges
    await client.query(`
      CREATE TABLE IF NOT EXISTS reference_ranges (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ref_min REAL,
        ref_max REAL,
        unit TEXT,
        ref_text TEXT,
        gender TEXT DEFAULT 'Tất cả',
        age_group TEXT DEFAULT 'Tất cả',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 1.4 allergen_scales
    await client.query(`
      CREATE TABLE IF NOT EXISTS allergen_scales (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        min_range REAL DEFAULT 0,
        max_range REAL DEFAULT 0.35,
        levels_json JSONB,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 1.5 doctors
    await client.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        specialty TEXT,
        phone TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'doctors_name_key') THEN
          ALTER TABLE doctors ADD CONSTRAINT doctors_name_key UNIQUE (name);
        END IF;
      END $$;
    `);

    // 1.6 catalog_items: ensure nullable unit & ref_text
    await client.query(`
      CREATE TABLE IF NOT EXISTS catalog_items (
        code TEXT PRIMARY KEY,
        category TEXT,
        name TEXT NOT NULL,
        ref_min REAL,
        ref_max REAL,
        unit TEXT,
        ref_text TEXT,
        price REAL DEFAULT 0,
        scientific TEXT,
        equipment TEXT,
        evaluation_type TEXT,
        reference_range_id TEXT,
        scale_id TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE catalog_items ALTER COLUMN unit DROP NOT NULL;
      ALTER TABLE catalog_items ALTER COLUMN ref_text DROP NOT NULL;
    `);

    // 1.7 Add Foreign Keys on catalog_items if not exist
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_catalog_category') THEN
          ALTER TABLE catalog_items 
            ADD CONSTRAINT fk_catalog_category 
            FOREIGN KEY (category) REFERENCES test_groups(name) 
            ON UPDATE CASCADE ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_catalog_equipment') THEN
          ALTER TABLE catalog_items 
            ADD CONSTRAINT fk_catalog_equipment 
            FOREIGN KEY (equipment) REFERENCES equipments(name) 
            ON UPDATE CASCADE ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_catalog_reference_range') THEN
          ALTER TABLE catalog_items 
            ADD CONSTRAINT fk_catalog_reference_range 
            FOREIGN KEY (reference_range_id) REFERENCES reference_ranges(id) 
            ON UPDATE CASCADE ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_catalog_scale') THEN
          ALTER TABLE catalog_items 
            ADD CONSTRAINT fk_catalog_scale 
            FOREIGN KEY (scale_id) REFERENCES allergen_scales(id) 
            ON UPDATE CASCADE ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // 1.8 test_packages
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_packages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        codes TEXT[] NOT NULL DEFAULT '{}',
        price REAL NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 1.9 package_items (Junction Table Many-to-Many)
    await client.query(`
      CREATE TABLE IF NOT EXISTS package_items (
        package_id TEXT REFERENCES test_packages(id) ON UPDATE CASCADE ON DELETE CASCADE,
        item_code TEXT REFERENCES catalog_items(code) ON UPDATE CASCADE ON DELETE CASCADE,
        PRIMARY KEY (package_id, item_code)
      );
    `);

    // 1.10 View v_catalog_details
    await client.query(`
      CREATE OR REPLACE VIEW v_catalog_details AS
      SELECT 
        c.code,
        c.name,
        c.category,
        tg.id as category_id,
        c.equipment,
        eq.id as equipment_id,
        eq.code as equipment_code,
        c.ref_min,
        c.ref_max,
        c.unit,
        c.ref_text,
        c.price,
        c.scientific,
        c.evaluation_type,
        c.reference_range_id,
        rr.name as reference_range_name,
        c.scale_id,
        als.name as scale_name,
        c.updated_at
      FROM catalog_items c
      LEFT JOIN test_groups tg ON tg.name = c.category
      LEFT JOIN equipments eq ON eq.name = c.equipment
      LEFT JOIN reference_ranges rr ON rr.id = c.reference_range_id
      LEFT JOIN allergen_scales als ON als.id = c.scale_id;
    `);

    console.log('✓ Đã tạo thành công cấu trúc bảng, khóa chính, khóa ngoại (Foreign Keys) & View SQL.');

    // 2. LOAD DATA
    console.log('\n2. Đang nạp dữ liệu vào các bảng quan hệ...');

    // 2.1 Load test_groups
    const defaultCatalogFile = path.resolve(__dirname, '../src/data/defaultCatalog.ts');
    const defaultCatalogTs = fs.readFileSync(defaultCatalogFile, 'utf8');
    const grpMatch = defaultCatalogTs.match(/export const DEFAULT_TEST_GROUPS: TestGroup\[\] = (\[[\s\S]*?\]);/);
    const groups = grpMatch ? new Function('return ' + grpMatch[1])() : [];

    for (const g of groups) {
      await client.query(`
        INSERT INTO test_groups (id, name, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (name) DO UPDATE SET updated_at = NOW();
      `, [g.id, g.name]);
    }
    console.log(`✓ Đã nạp ${groups.length} nhóm vào [test_groups].`);

    // 2.2 Load equipments
    const eqMatch = defaultCatalogTs.match(/export const DEFAULT_EQUIPMENTS: TestEquipment\[\] = (\[[\s\S]*?\]);/);
    const equipments = eqMatch ? new Function('return ' + eqMatch[1])() : [];

    for (const eq of equipments) {
      await client.query(`
        INSERT INTO equipments (id, name, code, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (name) DO UPDATE SET code = EXCLUDED.code, updated_at = NOW();
      `, [eq.id, eq.name, eq.code || null]);
    }
    console.log(`✓ Đã nạp ${equipments.length} thiết bị vào [equipments].`);

    // 2.3 Load reference_ranges
    const refRangesFile = path.resolve(__dirname, '../src/data/referenceRangesCatalog.ts');
    const refRangesTs = fs.readFileSync(refRangesFile, 'utf8');
    const refMatch = refRangesTs.match(/export const DEFAULT_REFERENCE_RANGES: ReferenceRangeItem\[\] = (\[[\s\S]*?\]);/);
    const refRanges = refMatch ? new Function('return ' + refMatch[1])() : [];

    for (const rr of refRanges) {
      await client.query(`
        INSERT INTO reference_ranges (id, name, ref_min, ref_max, unit, ref_text, gender, age_group, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name,
          ref_min = EXCLUDED.ref_min,
          ref_max = EXCLUDED.ref_max,
          unit = EXCLUDED.unit,
          ref_text = EXCLUDED.ref_text,
          gender = EXCLUDED.gender,
          age_group = EXCLUDED.age_group,
          updated_at = NOW();
      `, [rr.id, rr.name, rr.refMin ?? null, rr.refMax ?? null, rr.unit || null, rr.refText || null, rr.gender || 'Tất cả', rr.ageGroup || 'Tất cả']);
    }
    console.log(`✓ Đã nạp ${refRanges.length} khoảng tham chiếu vào [reference_ranges].`);

    // 2.4 Load allergen_scales
    const scalesFile = path.resolve(__dirname, '../src/domain/constants/allergenScales.ts');
    const scalesTs = fs.readFileSync(scalesFile, 'utf8');
    const scalesMatch = scalesTs.match(/export const DEFAULT_ALLERGEN_SCALES: AllergenGradingScale\[\] = (\[[\s\S]*?\]);/);
    const scales = scalesMatch ? new Function(`
      const DEFAULT_PROTIA_91_SCALE = ${scalesTs.match(/export const DEFAULT_PROTIA_91_SCALE: AllergenGradingScale = ({[\s\S]*?});/)[1]};
      const DEFAULT_ALLERGEN_44_SCALE = ${scalesTs.match(/export const DEFAULT_ALLERGEN_44_SCALE: AllergenGradingScale = ({[\s\S]*?});/)[1]};
      return [DEFAULT_PROTIA_91_SCALE, DEFAULT_ALLERGEN_44_SCALE];
    `)() : [];

    for (const sc of scales) {
      await client.query(`
        INSERT INTO allergen_scales (id, name, min_range, max_range, levels_json, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          min_range = EXCLUDED.min_range,
          max_range = EXCLUDED.max_range,
          levels_json = EXCLUDED.levels_json,
          updated_at = NOW();
      `, [sc.id, sc.name, 0, sc.id === 'scale_allergen_44' ? 0.35 : 0.34, JSON.stringify(sc.levels)]);
    }
    console.log(`✓ Đã nạp ${scales.length} thang đo dị ứng vào [allergen_scales].`);

    // 2.5 Load doctors
    const doctorsMatch = defaultCatalogTs.match(/export const DEFAULT_DOCTORS = (\[[\s\S]*?\]);/);
    const doctors = doctorsMatch ? new Function('return ' + doctorsMatch[1])() : [];

    for (const doc of doctors) {
      await client.query(`
        INSERT INTO doctors (id, name, specialty, phone, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (name) DO UPDATE SET specialty = EXCLUDED.specialty, updated_at = NOW();
      `, [doc.id, doc.name, doc.specialty || null, doc.phone || null]);
    }
    console.log(`✓ Đã nạp ${doctors.length} bác sĩ vào [doctors].`);

    // 2.6 Load 182 catalog_items
    const masterFile = path.resolve(__dirname, '../src/data/masterCatalog182.ts');
    const masterTs = fs.readFileSync(masterFile, 'utf8');
    const jsonLike = masterTs
      .replace(/import\s+[\s\S]*?;/g, '')
      .replace(/\/\*\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/export\s+const\s+MASTER_182_CATALOG\s*:\s*CatalogItem\[\]\s*=\s*/, 'const MASTER_182_CATALOG = ')
      + '\nreturn MASTER_182_CATALOG;';
    const catalogData = new Function(jsonLike)();

    for (const item of catalogData) {
      const eqVal = item.equipment && item.equipment.trim() ? item.equipment.trim() : null;
      const grpVal = item.category && item.category.trim() ? item.category.trim() : null;
      const refVal = item.referenceRangeId && item.referenceRangeId.trim() ? item.referenceRangeId.trim() : null;
      const scaleVal = item.scaleId && item.scaleId.trim() ? item.scaleId.trim() : null;

      await client.query(`
        INSERT INTO catalog_items (
          code, category, name, ref_min, ref_max, unit, ref_text, 
          price, scientific, equipment, evaluation_type, reference_range_id, scale_id, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        ON CONFLICT (code) DO UPDATE SET
          category = EXCLUDED.category,
          name = EXCLUDED.name,
          ref_min = EXCLUDED.ref_min,
          ref_max = EXCLUDED.ref_max,
          unit = EXCLUDED.unit,
          ref_text = EXCLUDED.ref_text,
          price = EXCLUDED.price,
          scientific = EXCLUDED.scientific,
          equipment = EXCLUDED.equipment,
          evaluation_type = EXCLUDED.evaluation_type,
          reference_range_id = EXCLUDED.reference_range_id,
          scale_id = EXCLUDED.scale_id,
          updated_at = NOW();
      `, [
        item.code,
        grpVal,
        item.name,
        item.refMin ?? null,
        item.refMax ?? null,
        item.unit ?? '',
        item.refText ?? '',
        item.price ?? 0,
        item.scientific || null,
        eqVal,
        item.evaluationType || 'range',
        refVal,
        scaleVal
      ]);
    }
    console.log(`✓ Đã nạp trọn vẹn ${catalogData.length} chỉ số vào [catalog_items] (có khóa ngoại liên kết test_groups & equipments).`);

    // 2.7 Load test_packages and package_items
    const allergenFile = path.resolve(__dirname, '../src/data/allergenCatalog.ts');
    const allergenTs = fs.readFileSync(allergenFile, 'utf8');
    const allergenCode = allergenTs
      .replace(/export\s+interface[\s\S]*?\}/g, '')
      .replace(/export\s+const\s+ALLERGEN_91_DATABASE\s*:\s*AllergenDatabaseItem\[\]\s*=\s*/, 'const ALLERGEN_91_DATABASE = ')
      + '\nreturn ALLERGEN_91_DATABASE;';
    const allergenList = new Function(allergenCode)();

    const pkgMatch = defaultCatalogTs.match(/export const TEST_PACKAGES: TestPackage\[\] = (\[[\s\S]*?\]);/);
    const packages = pkgMatch ? new Function('ALLERGEN_91_DATABASE', 'return ' + pkgMatch[1])(allergenList) : [];

    // Clear old package_items
    await client.query('DELETE FROM package_items;');

    for (const pkg of packages) {
      await client.query(`
        INSERT INTO test_packages (id, name, codes, price, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          codes = EXCLUDED.codes,
          price = EXCLUDED.price,
          updated_at = NOW();
      `, [pkg.id, pkg.name, pkg.codes || [], pkg.price ?? 0]);

      if (Array.isArray(pkg.codes)) {
        for (const code of pkg.codes) {
          // Check if item exists in catalog_items
          const check = await client.query('SELECT 1 FROM catalog_items WHERE code = $1', [code]);
          if (check.rowCount > 0) {
            await client.query(`
              INSERT INTO package_items (package_id, item_code)
              VALUES ($1, $2)
              ON CONFLICT DO NOTHING;
            `, [pkg.id, code]);
          }
        }
      }
    }
    console.log(`✓ Đã nạp ${packages.length} gói xét nghiệm vào [test_packages] và bảng liên kết Many-to-Many [package_items].`);

    // 3. VERIFY & REPORT
    console.log('\n--- 3. KIỂM TRA TÍNH TOÀN VẸN QUAN HỆ (REFERENTIAL INTEGRITY) ---');
    const counts = await client.query(`
      SELECT 'test_groups' as table_name, count(*) as count FROM test_groups
      UNION ALL SELECT 'equipments', count(*) FROM equipments
      UNION ALL SELECT 'reference_ranges', count(*) FROM reference_ranges
      UNION ALL SELECT 'allergen_scales', count(*) FROM allergen_scales
      UNION ALL SELECT 'catalog_items', count(*) FROM catalog_items
      UNION ALL SELECT 'test_packages', count(*) FROM test_packages
      UNION ALL SELECT 'package_items', count(*) FROM package_items
      UNION ALL SELECT 'doctors', count(*) FROM doctors;
    `);

    console.table(counts.rows);

    // Test JOIN view
    const viewSample = await client.query(`
      SELECT code, name, category, equipment, reference_range_name, scale_name 
      FROM v_catalog_details 
      WHERE code IN ('DN44', 'HBA', 'VITD', 'WBC', '17OHP')
      ORDER BY code;
    `);
    console.log('\nMẫu truy vấn View v_catalog_details (JOIN 4 bảng):');
    console.table(viewSample.rows);

    console.log('\n🎉 HOÀN THÀNH TOÀN DIỆN DI TRÚ SCHEMA QUAN HỆ & NẠP 182 CHỈ SỐ LÊN POSTGRESQL SUPABASE!');
  } catch (err) {
    console.error('\n❌ LỖI TRONG QUÁ TRÌNH DI TRÚ:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
