import express from "express";

import {
  createReferral,
  createInstantReferral,
  getReferrals,
  getReferralById,
  getHospitalReferrals,
  updateReferralStatus,
} from "../controllers/referralController.js";

import {
  assignMedicalStaff,
} from "../controllers/medicalStaffController.js";

const router = express.Router();

/*
=========================================================
REFERRALS
=========================================================
*/

/*
GET /api/referrals

Get all referrals
*/
router.get(
  "/",
  getReferrals
);

/*
GET /api/referrals/hospital/:hospitalId

Get referrals for a specific hospital
Example:
GET /api/referrals/hospital/1
*/
router.get(
  "/hospital/:hospitalId",
  getHospitalReferrals
);

/*
PATCH /api/referrals/:referralId/assign-medical-staff

Assign medical staff / ambulance to a referral
Example:
PATCH /api/referrals/2/assign-medical-staff
*/
router.patch(
  "/:referralId/assign-medical-staff",
  assignMedicalStaff
);

/*
GET /api/referrals/:id

Get a single referral
Example:
GET /api/referrals/2
*/
router.get(
  "/:id",
  getReferralById
);

/*
POST /api/referrals

Create standard referral
*/
router.post(
  "/",
  createReferral
);

/*
POST /api/referrals/instant

Create instant emergency referral
*/
router.post(
  "/instant",
  createInstantReferral
);

/*
PATCH /api/referrals/:id/status

Update referral status
Example:
PATCH /api/referrals/2/status
*/
router.patch(
  "/:id/status",
  updateReferralStatus
);

export default router;