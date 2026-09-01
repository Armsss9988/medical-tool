const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/DATABASE_URL\s*=\s*(.*)/);
const dbUrl = match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
const sql = postgres(dbUrl, { ssl: { rejectUnauthorized: false } });

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const tableList = [
    'catalog_items',
    'catalog_item_equipments',
    'reference_ranges',
    'test_packages',
    'test_groups',
    'equipments',
    'doctors',
    'clinic_info',
    'allergen_scales',
    'zalo_config',
    'medical_reports',
    'invoices'
  ];

  const backupData = {
    _meta: {
      backupAt: new Date().toISOString(),
      timestamp,
      tableCount: tableList.length,
      database: 'Supabase PostgreSQL'
    },
    tables: {}
  };

  for (const t of tableList) {
    try {
      const rows = await sql`SELECT * FROM ${sql(t)}`;
      backupData.tables[t] = {
        count: rows.length,
        rows: rows
      };
      console.log(`[Backup] ${t}: ${rows.length} rows`);
    } catch (err) {
      console.warn(`[Backup] Error reading ${t}:`, err.message);
      backupData.tables[t] = { error: err.message, rows: [] };
    }
  }

  const filename = `backup_full_${timestamp}.json`;
  const filepath = path.join(backupDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), 'utf8');

  // Also save a latest copy
  const latestPath = path.join(backupDir, 'backup_latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(backupData, null, 2), 'utf8');

  console.log(`\n==> BACKUP COMPLETED: ${filepath}`);
  await sql.end();
}

backup().catch(console.error);
