export type Role = "ADMIN" | "STAFF";

export type StatusPendaftaran = "AKTIF" | "SELESAI" | "DIBATALKAN";

export interface User {
  id: number;
  nama: string;
  email: string;
  role: Role;
  createdAt?: string;
}

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

export interface Pendaftaran {
  id: number;
  pesertaId: number;
  tanggalDaftar: string;
  status: StatusPendaftaran;
  totalBiaya: number;
  diskon: number;
  totalAkhir: number;
  catatan?: string | null;
  peserta?: Pick<Peserta, "id" | "nama" | "email">;
  detail: PendaftaranDetail[];
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
}

export interface LaporanPendapatan {
  totalPendaftaran: number;
  totalPendapatanKotor: number;
  totalDiskonDiberikan: number;
  totalPendapatanBersih: number;
}

export interface LaporanRingkasan extends LaporanPendapatan {
  totalPeserta: number;
  totalProgram: number;
  totalPendaftaranAktif: number;
}
