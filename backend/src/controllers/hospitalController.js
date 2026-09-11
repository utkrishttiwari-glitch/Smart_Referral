import { db } from "../db.js";
import { pool } from "../sql.js";
import { calculateFreshness } from "../services/freshnessService.js";

export async function getHospitals(req, res) {
  try {
   const hospitals = await db.orm.public.Hospital
  .where({
    isActive: true,
  })
  .select(
    "id",
    "name",
    "address",
    "city",
    "state",
    "latitude",
    "longitude",
    "phone",
    "isActive"
  )
  .all();

    res.json({
      success: true,
      data: hospitals,
    });
  } catch (error) {
    console.error("Failed to fetch hospitals:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch hospitals",
    });
  }
}

export async function getHospitalById(req, res) {
  try {
    const hospitalId = Number(req.params.id);

    if (!Number.isInteger(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hospital ID",
      });
    }

    const hospital = await db.orm.public.Hospital.first({
      id: hospitalId,
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    res.json({
      success: true,
      data: hospital,
    });
  } catch (error) {
    console.error("Failed to fetch hospital:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch hospital",
    });
  }
}

export async function getHospitalServices(req, res) {
  try {
    const hospitalId = Number(req.params.id);

    if (!Number.isInteger(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hospital ID",
      });
    }

    const hospital = await db.orm.public.Hospital.first({
      id: hospitalId,
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    const services = await db.orm.public.HospitalService
      .where({
        hospitalId,
      })
      .select(
        "id",
        "hospitalId",
        "serviceId",
        "isAvailable",
        "capacity",
        "notes",
        "updatedAt"
      )
      .all();

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("Failed to fetch hospital services:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch hospital services",
    });
  }
}


export async function getHospitalBeds(req, res) {
  try {
    const hospitalId = Number(req.params.id);

    if (!Number.isInteger(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hospital ID",
      });
    }

    const hospital = await db.orm.public.Hospital.first({
      id: hospitalId,
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    const beds = await db.orm.public.BedAvailability
      .where({
        hospitalId,
      })
      .select(
        "id",
        "hospitalId",
        "bedType",
        "totalBeds",
        "availableBeds",
        "updatedAt"
      )
      .all();

    res.json({
      success: true,
      data: beds,
    });
  } catch (error) {
    console.error("Failed to fetch hospital beds:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch hospital beds",
    });
  }
}

export async function getHospitalDataStatus(req, res) {
  try {
    const hospitalId = Number(req.params.id);

    if (!Number.isInteger(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hospital ID",
      });
    }

    const hospital = await db.orm.public.Hospital.first({
      id: hospitalId,
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    const dataStatus = await db.orm.public.HospitalDataUpdate
      .where({
        hospitalId,
      })
      .select(
        "id",
        "hospitalId",
        "source",
        "dataType",
        "updatedAt",
        "isVerified"
      )
      .all();

    const enrichedStatus = dataStatus.map((item) => {
      const freshness = calculateFreshness(item.updatedAt);
      const confidence = item.isVerified && freshness.confidence === "HIGH"
        ? "VERY_HIGH"
        : item.isVerified && freshness.confidence === "MEDIUM"
          ? "MEDIUM"
          : freshness.confidence;
      return {
        ...item,
        confidence,
        isUpdatedToday: freshness.isUpdatedToday,
        ageMinutes: freshness.ageMinutes,
      };
    });

    res.json({
      success: true,
      data: enrichedStatus,
    });
  } catch (error) {
    console.error("Failed to fetch hospital data status:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch hospital data status",
    });
  }
}


export function updateHospitalService(io) {
  return async function (req, res) {
    try {
      const hospitalId = Number(req.params.hospitalId);
      const serviceId = Number(req.params.serviceId);

      const { isAvailable, capacity, notes } = req.body;

      if (!Number.isInteger(hospitalId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid hospital ID",
        });
      }

      if (!Number.isInteger(serviceId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid service ID",
        });
      }

      if (typeof isAvailable !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isAvailable must be true or false",
        });
      }

      if (
        capacity !== undefined &&
        capacity !== null &&
        (!Number.isInteger(Number(capacity)) ||
          Number(capacity) < 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Capacity must be a non-negative integer",
        });
      }

      // Check hospital
      const hospital =
        await db.orm.public.Hospital.first({
          id: hospitalId,
        });

      if (!hospital) {
        return res.status(404).json({
          success: false,
          message: "Hospital not found",
        });
      }

      // Check service
      const service =
        await db.orm.public.Service.first({
          id: serviceId,
        });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      // Check hospital-service relationship
      const hospitalService =
        await db.orm.public.HospitalService.first({
          hospitalId,
          serviceId,
        });

      if (!hospitalService) {
        return res.status(404).json({
          success: false,
          message:
            "This service is not configured for the hospital",
        });
      }

      const newCapacity =
        capacity === undefined
          ? hospitalService.capacity
          : Number(capacity);

      const newNotes =
        notes === undefined
          ? hospitalService.notes
          : notes || null;

      /*
       * Prisma ORM update currently has a runtime issue
       * in our Prisma 8 RC setup, so use pg for this update.
       */
      const result = await pool.query(
        `
       UPDATE "hospitalService"
        SET
          "isAvailable" = $1,
          "capacity" = $2,
          "notes" = $3,
          "updatedAt" = NOW()
        WHERE
          "hospitalId" = $4
          AND "serviceId" = $5
        RETURNING
          "id",
          "hospitalId",
          "serviceId",
          "isAvailable",
          "capacity",
          "notes",
          "updatedAt"
        `,
        [
          isAvailable,
          newCapacity,
          newNotes,
          hospitalId,
          serviceId,
        ]
      );

      const updatedService = result.rows[0];

      /*
       * Broadcast to everyone listening to hospital updates.
       */
      io.emit(
        "hospital-service-updated",
        {
          ...updatedService,
          hospitalName: hospital.name,
          serviceName: service.name,
        }
      );

      return res.status(200).json({
        success: true,
        message:
          "Hospital service updated successfully",
        data: {
          ...updatedService,
          hospitalName: hospital.name,
          serviceName: service.name,
        },
      });
    } catch (error) {
      console.error(
        "Failed to update hospital service:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update hospital service",
      });
    }
  };
}

export function updateHospitalBed(io) {
  return async function (req, res) {
    try {
      const hospitalId = Number(req.params.hospitalId);
      const bedType = req.params.bedType;

      const {
        totalBeds,
        availableBeds,
      } = req.body;

      if (!Number.isInteger(hospitalId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid hospital ID",
        });
      }

      if (!bedType) {
        return res.status(400).json({
          success: false,
          message: "Bed type is required",
        });
      }

      if (
        !Number.isInteger(Number(totalBeds)) ||
        Number(totalBeds) < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "totalBeds must be a non-negative integer",
        });
      }

      if (
        !Number.isInteger(Number(availableBeds)) ||
        Number(availableBeds) < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "availableBeds must be a non-negative integer",
        });
      }

      if (Number(availableBeds) > Number(totalBeds)) {
        return res.status(400).json({
          success: false,
          message:
            "availableBeds cannot exceed totalBeds",
        });
      }

      const hospital =
        await db.orm.public.Hospital.first({
          id: hospitalId,
        });

      if (!hospital) {
        return res.status(404).json({
          success: false,
          message: "Hospital not found",
        });
      }

      const existingBed =
        await db.orm.public.BedAvailability.first({
          hospitalId,
          bedType,
        });

      if (!existingBed) {
        return res.status(404).json({
          success: false,
          message:
            "Bed type is not configured for this hospital",
        });
      }

      const result = await pool.query(
        `
        UPDATE "bedAvailability"
        SET
          "totalBeds" = $1,
          "availableBeds" = $2,
          "updatedAt" = NOW()
        WHERE
          "hospitalId" = $3
          AND "bedType" = $4
        RETURNING
          "id",
          "hospitalId",
          "bedType",
          "totalBeds",
          "availableBeds",
          "updatedAt"
        `,
        [
          Number(totalBeds),
          Number(availableBeds),
          hospitalId,
          bedType,
        ]
      );

      const updatedBed = result.rows[0];

      io.emit(
        "hospital-bed-updated",
        {
          ...updatedBed,
          hospitalName: hospital.name,
        }
      );

      return res.status(200).json({
        success: true,
        message:
          "Hospital bed availability updated successfully",
        data: {
          ...updatedBed,
          hospitalName: hospital.name,
        },
      });

    } catch (error) {

      console.error(
        "Failed to update hospital bed availability:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update hospital bed availability",
      });
    }
  };
}



export async function confirmHospitalData(req, res) {
  try {
    const hospitalId = Number(req.params.hospitalId);
    const { dataType } = req.body;

    if (!Number.isInteger(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hospital ID",
      });
    }

    if (!dataType) {
      return res.status(400).json({
        success: false,
        message: "dataType is required",
      });
    }

    const allowedDataTypes = [
      "SERVICE_AVAILABILITY",
      "BED_AVAILABILITY",
    ];

    if (!allowedDataTypes.includes(dataType)) {
      return res.status(400).json({
        success: false,
        message: `dataType must be one of: ${allowedDataTypes.join(", ")}`,
      });
    }

    // Check hospital exists
    const hospital = await db.orm.public.Hospital
      .where({ id: hospitalId })
      .select()
      .first();

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    // Simulated hospital confirmation.
    // We record this as a new audit event instead of
    // overwriting the previous data-update record.
    const result = await pool.query(
      `
      INSERT INTO "hospitalDataUpdate"
        ("hospitalId", "source", "dataType", "updatedAt", "isVerified")
      VALUES
        ($1, $2, $3, NOW(), $4)
      RETURNING
        "id",
        "hospitalId",
        "source",
        "dataType",
        "updatedAt",
        "isVerified"
      `,
      [
        hospitalId,
        "MANUAL_CALL",
        dataType,
        true,
      ]
    );

    const confirmation = result.rows[0];

    const responseData = {
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      dataType: confirmation.dataType,
      source: confirmation.source,
      isVerified: confirmation.isVerified,
      updatedAt: confirmation.updatedAt,
      confirmationMethod: "DUMMY_CALL",
      confirmationStatus: "CONFIRMED",
    };

    // Send real-time confirmation to connected clients.
    if (req.io) {
      req.io.emit("hospital-data-confirmed", responseData);
    }

    return res.status(200).json({
      success: true,
      message: "Hospital data confirmed successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Hospital confirmation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to confirm hospital data",
    });
  }
}