import { Router } from "express";
import {
  getAllProgram,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
} from "../controllers/programKursus.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getAllProgram);
router.get("/:id", getProgramById);
router.post("/", authorize("ADMIN"), createProgram);
router.put("/:id", authorize("ADMIN"), updateProgram);
router.delete("/:id", authorize("ADMIN"), deleteProgram);

export default router;
