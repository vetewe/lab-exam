import api from "./api";
import type { MidtransConfig, SnapResult } from "../types";

let snapScriptPromise: Promise<void> | null = null;

// Muat snap.js sekali, pakai client key & env dari backend.
export async function ensureSnapLoaded(config: MidtransConfig): Promise<void> {
  if (typeof window !== "undefined" && (window as unknown as { snap?: unknown }).snap) {
    return;
  }
  if (snapScriptPromise) return snapScriptPromise;

  if (!config.clientKey) {
    throw new Error("Client key Midtrans belum tersedia.");
  }

  const src = config.isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  snapScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.setAttribute("data-client-key", config.clientKey!);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat Snap.js Midtrans."));
    document.body.appendChild(script);
  });

  return snapScriptPromise;
}

export async function getMidtransConfig(): Promise<MidtransConfig> {
  const res = await api.get<MidtransConfig>("/pembayaran/config");
  return res.data;
}

export async function createSnapTransaction(pendaftaranId: number): Promise<SnapResult> {
  const res = await api.post<{ data: SnapResult }>(`/pembayaran/${pendaftaranId}/snap`);
  return res.data.data;
}

// Cek status terbaru ke Midtrans secara on-demand (tanpa menunggu webhook).
export async function refreshPaymentStatus(
  pendaftaranId: number
): Promise<{ statusPembayaran: string; orderId: string }> {
  const res = await api.post<{ data: { statusPembayaran: string; orderId: string } }>(
    `/pembayaran/${pendaftaranId}/refresh`
  );
  return res.data.data;
}

interface SnapCallbacks {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
}

// Tampilkan popup Snap. snap global disuntik oleh snap.js.
export function openSnap(token: string, callbacks: SnapCallbacks) {
  const snap = (window as unknown as {
    snap?: { pay: (token: string, cb: SnapCallbacks) => void };
  }).snap;
  if (!snap) {
    throw new Error("Snap.js belum dimuat.");
  }
  snap.pay(token, callbacks);
}
