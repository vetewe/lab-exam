import type { Request, Response } from "express";
import { z } from "zod";
import { StatusPendaftaran } from "@prisma/client";
import prisma from "../utils/prismaClient.js";
import { asyncHandler } from "../middlewares/errorHandler.middleware.js";
import { hitungPembayaran, type KursusInput } from "../services/pembayaran.service.js";

const createSchema = z.object({
  pesertaId: z.number().int().positive("Peserta wajib dipilih"),
  programKursusIds: z
    .array(z.number().int().positive())
    .min(1, "Minimal pilih 1 program kursus"),
  catatan: z.string().optional().nullable(),
});

const previewSchema = z.object({
  programKursusIds: z.array(z.number().int().positive()).min(1, "Minimal pilih 1 program"),
});

const updateSchema = z.object({
  status: z.nativeEnum(StatusPendaftaran).optional(),
  catatan: z.string().optional().nullable(),
});

async function ambilKursus(ids: number[]): Promise<KursusInput[]> {
  const program = await prisma.programKursus.findMany({ where: { id: { in: ids } } });
  if (program.length !== ids.length) {
    throw new Error("Salah satu program kursus tidak ditemukan.");
  }
  return program.map((p) => ({ id: p.id, namaProgram: p.namaProgram, biaya: p.biaya }));
}

// ─── GET /pendaftaran/preview (kalkulasi tanpa simpan) ───
export const previewPendaftaran = asyncHandler(async (req: Request, res: Response) => {
  // dukung query (?programKursusIds=1,2) maupun body
  let ids: number[] = [];
  if (req.query.programKursusIds) {
    ids = String(req.query.programKursusIds)
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
  } else if (req.body?.programKursusIds) {
    ids = previewSchema.parse(req.body).programKursusIds;
  }

  if (ids.length === 0) {
    return res.status(400).json({ message: "Minimal pilih 1 program kursus." });
  }

  const kursus = await ambilKursus(ids);
  const hasil = hitungPembayaran(kursus);
  res.json({ data: { kursus, ...hasil } });
});

// ─── GET /pendaftaran ────────────────────────────────────
// Admin melihat semua. Peserta hanya melihat miliknya sendiri.
export const getAllPendaftaran = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const where = user.role === "PESERTA" ? { pesertaId: user.id } : {};

  const pendaftaran = await prisma.pendaftaran.findMany({
    where,
    orderBy: { tanggalDaftar: "desc" },
    include: {
      peserta: { select: { id: true, nama: true, email: true } },
      detail: { include: { programKursus: true } },
      pembayaran: { orderBy: { createdAt: "desc" } },
    },
  });
  res.json({ data: pendaftaran });
});

// ─── GET /pendaftaran/:id ────────────────────────────────
export const getPendaftaranById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = req.user!;
  const pendaftaran = await prisma.pendaftaran.findUnique({
    where: { id },
    include: {
      peserta: { select: { id: true, nama: true, email: true, noTelepon: true, alamat: true } },
      detail: { include: { programKursus: true } },
      pembayaran: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!pendaftaran) {
    return res.status(404).json({ message: "Pendaftaran tidak ditemukan." });
  }
  // Peserta tidak boleh mengintip pendaftaran milik orang lain.
  if (user.role === "PESERTA" && pendaftaran.pesertaId !== user.id) {
    return res.status(403).json({ message: "Akses ditolak." });
  }
  res.json({ data: pendaftaran });
});

// ─── POST /pendaftaran (+ kalkulasi otomatis) ────────────
export const createPendaftaran = asyncHandler(async (req: Request, res: Response) => {
  const { pesertaId, programKursusIds, catatan } = createSchema.parse(req.body);

  const peserta = await prisma.user.findFirst({ where: { id: pesertaId, role: "PESERTA" } });
  if (!peserta) {
    return res.status(404).json({ message: "Peserta tidak ditemukan." });
  }

  const kursus = await ambilKursus(programKursusIds);
  const { totalBiaya, diskon, totalAkhir, keteranganDiskon } = hitungPembayaran(kursus);

  const pendaftaran = await prisma.pendaftaran.create({
    data: {
      pesertaId,
      totalBiaya,
      diskon,
      totalAkhir,
      catatan: catatan ?? null,
      detail: {
        create: kursus.map((k) => ({ programKursusId: k.id, biayaSatuan: k.biaya })),
      },
    },
    include: {
      peserta: { select: { id: true, nama: true } },
      detail: { include: { programKursus: true } },
    },
  });

  res.status(201).json({ data: { ...pendaftaran, keteranganDiskon } });
});

// ─── PUT /pendaftaran/:id (status / catatan) ─────────────
export const updatePendaftaran = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = updateSchema.parse(req.body);
  const pendaftaran = await prisma.pendaftaran.update({
    where: { id },
    data,
    include: {
      peserta: { select: { id: true, nama: true } },
      detail: { include: { programKursus: true } },
    },
  });
  res.json({ data: pendaftaran });
});

// ─── DELETE /pendaftaran/:id (ADMIN only - batalkan) ─────
export const deletePendaftaran = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.pendaftaran.delete({ where: { id } });
  res.json({ message: "Pendaftaran berhasil dibatalkan/dihapus." });
});
