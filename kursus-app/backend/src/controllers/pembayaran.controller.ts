import type { Request, Response } from "express";
import { StatusPembayaran } from "@prisma/client";
import prisma from "../utils/prismaClient.js";
import { asyncHandler } from "../middlewares/errorHandler.middleware.js";
import { midtransClientKey, midtransConfigured } from "../utils/midtrans.js";
import {
  buatTransaksiSnap,
  prosesNotifikasi,
  verifikasiSignature,
  cekStatusTransaksi,
} from "../services/midtrans.service.js";

// ─── GET /pembayaran/config (client key untuk Snap.js) ───
export const getConfig = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    configured: midtransConfigured,
    clientKey: midtransClientKey || null,
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  });
});

// ─── POST /pembayaran/:pendaftaranId/snap ────────────────
// Buat transaksi Snap. Peserta hanya boleh membayar pendaftaran miliknya.
export const createSnap = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const pendaftaranId = Number(req.params.pendaftaranId);

  const pendaftaran = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    include: {
      peserta: { select: { id: true, nama: true, email: true, noTelepon: true } },
      detail: { include: { programKursus: true } },
    },
  });

  if (!pendaftaran) {
    return res.status(404).json({ message: "Pendaftaran tidak ditemukan." });
  }
  if (user.role === "PESERTA" && pendaftaran.pesertaId !== user.id) {
    return res.status(403).json({ message: "Anda hanya bisa membayar pendaftaran sendiri." });
  }
  if (pendaftaran.statusPembayaran === StatusPembayaran.LUNAS) {
    return res.status(409).json({ message: "Pendaftaran ini sudah lunas." });
  }

  const result = await buatTransaksiSnap({
    pendaftaranId: pendaftaran.id,
    jumlah: pendaftaran.totalAkhir,
    peserta: pendaftaran.peserta,
    itemNama: pendaftaran.detail.map((d) => d.programKursus.namaProgram),
  });

  res.status(201).json({ data: result });
});

// ─── POST /pembayaran/notification (webhook Midtrans) ────
// Endpoint publik yang dipanggil server Midtrans. Tidak pakai auth JWT,
// tetapi memverifikasi signature_key agar notifikasi tidak bisa dipalsukan.
export const handleNotification = asyncHandler(async (req: Request, res: Response) => {
  if (!verifikasiSignature(req.body)) {
    return res.status(403).json({ message: "Signature tidak valid." });
  }
  const result = await prosesNotifikasi(req.body);
  res.json({ message: "Notifikasi diproses", ...result });
});

// ─── POST /pembayaran/:pendaftaranId/refresh ─────────────
// Cek status terbaru langsung ke Midtrans (on-demand) tanpa menunggu webhook.
export const refreshStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const pendaftaranId = Number(req.params.pendaftaranId);

  const pendaftaran = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    include: { pembayaran: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!pendaftaran) {
    return res.status(404).json({ message: "Pendaftaran tidak ditemukan." });
  }
  if (user.role === "PESERTA" && pendaftaran.pesertaId !== user.id) {
    return res.status(403).json({ message: "Akses ditolak." });
  }

  const pembayaran = pendaftaran.pembayaran[0];
  if (!pembayaran) {
    return res.status(404).json({ message: "Belum ada transaksi untuk pendaftaran ini." });
  }

  const result = await cekStatusTransaksi(pembayaran.orderId);
  res.json({ data: { statusPembayaran: result.status, orderId: result.orderId } });
});

// ─── GET /pembayaran/:pendaftaranId/status ───────────────
export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const pendaftaranId = Number(req.params.pendaftaranId);

  const pendaftaran = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    include: { pembayaran: { orderBy: { createdAt: "desc" } } },
  });

  if (!pendaftaran) {
    return res.status(404).json({ message: "Pendaftaran tidak ditemukan." });
  }
  if (user.role === "PESERTA" && pendaftaran.pesertaId !== user.id) {
    return res.status(403).json({ message: "Akses ditolak." });
  }

  res.json({
    data: {
      statusPembayaran: pendaftaran.statusPembayaran,
      pembayaran: pendaftaran.pembayaran,
    },
  });
});
