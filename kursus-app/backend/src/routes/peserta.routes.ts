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

router.use(authenticate); // semua endpoint peserta wajib login

router.get("/", getAllPeserta);
router.get("/:id", getPesertaById);
router.post("/", createPeserta);
router.put("/:id", updatePeserta);
router.delete("/:id", authorize("ADMIN"), deletePeserta);

export default router;
