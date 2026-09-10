import fs from "fs";
import path from "path";
import multer from "multer";

import { db } from "../db.js";

const uploadDirectory = path.resolve("uploads/referrals");

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const uploadReport = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export async function createMedicalReport(req, res) {
  try {
    const referralId = Number(req.params.referralId);

    if (!Number.isInteger(referralId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid referral ID",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Medical report file is required",
      });
    }

    const referral = await db.orm.public.Referral.first({
      id: referralId,
    });

    if (!referral) {
      fs.unlinkSync(req.file.path);

      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

    const report = await db.orm.public.MedicalReport.create({
      referralId,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
    });

    return res.status(201).json({
      success: true,
      message: "Medical report uploaded successfully",
      data: report,
    });
  } catch (error) {
    console.error("Medical report upload failed:", error);

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to upload medical report",
    });
  }
}

export async function getReferralReports(req, res) {
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

    const reports = await db.orm.public.MedicalReport
      .where({
        referralId,
      })
      .select(
        "id",
        "referralId",
        "fileName",
        "fileType",
        "fileSize",
        "filePath",
        "uploadedAt"
      )
      .all();

    return res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Failed to fetch referral reports:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch referral reports",
    });
  }
}

export async function downloadMedicalReport(req, res) {
  try {
    const reportId = Number(req.params.id);

    if (!Number.isInteger(reportId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    const report = await db.orm.public.MedicalReport.first({
      id: reportId,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Medical report not found",
      });
    }

    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({
        success: false,
        message: "Medical report file not found",
      });
    }

    res.download(
      report.filePath,
      report.fileName
    );
  } catch (error) {
    console.error("Failed to download medical report:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to download medical report",
    });
  }
}