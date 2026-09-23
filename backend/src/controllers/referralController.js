import { db } from "../db.js";
import { pool } from "../sql.js";
import { findEligibleHospitals } from "../services/recommendationService.js";

/*
=========================================================
FORMAT REFERRAL ROW
=========================================================
*/

function formatReferralRow(row) {
  return {
    id: row.id,
    patientName: row.patientName,
    referringDoctorName: row.referringDoctorName,

    requiredServiceId: row.requiredServiceId,
    destinationHospitalId: row.destinationHospitalId,

    status: row.status,
    urgency: row.urgency,
    reason: row.reason,
    notes: row.notes,

    createdAt: row.createdAt,
    updatedAt: row.updatedAt,

    requiredService: row.serviceId
      ? {
          id: row.serviceId,
          name: row.serviceName,
          description: row.serviceDescription,
        }
      : null,

    destinationHospital: row.hospitalId
      ? {
          id: row.hospitalId,
          name: row.hospitalName,
          city: row.hospitalCity,
          address: row.hospitalAddress,
          state: row.hospitalState,
          latitude: row.hospitalLatitude,
          longitude: row.hospitalLongitude,
          phone: row.hospitalPhone,
        }
      : null,

    medicalStaff: row.medicalStaffId
      ? {
          id: row.medicalStaffId,
          name: row.medicalStaffName,
          role: row.medicalStaffRole,
          phone: row.medicalStaffPhone,
          licenseNumber: row.medicalStaffLicenseNumber,
          ambulanceNumber: row.medicalStaffAmbulanceNumber,
          isAvailable: row.medicalStaffIsAvailable,
        }
      : null,
  };
}

/*
=========================================================
CREATE REFERRAL
=========================================================
*/

export async function createReferral(req, res) {
  try {
    const {
      patientName,
      referringDoctorName,
      requiredServiceId,
      destinationHospitalId,
      urgency,
      reason,
      notes,
    } = req.body;

    if (
      !patientName ||
      !requiredServiceId ||
      !destinationHospitalId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "patientName, requiredServiceId and destinationHospitalId are required.",
      });
    }

    const result =
      await db.orm.public.Referral.create({
        patientName,
        referringDoctorName:
          referringDoctorName || null,
        requiredServiceId:
          Number(requiredServiceId),
        destinationHospitalId:
          Number(destinationHospitalId),
        urgency: urgency || null,
        reason: reason || null,
        notes: notes || null,
        status: "CREATED",
      });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Create referral error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create referral.",
    });
  }
}

/*
=========================================================
GET ALL REFERRALS
=========================================================
*/

export async function getReferrals(req, res) {
  try {
    const referralsResult = await pool.query(
      `
      SELECT
        r.id,
        r."patientName",
        r."referringDoctorName",
        r."requiredServiceId",
        r."destinationHospitalId",
        r.status,
        r.urgency,
        r.reason,
        r.notes,
        r."createdAt",
        r."updatedAt",

        s.id AS "serviceId",
        s.name AS "serviceName",
        s.description AS "serviceDescription",

        h.id AS "hospitalId",
        h.name AS "hospitalName",
        h.city AS "hospitalCity",
        h.address AS "hospitalAddress",
        h.state AS "hospitalState",
        h.latitude AS "hospitalLatitude",
        h.longitude AS "hospitalLongitude",
        h.phone AS "hospitalPhone",

        ms.id AS "medicalStaffId",
        ms.name AS "medicalStaffName",
        ms.role AS "medicalStaffRole",
        ms.phone AS "medicalStaffPhone",
        ms."licenseNumber" AS "medicalStaffLicenseNumber",
        ms."ambulanceNumber" AS "medicalStaffAmbulanceNumber",
        ms."isAvailable" AS "medicalStaffIsAvailable"

      FROM "referral" r

      LEFT JOIN "service" s
        ON s.id = r."requiredServiceId"

      LEFT JOIN "hospital" h
        ON h.id = r."destinationHospitalId"

      LEFT JOIN "medicalStaff" ms
        ON ms.id = r."assignedMedicalStaffId"

      ORDER BY r."createdAt" DESC
      `
    );

    const referrals =
      referralsResult.rows.map(formatReferralRow);

    return res.json({
      success: true,
      data: referrals,
    });
  } catch (error) {
    console.error(
      "Get referrals error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch referrals.",
    });
  }
}

/*
=========================================================
GET SINGLE REFERRAL
=========================================================
*/

export async function getReferralById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid referral ID.",
      });
    }

    const referralResult = await pool.query(
      `
      SELECT
        r.id,
        r."patientName",
        r."referringDoctorName",
        r."requiredServiceId",
        r."destinationHospitalId",
        r.status,
        r.urgency,
        r.reason,
        r.notes,
        r."createdAt",
        r."updatedAt",

        s.id AS "serviceId",
        s.name AS "serviceName",
        s.description AS "serviceDescription",

        h.id AS "hospitalId",
        h.name AS "hospitalName",
        h.city AS "hospitalCity",
        h.address AS "hospitalAddress",
        h.state AS "hospitalState",
        h.latitude AS "hospitalLatitude",
        h.longitude AS "hospitalLongitude",
        h.phone AS "hospitalPhone",

        ms.id AS "medicalStaffId",
        ms.name AS "medicalStaffName",
        ms.role AS "medicalStaffRole",
        ms.phone AS "medicalStaffPhone",
        ms."licenseNumber" AS "medicalStaffLicenseNumber",
        ms."ambulanceNumber" AS "medicalStaffAmbulanceNumber",
        ms."isAvailable" AS "medicalStaffIsAvailable"

      FROM "referral" r

      LEFT JOIN "service" s
        ON s.id = r."requiredServiceId"

      LEFT JOIN "hospital" h
        ON h.id = r."destinationHospitalId"

      LEFT JOIN "medicalStaff" ms
        ON ms.id = r."assignedMedicalStaffId"

      WHERE r.id = $1
      `,
      [id]
    );

    const referral = referralResult.rows[0]
      ? formatReferralRow(referralResult.rows[0])
      : null;

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found.",
      });
    }

    return res.json({
      success: true,
      data: referral,
    });
  } catch (error) {
    console.error(
      "Get referral error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch referral.",
    });
  }
}

/*
=========================================================
GET REFERRALS FOR HOSPITAL
=========================================================
*/

export async function getHospitalReferrals(req, res) {
  try {
    const hospitalId = Number(
      req.params.hospitalId
    );

    console.log(
      "Fetching referrals for hospital:",
      hospitalId
    );

    if (!Number.isInteger(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hospital ID.",
      });
    }

    /*
    ========================================================
    GET HOSPITAL
    ========================================================
    */

    const hospitalResult = await pool.query(
      `
      SELECT
        h.id,
        h.name,
        h.city,
        h.address,
        h.state,
        h.latitude,
        h.longitude,
        h.phone
      FROM "hospital" h
      WHERE h.id = $1
      `,
      [hospitalId]
    );

    if (hospitalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found.",
      });
    }

    const hospital =
      hospitalResult.rows[0];

    /*
    ========================================================
    GET REFERRALS
    ========================================================
    */

    const referralsResult = await pool.query(
      `
      SELECT
        r.id,
        r."patientName",
        r."referringDoctorName",
        r."requiredServiceId",
        r."destinationHospitalId",
        r.status,
        r.urgency,
        r.reason,
        r.notes,
        r."createdAt",
        r."updatedAt",

        s.id AS "serviceId",
        s.name AS "serviceName",
        s.description AS "serviceDescription",

        ms.id AS "medicalStaffId",
        ms.name AS "medicalStaffName",
        ms.role AS "medicalStaffRole",
        ms.phone AS "medicalStaffPhone",
        ms."ambulanceNumber" AS "ambulanceNumber"

      FROM "referral" r

      LEFT JOIN "service" s
        ON s.id = r."requiredServiceId"

      LEFT JOIN "medicalStaff" ms
        ON ms.id = r."assignedMedicalStaffId"

      WHERE r."destinationHospitalId" = $1

      ORDER BY r."createdAt" DESC
      `,
      [hospitalId]
    );

    /*
    ========================================================
    FORMAT RESPONSE
    ========================================================
    */

    const referrals =
      referralsResult.rows.map(
        (row) => ({
          id: row.id,

          patientName:
            row.patientName,

          referringDoctorName:
            row.referringDoctorName,

          requiredServiceId:
            row.requiredServiceId,

          destinationHospitalId:
            row.destinationHospitalId,

          status:
            row.status,

          urgency:
            row.urgency,

          reason:
            row.reason,

          notes:
            row.notes,

          createdAt:
            row.createdAt,

          updatedAt:
            row.updatedAt,

          requiredService:
            row.serviceId
              ? {
                  id:
                    row.serviceId,

                  name:
                    row.serviceName,

                  description:
                    row.serviceDescription,
                }
              : null,

          medicalStaff:
            row.medicalStaffId
              ? {
                  id:
                    row.medicalStaffId,

                  name:
                    row.medicalStaffName,

                  role:
                    row.medicalStaffRole,

                  phone:
                    row.medicalStaffPhone,

                  ambulanceNumber:
                    row.ambulanceNumber,
                }
              : null,
        })
      );

    console.log(
      `Found ${referrals.length} referrals for hospital ${hospitalId}`
    );

    return res.json({
      success: true,
      hospital,
      data: referrals,
    });
  } catch (error) {
    console.error(
      "Get hospital referrals error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch hospital referrals.",
      error: error.message,
    });
  }
}

/*
=========================================================
UPDATE REFERRAL STATUS
=========================================================
*/

export async function updateReferralStatus(
  req,
  res
) {
  const referralId = Number(
    req.params.id
  );

  const {
    status,
    message,
  } = req.body;

  const allowedStatuses = [
    "CREATED",
    "SENT",
    "RECEIVED",
    "ACCEPTED",
    "REJECTED",
    "AMBULANCE_ASSIGNED",
    "IN_TRANSIT",
    "ARRIVED",
    "COMPLETED",
  ];

  if (!Number.isInteger(referralId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid referral ID.",
    });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid referral status.",
    });
  }

  try {
    /*
    ========================================================
    CHECK REFERRAL
    ========================================================
    */

    const referralResult =
      await pool.query(
        `
        SELECT
          r.*,
          h.name AS "hospitalName",
          s.name AS "serviceName"
        FROM "referral" r

        JOIN "hospital" h
          ON h.id = r."destinationHospitalId"

        JOIN "service" s
          ON s.id = r."requiredServiceId"

        WHERE r.id = $1
        `,
        [referralId]
      );

    if (
      referralResult.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "Referral not found.",
      });
    }

    const referral =
      referralResult.rows[0];

    /*
    ========================================================
    UPDATE STATUS
    ========================================================
    */

    const updateResult =
      await pool.query(
        `
        UPDATE "referral"
        SET
          "status" = $1,
          "updatedAt" = NOW()
        WHERE "id" = $2
        RETURNING *
        `,
        [
          status,
          referralId,
        ]
      );

    /*
    ========================================================
    ACCEPTED
    Create pre-arrival alert automatically.
    ========================================================
    */

    let alert = null;

    if (status === "ACCEPTED") {
      const alertMessage =
        message ||
        `Incoming referral accepted by ${referral.hospitalName}. ` +
        `Prepare ${referral.serviceName} for patient ${referral.patientName}.`;

      const alertResult =
        await pool.query(
          `
          INSERT INTO "preArrivalAlert"
          (
            "referralId",
            "message",
            "status",
            "sentAt",
            "createdAt",
            "updatedAt"
          )
          VALUES
          (
            $1,
            $2,
            'SENT',
            NOW(),
            NOW(),
            NOW()
          )
          RETURNING *
          `,
          [
            referralId,
            alertMessage,
          ]
        );

      alert =
        alertResult.rows[0];
    }

    /*
    ========================================================
    SOCKET EVENTS
    ========================================================
    */

    const io =
      req.app.locals.io;

    if (io) {
      io.to(
        `referral-${referralId}`
      ).emit(
        "referral-status-updated",
        {
          referralId,
          status,
          hospitalName:
            referral.hospitalName,
          message:
            message || null,
        }
      );

      if (alert) {
        io.to(
          `referral-${referralId}`
        ).emit(
          "pre-arrival-alert",
          alert
        );
      }
    }

    /*
    ========================================================
    RESPONSE
    ========================================================
    */

    return res.json({
      success: true,

      message:
        `Referral ${status.toLowerCase()}.`,

      data: {
        referral:
          updateResult.rows[0],

        alert,
      },
    });
  } catch (error) {
    console.error(
      "Update referral status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update referral status.",
      error:
        error.message,
    });
  }
}

/*
=========================================================
CREATE INSTANT REFERRAL
=========================================================
*/

export async function createInstantReferral(
  req,
  res
) {
  try {
    const {
      patientName,
      referringDoctorName,
      requiredServiceId,
      destinationHospitalId,
      reason,
      notes,
      latitude,
      longitude,
    } = req.body;

    /*
    ========================================================
    VALIDATION
    ========================================================
    */

    if (
      !patientName ||
      !requiredServiceId ||
      !destinationHospitalId ||
      !Number.isFinite(Number(latitude)) ||
      !Number.isFinite(Number(longitude))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "patientName, requiredServiceId, destinationHospitalId, latitude and longitude are required.",
      });
    }

    /*
    ========================================================
    1. CHECK INSTANT REFERRAL ELIGIBILITY
    ========================================================
    */

    const recommendations =
      await findEligibleHospitals({
        requiredServiceId:
          Number(requiredServiceId),

        latitude:
          Number(latitude),

        longitude:
          Number(longitude),
      });

    /*
    IMPORTANT:
    Backend recommendation service remains the authority
    for Instant Referral eligibility.
    */

    const selected =
      recommendations.find(
        (recommendation) =>
          Number(
            recommendation.hospital?.id
          ) ===
            Number(
              destinationHospitalId
            ) &&
          recommendation
            .instantEligibility
            ?.canInstantRefer === true
      );

    /*
    ========================================================
    2. BLOCK IF NOT ELIGIBLE
    ========================================================
    */

    if (!selected) {
      const matchingRecommendation =
        recommendations.find(
          (recommendation) =>
            Number(
              recommendation.hospital?.id
            ) ===
            Number(
              destinationHospitalId
            )
        );

      return res.status(409).json({
        success: false,
        message:
          matchingRecommendation
            ?.instantEligibility
            ?.instantReferralReason ||
          "Instant referral is not currently available.",
      });
    }

    /*
    ========================================================
    3. GET ACTUAL SERVICE
    ========================================================
    
    selected.service is HospitalService.

    It contains:
      id
      hospitalId
      serviceId
      isAvailable
      capacity
      notes

    It does NOT contain:
      name

    Therefore we query the actual Service table.
    */

    const serviceResult =
      await pool.query(
        `
        SELECT
          "id",
          "name",
          "description"
        FROM "service"
        WHERE "id" = $1
        LIMIT 1
        `,
        [
          Number(
            requiredServiceId
          ),
        ]
      );

    if (
      serviceResult.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Required service not found.",
      });
    }

    const service =
      serviceResult.rows[0];

    /*
    ========================================================
    4. CREATE REFERRAL
    ========================================================
    */

    const referralResult =
      await pool.query(
        `
        INSERT INTO "referral"
        (
          "patientName",
          "referringDoctorName",
          "requiredServiceId",
          "destinationHospitalId",
          "status",
          "urgency",
          "reason",
          "notes",
          "createdAt",
          "updatedAt"
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          'ACCEPTED',
          'INSTANT',
          $5,
          $6,
          NOW(),
          NOW()
        )
        RETURNING *
        `,
        [
          patientName,

          referringDoctorName ||
            null,

          Number(
            requiredServiceId
          ),

          Number(
            destinationHospitalId
          ),

          reason || null,

          notes || null,
        ]
      );

    const referral =
      referralResult.rows[0];

    /*
    ========================================================
    5. CREATE PRE-ARRIVAL ALERT
    ========================================================
    
    FIX:
    Use service.name from the actual Service table.
    This prevents:
    
    "for undefined"
    
    ========================================================
    */

    const alertMessage =
      `INSTANT EMERGENCY REFERRAL: ${patientName} is being referred to ` +
      `${selected.hospital.name} for ${service.name}. ` +
      `Prepare for immediate arrival.`;

    const alertResult =
      await pool.query(
        `
        INSERT INTO "preArrivalAlert"
        (
          "referralId",
          "message",
          "status",
          "sentAt",
          "createdAt",
          "updatedAt"
        )
        VALUES
        (
          $1,
          $2,
          'SENT',
          NOW(),
          NOW(),
          NOW()
        )
        RETURNING *
        `,
        [
          referral.id,
          alertMessage,
        ]
      );

    /*
    ========================================================
    6. SOCKET.IO EVENTS
    ========================================================
    */

    const io =
      req.app.locals.io;

    if (io) {
      io.to(
        `referral-${referral.id}`
      ).emit(
        "referral-status-updated",
        {
          referralId:
            referral.id,

          status:
            "ACCEPTED",

          hospitalName:
            selected.hospital.name,

          message:
            alertMessage,
        }
      );

      io.to(
        `referral-${referral.id}`
      ).emit(
        "pre-arrival-alert",
        alertResult.rows[0]
      );
    }

    /*
    ========================================================
    7. RESPONSE
    ========================================================
    */

    return res.status(201).json({
      success: true,

      message:
        "Instant referral created and hospital alerted.",

      data: {
        referral,

        alert:
          alertResult.rows[0],

        recommendation: {
          ...selected,

          /*
           * Return the proper Service object
           * instead of the HospitalService-only object.
           */
          service: {
            ...selected.service,

            id:
              service.id,

            name:
              service.name,

            description:
              service.description,
          },
        },
      },
    });
  } catch (error) {
    console.error(
      "Create instant referral error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create instant referral.",
      error:
        error.message,
    });
  }
}