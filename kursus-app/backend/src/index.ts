import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import pesertaRoutes from "./routes/peserta.routes.js";
import programKursusRoutes from "./routes/programKursus.routes.js";
import pendaftaranRoutes from "./routes/pendaftaran.routes.js";
import laporanRoutes from "./routes/laporan.routes.js";
import pembayaranRoutes from "./routes/pembayaran.routes.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ─── Middleware global ───────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health check ────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ message: "API Sistem Manajemen Kursus berjalan 🚀", version: "1.0.0" });
});

// ─── Routes ──────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/peserta", pesertaRoutes);
app.use("/api/program-kursus", programKursusRoutes);
app.use("/api/pendaftaran", pendaftaranRoutes);
app.use("/api/laporan", laporanRoutes);
app.use("/api/pembayaran", pembayaranRoutes);

// ─── 404 handler ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan." });
});

// ─── Error handler (paling akhir) ────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📚 Base API: http://localhost:${PORT}/api`);
});
