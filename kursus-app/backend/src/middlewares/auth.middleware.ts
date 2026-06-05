import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

export interface AuthPayload {
  id: number;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "secret";

// ─── Verifikasi JWT (wajib login) ────────────────────────
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token tidak ditemukan. Silakan login." });
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Token tidak valid atau kedaluwarsa." });
  }
}

// ─── Batasi akses ke role tertentu ───────────────────────
export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Belum terautentikasi." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Akses ditolak. Hak akses tidak mencukupi." });
    }
    next();
  };
}
