// ─── Service Kalkulasi Pembayaran ────────────────────────
// Mengimplementasikan aturan diskon sesuai PRD bagian 5.

export interface KursusInput {
  id: number;
  namaProgram: string;
  biaya: number;
}

export interface HasilKalkulasi {
  totalBiaya: number;
  diskon: number;
  totalAkhir: number;
  persentaseDiskon: number;
  keteranganDiskon: string;
}

/**
 * Hitung pembayaran berdasarkan daftar kursus yang dipilih.
 *
 * Aturan diskon:
 * 1. >= 2 kursus               → diskon 20%
 * 2. 1 kursus & biaya > 1jt    → diskon 10%
 * 3. 2 kursus & total > 1jt    → tetap 20% (diskon terbesar berlaku)
 * 4. selain itu                → diskon 0
 */
export function hitungPembayaran(kursus: KursusInput[]): HasilKalkulasi {
  const totalBiaya = kursus.reduce((sum, k) => sum + k.biaya, 0);

  let persentaseDiskon = 0;
  let keteranganDiskon = "Tidak ada diskon";

  if (kursus.length >= 2) {
    persentaseDiskon = 0.2; // 20%
    keteranganDiskon = "Diskon 20% karena mendaftar 2 kursus atau lebih";
  } else if (kursus.length === 1 && totalBiaya > 1_000_000) {
    persentaseDiskon = 0.1; // 10%
    keteranganDiskon = "Diskon 10% karena biaya kursus di atas Rp 1.000.000";
  }

  const diskon = totalBiaya * persentaseDiskon;
  const totalAkhir = totalBiaya - diskon;

  return { totalBiaya, diskon, totalAkhir, persentaseDiskon, keteranganDiskon };
}
