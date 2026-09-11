import express from "express";

import {
  uploadReport,
  createMedicalReport,
  getReferralReports,
  downloadMedicalReport,
} from "../controllers/reportController.js";

const router = express.Router();

router.post(
  "/:referralId",
  uploadReport.single("report"),
  createMedicalReport
);

router.get(
  "/referral/:referralId",
  getReferralReports
);

router.get(
  "/:id/download",
  downloadMedicalReport
);

export default router;