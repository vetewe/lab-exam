import type { Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prismaClient.js";
import { asyncHandler } from "../middlewares/errorHandler.middleware.js";

const programSchema = z.object({
  namaProgram: z.string().min(1, "Nama program wajib diisi"),
  deskripsi: z.string().optional().nullable(),
  biaya: z.number().positive("Biaya harus lebih dari 0"),
  durasi: z.string().min(1, "Durasi wajib diisi"),
});

// ─── GET /program-kursus ─────────────────────────────────
export const getAllProgram = asyncHandler(async (_req: Request, res: Response) => {
  const program = await prisma.programKursus.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json({ data: program });
});

// ─── GET /program-kursus/:id ─────────────────────────────
export const getProgramById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const program = await prisma.programKursus.findUnique({ where: { id } });

  if (!program) {
    return res.status(404).json({ message: "Program kursus tidak ditemukan." });
  }
  res.json({ data: program });
});

// ─── POST /program-kursus (ADMIN only) ───────────────────
export const createProgram = asyncHandler(async (req: Request, res: Response) => {
  const data = programSchema.parse(req.body);
  const program = await prisma.programKursus.create({ data });
  res.status(201).json({ data: program });
});

// ─── PUT /program-kursus/:id (ADMIN only) ────────────────
export const updateProgram = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = programSchema.parse(req.body);
  const program = await prisma.programKursus.update({ where: { id }, data });
  res.json({ data: program });
});

// ─── DELETE /program-kursus/:id (ADMIN only) ─────────────
export const deleteProgram = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.programKursus.delete({ where: { id } });
  res.json({ message: "Program kursus berhasil dihapus." });
});
