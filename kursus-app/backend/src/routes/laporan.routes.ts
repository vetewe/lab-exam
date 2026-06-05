import { Router } from "express";
import {
  getLaporanPeserta,
  getLaporanPembayaranPeserta,
  getLaporanPendapatan,
  getLaporanRingkasan,
} from "../controllers/laporan.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/peserta", getLaporanPeserta);
router.get("/pembayaran-peserta", getLaporanPembayaranPeserta);
router.get("/pendapatan", getLaporanPendapatan);
router.get("/ringkasan", getLaporanRingkasan);

export default router;
