import { db } from "../db.js";
import { pool } from "../sql.js";

export async function createMedicalStaff(req, res) {
  try {
    const {
      name,
      role,
      phone,
      licenseNumber,
      ambulanceNumber,
    } = req.body;

    if (!name || !role) {
      return res.status(400).json({
        success: false,
        message: "Name and role are required",
      });
    }

    const medicalStaff =
      await db.orm.public.MedicalStaff.create({
        name,
        role,
        phone: phone || null,
        licenseNumber: licenseNumber || null,
        ambulanceNumber: ambulanceNumber || null,
        isAvailable: true,
      });

    return res.status(201).json({
      success: true,
      message: "Medical staff created successfully",
      data: medicalStaff,
    });
  } catch (error) {
    console.error("Failed to create medical staff:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create medical staff",
    });
  }
}

export async function getMedicalStaff(req, res) {
  try {
    const staff =
      await db.orm.public.MedicalStaff
        .select(
          "id",
          "name",
          "role",
          "phone",
          "licenseNumber",
          "ambulanceNumber",
          "isAvailable",
          "createdAt",
          "updatedAt"
        )
        .all();

    return res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error("Failed to get medical staff:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get medical staff",
    });
  }
}

/*
=========================================================
ASSIGN MEDICAL STAFF TO REFERRAL
=========================================================
PATCH /api/referrals/:referralId/assign-medical-staff
*/

export async function assignMedicalStaff(req, res) {
  try {
    const referralId = Number(req.params.referralId);
    const medicalStaffId = Number(req.body.medicalStaffId);

    if (
      !Number.isInteger(referralId) ||
      referralId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid referralId is required",
      });
    }

    if (
      !Number.isInteger(medicalStaffId) ||
      medicalStaffId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid medicalStaffId is required",
      });
    }

    // Check referral
    const referralResult = await pool.query(
      `
      SELECT
        "id",
        "patientName",
        "destinationHospitalId",
        "status",
        "assignedMedicalStaffId"
      FROM "referral"
      WHERE "id" = $1
      LIMIT 1
      `,
      [referralId]
    );

    if (referralResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

    const referral = referralResult.rows[0];

    // Check medical staff
    const staffResult = await pool.query(
      `
      SELECT
        "id",
        "name",
        "role",
        "phone",
        "licenseNumber",
        "ambulanceNumber",
        "isAvailable"
      FROM "medicalStaff"
      WHERE "id" = $1
      LIMIT 1
      `,
      [medicalStaffId]
    );

    if (staffResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Medical staff not found",
      });
    }

    const staff = staffResult.rows[0];

    if (!staff.isAvailable) {
      return res.status(409).json({
        success: false,
        message: "Medical staff is currently unavailable",
      });
    }

    // Assign staff to referral
    const updateResult = await pool.query(
      `
      UPDATE "referral"
      SET
        "assignedMedicalStaffId" = $1,
        "status" = 'AMBULANCE_ASSIGNED',
        "updatedAt" = NOW()
      WHERE "id" = $2
      RETURNING
        "id",
        "patientName",
        "referringDoctorName",
        "requiredServiceId",
        "destinationHospitalId",
        "status",
        "urgency",
        "reason",
        "notes",
        "assignedMedicalStaffId",
        "createdAt",
        "updatedAt"
      `,
      [medicalStaffId, referralId]
    );

    const updatedReferral = updateResult.rows[0];

    // Mark staff unavailable after assignment
    await pool.query(
      `
      UPDATE "medicalStaff"
      SET
        "isAvailable" = false,
        "updatedAt" = NOW()
      WHERE "id" = $1
      `,
      [medicalStaffId]
    );

    // Notify connected clients
    const io = req.app.locals.io;

    if (io) {
      io.to(`referral-${referralId}`).emit(
        "medical-staff-assigned",
        {
          referralId,
          medicalStaff: staff,
          status: "AMBULANCE_ASSIGNED",
        }
      );

      io.emit("referral-updated", {
        referralId,
        status: "AMBULANCE_ASSIGNED",
        medicalStaff: staff,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Medical staff assigned successfully",
      data: {
        referral: updatedReferral,
        medicalStaff: staff,
      },
    });
  } catch (error) {
    console.error(
      "Failed to assign medical staff:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to assign medical staff",
    });
  }
}