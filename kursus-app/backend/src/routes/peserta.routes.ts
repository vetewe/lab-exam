import { Router } from "express";
import {
  getAllPeserta,
  getPesertaById,
  createPeserta,
  updatePeserta,
  deletePeserta,
} from "../controllers/peserta.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

// Manajemen peserta hanya untuk ADMIN.
router.use(authenticate, authorize("ADMIN"));

router.get("/", getAllPeserta);
router.get("/:id", getPesertaById);
router.post("/", createPeserta);
router.put("/:id", updatePeserta);
router.delete("/:id", deletePeserta);

export default router;
