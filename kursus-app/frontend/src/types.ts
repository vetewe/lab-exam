export type Role = "ADMIN" | "PESERTA";

export type StatusPendaftaran = "AKTIF" | "SELESAI" | "DIBATALKAN";

export type StatusPembayaran =
  | "BELUM_BAYAR"
  | "PENDING"
  | "LUNAS"
  | "GAGAL"
  | "KEDALUWARSA";

export interface User {
  id: number;
  nama: string;
  email: string;
  role: Role;
  noTelepon?: string | null;
  alamat?: string | null;
  createdAt?: string;
}

// Peserta = User dengan role PESERTA (untuk halaman admin).
export interface Peserta {
  id: number;
  nama: string;
  email: string;
  noTelepon: string;
  alamat: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: { pendaftaran: number };
  pendaftaran?: Pendaftaran[];
}

export interface ProgramKursus {
  id: number;
  namaProgram: string;
  deskripsi?: string | null;
  biaya: number;
  durasi: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PendaftaranDetail {
  id: number;
  pendaftaranId: number;
  programKursusId: number;
  biayaSatuan: number;
  programKursus: ProgramKursus;
}

export interface Pembayaran {
  id: number;
  pendaftaranId: number;
  orderId: string;
  jumlah: number;
  status: StatusPembayaran;
  snapToken?: string | null;
  metode?: string | null;
  createdAt?: string;
}

export interface Pendaftaran {
  id: number;
  pesertaId: number;
  tanggalDaftar: string;
  status: StatusPendaftaran;
  statusPembayaran: StatusPembayaran;
  totalBiaya: number;
  diskon: number;
  totalAkhir: number;
  catatan?: string | null;
  peserta?: Pick<Peserta, "id" | "nama" | "email"> & {
    noTelepon?: string | null;
    alamat?: string | null;
  };
  detail: PendaftaranDetail[];
  pembayaran?: Pembayaran[];
  keteranganDiskon?: string;
}

export interface HasilKalkulasi {
  kursus: { id: number; namaProgram: string; biaya: number }[];
  totalBiaya: number;
  diskon: number;
  totalAkhir: number;
  persentaseDiskon: number;
  keteranganDiskon: string;
}

// ─── Pembayaran (Midtrans) ───────────────────────────────
export interface MidtransConfig {
  configured: boolean;
  clientKey: string | null;
  isProduction: boolean;
}

export interface SnapResult {
  orderId: string;
  snapToken: string;
  redirectUrl: string;
  pembayaranId: number;
}

// ─── Laporan ─────────────────────────────────────────────
export interface LaporanPesertaItem {
  peserta: { id: number; nama: string; email: string };
  program: { namaProgram: string; tanggalDaftar: string; status: StatusPendaftaran }[];
}

export interface LaporanPembayaranItem {
  peserta: { id: number; nama: string };
  jumlahTransaksi: number;
  totalBiayaKotor: number;
  totalDiskon: number;
  totalAkhir: number;
  totalLunas: number;
}

export interface LaporanPendapatan {
  totalPendaftaran: number;
  totalPendapatanKotor: number;
  totalDiskonDiberikan: number;
  totalPendapatanBersih: number;
  totalPendapatanLunas: number;
  totalPendapatanTertunda: number;
}

export interface LaporanRingkasan extends LaporanPendapatan {
  totalPeserta: number;
  totalProgram: number;
  totalPendaftaranAktif: number;
}

// ─── Laporan detail per siswa (untuk cetak) ──────────────
export interface LaporanDetailPeserta {
  peserta: {
    id: number;
    nama: string;
    email: string;
    noTelepon?: string | null;
    alamat?: string | null;
  };
  pendaftaran: {
    id: number;
    tanggalDaftar: string;
    status: StatusPendaftaran;
    statusPembayaran: StatusPembayaran;
    totalBiaya: number;
    diskon: number;
    totalAkhir: number;
    program: { namaProgram: string; biayaSatuan: number }[];
  }[];
  ringkasan: {
    jumlahPendaftaran: number;
    totalBiaya: number;
    totalDiskon: number;
    totalAkhir: number;
    totalLunas: number;
    totalTertunda: number;
  };
}
