-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PESERTA');

-- CreateEnum
CREATE TYPE "StatusPendaftaran" AS ENUM ('AKTIF', 'SELESAI', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "StatusPembayaran" AS ENUM ('BELUM_BAYAR', 'PENDING', 'LUNAS', 'GAGAL', 'KEDALUWARSA');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PESERTA',
    "noTelepon" TEXT,
    "alamat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramKursus" (
    "id" SERIAL NOT NULL,
    "namaProgram" TEXT NOT NULL,
    "deskripsi" TEXT,
    "biaya" DOUBLE PRECISION NOT NULL,
    "durasi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramKursus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pendaftaran" (
    "id" SERIAL NOT NULL,
    "pesertaId" INTEGER NOT NULL,
    "tanggalDaftar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusPendaftaran" NOT NULL DEFAULT 'AKTIF',
    "statusPembayaran" "StatusPembayaran" NOT NULL DEFAULT 'BELUM_BAYAR',
    "totalBiaya" DOUBLE PRECISION NOT NULL,
    "diskon" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAkhir" DOUBLE PRECISION NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pendaftaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendaftaranDetail" (
    "id" SERIAL NOT NULL,
    "pendaftaranId" INTEGER NOT NULL,
    "programKursusId" INTEGER NOT NULL,
    "biayaSatuan" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PendaftaranDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pembayaran" (
    "id" SERIAL NOT NULL,
    "pendaftaranId" INTEGER NOT NULL,
    "orderId" TEXT NOT NULL,
    "jumlah" DOUBLE PRECISION NOT NULL,
    "status" "StatusPembayaran" NOT NULL DEFAULT 'PENDING',
    "snapToken" TEXT,
    "metode" TEXT,
    "rawResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pembayaran_orderId_key" ON "Pembayaran"("orderId");

-- AddForeignKey
ALTER TABLE "Pendaftaran" ADD CONSTRAINT "Pendaftaran_pesertaId_fkey" FOREIGN KEY ("pesertaId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendaftaranDetail" ADD CONSTRAINT "PendaftaranDetail_pendaftaranId_fkey" FOREIGN KEY ("pendaftaranId") REFERENCES "Pendaftaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendaftaranDetail" ADD CONSTRAINT "PendaftaranDetail_programKursusId_fkey" FOREIGN KEY ("programKursusId") REFERENCES "ProgramKursus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pembayaran" ADD CONSTRAINT "Pembayaran_pendaftaranId_fkey" FOREIGN KEY ("pendaftaranId") REFERENCES "Pendaftaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

