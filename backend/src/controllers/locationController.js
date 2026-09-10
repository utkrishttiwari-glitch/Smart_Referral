import { db } from "../db.js";

export function createLocationUpdate(io) {
  return async function (req, res) {
    try {
      const referralId = Number(req.params.referralId);
      const medicalStaffId = Number(req.body.medicalStaffId);
      const latitude = Number(req.body.latitude);
      const longitude = Number(req.body.longitude);

      if (!Number.isInteger(referralId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral ID",
        });
      }

      if (!Number.isInteger(medicalStaffId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid medical staff ID",
        });
      }

      if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid latitude",
        });
      }

      if (
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid longitude",
        });
      }

      const referral =
        await db.orm.public.Referral.first({
          id: referralId,
        });

      if (!referral) {
        return res.status(404).json({
          success: false,
          message: "Referral not found",
        });
      }

      if (referral.assignedMedicalStaffId !== medicalStaffId) {
        return res.status(400).json({
          success: false,
          message:
            "Medical staff is not assigned to this referral",
        });
      }

      const medicalStaff =
        await db.orm.public.MedicalStaff.first({
          id: medicalStaffId,
        });

      if (!medicalStaff) {
        return res.status(404).json({
          success: false,
          message: "Medical staff not found",
        });
      }

      const locationUpdate =
        await db.orm.public.LocationUpdate.create({
          referralId,
          medicalStaffId,
          latitude,
          longitude,
        });

      // Broadcast the new location to everyone
      // watching this specific referral.
      io.to(`referral-${referralId}`).emit(
        "location-update",
        locationUpdate
      );

      return res.status(201).json({
        success: true,
        message: "Location update recorded successfully",
        data: locationUpdate,
      });
    } catch (error) {
      console.error(
        "Failed to create location update:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to create location update",
      });
    }
  };
}

export async function getReferralLocations(req, res) {
  try {
    const referralId = Number(req.params.referralId);

    if (!Number.isInteger(referralId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid referral ID",
      });
    }

    const referral =
      await db.orm.public.Referral.first({
        id: referralId,
      });

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

    const locations =
      await db.orm.public.LocationUpdate
        .where({
          referralId,
        })
        .select(
          "id",
          "referralId",
          "medicalStaffId",
          "latitude",
          "longitude",
          "recordedAt",
          "createdAt"
        )
        .all();

    return res.status(200).json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error(
      "Failed to get referral locations:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get referral locations",
    });
  }
}

export async function getLatestReferralLocation(req, res) {
  try {
    const referralId = Number(req.params.referralId);

    if (!Number.isInteger(referralId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid referral ID",
      });
    }

    const referral =
      await db.orm.public.Referral.first({
        id: referralId,
      });

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

    const locations =
      await db.orm.public.LocationUpdate
        .where({
          referralId,
        })
        .select(
          "id",
          "referralId",
          "medicalStaffId",
          "latitude",
          "longitude",
          "recordedAt",
          "createdAt"
        )
        .all();

    if (locations.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No location updates found for this referral",
      });
    }

    const latestLocation = [...locations].sort(
      (a, b) =>
        new Date(String(b.recordedAt)).getTime() -
        new Date(String(a.recordedAt)).getTime()
    )[0];

    return res.status(200).json({
      success: true,
      data: latestLocation,
    });
  } catch (error) {
    console.error(
      "Failed to get latest referral location:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get latest referral location",
    });
  }
}