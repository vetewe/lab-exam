import { Router } from "express";
import {
  getLaporanPeserta,
  getLaporanPembayaranPeserta,
  getLaporanPendapatan,
  getLaporanRingkasan,
  getLaporanDetailPeserta,
} from "../controllers/laporan.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

// Laporan hanya untuk ADMIN.
router.use(authenticate, authorize("ADMIN"));

router.get("/peserta", getLaporanPeserta);
router.get("/peserta/:id", getLaporanDetailPeserta);
router.get("/pembayaran-peserta", getLaporanPembayaranPeserta);
router.get("/pendapatan", getLaporanPendapatan);
router.get("/ringkasan", getLaporanRingkasan);

export default router;
