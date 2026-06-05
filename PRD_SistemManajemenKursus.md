# BOOTS — Sistem Manajemen Kursus
**Reinforce Your Knowledge**

Aplikasi web untuk mengelola pendaftaran peserta kursus: manajemen peserta, program kursus, pendaftaran, kalkulasi pembayaran otomatis dengan aturan diskon, pembayaran mandiri oleh peserta via Midtrans, serta laporan keuangan lembaga.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Runtime | Bun |
| Backend | Express.js + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Auth | JWT (JSON Web Token) |
| Payment | Midtrans Snap (sandbox) |

## Struktur Proyek

```
kursus-app/
├── backend/    # API Express + Prisma + PostgreSQL
└── frontend/   # React + Vite + Tailwind
```

## Prasyarat

- [Bun](https://bun.sh) v1.3+
- PostgreSQL berjalan secara lokal (atau remote)

## Setup & Menjalankan

### 1. Backend

```bash
cd backend

# Install dependency
bun install

# Salin & sesuaikan environment
cp .env.example .env
# Edit DATABASE_URL sesuai koneksi PostgreSQL Anda
# Isi MIDTRANS_SERVER_KEY & MIDTRANS_CLIENT_KEY (sandbox) bila ingin uji pembayaran

# Generate Prisma client
bunx prisma generate

# Jalankan migrasi (buat tabel di database)
bunx prisma migrate dev

# Isi data sample (1 admin, 3 peserta, 4 program)
bun run prisma:seed

# Jalankan server (http://localhost:3000)
bun run dev
```

### 2. Frontend

```bash
cd frontend

# Install dependency
bun install

# Salin environment (default sudah menunjuk ke localhost:3000)
cp .env.example .env

# Jalankan dev server (http://localhost:5173)
bun run dev
```

Buka `http://localhost:5173` di browser.

## Akun Demo

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@kursus.com` | `admin123` |
| PESERTA | `budi@email.com` | `peserta123` |
| PESERTA | `siti@email.com` | `peserta123` |
| PESERTA | `andi@email.com` | `peserta123` |

## Aturan Diskon Pembayaran

Diimplementasikan di `backend/src/services/pembayaran.service.ts`:

1. Mendaftar **≥ 2 kursus** sekaligus → diskon **20%**
2. Mendaftar **1 kursus** dengan biaya **> Rp 1.000.000** → diskon **10%**
3. Jika memenuhi keduanya → tetap **20%** (diskon terbesar berlaku)
4. Selain itu → diskon **0%**

Formula:
```
totalBiaya  = SUM(biaya semua kursus)
diskon      = totalBiaya × persentaseDiskon
totalAkhir  = totalBiaya − diskon
```

## API Endpoints

Base URL: `http://localhost:3000/api`

### Auth
| Method | Endpoint | Auth |
|---|---|---|
| POST | `/auth/login` | — |
| POST | `/auth/register` | ADMIN |
| GET | `/auth/me` | ✓ |

### Peserta (manajemen oleh ADMIN)
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/peserta` | ADMIN |
| GET | `/peserta/:id` | ADMIN |
| POST | `/peserta` | ADMIN |
| PUT | `/peserta/:id` | ADMIN |
| DELETE | `/peserta/:id` | ADMIN |

### Program Kursus
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/program-kursus` | ADMIN |
| GET | `/program-kursus/:id` | ADMIN |
| POST | `/program-kursus` | ADMIN |
| PUT | `/program-kursus/:id` | ADMIN |
| DELETE | `/program-kursus/:id` | ADMIN |

### Pendaftaran
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/pendaftaran` | ✓ (peserta: hanya miliknya) |
| GET | `/pendaftaran/:id` | ✓ (peserta: hanya miliknya) |
| GET | `/pendaftaran/preview?programKursusIds=1,2` | ADMIN |
| POST | `/pendaftaran` | ADMIN |
| PUT | `/pendaftaran/:id` | ADMIN |
| DELETE | `/pendaftaran/:id` | ADMIN |

### Laporan
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/laporan/peserta` | ADMIN |
| GET | `/laporan/pembayaran-peserta` | ADMIN |
| GET | `/laporan/pendapatan` | ADMIN |
| GET | `/laporan/ringkasan` | ADMIN |

### Pembayaran (Midtrans)
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/pembayaran/config` | ✓ |
| POST | `/pembayaran/:pendaftaranId/snap` | ✓ (peserta: miliknya) |
| GET | `/pembayaran/:pendaftaranId/status` | ✓ (peserta: miliknya) |
| POST | `/pembayaran/:pendaftaranId/refresh` | ✓ (peserta: miliknya) |
| POST | `/pembayaran/notification` | — (webhook Midtrans, verifikasi signature) |

## Hak Akses

Sistem memakai dua peran: **ADMIN** (mengelola seluruh data) dan **PESERTA** (melihat & membayar pendaftaran sendiri).

| Fitur | ADMIN | PESERTA |
|---|---|---|
| CRUD Peserta | ✓ | ✗ |
| CRUD Program Kursus | ✓ | ✗ |
| Buat & batalkan Pendaftaran | ✓ | ✗ |
| Akses Laporan | ✓ | ✗ |
| Buat User Baru | ✓ | ✗ |
| Lihat pendaftaran sendiri | — | ✓ |
| Bayar tagihan (Midtrans) | — | ✓ |

## Skrip Berguna

Backend:
- `bun run dev` — server dengan hot reload
- `bun run build` — type-check (tsc --noEmit)
- `bun run prisma:seed` — isi ulang data sample
- `bunx prisma studio` — GUI database

Frontend:
- `bun run dev` — dev server
- `bun run build` — build produksi
- `bun run type-check` — type-check
