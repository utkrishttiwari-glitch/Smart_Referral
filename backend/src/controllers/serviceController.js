import { db } from "../db.js";

export async function getServices(req, res) {
  try {
    const services = await db.orm.public.Service
      .where({
        isActive: true,
      })
      .select(
        "id",
        "name",
        "description",
        "isActive"
      )
      .all();

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("Failed to fetch services:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
    });
  }
}