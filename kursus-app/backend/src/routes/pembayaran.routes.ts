import { Router } from "express";
import {
  getConfig,
  createSnap,
  handleNotification,
  getStatus,
  refreshStatus,
} from "../controllers/pembayaran.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Webhook Midtrans — PUBLIK (dipanggil server Midtrans, tanpa JWT).
router.post("/notification", handleNotification);

// Endpoint yang butuh login.
router.get("/config", authenticate, getConfig);
router.post("/:pendaftaranId/snap", authenticate, createSnap);
router.get("/:pendaftaranId/status", authenticate, getStatus);
router.post("/:pendaftaranId/refresh", authenticate, refreshStatus);

export default router;
