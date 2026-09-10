import express from "express";

import {
  createReferral,
  createInstantReferral,
  getReferrals,
  getReferralById,
  getHospitalReferrals,
  updateReferralStatus,
} from "../controllers/referralController.js";

const router =
  express.Router();

/*
=========================================================
REFERRALS
=========================================================
*/

/*
GET /api/referrals
*/
router.get(
  "/",
  getReferrals
);

/*
GET /api/referrals/hospital/2
*/
router.get(
  "/hospital/:hospitalId",
  getHospitalReferrals
);

/*
GET /api/referrals/2
*/
router.get(
  "/:id",
  getReferralById
);

/*
POST /api/referrals
*/
router.post(
  "/",
  createReferral
);

router.post(
  "/instant",
  createInstantReferral
);

/*
PATCH /api/referrals/2/status
*/
router.patch(
  "/:id/status",
  updateReferralStatus
);

export default router;