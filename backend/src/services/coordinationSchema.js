import { pool } from "../sql.js";

export async function ensureCoordinationSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "doctor" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "specialization" TEXT NOT NULL,
      "licenseNumber" TEXT,
      "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
      "isAvailable" BOOLEAN NOT NULL DEFAULT TRUE,
      "profile" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "teleconsultation" (
      "id" SERIAL PRIMARY KEY,
      "patientName" TEXT NOT NULL,
      "doctorId" INTEGER NOT NULL REFERENCES "doctor"("id"),
      "medicalStaffId" INTEGER REFERENCES "medicalStaff"("id"),
      "referralId" INTEGER REFERENCES "referral"("id"),
      "status" TEXT NOT NULL DEFAULT 'REQUESTED',
      "context" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "consultationMessage" (
      "id" SERIAL PRIMARY KEY,
      "consultationId" INTEGER NOT NULL REFERENCES "teleconsultation"("id") ON DELETE CASCADE,
      "senderRole" TEXT NOT NULL,
      "senderName" TEXT NOT NULL,
      "messageType" TEXT NOT NULL DEFAULT 'NOTE',
      "content" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "medicineProvider" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'MEDICINE_PROVIDER',
      "phone" TEXT,
      "location" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "medicineAvailability" (
      "id" SERIAL PRIMARY KEY,
      "providerId" INTEGER NOT NULL REFERENCES "medicineProvider"("id") ON DELETE CASCADE,
      "medicineName" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
      "quantity" INTEGER,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE ("providerId", "medicineName")
    );
  `);
}

export async function seedCoordinationData() {
  await pool.query(`
    INSERT INTO "doctor" ("name", "specialization", "licenseNumber", "verificationStatus", "isAvailable", "profile")
    SELECT 'Dr. Ananya Sharma', 'Emergency Medicine', 'DEMO-VERIFIED-001', 'VERIFIED', TRUE, 'Verified emergency physician available for prototype consultations.'
    WHERE NOT EXISTS (SELECT 1 FROM "doctor");

    INSERT INTO "doctor" ("name", "specialization", "licenseNumber", "verificationStatus", "isAvailable", "profile")
    SELECT 'Dr. Rohan Mehta', 'Cardiology', 'DEMO-VERIFIED-002', 'VERIFIED', TRUE, 'Verified cardiology specialist available for prototype consultations.'
    WHERE NOT EXISTS (SELECT 1 FROM "doctor" WHERE "specialization" = 'Cardiology');

    INSERT INTO "medicineProvider" ("name", "role", "phone", "location")
    SELECT 'Sharma Medical Store', 'MEDICINE_PROVIDER', '011-40000009', 'Near District Hospital'
    WHERE NOT EXISTS (SELECT 1 FROM "medicineProvider");

    INSERT INTO "medicineAvailability" ("providerId", "medicineName", "status", "quantity")
    SELECT p."id", item."medicineName", item."status", item."quantity"
    FROM "medicineProvider" p
    CROSS JOIN (VALUES
      ('Paracetamol', 'AVAILABLE', 48),
      ('ORS', 'AVAILABLE', 24),
      ('Antibiotic X', 'LOW_STOCK', 4),
      ('Medicine Y', 'OUT_OF_STOCK', 0)
    ) AS item("medicineName", "status", "quantity")
    WHERE NOT EXISTS (SELECT 1 FROM "medicineAvailability");
  `);
}
