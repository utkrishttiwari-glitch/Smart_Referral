import express from "express";

import {
  createLocationUpdate,
  getReferralLocations,
  getLatestReferralLocation,
} from "../controllers/locationController.js";

const router = express.Router();

export default function locationRoutes(io) {
  router.post(
    "/referral/:referralId",
    createLocationUpdate(io)
  );

  router.get(
    "/referral/:referralId/latest",
    getLatestReferralLocation
  );

  router.get(
    "/referral/:referralId",
    getReferralLocations
  );

  return router;
}