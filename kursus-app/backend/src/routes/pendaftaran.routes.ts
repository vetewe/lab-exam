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

// preview harus didefinisikan SEBELUM /:id agar tidak tertangkap route param
router.get("/preview", previewPendaftaran);
router.post("/preview", previewPendaftaran);

router.get("/", getAllPendaftaran);
router.get("/:id", getPendaftaranById);
router.post("/", createPendaftaran);
router.put("/:id", updatePendaftaran);
router.delete("/:id", authorize("ADMIN"), deletePendaftaran);

export default router;
