import { Router } from "express";
import {
  getAllPendaftaran,
  getPendaftaranById,
  createPendaftaran,
  updatePendaftaran,
  deletePendaftaran,
  previewPendaftaran,
} from "../controllers/pendaftaran.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

// Preview & pembuatan pendaftaran hanya untuk ADMIN.
// (preview harus didefinisikan SEBELUM /:id agar tidak tertangkap route param)
router.get("/preview", authorize("ADMIN"), previewPendaftaran);
router.post("/preview", authorize("ADMIN"), previewPendaftaran);

// GET dapat diakses peserta (controller membatasi ke miliknya sendiri).
router.get("/", getAllPendaftaran);
router.get("/:id", getPendaftaranById);

// Mutasi pendaftaran hanya ADMIN.
router.post("/", authorize("ADMIN"), createPendaftaran);
router.put("/:id", authorize("ADMIN"), updatePendaftaran);
router.delete("/:id", authorize("ADMIN"), deletePendaftaran);

export default router;
