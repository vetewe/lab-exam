# PRD — Sistem Manajemen Kursus
**Product Requirements Document**
**Versi:** 1.0.0
**Tanggal:** Juni 2026
**Status:** Ready for Development

---

## 1. Ringkasan Proyek

Sistem web untuk mengelola pendaftaran peserta kursus, termasuk manajemen peserta, program kursus, pendaftaran, kalkulasi pembayaran otomatis dengan aturan diskon, serta laporan keuangan lembaga kursus.

### Tech Stack

| Layer | Teknologi |
|---|---|
| Runtime | **Bun** |
| Backend | **Express.js + TypeScript** |
| ORM | **Prisma** |
| Database | **PostgreSQL** |
| Frontend | **React + TypeScript** |
| Styling | **Tailwind CSS** |
| Auth | **JWT (JSON Web Token)** |
| Version Control | **GitHub** — setiap fitur di-push selesai dibuat |

---

## 2. Alur Kerja Development & GitHub

> **ATURAN WAJIB:** Setiap fitur selesai dibuat → langsung commit & push ke GitHub. Gunakan branch strategy berikut:

```
main
└── develop
    ├── feat/setup-project
    ├── feat/auth
    ├── feat/peserta-crud
    ├── feat/program-kursus-crud
    ├── feat/pendaftaran-crud
    ├── feat/kalkulasi-pembayaran
    └── feat/laporan
```

### Commit Convention
```
feat: add [nama fitur]
fix: fix [nama bug]
chore: setup [nama konfigurasi]
```

### GitHub Push Checklist per Fitur
- [ ] Code selesai dan berjalan
- [ ] Tidak ada error TypeScript
- [ ] `git add .` → `git commit -m "feat: ..."` → `git push origin feat/...`
- [ ] Buat Pull Request ke `develop`

---

## 3. Struktur Direktori Proyek

```
kursus-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── peserta.controller.ts
│   │   │   ├── programKursus.controller.ts
│   │   │   ├── pendaftaran.controller.ts
│   │   │   └── laporan.controller.ts
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts
│   │   │   └── errorHandler.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── peserta.routes.ts
│   │   │   ├── programKursus.routes.ts
│   │   │   ├── pendaftaran.routes.ts
│   │   │   └── laporan.routes.ts
│   │   ├── services/
│   │   │   ├── pembayaran.service.ts
│   │   │   └── laporan.service.ts
│   │   ├── utils/
│   │   │   └── prismaClient.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── PesertaPage.tsx
│   │   │   ├── ProgramKursusPage.tsx
│   │   │   ├── PendaftaranPage.tsx
│   │   │   └── LaporanPage.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## 4. Database Schema (Prisma)

File: `backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUM ────────────────────────────────────────────────
enum Role {
  ADMIN
  STAFF
}

enum StatusPendaftaran {
  AKTIF
  SELESAI
  DIBATALKAN
}

// ─── MODEL USER (AUTH) ───────────────────────────────────
model User {
  id        Int      @id @default(autoincrement())
  nama      String
  email     String   @unique
  password  String
  role      Role     @default(STAFF)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ─── MODEL PESERTA ───────────────────────────────────────
model Peserta {
  id           Int            @id @default(autoincrement())
  nama         String
  email        String         @unique
  noTelepon    String
  alamat       String
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  pendaftaran  Pendaftaran[]
}

// ─── MODEL PROGRAM KURSUS ────────────────────────────────
model ProgramKursus {
  id                  Int                   @id @default(autoincrement())
  namaProgram         String
  deskripsi           String?
  biaya               Float
  durasi              String                // contoh: "3 bulan", "12 minggu"
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt
  pendaftaranDetail   PendaftaranDetail[]
}

// ─── MODEL PENDAFTARAN ───────────────────────────────────
model Pendaftaran {
  id                Int                 @id @default(autoincrement())
  pesertaId         Int
  tanggalDaftar     DateTime            @default(now())
  status            StatusPendaftaran   @default(AKTIF)
  totalBiaya        Float               // jumlah biaya semua kursus
  diskon            Float               @default(0) // nominal diskon
  totalAkhir        Float               // totalBiaya - diskon
  catatan           String?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  peserta           Peserta             @relation(fields: [pesertaId], references: [id])
  detail            PendaftaranDetail[]
}

// ─── MODEL DETAIL PENDAFTARAN (relasi many-to-many) ──────
model PendaftaranDetail {
  id              Int           @id @default(autoincrement())
  pendaftaranId   Int
  programKursusId Int
  biayaSatuan     Float         // snapshot biaya saat pendaftaran

  pendaftaran     Pendaftaran   @relation(fields: [pendaftaranId], references: [id], onDelete: Cascade)
  programKursus   ProgramKursus @relation(fields: [programKursusId], references: [id])
}
```

---

## 5. Aturan Bisnis Kalkulasi Pembayaran

Implementasi di: `backend/src/services/pembayaran.service.ts`

```
ATURAN DISKON:
─────────────────────────────────────────────────────────
1. Jika peserta mendaftar 2 kursus sekaligus
   → diskon 20% dari total biaya

2. Jika mendaftar 1 kursus dengan biaya > Rp 1.000.000
   → diskon 10% dari total biaya

3. Jika mendaftar 2 kursus sekaligus DAN total > Rp 1.000.000
   → tetap diskon 20% (diskon lebih besar berlaku)

4. Jika tidak memenuhi syarat apapun
   → diskon 0

FORMULA:
─────────────────────────────────────────────────────────
totalBiaya  = SUM(biaya semua kursus yang dipilih)
diskon      = totalBiaya × persentaseDiskon
totalAkhir  = totalBiaya - diskon
```

### Pseudocode Service Kalkulasi

```typescript
function hitungPembayaran(kursus: ProgramKursus[]): HasilKalkulasi {
  const totalBiaya = kursus.reduce((sum, k) => sum + k.biaya, 0);
  
  let persentaseDiskon = 0;

  if (kursus.length >= 2) {
    persentaseDiskon = 0.20; // 20%
  } else if (kursus.length === 1 && totalBiaya > 1_000_000) {
    persentaseDiskon = 0.10; // 10%
  }

  const diskon    = totalBiaya * persentaseDiskon;
  const totalAkhir = totalBiaya - diskon;

  return { totalBiaya, diskon, totalAkhir, persentaseDiskon };
}
```

---

## 6. API Endpoints (Backend Express)

Base URL: `http://localhost:3000/api`

### 6.1 Auth

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login, kembalikan JWT | ❌ |
| POST | `/auth/register` | Buat user baru (admin only) | ✅ ADMIN |
| GET | `/auth/me` | Data user yang sedang login | ✅ |

### 6.2 Peserta

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | `/peserta` | List semua peserta | ✅ |
| GET | `/peserta/:id` | Detail peserta + riwayat pendaftaran | ✅ |
| POST | `/peserta` | Tambah peserta baru | ✅ |
| PUT | `/peserta/:id` | Edit data peserta | ✅ |
| DELETE | `/peserta/:id` | Hapus peserta | ✅ ADMIN |

**Body POST/PUT `/peserta`:**
```json
{
  "nama": "Budi Santoso",
  "email": "budi@email.com",
  "noTelepon": "081234567890",
  "alamat": "Jl. Merdeka No. 10, Jakarta"
}
```

### 6.3 Program Kursus

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | `/program-kursus` | List semua program | ✅ |
| GET | `/program-kursus/:id` | Detail program | ✅ |
| POST | `/program-kursus` | Tambah program baru | ✅ ADMIN |
| PUT | `/program-kursus/:id` | Edit program | ✅ ADMIN |
| DELETE | `/program-kursus/:id` | Hapus program | ✅ ADMIN |

**Body POST/PUT `/program-kursus`:**
```json
{
  "namaProgram": "Web Development Fullstack",
  "deskripsi": "Belajar React, Node.js, dan database dari nol.",
  "biaya": 1500000,
  "durasi": "3 bulan"
}
```

### 6.4 Pendaftaran

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | `/pendaftaran` | List semua pendaftaran | ✅ |
| GET | `/pendaftaran/:id` | Detail pendaftaran | ✅ |
| POST | `/pendaftaran` | Buat pendaftaran baru + hitung otomatis | ✅ |
| PUT | `/pendaftaran/:id` | Edit status / catatan | ✅ |
| DELETE | `/pendaftaran/:id` | Batalkan pendaftaran | ✅ ADMIN |

**Body POST `/pendaftaran`:**
```json
{
  "pesertaId": 1,
  "programKursusIds": [2, 5],
  "catatan": "Bayar via transfer BCA"
}
```

**Response POST `/pendaftaran`:**
```json
{
  "id": 10,
  "peserta": { "id": 1, "nama": "Budi Santoso" },
  "detail": [
    { "programKursus": { "namaProgram": "UI/UX Design", "biaya": 1200000 } },
    { "programKursus": { "namaProgram": "Web Development", "biaya": 1500000 } }
  ],
  "totalBiaya": 2700000,
  "diskon": 540000,
  "totalAkhir": 2160000,
  "keteranganDiskon": "Diskon 20% karena mendaftar 2 kursus",
  "status": "AKTIF"
}
```

### 6.5 Laporan

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | `/laporan/peserta` | Daftar semua peserta + program yang diikuti | ✅ |
| GET | `/laporan/pembayaran-peserta` | Total pembayaran per peserta | ✅ |
| GET | `/laporan/pendapatan` | Total pendapatan lembaga kursus | ✅ |
| GET | `/laporan/ringkasan` | Dashboard ringkasan semua laporan | ✅ |

---

## 7. Fitur Frontend (React)

### 7.1 Halaman & Komponen

| Halaman | Route | Deskripsi |
|---|---|---|
| Login | `/login` | Form login, simpan JWT ke localStorage |
| Dashboard | `/` | Ringkasan statistik (total peserta, pendapatan, dll) |
| Peserta | `/peserta` | Tabel peserta + tombol CRUD |
| Program Kursus | `/program-kursus` | Tabel program + tombol CRUD |
| Pendaftaran | `/pendaftaran` | Form pendaftaran + preview kalkulasi |
| Laporan | `/laporan` | 3 jenis laporan dalam tab |

### 7.2 Fitur Kunci Frontend

**Form Pendaftaran (UX Penting):**
- Dropdown pilih peserta
- Checkbox multi-pilih program kursus (bisa pilih lebih dari 1)
- Preview real-time kalkulasi diskon saat user memilih kursus
- Tampil: Total Biaya, Diskon (%), Keterangan Diskon, **Total Akhir**

**Halaman Laporan — 3 Tab:**
1. **Tab "Daftar Peserta & Program"** — tabel: nama peserta | program yang diikuti | tanggal daftar | status
2. **Tab "Pembayaran per Peserta"** — tabel: nama peserta | total transaksi | total biaya | total diskon | total akhir
3. **Tab "Pendapatan Lembaga"** — kartu ringkasan: Total Pendapatan Kotor, Total Diskon Diberikan, **Total Pendapatan Bersih**

---

## 8. Rencana Development (Urutan Fitur)

Setiap fitur selesai → push ke GitHub.

### Fitur 1: Setup Project
**Branch:** `feat/setup-project`
- [ ] Init Bun project untuk backend & frontend
- [ ] Setup Express + TypeScript di backend
- [ ] Setup Prisma + koneksi database
- [ ] Setup React + TypeScript + Tailwind di frontend
- [ ] Buat `.env.example`
- [ ] Buat `README.md` dasar
- **Push:** `feat: initial project setup with Bun, Express TS, Prisma, React TS`

### Fitur 2: Database Schema & Migration
**Branch:** `feat/database-schema`
- [ ] Tulis schema Prisma (semua model sesuai bagian 4)
- [ ] Jalankan `bunx prisma migrate dev --name init`
- [ ] Buat `seed.ts` dengan data sample (3 peserta, 4 program kursus, 1 user admin)
- **Push:** `feat: add prisma schema and initial seed data`

### Fitur 3: Auth (Login & JWT)
**Branch:** `feat/auth`
- [ ] Backend: route POST `/auth/login`, POST `/auth/register`, GET `/auth/me`
- [ ] Middleware JWT (`auth.middleware.ts`)
- [ ] Password hashing dengan `bcrypt`
- [ ] Frontend: `LoginPage.tsx`, `AuthContext.tsx`, protected routes
- **Push:** `feat: implement JWT auth with login and role-based access`

### Fitur 4: CRUD Peserta
**Branch:** `feat/peserta-crud`
- [ ] Backend: semua endpoint `/peserta` (GET list, GET by id, POST, PUT, DELETE)
- [ ] Frontend: `PesertaPage.tsx` dengan tabel + modal form tambah/edit + konfirmasi hapus
- [ ] Validasi input (email unik, no telepon format)
- **Push:** `feat: full CRUD for peserta`

### Fitur 5: CRUD Program Kursus
**Branch:** `feat/program-kursus-crud`
- [ ] Backend: semua endpoint `/program-kursus`
- [ ] Frontend: `ProgramKursusPage.tsx` dengan tabel + modal form + format Rupiah untuk biaya
- **Push:** `feat: full CRUD for program kursus`

### Fitur 6: Kalkulasi Pembayaran (Service)
**Branch:** `feat/kalkulasi-pembayaran`
- [ ] Buat `pembayaran.service.ts` dengan fungsi `hitungPembayaran()`
- [ ] Unit test logika diskon (opsional)
- [ ] Endpoint GET `/pendaftaran/preview` untuk kalkulasi tanpa simpan
- **Push:** `feat: add payment calculation service with discount rules`

### Fitur 7: CRUD Pendaftaran
**Branch:** `feat/pendaftaran-crud`
- [ ] Backend: semua endpoint `/pendaftaran`, integrasikan `pembayaran.service.ts`
- [ ] Simpan `PendaftaranDetail` untuk setiap kursus yang dipilih
- [ ] Frontend: `PendaftaranPage.tsx`:
  - Tabel list pendaftaran
  - Form buat pendaftaran (multi-select program kursus)
  - Preview kalkulasi real-time saat memilih kursus
  - Detail pendaftaran
- **Push:** `feat: full CRUD for pendaftaran with auto payment calculation`

### Fitur 8: Laporan
**Branch:** `feat/laporan`
- [ ] Backend: endpoint laporan (bagian 6.5)
- [ ] `laporan.service.ts` untuk query agregasi Prisma
- [ ] Frontend: `LaporanPage.tsx` dengan 3 tab laporan
- [ ] Format angka ke Rupiah di seluruh laporan
- [ ] Tombol Export (opsional: cetak / download CSV)
- **Push:** `feat: add reporting module with 3 report types`

### Fitur 9: Dashboard & Polish
**Branch:** `feat/dashboard`
- [ ] Dashboard dengan kartu statistik (total peserta aktif, pendapatan bulan ini, dll)
- [ ] Navigasi sidebar/navbar
- [ ] Loading states & error handling global
- [ ] Responsive mobile
- **Push:** `feat: dashboard overview and UI polish`

---

## 9. Environment Variables

File: `backend/.env`

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kursus_db"

# JWT
JWT_SECRET="ganti_dengan_secret_yang_kuat"
JWT_EXPIRES_IN="7d"

# App
PORT=3000
NODE_ENV=development
```

File: `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 10. Contoh Response API Laporan

### GET `/laporan/peserta`
```json
{
  "data": [
    {
      "peserta": { "id": 1, "nama": "Budi Santoso", "email": "budi@email.com" },
      "program": [
        { "namaProgram": "Web Development", "tanggalDaftar": "2026-06-01", "status": "AKTIF" },
        { "namaProgram": "UI/UX Design", "tanggalDaftar": "2026-06-01", "status": "AKTIF" }
      ]
    }
  ]
}
```

### GET `/laporan/pembayaran-peserta`
```json
{
  "data": [
    {
      "peserta": { "id": 1, "nama": "Budi Santoso" },
      "jumlahTransaksi": 2,
      "totalBiayaKotor": 4200000,
      "totalDiskon": 840000,
      "totalAkhir": 3360000
    }
  ]
}
```

### GET `/laporan/pendapatan`
```json
{
  "totalPendaftaran": 25,
  "totalPendapatanKotor": 32000000,
  "totalDiskonDiberikan": 4800000,
  "totalPendapatanBersih": 27200000
}
```

---

## 11. Role & Hak Akses

| Fitur | ADMIN | STAFF |
|---|---|---|
| Login | ✅ | ✅ |
| Lihat semua data | ✅ | ✅ |
| CRUD Peserta | ✅ | ✅ (kecuali hapus) |
| CRUD Program Kursus | ✅ | ❌ (hanya lihat) |
| Buat Pendaftaran | ✅ | ✅ |
| Batalkan Pendaftaran | ✅ | ❌ |
| Akses Laporan | ✅ | ✅ |
| Buat User Baru | ✅ | ❌ |

---

## 12. Checklist Sebelum Submit / Demo

- [ ] Semua endpoint berjalan tanpa error
- [ ] Logika diskon: 10% (biaya > 1jt), 20% (2 kursus), tidak berlaku ganda
- [ ] CRUD semua entitas berfungsi penuh
- [ ] 3 laporan tampil dengan data yang benar
- [ ] JWT auth berjalan + protected routes di frontend
- [ ] Semua fitur sudah di-push ke GitHub dengan pesan commit yang jelas
- [ ] `README.md` berisi: cara setup, cara run, akun demo default

---

*PRD ini dibuat untuk keperluan ujian pemrograman. Semua fitur wajib di-push ke GitHub setiap selesai.*
