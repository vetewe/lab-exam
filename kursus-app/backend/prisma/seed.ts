import { PrismaClient, Role, StatusPendaftaran, StatusPembayaran } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Mulai seeding...");

  // ─── Bersihkan data lama (urutan penting karena relasi) ───
  await prisma.pembayaran.deleteMany();
  await prisma.pendaftaranDetail.deleteMany();
  await prisma.pendaftaran.deleteMany();
  await prisma.programKursus.deleteMany();
  await prisma.user.deleteMany();

  // ─── USER STAF ──────────────────────────────────────────
  const passwordAdmin = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      nama: "Administrator",
      email: "admin@kursus.com",
      password: passwordAdmin,
      role: Role.ADMIN,
    },
  });

  console.log(`✅ User admin dibuat (${admin.email})`);

  // ─── USER PESERTA (3 peserta) ───────────────────────────
  const passwordPeserta = await bcrypt.hash("peserta123", 10);

  const [budi, siti, andi] = await Promise.all([
    prisma.user.create({
      data: {
        nama: "Budi Santoso",
        email: "budi@email.com",
        password: passwordPeserta,
        role: Role.PESERTA,
        noTelepon: "081234567890",
        alamat: "Jl. Merdeka No. 10, Jakarta",
      },
    }),
    prisma.user.create({
      data: {
        nama: "Siti Aminah",
        email: "siti@email.com",
        password: passwordPeserta,
        role: Role.PESERTA,
        noTelepon: "082345678901",
        alamat: "Jl. Sudirman No. 25, Bandung",
      },
    }),
    prisma.user.create({
      data: {
        nama: "Andi Wijaya",
        email: "andi@email.com",
        password: passwordPeserta,
        role: Role.PESERTA,
        noTelepon: "083456789012",
        alamat: "Jl. Gajah Mada No. 5, Surabaya",
      },
    }),
  ]);

  console.log("✅ 3 Peserta (User role PESERTA) dibuat");

  // ─── PROGRAM KURSUS (4 program) ─────────────────────────
  const [webDev, uiux, dataScience, english] = await Promise.all([
    prisma.programKursus.create({
      data: {
        namaProgram: "Web Development Fullstack",
        deskripsi: "Belajar React, Node.js, dan database dari nol.",
        biaya: 1_500_000,
        durasi: "3 bulan",
      },
    }),
    prisma.programKursus.create({
      data: {
        namaProgram: "UI/UX Design",
        deskripsi: "Mendesain antarmuka & pengalaman pengguna dengan Figma.",
        biaya: 1_200_000,
        durasi: "2 bulan",
      },
    }),
    prisma.programKursus.create({
      data: {
        namaProgram: "Data Science & Machine Learning",
        deskripsi: "Analisis data dan model ML dengan Python.",
        biaya: 2_000_000,
        durasi: "4 bulan",
      },
    }),
    prisma.programKursus.create({
      data: {
        namaProgram: "English Conversation",
        deskripsi: "Kelas percakapan bahasa Inggris level pemula-mahir.",
        biaya: 800_000,
        durasi: "12 minggu",
      },
    }),
  ]);

  console.log("✅ 4 Program kursus dibuat");

  // ─── PENDAFTARAN CONTOH ─────────────────────────────────
  // Budi: 2 kursus (Web Dev + UI/UX) → diskon 20%, sudah LUNAS
  const totalBudi = webDev.biaya + uiux.biaya; // 2.700.000
  const diskonBudi = totalBudi * 0.2;
  await prisma.pendaftaran.create({
    data: {
      pesertaId: budi.id,
      status: StatusPendaftaran.AKTIF,
      statusPembayaran: StatusPembayaran.LUNAS,
      totalBiaya: totalBudi,
      diskon: diskonBudi,
      totalAkhir: totalBudi - diskonBudi,
      catatan: "Bayar via transfer BCA",
      detail: {
        create: [
          { programKursusId: webDev.id, biayaSatuan: webDev.biaya },
          { programKursusId: uiux.id, biayaSatuan: uiux.biaya },
        ],
      },
    },
  });

  // Siti: 1 kursus Data Science (2jt > 1jt) → diskon 10%, BELUM BAYAR
  const totalSiti = dataScience.biaya;
  const diskonSiti = totalSiti * 0.1;
  await prisma.pendaftaran.create({
    data: {
      pesertaId: siti.id,
      status: StatusPendaftaran.AKTIF,
      statusPembayaran: StatusPembayaran.BELUM_BAYAR,
      totalBiaya: totalSiti,
      diskon: diskonSiti,
      totalAkhir: totalSiti - diskonSiti,
      catatan: "Cicilan 2x",
      detail: {
        create: [{ programKursusId: dataScience.id, biayaSatuan: dataScience.biaya }],
      },
    },
  });

  // Andi: 1 kursus English (800rb < 1jt) → diskon 0, BELUM BAYAR
  const totalAndi = english.biaya;
  await prisma.pendaftaran.create({
    data: {
      pesertaId: andi.id,
      status: StatusPendaftaran.AKTIF,
      statusPembayaran: StatusPembayaran.BELUM_BAYAR,
      totalBiaya: totalAndi,
      diskon: 0,
      totalAkhir: totalAndi,
      detail: {
        create: [{ programKursusId: english.id, biayaSatuan: english.biaya }],
      },
    },
  });

  console.log("✅ 3 Pendaftaran contoh dibuat");
  console.log("🎉 Seeding selesai!");
  console.log("\n─── Akun Demo ───");
  console.log("ADMIN   → admin@kursus.com / admin123");
  console.log("PESERTA → budi@email.com / peserta123");
  console.log("PESERTA → siti@email.com / peserta123");
  console.log("PESERTA → andi@email.com / peserta123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
