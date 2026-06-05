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

// Program kursus hanya dikelola ADMIN.
router.use(authenticate, authorize("ADMIN"));

router.get("/", getAllProgram);
router.get("/:id", getProgramById);
router.post("/", createProgram);
router.put("/:id", updateProgram);
router.delete("/:id", deleteProgram);

export default router;
