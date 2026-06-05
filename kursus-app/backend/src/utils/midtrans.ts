import midtransClient from "midtrans-client";

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? "";
const CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY ?? "";
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";

export const midtransConfigured = Boolean(SERVER_KEY && CLIENT_KEY);

// Snap API client (lazy — hanya dibuat jika key tersedia).
export const snap = midtransConfigured
  ? new midtransClient.Snap({
      isProduction: IS_PRODUCTION,
      serverKey: SERVER_KEY,
      clientKey: CLIENT_KEY,
    })
  : null;

// Base URL Core API (untuk cek status via fetch langsung —
// library midtrans-client menggantung di runtime Bun).
export const MIDTRANS_API_BASE = IS_PRODUCTION
  ? "https://api.midtrans.com"
  : "https://api.sandbox.midtrans.com";

// Header Authorization Basic (server key sebagai username, password kosong).
export function midtransAuthHeader(): string {
  return "Basic " + Buffer.from(`${SERVER_KEY}:`).toString("base64");
}

export { CLIENT_KEY as midtransClientKey, SERVER_KEY as midtransServerKey };
