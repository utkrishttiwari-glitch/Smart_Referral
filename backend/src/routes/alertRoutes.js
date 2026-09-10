import express from "express";

import {
  createPreArrivalAlert,
  getReferralAlerts,
  acknowledgePreArrivalAlert,
} from "../controllers/alertController.js";

const router = express.Router();

router.post(
  "/referral/:referralId",
  createPreArrivalAlert
);

router.get(
  "/referral/:referralId",
  getReferralAlerts
);

router.patch(
  "/:id/acknowledge",
  acknowledgePreArrivalAlert
);

export default router;