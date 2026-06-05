import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { IconChevronLeft, IconChevronRight, IconInbox, IconSearch } from "./icons";

// ─── Button ──────────────────────────────────────────────
type Variant = "primary" | "secondary" | "danger" | "ghost" | "subtle";
type Size = "sm" | "md";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-300",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-300",
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-300",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-300",
  subtle:
    "bg-red-50 text-red-600 hover:bg-red-100 focus-visible:ring-red-200",
};

const sizeClass: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs gap-1",
  md: "px-4 py-2 text-sm gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

// ─── Input field ─────────────────────────────────────────
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function Field({ label, hint, className = "", ...props }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${className}`}
        {...props}
      />
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

// ─── Search input ────────────────────────────────────────
export function SearchInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}

// ─── Alert ───────────────────────────────────────────────
export function Alert({ type = "error", children }: { type?: "error" | "success"; children: ReactNode }) {
  const cls =
    type === "error"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-green-50 text-green-700 border-green-200";
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${cls}`} role="alert">
      <span>{children}</span>
    </div>
  );
}

// ─── Badge status ────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    AKTIF: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    SELESAI: "bg-blue-50 text-blue-700 ring-blue-600/20",
    DIBATALKAN: "bg-red-50 text-red-700 ring-red-600/20",
  };
  const dot: Record<string, string> = {
    AKTIF: "bg-emerald-500",
    SELESAI: "bg-blue-500",
    DIBATALKAN: "bg-red-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        map[status] ?? "bg-slate-50 text-slate-600 ring-slate-500/20"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status] ?? "bg-slate-400"}`} />
      {status}
    </span>
  );
}

// ─── Pill (label kecil netral) ───────────────────────────
export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

// ─── Badge status pembayaran ─────────────────────────────
const PAYMENT_LABEL: Record<string, string> = {
  BELUM_BAYAR: "Belum Bayar",
  PENDING: "Menunggu",
  LUNAS: "Lunas",
  GAGAL: "Gagal",
  KEDALUWARSA: "Kedaluwarsa",
};

export function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    BELUM_BAYAR: "bg-slate-100 text-slate-600 ring-slate-500/20",
    PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
    LUNAS: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    GAGAL: "bg-red-50 text-red-700 ring-red-600/20",
    KEDALUWARSA: "bg-red-50 text-red-700 ring-red-600/20",
  };
  const dot: Record<string, string> = {
    BELUM_BAYAR: "bg-slate-400",
    PENDING: "bg-amber-500",
    LUNAS: "bg-emerald-500",
    GAGAL: "bg-red-500",
    KEDALUWARSA: "bg-red-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        map[status] ?? "bg-slate-50 text-slate-600 ring-slate-500/20"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status] ?? "bg-slate-400"}`} />
      {PAYMENT_LABEL[status] ?? status}
    </span>
  );
}

// ─── Spinner ─────────────────────────────────────────────
export function Spinner({ label = "Memuat..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

// ─── Page Header ─────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Card ────────────────────────────────────────────────
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-card ${className}`}>
      {children}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────
export function EmptyState({ icon, message }: { icon?: ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon ?? <IconInbox className="h-6 w-6" />}
      </div>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

// ─── Pagination ──────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  onPageChange: (p: number) => void;
}

export function Pagination({ page, totalPages, from, to, total, onPageChange }: PaginationProps) {
  if (total === 0) return null;

  const pages: (number | "…")[] = [];
  const range = 1;
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= page - range && p <= page + range)) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  const navBtn =
    "flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
      <p className="text-sm text-slate-500">
        Menampilkan <span className="font-medium text-slate-700">{from}</span>–
        <span className="font-medium text-slate-700">{to}</span> dari{" "}
        <span className="font-medium text-slate-700">{total}</span> data
      </p>

      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className={navBtn} aria-label="Sebelumnya">
          <IconChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-1.5 text-sm text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`h-8 min-w-[2rem] rounded-lg px-2 text-sm font-medium transition ${
                p === page
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className={navBtn} aria-label="Berikutnya">
          <IconChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Table helpers ───────────────────────────────────────
export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 ${className}`}>
      {children}
    </th>
  );
}
