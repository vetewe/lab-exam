import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("❌ Error:", err);

  // Validasi Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validasi gagal",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Error Prisma yang umum
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[])?.join(", ") ?? "field";
      return res.status(409).json({ message: `Data dengan ${target} tersebut sudah ada.` });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Data tidak ditemukan." });
    }
    if (err.code === "P2003") {
      return res.status(409).json({
        message: "Data masih terhubung dengan data lain dan tidak bisa dihapus.",
      });
    }
  }

  const message = err instanceof Error ? err.message : "Terjadi kesalahan pada server.";
  return res.status(500).json({ message });
}

// ─── Helper untuk membungkus async controller ────────────
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
