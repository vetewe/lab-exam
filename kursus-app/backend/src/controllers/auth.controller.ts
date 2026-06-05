import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../utils/prismaClient.js";
import { asyncHandler } from "../middlewares/errorHandler.middleware.js";
import type { AuthPayload } from "../middlewares/auth.middleware.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

const registerSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
});

// ─── POST /auth/login ────────────────────────────────────
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Email atau password salah." });
  }

  const cocok = await bcrypt.compare(password, user.password);
  if (!cocok) {
    return res.status(401).json({ message: "Email atau password salah." });
  }

  const payload: AuthPayload = { id: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

  res.json({
    token,
    user: { id: user.id, nama: user.nama, email: user.email, role: user.role },
  });
});

// ─── POST /auth/register (ADMIN only) ────────────────────
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { nama, email, password, role } = registerSchema.parse(req.body);

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { nama, email, password: hashed, role: role ?? "STAFF" },
  });

  res.status(201).json({
    user: { id: user.id, nama: user.nama, email: user.email, role: user.role },
  });
});

// ─── GET /auth/me ────────────────────────────────────────
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, nama: true, email: true, role: true, createdAt: true },
  });

  if (!user) {
    return res.status(404).json({ message: "User tidak ditemukan." });
  }

  res.json({ user });
});
