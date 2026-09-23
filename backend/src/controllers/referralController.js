export async function createInstantReferral(req, res) {
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
     * ---------------------------------------------------------
     * 1. VERIFY INSTANT REFERRAL ELIGIBILITY
     * ---------------------------------------------------------
     */

    const recommendations = await findEligibleHospitals({
      requiredServiceId: Number(requiredServiceId),
      latitude: Number(latitude),
      longitude: Number(longitude),
    });

    const selected = recommendations.find(
      (recommendation) =>
        Number(recommendation.hospital?.id) ===
          Number(destinationHospitalId) &&
        recommendation.instantEligibility?.canInstantRefer === true
    );

    if (!selected) {
      return res.status(409).json({
        success: false,
        message:
          recommendations.find(
            (recommendation) =>
              Number(recommendation.hospital?.id) ===
              Number(destinationHospitalId)
          )?.instantEligibility?.instantReferralReason ||
          "Instant referral is not currently available.",
      });
    }

    /*
     * ---------------------------------------------------------
     * 2. GET ACTUAL SERVICE DETAILS
     * ---------------------------------------------------------
     *
     * selected.service is HospitalService.
     * We need the real Service record for the service name.
     */

    const serviceResult = await pool.query(
      `
      SELECT
        "id",
        "name",
        "description"
      FROM "service"
      WHERE "id" = $1
      LIMIT 1
      `,
      [Number(requiredServiceId)]
    );

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Required service not found.",
      });
    }

    const service = serviceResult.rows[0];

    /*
     * ---------------------------------------------------------
     * 3. CREATE REFERRAL
     * ---------------------------------------------------------
     */

    const referralResult = await pool.query(
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
        referringDoctorName || null,
        Number(requiredServiceId),
        Number(destinationHospitalId),
        reason || null,
        notes || null,
      ]
    );

    const referral = referralResult.rows[0];

    /*
     * ---------------------------------------------------------
     * 4. CREATE PRE-ARRIVAL ALERT
     * ---------------------------------------------------------
     *
     * Use service.name from the actual Service table.
     */

    const alertMessage =
      `INSTANT EMERGENCY REFERRAL: ${patientName} is being referred to ` +
      `${selected.hospital.name} for ${service.name}. ` +
      `Prepare for immediate arrival.`;

    const alertResult = await pool.query(
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
      [referral.id, alertMessage]
    );

    /*
     * ---------------------------------------------------------
     * 5. REAL-TIME SOCKET EVENTS
     * ---------------------------------------------------------
     */

    const io = req.app.locals.io;

    if (io) {
      io.to(`referral-${referral.id}`).emit(
        "referral-status-updated",
        {
          referralId: referral.id,
          status: "ACCEPTED",
          hospitalName: selected.hospital.name,
          message: alertMessage,
        }
      );

      io.to(`referral-${referral.id}`).emit(
        "pre-arrival-alert",
        alertResult.rows[0]
      );
    }

    /*
     * ---------------------------------------------------------
     * 6. RESPONSE
     * ---------------------------------------------------------
     */

    return res.status(201).json({
      success: true,
      message: "Instant referral created and hospital alerted.",
      data: {
        referral,
        alert: alertResult.rows[0],
        recommendation: {
          ...selected,
          service: {
            ...selected.service,
            id: service.id,
            name: service.name,
            description: service.description,
          },
        },
      },
    });
  } catch (error) {
    console.error("Create instant referral error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create instant referral.",
      error: error.message,
    });
  }
}