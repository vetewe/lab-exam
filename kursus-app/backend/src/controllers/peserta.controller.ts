import type { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "../utils/prismaClient.js";
import { asyncHandler } from "../middlewares/errorHandler.middleware.js";

// Peserta = User dengan role PESERTA.
const createSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  noTelepon: z
    .string()
    .min(8, "No telepon minimal 8 digit")
    .regex(/^[0-9+\-\s]+$/, "Format no telepon tidak valid"),
  alamat: z.string().min(1, "Alamat wajib diisi"),
});

// Saat update, password opsional (hanya diganti jika diisi).
const updateSchema = createSchema.extend({
  password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
});

const PESERTA_SELECT = {
  id: true,
  nama: true,
  email: true,
  noTelepon: true,
  alamat: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { pendaftaran: true } },
} as const;

// ─── GET /peserta ────────────────────────────────────────
export const getAllPeserta = asyncHandler(async (_req: Request, res: Response) => {
  const peserta = await prisma.user.findMany({
    where: { role: "PESERTA" },
    orderBy: { createdAt: "desc" },
    select: PESERTA_SELECT,
  });
  res.json({ data: peserta });
});

// ─── GET /peserta/:id (+ riwayat pendaftaran) ────────────
export const getPesertaById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const peserta = await prisma.user.findFirst({
    where: { id, role: "PESERTA" },
    select: {
      ...PESERTA_SELECT,
      pendaftaran: {
        orderBy: { tanggalDaftar: "desc" },
        include: { detail: { include: { programKursus: true } } },
      },
    },
  });

  if (!peserta) {
    return res.status(404).json({ message: "Peserta tidak ditemukan." });
  }
  res.json({ data: peserta });
});

// ─── POST /peserta ───────────────────────────────────────
export const createPeserta = asyncHandler(async (req: Request, res: Response) => {
  const { nama, email, password, noTelepon, alamat } = createSchema.parse(req.body);
  const hashed = await bcrypt.hash(password, 10);

  const peserta = await prisma.user.create({
    data: { nama, email, password: hashed, role: "PESERTA", noTelepon, alamat },
    select: PESERTA_SELECT,
  });
  res.status(201).json({ data: peserta });
});

// ─── PUT /peserta/:id ────────────────────────────────────
export const updatePeserta = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { nama, email, password, noTelepon, alamat } = updateSchema.parse(req.body);

  const existing = await prisma.user.findFirst({ where: { id, role: "PESERTA" } });
  if (!existing) {
    return res.status(404).json({ message: "Peserta tidak ditemukan." });
  }

  const data: Record<string, unknown> = { nama, email, noTelepon, alamat };
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  const peserta = await prisma.user.update({
    where: { id },
    data,
    select: PESERTA_SELECT,
  });
  res.json({ data: peserta });
});

// ─── DELETE /peserta/:id (ADMIN only) ────────────────────
export const deletePeserta = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const existing = await prisma.user.findFirst({ where: { id, role: "PESERTA" } });
  if (!existing) {
    return res.status(404).json({ message: "Peserta tidak ditemukan." });
  }
  await prisma.user.delete({ where: { id } });
  res.json({ message: "Peserta berhasil dihapus." });
});
