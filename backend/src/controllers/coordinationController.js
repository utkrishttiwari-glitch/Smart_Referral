import { pool } from "../sql.js";

const consultationStatuses = ["REQUESTED", "ACCEPTED", "IN_PROGRESS", "COMPLETED"];
const medicineStatuses = ["AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK"];

function emitConsultation(req, consultation) {
  const io = req.app.locals.io;
  if (io) {
    io.emit("consultation-status-updated", consultation);
  }
}

export async function getDoctors(req, res) {
  const result = await pool.query(`SELECT * FROM "doctor" WHERE "verificationStatus" = 'VERIFIED' ORDER BY "isAvailable" DESC, "name"`);
  return res.json({ success: true, data: result.rows });
}

export async function createConsultation(req, res) {
  try {
    const { patientName, doctorId, medicalStaffId, referralId, context } = req.body;
    if (!patientName || !Number.isInteger(Number(doctorId))) {
      return res.status(400).json({ success: false, message: "patientName and doctorId are required" });
    }
    const doctor = await pool.query(`SELECT * FROM "doctor" WHERE "id" = $1 AND "verificationStatus" = 'VERIFIED'`, [Number(doctorId)]);
    if (!doctor.rows[0]) return res.status(404).json({ success: false, message: "Verified doctor not found" });
    const result = await pool.query(`INSERT INTO "teleconsultation" ("patientName", "doctorId", "medicalStaffId", "referralId", "context") VALUES ($1, $2, $3, $4, $5) RETURNING *`, [patientName, Number(doctorId), medicalStaffId ? Number(medicalStaffId) : null, referralId ? Number(referralId) : null, context || null]);
    const consultation = { ...result.rows[0], doctor: doctor.rows[0] };
    emitConsultation(req, consultation);
    return res.status(201).json({ success: true, data: consultation });
  } catch (error) {
    console.error("Create consultation error:", error);
    return res.status(500).json({ success: false, message: "Failed to start consultation" });
  }
}

export async function getConsultations(req, res) {
  const result = await pool.query(`SELECT c.*, d."name" AS "doctorName", d."specialization", d."verificationStatus", ms."name" AS "medicalStaffName", ms."ambulanceNumber" FROM "teleconsultation" c JOIN "doctor" d ON d."id" = c."doctorId" LEFT JOIN "medicalStaff" ms ON ms."id" = c."medicalStaffId" ORDER BY c."createdAt" DESC`);
  return res.json({ success: true, data: result.rows });
}

export async function getConsultationMessages(req, res) {
  const result = await pool.query(
    `SELECT * FROM "consultationMessage" WHERE "consultationId" = $1 ORDER BY "createdAt" ASC`,
    [Number(req.params.id)]
  );
  return res.json({ success: true, data: result.rows });
}

export async function updateConsultation(req, res) {
  try {
    const status = String(req.body.status || "").toUpperCase();
    if (!consultationStatuses.includes(status)) return res.status(400).json({ success: false, message: "Invalid consultation status" });
    const result = await pool.query(`UPDATE "teleconsultation" SET "status" = $1, "updatedAt" = NOW() WHERE "id" = $2 RETURNING *`, [status, Number(req.params.id)]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: "Consultation not found" });
    emitConsultation(req, result.rows[0]);
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Update consultation error:", error);
    return res.status(500).json({ success: false, message: "Failed to update consultation" });
  }
}

export async function addConsultationMessage(req, res) {
  const { senderRole, senderName, messageType, content } = req.body;
  if (!senderRole || !senderName || !content) return res.status(400).json({ success: false, message: "senderRole, senderName and content are required" });
  const result = await pool.query(`INSERT INTO "consultationMessage" ("consultationId", "senderRole", "senderName", "messageType", "content") VALUES ($1, $2, $3, $4, $5) RETURNING *`, [Number(req.params.id), senderRole, senderName, messageType || "NOTE", content]);
  const io = req.app.locals.io;
  if (io) io.emit("consultation-message", result.rows[0]);
  return res.status(201).json({ success: true, data: result.rows[0] });
}

export async function getMedicineProviders(req, res) {
  const result = await pool.query(`SELECT p.*, COALESCE(json_agg(json_build_object('id', a."id", 'medicineName', a."medicineName", 'status', a."status", 'quantity', a."quantity", 'updatedAt', a."updatedAt") ORDER BY a."medicineName") FILTER (WHERE a."id" IS NOT NULL), '[]') AS medicines FROM "medicineProvider" p LEFT JOIN "medicineAvailability" a ON a."providerId" = p."id" WHERE p."isActive" = TRUE GROUP BY p."id" ORDER BY p."name"`);
  return res.json({ success: true, data: result.rows });
}

export async function updateMedicineAvailability(req, res) {
  const { medicineName, status, quantity } = req.body;
  if (!medicineName || !medicineStatuses.includes(String(status).toUpperCase())) return res.status(400).json({ success: false, message: "medicineName and a valid status are required" });
  const result = await pool.query(`INSERT INTO "medicineAvailability" ("providerId", "medicineName", "status", "quantity") VALUES ($1, $2, $3, $4) ON CONFLICT ("providerId", "medicineName") DO UPDATE SET "status" = EXCLUDED."status", "quantity" = EXCLUDED."quantity", "updatedAt" = NOW() RETURNING *`, [Number(req.params.providerId), medicineName, String(status).toUpperCase(), quantity === null || quantity === undefined ? null : Number(quantity)]);
  return res.json({ success: true, data: result.rows[0] });
}
