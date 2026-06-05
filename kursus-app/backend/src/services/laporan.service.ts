import { StatusPendaftaran } from "@prisma/client";
import prisma from "../utils/prismaClient.js";

// ─── Laporan: Daftar Peserta & Program yang diikuti ──────
export async function laporanPeserta() {
  const peserta = await prisma.peserta.findMany({
    orderBy: { nama: "asc" },
    include: {
      pendaftaran: {
        include: { detail: { include: { programKursus: true } } },
      },
    },
  });

  return peserta.map((p) => ({
    peserta: { id: p.id, nama: p.nama, email: p.email },
    program: p.pendaftaran.flatMap((daftar) =>
      daftar.detail.map((d) => ({
        namaProgram: d.programKursus.namaProgram,
        tanggalDaftar: daftar.tanggalDaftar.toISOString().split("T")[0],
        status: daftar.status,
      }))
    ),
  }));
}

// ─── Laporan: Total Pembayaran per Peserta ───────────────
export async function laporanPembayaranPeserta() {
  const peserta = await prisma.peserta.findMany({
    orderBy: { nama: "asc" },
    include: {
      pendaftaran: {
        where: { status: { not: StatusPendaftaran.DIBATALKAN } },
      },
    },
  });

  return peserta
    .map((p) => {
      const jumlahTransaksi = p.pendaftaran.length;
      const totalBiayaKotor = p.pendaftaran.reduce((s, d) => s + d.totalBiaya, 0);
      const totalDiskon = p.pendaftaran.reduce((s, d) => s + d.diskon, 0);
      const totalAkhir = p.pendaftaran.reduce((s, d) => s + d.totalAkhir, 0);

      return {
        peserta: { id: p.id, nama: p.nama },
        jumlahTransaksi,
        totalBiayaKotor,
        totalDiskon,
        totalAkhir,
      };
    })
    .filter((p) => p.jumlahTransaksi > 0);
}

// ─── Laporan: Total Pendapatan Lembaga ───────────────────
export async function laporanPendapatan() {
  const pendaftaran = await prisma.pendaftaran.findMany({
    where: { status: { not: StatusPendaftaran.DIBATALKAN } },
  });

  const totalPendaftaran = pendaftaran.length;
  const totalPendapatanKotor = pendaftaran.reduce((s, d) => s + d.totalBiaya, 0);
  const totalDiskonDiberikan = pendaftaran.reduce((s, d) => s + d.diskon, 0);
  const totalPendapatanBersih = pendaftaran.reduce((s, d) => s + d.totalAkhir, 0);

  return {
    totalPendaftaran,
    totalPendapatanKotor,
    totalDiskonDiberikan,
    totalPendapatanBersih,
  };
}

// ─── Ringkasan Dashboard ─────────────────────────────────
export async function laporanRingkasan() {
  const [totalPeserta, totalProgram, pendapatan, pendaftaranAktif] = await Promise.all([
    prisma.peserta.count(),
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
