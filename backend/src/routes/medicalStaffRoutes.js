import express from "express";

import {
  createMedicalStaff,
  getMedicalStaff,
} from "../controllers/medicalStaffController.js";

const router = express.Router();

router.post("/", createMedicalStaff);

router.get("/", getMedicalStaff);

export default router;