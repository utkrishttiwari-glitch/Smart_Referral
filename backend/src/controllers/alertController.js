import { db } from "../db.js";
import { pool } from "../sql.js";

export async function createPreArrivalAlert(req, res) {
  try {
    const referralId = Number(req.params.referralId);

    if (!Number.isInteger(referralId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid referral ID",
      });
    }

    const referral = await db.orm.public.Referral.first({
      id: referralId,
    });

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

   const message =
  `Pre-arrival alert for patient ${referral.patientName}. ` +
  `Referral #${referral.id} is arriving at the receiving hospital.`;
  
    const alert = await db.orm.public.PreArrivalAlert.create({
      referralId: referral.id,
      message,
      status: "SENT",
    });

    return res.status(201).json({
      success: true,
      message: "Pre-arrival alert created successfully",
      data: alert,
    });
  } catch (error) {
    console.error("Failed to create pre-arrival alert:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create pre-arrival alert",
    });
  }
}

export async function getReferralAlerts(req, res) {
  try {
    const referralId = Number(req.params.referralId);

    if (!Number.isInteger(referralId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid referral ID",
      });
    }

    const referral = await db.orm.public.Referral.first({
      id: referralId,
    });

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

    const alerts = await db.orm.public.PreArrivalAlert
      .where({
        referralId,
      })
      .select(
        "id",
        "referralId",
        "message",
        "status",
        "sentAt",
        "acknowledgedAt",
        "createdAt",
        "updatedAt"
      )
      .all();

    return res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error("Failed to get referral alerts:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get referral alerts",
    });
  }
}

export async function acknowledgePreArrivalAlert(req, res) {
  try {
    const alertId = Number(req.params.id);

    if (!Number.isInteger(alertId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alert ID",
      });
    }

    const alert = await db.orm.public.PreArrivalAlert.first({
      id: alertId,
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Pre-arrival alert not found",
      });
    }

    if (alert.status === "ACKNOWLEDGED") {
      return res.status(400).json({
        success: false,
        message: "Alert has already been acknowledged",
      });
    }

    await pool.query(
      `
        UPDATE "preArrivalAlert"
        SET "status" = $1,
            "acknowledgedAt" = CURRENT_TIMESTAMP,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = $2
      `,
      ["ACKNOWLEDGED", alertId]
    );

    const updatedAlert =
      await db.orm.public.PreArrivalAlert.first({
        id: alertId,
      });

    return res.status(200).json({
      success: true,
      message: "Pre-arrival alert acknowledged successfully",
      data: updatedAlert,
    });
  } catch (error) {
    console.error("Failed to acknowledge pre-arrival alert:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to acknowledge pre-arrival alert",
    });
  }
}