import express from "express";
import {
  getDoctors,
  createConsultation,
  getConsultations,
  getConsultationMessages,
  updateConsultation,
  addConsultationMessage,
  getMedicineProviders,
  updateMedicineAvailability,
} from "../controllers/coordinationController.js";

const router = express.Router();
router.get("/doctors", getDoctors);
router.post("/consultations", createConsultation);
router.get("/consultations", getConsultations);
router.get("/consultations/:id/messages", getConsultationMessages);
router.patch("/consultations/:id", updateConsultation);
router.post("/consultations/:id/messages", addConsultationMessage);
router.get("/medicine-providers", getMedicineProviders);
router.patch("/medicine-providers/:providerId/availability", updateMedicineAvailability);
export default router;
