import express from "express";
import {
  getRecommendations,
  getInstantRecommendation,
} from "../controllers/recommendationController.js";

const router = express.Router();

router.post("/", getRecommendations);
router.post("/instant", getInstantRecommendation);

export default router;