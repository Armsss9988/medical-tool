import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
let databaseUrl = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const mDb = line.match(/^DATABASE_URL\s*=\s*(.*)$/);
    if (mDb && mDb[1].trim()) databaseUrl = mDb[1].trim().replace(/^["']|["']$/g, '');
  }
}

async function verifyHealth() {
  console.log('===============================================================');
  console.log('🏥 KIỂM TRA ĐỘ KHỎE DỮ LIỆU SAU MIGRATION');
  console.log('===============================================================\n');

  const sql = postgres(databaseUrl, { max: 1, prepare: false });

  // 1. Chỉ số thiếu unit hoặc ref_text
  const missingUnitOrRef = await sql`
    SELECT code, name, category, unit, ref_text 
    FROM catalog_items 
    WHERE unit IS NULL OR unit = '' OR ref_text IS NULL OR ref_text = ''
  `;
  console.log(`1. Chỉ số thiếu unit hoặc ref_text: ${missingUnitOrRef.length} (Kỳ vọng: 0)`);
  if (missingUnitOrRef.length > 0) console.table(missingUnitOrRef);

  // 2. Gói trỏ máy đo không tồn tại
  const brokenPkgEq = await sql`
    SELECT id, name, default_equipment_id 
    FROM test_packages 
    WHERE default_equipment_id IS NOT NULL 
      AND default_equipment_id NOT IN (SELECT id FROM equipments)
  `;
  console.log(`2. Gói xét nghiệm có default_equipment_id không tồn tại: ${brokenPkgEq.length} (Kỳ vọng: 0)`);
  if (brokenPkgEq.length > 0) console.table(brokenPkgEq);

  // 3. Package items trỏ máy đo không tồn tại
  const brokenItemEq = await sql`
    SELECT package_id, catalog_code, equipment_id 
    FROM package_items 
    WHERE equipment_id IS NOT NULL 
      AND equipment_id NOT IN (SELECT id FROM equipments)
  `;
  console.log(`3. Chỉ số trong gói có equipment_id không tồn tại: ${brokenItemEq.length} (Kỳ vọng: 0)`);
  if (brokenItemEq.length > 0) console.table(brokenItemEq);

  // 4. Dị nguyên trong catalog_items chưa có CIE
  const unmappedAllergens = await sql`
    SELECT code, name, category 
    FROM catalog_items 
    WHERE category ILIKE '%Dị Nguyên%' 
      AND code NOT IN (SELECT catalog_code FROM catalog_item_equipments)
  `;
  console.log(`4. Dị nguyên chưa có cấu hình máy đo CIE: ${unmappedAllergens.length} (Kỳ vọng: 0)`);
  if (unmappedAllergens.length > 0) console.table(unmappedAllergens);

  // 5. CIE trỏ vào mã catalog không tồn tại
  const orphanCieCode = await sql`
    SELECT id, catalog_code 
    FROM catalog_item_equipments 
    WHERE catalog_code NOT IN (SELECT code FROM catalog_items)
  `;
  console.log(`5. CIE mồ côi (catalog_code không tồn tại): ${orphanCieCode.length} (Kỳ vọng: 0)`);
  if (orphanCieCode.length > 0) console.table(orphanCieCode);

  // 6. CIE trỏ vào equipment không tồn tại
  const orphanCieEq = await sql`
    SELECT id, equipment_id 
    FROM catalog_item_equipments 
    WHERE equipment_id NOT IN (SELECT id FROM equipments)
  `;
  console.log(`6. CIE mồ côi (equipment_id không tồn tại): ${orphanCieEq.length} (Kỳ vọng: 0)`);
  if (orphanCieEq.length > 0) console.table(orphanCieEq);

  // 7. Kiểm tra trạng thái 10 chỉ số mục tiêu
  const targetItems = await sql`
    SELECT code, name, category, unit, ref_min, ref_max, ref_text, evaluation_type
    FROM catalog_items 
    WHERE code IN ('CAROTENETP', 'IGF1', 'SOIPHAN', 'STOOL_RBC', 'STOOL_WBC', 'GENI23', 'SLSS5', 'SLSS55', 'GOIKHANSINH6', 'HST12T')
    ORDER BY code
  `;
  console.log('\n7. Trạng thái 10 chỉ số sau chuẩn hóa:');
  console.table(targetItems);

  await sql.end();

  const totalErrors = missingUnitOrRef.length + brokenPkgEq.length + brokenItemEq.length + unmappedAllergens.length + orphanCieCode.length + orphanCieEq.length;
  if (totalErrors === 0) {
    console.log('🎉 TẤT CẢ CÁC TIÊU CHÍ ĐỘ KHỎE DỮ LIỆU ĐẠT 100%!');
  } else {
    console.error(`❌ CÒN ${totalErrors} LỖI DỮ LIỆU!`);
    process.exit(1);
  }
}

verifyHealth().catch(console.error);
