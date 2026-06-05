import { StatusPendaftaran, StatusPembayaran, type Prisma } from "@prisma/client";
import prisma from "../utils/prismaClient.js";

// ─── Filter periode (berdasarkan tanggalDaftar) ──────────
export interface PeriodeFilter {
  bulan?: number; // 1-12
  tahun?: number;
}

// Bangun klausa where untuk rentang tanggalDaftar sesuai periode.
function rentangTanggal(periode: PeriodeFilter): Prisma.PendaftaranWhereInput {
  const { bulan, tahun } = periode;
  if (!tahun) return {};

  // Bulan diberikan → rentang 1 bulan; hanya tahun → rentang 1 tahun.
  const start = bulan
    ? new Date(Date.UTC(tahun, bulan - 1, 1))
    : new Date(Date.UTC(tahun, 0, 1));
  const end = bulan
    ? new Date(Date.UTC(tahun, bulan, 1))
    : new Date(Date.UTC(tahun + 1, 0, 1));

  return { tanggalDaftar: { gte: start, lt: end } };
}

// ─── Laporan: Daftar Peserta & Program yang diikuti ──────
export async function laporanPeserta(periode: PeriodeFilter = {}) {
  const filter = rentangTanggal(periode);
  const peserta = await prisma.user.findMany({
    where: { role: "PESERTA" },
    orderBy: { nama: "asc" },
    include: {
      pendaftaran: {
        where: filter,
        include: { detail: { include: { programKursus: true } } },
      },
    },
  });

  return peserta
    .map((p) => ({
      peserta: { id: p.id, nama: p.nama, email: p.email },
      program: p.pendaftaran.flatMap((daftar) =>
        daftar.detail.map((d) => ({
          namaProgram: d.programKursus.namaProgram,
          tanggalDaftar: daftar.tanggalDaftar.toISOString().split("T")[0],
          status: daftar.status,
        }))
      ),
    }))
    // Saat periode difilter, sembunyikan peserta tanpa program di periode itu.
    .filter((p) => (periode.tahun ? p.program.length > 0 : true));
}

// ─── Laporan: Total Pembayaran per Peserta ───────────────
export async function laporanPembayaranPeserta(periode: PeriodeFilter = {}) {
  const filter = rentangTanggal(periode);
  const peserta = await prisma.user.findMany({
    where: { role: "PESERTA" },
    orderBy: { nama: "asc" },
    include: {
      pendaftaran: {
        where: { status: { not: StatusPendaftaran.DIBATALKAN }, ...filter },
      },
    },
  });

  return peserta
    .map((p) => {
      const jumlahTransaksi = p.pendaftaran.length;
      const totalBiayaKotor = p.pendaftaran.reduce((s, d) => s + d.totalBiaya, 0);
      const totalDiskon = p.pendaftaran.reduce((s, d) => s + d.diskon, 0);
      const totalAkhir = p.pendaftaran.reduce((s, d) => s + d.totalAkhir, 0);
      const totalLunas = p.pendaftaran
        .filter((d) => d.statusPembayaran === StatusPembayaran.LUNAS)
        .reduce((s, d) => s + d.totalAkhir, 0);

      return {
        peserta: { id: p.id, nama: p.nama },
        jumlahTransaksi,
        totalBiayaKotor,
        totalDiskon,
        totalAkhir,
        totalLunas,
      };
    })
    .filter((p) => p.jumlahTransaksi > 0);
}

// ─── Laporan: Total Pendapatan Lembaga ───────────────────
export async function laporanPendapatan(periode: PeriodeFilter = {}) {
  const filter = rentangTanggal(periode);
  const pendaftaran = await prisma.pendaftaran.findMany({
    where: { status: { not: StatusPendaftaran.DIBATALKAN }, ...filter },
  });

  const totalPendaftaran = pendaftaran.length;
  const totalPendapatanKotor = pendaftaran.reduce((s, d) => s + d.totalBiaya, 0);
  const totalDiskonDiberikan = pendaftaran.reduce((s, d) => s + d.diskon, 0);
  const totalPendapatanBersih = pendaftaran.reduce((s, d) => s + d.totalAkhir, 0);

  // Pendapatan yang benar-benar sudah diterima (LUNAS) vs masih tertunda.
  const lunas = pendaftaran.filter((d) => d.statusPembayaran === StatusPembayaran.LUNAS);
  const totalPendapatanLunas = lunas.reduce((s, d) => s + d.totalAkhir, 0);
  const totalPendapatanTertunda = totalPendapatanBersih - totalPendapatanLunas;

  return {
    totalPendaftaran,
    totalPendapatanKotor,
    totalDiskonDiberikan,
    totalPendapatanBersih,
    totalPendapatanLunas,
    totalPendapatanTertunda,
  };
}

// ─── Laporan detail per Peserta (untuk cetak) ────────────
export async function laporanDetailPeserta(pesertaId: number) {
  const peserta = await prisma.user.findFirst({
    where: { id: pesertaId, role: "PESERTA" },
    include: {
      pendaftaran: {
        orderBy: { tanggalDaftar: "desc" },
        include: {
          detail: { include: { programKursus: true } },
          pembayaran: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  if (!peserta) return null;

  const aktif = peserta.pendaftaran.filter((d) => d.status !== StatusPendaftaran.DIBATALKAN);
  const totalBiaya = aktif.reduce((s, d) => s + d.totalBiaya, 0);
  const totalDiskon = aktif.reduce((s, d) => s + d.diskon, 0);
  const totalAkhir = aktif.reduce((s, d) => s + d.totalAkhir, 0);
  const totalLunas = aktif
    .filter((d) => d.statusPembayaran === StatusPembayaran.LUNAS)
    .reduce((s, d) => s + d.totalAkhir, 0);

  return {
    peserta: {
      id: peserta.id,
      nama: peserta.nama,
      email: peserta.email,
      noTelepon: peserta.noTelepon,
      alamat: peserta.alamat,
    },
    pendaftaran: peserta.pendaftaran.map((d) => ({
      id: d.id,
      tanggalDaftar: d.tanggalDaftar.toISOString().split("T")[0],
      status: d.status,
      statusPembayaran: d.statusPembayaran,
      totalBiaya: d.totalBiaya,
      diskon: d.diskon,
      totalAkhir: d.totalAkhir,
      program: d.detail.map((x) => ({
        namaProgram: x.programKursus.namaProgram,
        biayaSatuan: x.biayaSatuan,
      })),
    })),
    ringkasan: {
      jumlahPendaftaran: aktif.length,
      totalBiaya,
      totalDiskon,
      totalAkhir,
      totalLunas,
      totalTertunda: totalAkhir - totalLunas,
    },
  };
}

// ─── Ringkasan Dashboard ─────────────────────────────────
export async function laporanRingkasan() {
  const [totalPeserta, totalProgram, pendapatan, pendaftaranAktif] = await Promise.all([
    prisma.user.count({ where: { role: "PESERTA" } }),
    prisma.programKursus.count(),
    laporanPendapatan(),
    prisma.pendaftaran.count({ where: { status: StatusPendaftaran.AKTIF } }),
  ]);

  return {
    totalPeserta,
    totalProgram,
    totalPendaftaranAktif: pendaftaranAktif,
    ...pendapatan,
  };
}
