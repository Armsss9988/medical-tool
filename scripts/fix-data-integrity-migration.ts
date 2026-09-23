import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

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
      console.log(`✓ [Supabase Storage] Đã đồng bộ [${key}]: ${Array.isArray(data) ? data.length + ' mục' : '1 đối tượng'}`);
    } else {
      const errText = await res.text();
      console.warn(`! [Supabase Storage] Lỗi đồng bộ [${key}]: HTTP ${res.status} - ${errText}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`! [Supabase Storage] Lỗi kết nối [${key}]:`, msg);
  }
}

async function runMigration() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU MIGRATION CHUẨN HÓA DỮ LIỆU CHỈ SỐ & GÓI XÉT NGHIỆM');
  console.log('===============================================================\n');

  if (!databaseUrl) {
    throw new Error('DATABASE_URL không được cấu hình trong .env!');
  }

  const sql = postgres(databaseUrl, { max: 1, prepare: false });

  try {
    await sql.begin(async (tx) => {
      // 1. Khôi phục máy đo Thermo Scientific Phadia 250 (Dị Ứng Kháng Sinh)
      console.log('1️⃣ Khôi phục thiết bị Phadia 250...');
      await tx`
        INSERT INTO equipments (id, code, name, updated_at)
        VALUES ('81e15751-ec5a-4cce-9fb6-9860d859950e', 'PHADIA-250', 'Thermo Scientific Phadia 250 (Dị Ứng Kháng Sinh)', NOW())
        ON CONFLICT (id) DO UPDATE 
        SET name = EXCLUDED.name, code = EXCLUDED.code, updated_at = NOW();
      `;
      console.log('   ✓ Đã upsert thiết bị 81e15751-ec5a-4cce-9fb6-9860d859950e');

      // Đảm bảo gói C6 kháng sinh trỏ đúng máy Phadia 250
      await tx`
        UPDATE test_packages 
        SET default_equipment_id = '81e15751-ec5a-4cce-9fb6-9860d859950e'
        WHERE id = 'pkg_1789301591992';
      `;
      await tx`
        UPDATE package_items 
        SET equipment_id = '81e15751-ec5a-4cce-9fb6-9860d859950e'
        WHERE package_id = 'pkg_1789301591992' AND (equipment_id IS NULL OR equipment_id = '');
      `;

      // 2. Chuẩn hóa Alias trong package_items
      console.log('\n2️⃣ Chuẩn hóa alias thiết bị trong package_items...');
      const r1 = await tx`
        UPDATE package_items 
        SET equipment_id = 'eq_mediwiss_c1' 
        WHERE equipment_id = 'eq_mediwiss';
      `;
      const r2 = await tx`
        UPDATE package_items 
        SET equipment_id = 'eq_protia_q' 
        WHERE equipment_id = 'eq_protia';
      `;
      console.log(`   ✓ eq_mediwiss -> eq_mediwiss_c1: ${r1.count} dòng`);
      console.log(`   ✓ eq_protia -> eq_protia_q: ${r2.count} dòng`);

      // 3. Chuẩn hóa 10 chỉ số thiếu đơn vị / khoảng tham chiếu / category
      console.log('\n3️⃣ Chuẩn hóa thông tin 10 chỉ số xét nghiệm...');
      await tx`
        UPDATE catalog_items 
        SET category = 'Vi Chất', unit = 'µg/dL', ref_min = 50, ref_max = 200, ref_text = '50 - 200', price = COALESCE(price, 150000), evaluation_type = 'range' 
        WHERE code = 'CAROTENETP';
      `;
      await tx`
        UPDATE catalog_items 
        SET category = 'Hóc Môn', unit = 'ng/mL', ref_min = 115, ref_max = 307, ref_text = '115 - 307', price = COALESCE(price, 250000), evaluation_type = 'range' 
        WHERE code = 'IGF1';
      `;
      await tx`
        UPDATE catalog_items 
        SET category = 'Ký Sinh Trùng', unit = 'Tiêu bản', ref_text = 'Âm tính (Không tìm thấy KST)', evaluation_type = 'detection' 
        WHERE code = 'SOIPHAN';
      `;
      await tx`
        UPDATE catalog_items 
        SET category = 'Ký Sinh Trùng', unit = 'BC/QT40', ref_text = 'Âm tính (Không có hồng cầu)', evaluation_type = 'detection' 
        WHERE code = 'STOOL_RBC';
      `;
      await tx`
        UPDATE catalog_items 
        SET category = 'Ký Sinh Trùng', unit = 'BC/QT40', ref_text = 'Âm tính (Không có bạch cầu)', evaluation_type = 'detection' 
        WHERE code = 'STOOL_WBC';
      `;
      await tx`
        UPDATE catalog_items 
        SET category = 'Di Truyền', unit = 'Nguy cơ', ref_text = 'Nguy cơ thấp', evaluation_type = 'text' 
        WHERE code = 'GENI23';
      `;
      await tx`
        UPDATE catalog_items 
        SET category = 'Miễn Dịch & Tầm Soát', unit = 'Nguy cơ', ref_text = 'Nguy cơ thấp', evaluation_type = 'text' 
        WHERE code = 'SLSS5';
      `;
      await tx`
        UPDATE catalog_items 
        SET category = 'Miễn Dịch & Tầm Soát', unit = 'Nguy cơ', ref_text = 'Nguy cơ thấp', evaluation_type = 'text' 
        WHERE code = 'SLSS55';
      `;
      await tx`
        UPDATE catalog_items 
        SET category = 'Dị Nguyên & Miễn Dịch', unit = 'kUA/L', ref_text = '< 0.35 (Độ 0)', evaluation_type = 'scale' 
        WHERE code = 'GOIKHANSINH6';
      `;
      await tx`
        UPDATE catalog_items 
        SET category = 'Huyết Sắc Tố', unit = '%', ref_text = 'Bình thường', evaluation_type = 'text' 
        WHERE code = 'HST12T';
      `;
      console.log('   ✓ Đã cập nhật 10 chỉ số: CAROTENETP, IGF1, SOIPHAN, STOOL_RBC, STOOL_WBC, GENI23, SLSS5, SLSS55, GOIKHANSINH6, HST12T');

      // 4. Bổ sung các bản ghi CIE bị thiếu cho các dị nguyên trong catalog_items
      console.log('\n4️⃣ Kiểm tra và bổ sung liên kết CIE cho các dị nguyên chưa có máy đo...');
      const unmappedAllergens = await tx`
        SELECT c.code, c.name, c.unit, c.category
        FROM catalog_items c
        WHERE c.category ILIKE '%Dị Nguyên%'
          AND c.code NOT IN (SELECT catalog_code FROM catalog_item_equipments)
      `;
      console.log(`   Tìm thấy ${unmappedAllergens.length} chỉ số dị nguyên chưa có CIE.`);

      let insertedCie = 0;
      for (const alg of unmappedAllergens) {
        const eqId = 'eq_protia_q';
        const scaleId = 'scale_protia_91';
        const refMax = 0.34;
        const refText = '< 0,34 (Độ 0)';
        const cieId = `cie_${alg.code.toLowerCase()}_${eqId}`;

        await tx`
          INSERT INTO catalog_item_equipments (
            id, catalog_code, equipment_id, evaluation_type, ref_min, ref_max, unit, ref_text, scale_id, is_default, updated_at
          ) VALUES (
            ${cieId}, ${alg.code}, ${eqId}, 'scale', 0, ${refMax}, ${alg.unit || 'IU/mL'}, ${refText}, ${scaleId}, true, NOW()
          )
          ON CONFLICT (id) DO NOTHING;
        `;
        insertedCie++;
      }
      console.log(`   ✓ Đã chèn ${insertedCie} bản ghi CIE mới.`);

      // 5. Dọn dẹp các bản ghi CIE mồ côi (trỏ vào mã không tồn tại trong catalog_items hoặc thiết bị không tồn tại)
      console.log('\n5️⃣ Dọn dẹp CIE mồ côi...');
      const deletedOrphanCatalog = await tx`
        DELETE FROM catalog_item_equipments 
        WHERE catalog_code NOT IN (SELECT code FROM catalog_items);
      `;
      const deletedOrphanEquipments = await tx`
        DELETE FROM catalog_item_equipments 
        WHERE equipment_id NOT IN (SELECT id FROM equipments);
      `;
      console.log(`   ✓ Đã xóa ${deletedOrphanCatalog.count} bản ghi CIE trỏ vào mã catalog không tồn tại.`);
      console.log(`   ✓ Đã xóa ${deletedOrphanEquipments.count} bản ghi CIE trỏ vào thiết bị không tồn tại.`);
    });

    console.log('\n🎉 [PostgreSQL] TRANSACTION HOÀN TẤT THÀNH CÔNG!');

    // Đọc dữ liệu cập nhật từ DB để sync sang Supabase Storage
    console.log('\n☁️ Đang đọc dữ liệu sạch từ PostgreSQL để đồng bộ sang Supabase Storage...');
    const allCatalog = await sql`SELECT * FROM catalog_items ORDER BY code ASC`;
    const allCie = await sql`SELECT * FROM catalog_item_equipments ORDER BY catalog_code ASC`;
    const allEquipments = await sql`SELECT * FROM equipments ORDER BY id ASC`;
    const allPackages = await sql`SELECT * FROM test_packages ORDER BY id ASC`;
    const allPackageItems = await sql`SELECT * FROM package_items ORDER BY package_id, order_index ASC`;

    // Chuẩn bị package list kèm items theo đúng format app_storage
    const packagesWithItems = allPackages.map((pkg) => {
      const items = allPackageItems
        .filter((pi) => pi.package_id === pkg.id)
        .map((pi) => ({
          code: pi.catalog_code,
          equipmentId: pi.equipment_id || null,
          defaultValue: pi.default_value || undefined,
          hasDefaultValue: pi.has_default_value || false
        }));
      return {
        id: pkg.id,
        name: pkg.name,
        price: pkg.price,
        defaultEquipmentId: pkg.default_equipment_id || null,
        items,
        codes: items.map((i) => i.code)
      };
    });

    // Chuyển đổi catalog items theo đúng format app_storage
    const catalogFormatted = allCatalog.map((c) => ({
      code: c.code,
      name: c.name,
      category: c.category,
      unit: c.unit,
      refMin: c.ref_min,
      refMax: c.ref_max,
      refText: c.ref_text,
      price: c.price,
      scientific: c.scientific,
      evaluationType: c.evaluation_type
    }));

    // Chuyển đổi CIE theo đúng format app_storage
    const cieFormatted = allCie.map((link) => ({
      id: link.id,
      catalogCode: link.catalog_code,
      equipmentId: link.equipment_id,
      evaluationType: link.evaluation_type,
      refMin: link.ref_min,
      refMax: link.ref_max,
      unit: link.unit,
      refText: link.ref_text,
      scaleId: link.scale_id,
      isDefault: link.is_default
    }));

    // Chuyển đổi equipments theo đúng format app_storage
    const eqFormatted = allEquipments.map((e) => ({
      id: e.id,
      name: e.name,
      code: e.code
    }));

    await syncToSupabaseStorage('catalog_data', catalogFormatted);
    await syncToSupabaseStorage('catalog_item_equipments', cieFormatted);
    await syncToSupabaseStorage('equipments_catalog', eqFormatted);
    await syncToSupabaseStorage('test_packages', packagesWithItems);

    console.log('\n===============================================================');
    console.log('✅ HOÀN TẤT ĐỒNG BỘ TOÀN DIỆN POSTGRESQL & SUPABASE STORAGE!');
    console.log('===============================================================');

    await sql.end();
  } catch (err: unknown) {
    await sql.end();
    console.error('❌ Lỗi khi thực hiện migration:', err);
    process.exit(1);
  }
}

runMigration();
