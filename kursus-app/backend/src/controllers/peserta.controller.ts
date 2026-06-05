import type { Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prismaClient.js";
import { asyncHandler } from "../middlewares/errorHandler.middleware.js";

const pesertaSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  noTelepon: z
    .string()
    .min(8, "No telepon minimal 8 digit")
    .regex(/^[0-9+\-\s]+$/, "Format no telepon tidak valid"),
  alamat: z.string().min(1, "Alamat wajib diisi"),
});

// ─── GET /peserta ────────────────────────────────────────
export const getAllPeserta = asyncHandler(async (_req: Request, res: Response) => {
  const peserta = await prisma.peserta.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { pendaftaran: true } } },
  });
  res.json({ data: peserta });
});

// ─── GET /peserta/:id (+ riwayat pendaftaran) ────────────
export const getPesertaById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const peserta = await prisma.peserta.findUnique({
    where: { id },
    include: {
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
  const data = pesertaSchema.parse(req.body);
  const peserta = await prisma.peserta.create({ data });
  res.status(201).json({ data: peserta });
});

// ─── PUT /peserta/:id ────────────────────────────────────
export const updatePeserta = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = pesertaSchema.parse(req.body);
  const peserta = await prisma.peserta.update({ where: { id }, data });
  res.json({ data: peserta });
});

// ─── DELETE /peserta/:id (ADMIN only) ────────────────────
export const deletePeserta = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.peserta.delete({ where: { id } });
  res.json({ message: "Peserta berhasil dihapus." });
});
