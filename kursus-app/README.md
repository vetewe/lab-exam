# Sistem Manajemen Kursus

Aplikasi web untuk mengelola pendaftaran peserta kursus: manajemen peserta, program kursus, pendaftaran, kalkulasi pembayaran otomatis dengan aturan diskon, serta laporan keuangan lembaga.

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

# Generate Prisma client
bunx prisma generate

# Jalankan migrasi (buat tabel di database)
bunx prisma migrate dev --name init

# Isi data sample (3 peserta, 4 program, 2 user)
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
| STAFF | `staff@kursus.com` | `staff123` |

## Aturan Diskon Pembayaran

Diimplementasikan di [backend/src/services/pembayaran.service.ts](backend/src/services/pembayaran.service.ts):

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

### Peserta
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/peserta` | ✓ |
| GET | `/peserta/:id` | ✓ |
| POST | `/peserta` | ✓ |
| PUT | `/peserta/:id` | ✓ |
| DELETE | `/peserta/:id` | ADMIN |

### Program Kursus
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/program-kursus` | ✓ |
| GET | `/program-kursus/:id` | ✓ |
| POST | `/program-kursus` | ADMIN |
| PUT | `/program-kursus/:id` | ADMIN |
| DELETE | `/program-kursus/:id` | ADMIN |

### Pendaftaran
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/pendaftaran` | ✓ |
| GET | `/pendaftaran/:id` | ✓ |
| GET | `/pendaftaran/preview?programKursusIds=1,2` | ✓ |
| POST | `/pendaftaran` | ✓ |
| PUT | `/pendaftaran/:id` | ✓ |
| DELETE | `/pendaftaran/:id` | ADMIN |

### Laporan
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/laporan/peserta` | ✓ |
| GET | `/laporan/pembayaran-peserta` | ✓ |
| GET | `/laporan/pendapatan` | ✓ |
| GET | `/laporan/ringkasan` | ✓ |

## Hak Akses

| Fitur | ADMIN | STAFF |
|---|---|---|
| Lihat semua data | ✓ | ✓ |
| CRUD Peserta | ✓ | ✓ (kecuali hapus) |
| CRUD Program Kursus | ✓ | hanya lihat |
| Buat Pendaftaran | ✓ | ✓ |
| Batalkan Pendaftaran | ✓ | ✗ |
| Akses Laporan | ✓ | ✓ |
| Buat User Baru | ✓ | ✗ |

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
