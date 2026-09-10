import { db } from "../db.js";

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