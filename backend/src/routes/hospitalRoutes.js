import express from "express";

import {
  getHospitals,
  getHospitalById,
  getHospitalServices,
  getHospitalBeds,
  getHospitalDataStatus,
  updateHospitalService,
  updateHospitalBed,
  confirmHospitalData,
} from "../controllers/hospitalController.js";

const router = express.Router();

export default function hospitalRoutes(io) {

  router.get(
    "/",
    getHospitals
  );

  router.get(
    "/:id",
    getHospitalById
  );

  router.get(
    "/:id/services",
    getHospitalServices
  );

  router.get(
    "/:id/beds",
    getHospitalBeds
  );

  router.get(
    "/:id/data-status",
    getHospitalDataStatus
  );


  // ============================================
  // REAL-TIME SERVICE UPDATE
  // ============================================

  router.patch(
    "/:hospitalId/services/:serviceId",
    updateHospitalService(io)
  );
  router.patch(
  "/:hospitalId/beds/:bedType",
  updateHospitalBed(io)
);

router.post("/:hospitalId/confirm", (req, res) => {
  req.io = io;
  confirmHospitalData(req, res);
});


  return router;
}
