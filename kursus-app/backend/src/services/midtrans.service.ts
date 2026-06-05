import crypto from "node:crypto";
import { StatusPembayaran } from "@prisma/client";
import prisma from "../utils/prismaClient.js";
import {
  snap,
  midtransConfigured,
  midtransServerKey,
  MIDTRANS_API_BASE,
  midtransAuthHeader,
} from "../utils/midtrans.js";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

/**
 * Verifikasi keaslian notifikasi Midtrans.
 * signature_key = SHA512(order_id + status_code + gross_amount + server_key)
 * Mengembalikan true jika tanda tangan cocok.
 */
export function verifikasiSignature(notification: Record<string, unknown>): boolean {
  const orderId = String(notification.order_id ?? "");
  const statusCode = String(notification.status_code ?? "");
  const grossAmount = String(notification.gross_amount ?? "");
  const signature = String(notification.signature_key ?? "");

  if (!orderId || !statusCode || !grossAmount || !signature) return false;

  const expected = crypto
    .createHash("sha512")
    .update(orderId + statusCode + grossAmount + midtransServerKey)
    .digest("hex");

  // Bandingkan dengan timing-safe agar tahan terhadap timing attack.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Order ID unik & deterministik-ish: KURSUS-<pendaftaranId>-<timestamp>
function buatOrderId(pendaftaranId: number): string {
  return `KURSUS-${pendaftaranId}-${Date.now()}`;
}

interface PesertaSnap {
  nama: string;
  email: string;
  noTelepon?: string | null;
}

/**
 * Buat transaksi Snap di Midtrans untuk sebuah pendaftaran.
 * Mengembalikan snapToken + redirectUrl, dan menyimpan record Pembayaran (PENDING).
 */
export async function buatTransaksiSnap(params: {
  pendaftaranId: number;
  jumlah: number;
  peserta: PesertaSnap;
  itemNama: string[];
}) {
  if (!snap || !midtransConfigured) {
    throw new Error(
      "Midtrans belum dikonfigurasi. Set MIDTRANS_SERVER_KEY & MIDTRANS_CLIENT_KEY di .env"
    );
  }

  const orderId = buatOrderId(params.pendaftaranId);
  const grossAmount = Math.round(params.jumlah);

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    customer_details: {
      first_name: params.peserta.nama,
      email: params.peserta.email,
      phone: params.peserta.noTelepon ?? undefined,
    },
    item_details: [
      {
        id: `PENDAFTARAN-${params.pendaftaranId}`,
        price: grossAmount,
        quantity: 1,
        name: params.itemNama.join(", ").slice(0, 50) || "Pembayaran Kursus",
      },
    ],
    callbacks: {
      finish: `${FRONTEND_URL}/pembayaran/selesai`,
    },
  };

  const transaksi = await snap.createTransaction(parameter);

  const pembayaran = await prisma.pembayaran.create({
    data: {
      pendaftaranId: params.pendaftaranId,
      orderId,
      jumlah: grossAmount,
      status: StatusPembayaran.PENDING,
      snapToken: transaksi.token,
    },
  });

  // Tandai pendaftaran sebagai PENDING menunggu pembayaran.
  await prisma.pendaftaran.update({
    where: { id: params.pendaftaranId },
    data: { statusPembayaran: StatusPembayaran.PENDING },
  });

  return {
    orderId,
    snapToken: transaksi.token,
    redirectUrl: transaksi.redirect_url as string,
    pembayaranId: pembayaran.id,
  };
}

/**
 * Petakan status transaksi Midtrans → enum StatusPembayaran kita.
 * Mengacu pada dokumentasi Midtrans (transaction_status + fraud_status).
 */
export function mapStatusMidtrans(
  transactionStatus: string,
  fraudStatus?: string
): StatusPembayaran {
  switch (transactionStatus) {
    case "capture":
      // kartu kredit: cek fraud
      return fraudStatus === "accept" ? StatusPembayaran.LUNAS : StatusPembayaran.PENDING;
    case "settlement":
      return StatusPembayaran.LUNAS;
    case "pending":
      return StatusPembayaran.PENDING;
    case "deny":
      return StatusPembayaran.GAGAL;
    case "cancel":
      return StatusPembayaran.GAGAL;
    case "expire":
      return StatusPembayaran.KEDALUWARSA;
    case "failure":
      return StatusPembayaran.GAGAL;
    default:
      return StatusPembayaran.PENDING;
  }
}

/**
 * Terapkan status pembayaran ke record Pembayaran (by orderId) dan
 * Pendaftaran terkait. Dipakai oleh webhook maupun cek status on-demand.
 */
async function terapkanStatus(
  orderId: string,
  status: StatusPembayaran,
  extra: { paymentType?: string; raw?: unknown }
) {
  const pembayaran = await prisma.pembayaran.findUnique({ where: { orderId } });
  if (!pembayaran) {
    throw new Error(`Pembayaran dengan orderId ${orderId} tidak ditemukan.`);
  }

  await prisma.pembayaran.update({
    where: { orderId },
    data: {
      status,
      metode: extra.paymentType ?? pembayaran.metode,
      rawResponse: extra.raw ? JSON.stringify(extra.raw) : pembayaran.rawResponse,
    },
  });

  await prisma.pendaftaran.update({
    where: { id: pembayaran.pendaftaranId },
    data: { statusPembayaran: status },
  });

  return { orderId, status, pendaftaranId: pembayaran.pendaftaranId };
}

/**
 * Proses notifikasi (webhook) dari Midtrans: update record Pembayaran
 * dan status pembayaran Pendaftaran terkait.
 */
export async function prosesNotifikasi(notification: Record<string, unknown>) {
  const orderId = String(notification.order_id ?? "");
  const transactionStatus = String(notification.transaction_status ?? "");
  const fraudStatus = notification.fraud_status ? String(notification.fraud_status) : undefined;
  const paymentType = notification.payment_type ? String(notification.payment_type) : undefined;

  if (!orderId) {
    throw new Error("order_id tidak ada pada notifikasi.");
  }

  const status = mapStatusMidtrans(transactionStatus, fraudStatus);
  return terapkanStatus(orderId, status, { paymentType, raw: notification });
}

/**
 * Cek status transaksi langsung ke Midtrans (on-demand), tanpa menunggu webhook.
 * Memanggil Core API via fetch bawaan — library midtrans-client menggantung
 * di runtime Bun, sedangkan fetch terbukti cepat & andal.
 */
export async function cekStatusTransaksi(orderId: string) {
  if (!midtransConfigured) {
    throw new Error("Midtrans belum dikonfigurasi.");
  }

  // Timeout 15 detik agar tidak menggantung jika Midtrans lambat.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  let res: Response;
  try {
    res = await fetch(`${MIDTRANS_API_BASE}/v2/${encodeURIComponent(orderId)}/status`, {
      method: "GET",
      headers: {
        Authorization: midtransAuthHeader(),
        Accept: "application/json",
      },
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new Error(
      aborted
        ? "Timeout menghubungi Midtrans."
        : `Gagal menghubungi Midtrans: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    clearTimeout(timer);
  }

  const statusResponse = (await res.json()) as Record<string, unknown>;
  const statusCode = String(statusResponse.status_code ?? res.status);

  // 404 = transaksi belum pernah diproses (peserta belum menyelesaikan bayar).
  if (statusCode === "404") {
    throw new Error(
      "Transaksi belum diproses di Midtrans. Selesaikan pembayaran terlebih dahulu, lalu cek lagi."
    );
  }
  if (!res.ok && statusCode !== "200" && statusCode !== "201" && statusCode !== "407") {
    const msg = String(statusResponse.status_message ?? `HTTP ${res.status}`);
    throw new Error(`Gagal mengambil status dari Midtrans: ${msg}`);
  }

  const transactionStatus = String(statusResponse.transaction_status ?? "");
  const fraudStatus = statusResponse.fraud_status
    ? String(statusResponse.fraud_status)
    : undefined;
  const paymentType = statusResponse.payment_type
    ? String(statusResponse.payment_type)
    : undefined;

  const status = mapStatusMidtrans(transactionStatus, fraudStatus);
  return terapkanStatus(orderId, status, { paymentType, raw: statusResponse });
}
