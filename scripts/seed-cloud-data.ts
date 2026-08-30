import { sql } from 'drizzle-orm';
import { db } from '../apps/web/lib/db';
import {
  catalogItems,
  catalogItemEquipments,
  testPackages,
  testGroups,
  equipments,
  doctors,
  clinicInfo,
  zaloConfig,
  referenceRanges,
  medicalReports,
  invoices
} from '../apps/web/lib/schema';
import {
  INITIAL_CATALOG,
  INITIAL_PACKAGES,
  INITIAL_GROUPS,
  INITIAL_EQUIPMENTS,
  INITIAL_DOCTORS,
  INITIAL_CLINIC_INFO,
  REFERENCE_RANGES
} from '../packages/shared/src/data/initialData';

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Seed Groups
    console.log('Seeding Test Groups...');
    for (const group of INITIAL_GROUPS) {
      await db
        .insert(testGroups)
        .values({
          id: group.id,
          name: group.name
        })
        .onConflictDoUpdate({
          target: testGroups.id,
          set: { name: group.name, updatedAt: new Date() }
        });
    }

    // 2. Seed Equipments
    console.log('Seeding Equipments...');
    for (const eq of INITIAL_EQUIPMENTS) {
      await db
        .insert(equipments)
        .values({
          id: eq.id,
          name: eq.name,
          code: eq.code || null
        })
        .onConflictDoUpdate({
          target: equipments.id,
          set: { name: eq.name, code: eq.code || null, updatedAt: new Date() }
        });
    }

    // 3. Seed Doctors
    console.log('Seeding Doctors...');
    for (const doc of INITIAL_DOCTORS) {
      await db
        .insert(doctors)
        .values({
          id: doc.id,
          name: doc.name,
          specialty: doc.specialty || null,
          phone: doc.phone || null
        })
        .onConflictDoUpdate({
          target: doctors.id,
          set: {
            name: doc.name,
            specialty: doc.specialty || null,
            phone: doc.phone || null,
            updatedAt: new Date()
          }
        });
    }

    // 4. Seed Reference Ranges
    console.log('Seeding Reference Ranges...');
    for (const range of REFERENCE_RANGES) {
      await db
        .insert(referenceRanges)
        .values({
          id: range.id,
          name: range.name,
          refMin: range.refMin ?? null,
          refMax: range.refMax ?? null,
          unit: range.unit || '',
          refText: range.refText || '',
          gender: range.gender || null,
          ageGroup: range.ageGroup || null,
          note: range.note || null
        })
        .onConflictDoUpdate({
          target: referenceRanges.id,
          set: {
            name: range.name,
            refMin: range.refMin ?? null,
            refMax: range.refMax ?? null,
            unit: range.unit || '',
            refText: range.refText || '',
            gender: range.gender || null,
            ageGroup: range.ageGroup || null,
            note: range.note || null,
            updatedAt: new Date()
          }
        });
    }

    // 5. Seed Catalog Items
    console.log('Seeding Catalog Items...');
    for (const item of INITIAL_CATALOG) {
      await db
        .insert(catalogItems)
        .values({
          code: item.code,
          category: item.category,
          name: item.name,
          refMin: item.refMin ?? null,
          refMax: item.refMax ?? null,
          unit: item.unit || '',
          refText: item.refText || '',
          price: item.price ?? null,
          scientific: item.scientific || null,
          evaluationType: item.evaluationType || null
        })
        .onConflictDoUpdate({
          target: catalogItems.code,
          set: {
            category: item.category,
            name: item.name,
            refMin: item.refMin ?? null,
            refMax: item.refMax ?? null,
            unit: item.unit || '',
            refText: item.refText || '',
            price: item.price ?? null,
            scientific: item.scientific || null,
            evaluationType: item.evaluationType || null,
            updatedAt: new Date()
          }
        });
    }

    // 6. Seed Packages
    console.log('Seeding Test Packages...');
    for (const pkg of INITIAL_PACKAGES) {
      const normalizedItems = pkg.items.map((it) =>
        typeof it === 'string' ? { code: it, equipmentId: null } : it
      );

      await db
        .insert(testPackages)
        .values({
          id: pkg.id,
          name: pkg.name,
          items: normalizedItems,
          price: pkg.price || 0
        })
        .onConflictDoUpdate({
          target: testPackages.id,
          set: {
            name: pkg.name,
            items: normalizedItems,
            price: pkg.price || 0,
            updatedAt: new Date()
          }
        });
    }

    // 7. Seed Clinic Info
    console.log('Seeding Clinic Info...');
    await db
      .insert(clinicInfo)
      .values({
        id: 'default',
        name: INITIAL_CLINIC_INFO.name,
        address: INITIAL_CLINIC_INFO.address,
        phone: INITIAL_CLINIC_INFO.phone,
        website: INITIAL_CLINIC_INFO.website || null,
        defaultDoctor: INITIAL_CLINIC_INFO.defaultDoctor,
        logoUrl: INITIAL_CLINIC_INFO.logoUrl || null,
        stampUrl: INITIAL_CLINIC_INFO.stampUrl || null,
        bankId: INITIAL_CLINIC_INFO.bankId || null,
        bankName: INITIAL_CLINIC_INFO.bankName || null,
        bankAccountNo: INITIAL_CLINIC_INFO.bankAccountNo || null,
        bankAccountName: INITIAL_CLINIC_INFO.bankAccountName || null,
        bankBranch: INITIAL_CLINIC_INFO.bankBranch || null,
        bankQrImageUrl: INITIAL_CLINIC_INFO.bankQrImageUrl || null,
        cashierName: INITIAL_CLINIC_INFO.cashierName || null,
        accountantName: INITIAL_CLINIC_INFO.accountantName || null
      })
      .onConflictDoUpdate({
        target: clinicInfo.id,
        set: {
          name: INITIAL_CLINIC_INFO.name,
          address: INITIAL_CLINIC_INFO.address,
          phone: INITIAL_CLINIC_INFO.phone,
          website: INITIAL_CLINIC_INFO.website || null,
          defaultDoctor: INITIAL_CLINIC_INFO.defaultDoctor,
          logoUrl: INITIAL_CLINIC_INFO.logoUrl || null,
          stampUrl: INITIAL_CLINIC_INFO.stampUrl || null,
          bankId: INITIAL_CLINIC_INFO.bankId || null,
          bankName: INITIAL_CLINIC_INFO.bankName || null,
          bankAccountNo: INITIAL_CLINIC_INFO.bankAccountNo || null,
          bankAccountName: INITIAL_CLINIC_INFO.bankAccountName || null,
          bankBranch: INITIAL_CLINIC_INFO.bankBranch || null,
          bankQrImageUrl: INITIAL_CLINIC_INFO.bankQrImageUrl || null,
          cashierName: INITIAL_CLINIC_INFO.cashierName || null,
          accountantName: INITIAL_CLINIC_INFO.accountantName || null,
          updatedAt: new Date()
        }
      });

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
