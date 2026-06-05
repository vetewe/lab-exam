import { Router } from "express";
import { login, register, me } from "../controllers/auth.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/register", authenticate, authorize("ADMIN"), register);
router.get("/me", authenticate, me);

export default router;
