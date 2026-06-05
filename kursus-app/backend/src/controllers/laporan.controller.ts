import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/errorHandler.middleware.js";
import {
  laporanPeserta,
  laporanPembayaranPeserta,
  laporanPendapatan,
  laporanRingkasan,
  laporanDetailPeserta,
  type PeriodeFilter,
} from "../services/laporan.service.js";

// Ambil filter periode (bulan/tahun) dari query string.
function parsePeriode(req: Request): PeriodeFilter {
  const bulan = req.query.bulan ? Number(req.query.bulan) : undefined;
  const tahun = req.query.tahun ? Number(req.query.tahun) : undefined;
  return {
    bulan: bulan && bulan >= 1 && bulan <= 12 ? bulan : undefined,
    tahun: tahun && tahun > 1900 ? tahun : undefined,
  };
}

// ─── GET /laporan/peserta ────────────────────────────────
export const getLaporanPeserta = asyncHandler(async (req: Request, res: Response) => {
  const data = await laporanPeserta(parsePeriode(req));
  res.json({ data });
});

// ─── GET /laporan/pembayaran-peserta ─────────────────────
export const getLaporanPembayaranPeserta = asyncHandler(async (req: Request, res: Response) => {
  const data = await laporanPembayaranPeserta(parsePeriode(req));
  res.json({ data });
});

// ─── GET /laporan/pendapatan ─────────────────────────────
export const getLaporanPendapatan = asyncHandler(async (req: Request, res: Response) => {
  const data = await laporanPendapatan(parsePeriode(req));
  res.json(data);
});

// ─── GET /laporan/ringkasan (dashboard) ──────────────────
export const getLaporanRingkasan = asyncHandler(async (_req: Request, res: Response) => {
  const data = await laporanRingkasan();
  res.json(data);
});

// ─── GET /laporan/peserta/:id (detail untuk cetak) ───────
export const getLaporanDetailPeserta = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = await laporanDetailPeserta(id);
  if (!data) {
    return res.status(404).json({ message: "Peserta tidak ditemukan." });
  }
  res.json({ data });
});
