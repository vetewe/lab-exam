import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/errorHandler.middleware.js";
import {
  laporanPeserta,
  laporanPembayaranPeserta,
  laporanPendapatan,
  laporanRingkasan,
} from "../services/laporan.service.js";

// ─── GET /laporan/peserta ────────────────────────────────
export const getLaporanPeserta = asyncHandler(async (_req: Request, res: Response) => {
  const data = await laporanPeserta();
  res.json({ data });
});

// ─── GET /laporan/pembayaran-peserta ─────────────────────
export const getLaporanPembayaranPeserta = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await laporanPembayaranPeserta();
    res.json({ data });
  }
);

// ─── GET /laporan/pendapatan ─────────────────────────────
export const getLaporanPendapatan = asyncHandler(async (_req: Request, res: Response) => {
  const data = await laporanPendapatan();
  res.json(data);
});

// ─── GET /laporan/ringkasan (dashboard) ──────────────────
export const getLaporanRingkasan = asyncHandler(async (_req: Request, res: Response) => {
  const data = await laporanRingkasan();
  res.json(data);
});
