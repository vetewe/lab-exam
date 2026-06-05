import { useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Alert, Button, Card, EmptyState, PaymentBadge, Pill, Spinner } from "../components/ui";
import {
  IconCheck,
  IconClipboard,
  IconClock,
  IconCreditCard,
  IconWallet,
} from "../components/icons";
import { formatRupiah, formatTanggal } from "../utils/format";
import {
  createSnapTransaction,
  ensureSnapLoaded,
  getMidtransConfig,
  openSnap,
  refreshPaymentStatus,
} from "../services/payment";
import type { MidtransConfig, Pendaftaran } from "../types";

function initials(nama: string) {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Warna aksen kiri kartu sesuai status pembayaran.
const ACCENT: Record<string, string> = {
  LUNAS: "border-l-emerald-500",
  PENDING: "border-l-amber-500",
  BELUM_BAYAR: "border-l-slate-300",
  GAGAL: "border-l-red-500",
  KEDALUWARSA: "border-l-red-500",
};

export default function PesertaDashboardPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Pendaftaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [config, setConfig] = useState<MidtransConfig | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ data: Pendaftaran[] }>("/pendaftaran");
      setList(res.data.data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    getMidtransConfig()
      .then(setConfig)
      .catch(() => setConfig({ configured: false, clientKey: null, isProduction: false }));
  }, [load]);

  async function handleBayar(p: Pendaftaran) {
    setError("");
    setInfo("");
    if (!config?.configured) {
      setError(
        "Pembayaran online belum aktif. Admin perlu mengatur kunci Midtrans terlebih dahulu."
      );
      return;
    }
    setPayingId(p.id);
    try {
      await ensureSnapLoaded(config);
      const { snapToken } = await createSnapTransaction(p.id);
      openSnap(snapToken, {
        onSuccess: () => {
          setInfo("Pembayaran berhasil! Status akan diperbarui.");
          load();
        },
        onPending: () => {
          setInfo("Pembayaran tertunda. Selesaikan sesuai instruksi.");
          load();
        },
        onError: () => setError("Pembayaran gagal. Silakan coba lagi."),
        onClose: () => {
          setInfo("Jendela pembayaran ditutup sebelum selesai.");
          load();
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPayingId(null);
    }
  }

  async function handleCekStatus(p: Pendaftaran) {
    setError("");
    setInfo("");
    setRefreshingId(p.id);
    try {
      const { statusPembayaran } = await refreshPaymentStatus(p.id);
      const label: Record<string, string> = {
        LUNAS: "Pembayaran sudah LUNAS.",
        PENDING: "Pembayaran masih menunggu/diproses.",
        BELUM_BAYAR: "Belum ada pembayaran.",
        GAGAL: "Pembayaran gagal.",
        KEDALUWARSA: "Transaksi sudah kedaluwarsa.",
      };
      setInfo(label[statusPembayaran] ?? `Status terbaru: ${statusPembayaran}`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRefreshingId(null);
    }
  }

  if (loading) return <Spinner />;

  const belumLunas = list.filter(
    (p) => p.statusPembayaran !== "LUNAS" && p.status !== "DIBATALKAN"
  );
  const totalTagihan = belumLunas.reduce((s, p) => s + p.totalAkhir, 0);
  const totalLunas = list
    .filter((p) => p.statusPembayaran === "LUNAS")
    .reduce((s, p) => s + p.totalAkhir, 0);

  return (
    <div>
      {/* ─── Hero banner profil ─── */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-soft">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-brand-400/20 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold backdrop-blur">
            {initials(user?.nama ?? "P")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-brand-100">Selamat datang kembali,</p>
            <h2 className="text-2xl font-bold leading-tight">{user?.nama}</h2>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-100">
              <span>{user?.email}</span>
              {user?.noTelepon && <span>· {user.noTelepon}</span>}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {info && <div className="mb-4"><Alert type="success">{info}</Alert></div>}

      {config && !config.configured && (
        <div className="mb-4">
          <Alert>
            Pembayaran online (Midtrans) belum dikonfigurasi. Hubungi admin untuk mengaktifkannya.
          </Alert>
        </div>
      )}

      {/* ─── Ringkasan ─── */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Tagihan</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <IconClock className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{formatRupiah(totalTagihan)}</p>
          <p className="mt-1 text-xs text-slate-400">{belumLunas.length} pendaftaran belum lunas</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Sudah Dibayar</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <IconCheck className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{formatRupiah(totalLunas)}</p>
          <p className="mt-1 text-xs text-slate-400">
            {list.filter((p) => p.statusPembayaran === "LUNAS").length} pendaftaran lunas
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Pendaftaran</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <IconClipboard className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{list.length}</p>
          <p className="mt-1 text-xs text-slate-400">kursus yang Anda ikuti</p>
        </Card>
      </div>

      {/* ─── Daftar pendaftaran ─── */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Pendaftaran Saya</h3>
        {belumLunas.length > 0 && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            {belumLunas.length} menunggu pembayaran
          </span>
        )}
      </div>

      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconClipboard className="h-6 w-6" />}
            message="Anda belum memiliki pendaftaran kursus. Hubungi admin untuk didaftarkan."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {list.map((p) => {
            const lunas = p.statusPembayaran === "LUNAS";
            const bisaBayar = !lunas && p.status !== "DIBATALKAN";
            return (
              <Card
                key={p.id}
                className={`border-l-4 p-5 ${ACCENT[p.statusPembayaran] ?? "border-l-slate-300"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-slate-400">
                        Pendaftaran #{p.id}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400">
                        {formatTanggal(p.tanggalDaftar)}
                      </span>
                      <PaymentBadge status={p.statusPembayaran} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {p.detail.map((d) => (
                        <Pill key={d.id}>{d.programKursus.namaProgram}</Pill>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <span className="text-slate-500">
                        Total biaya:{" "}
                        <span className="text-slate-700">{formatRupiah(p.totalBiaya)}</span>
                      </span>
                      {p.diskon > 0 && (
                        <span className="text-slate-500">
                          Diskon:{" "}
                          <span className="text-emerald-600">- {formatRupiah(p.diskon)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-slate-400">Total bayar</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatRupiah(p.totalAkhir)}
                    </p>
                    {lunas ? (
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                        <IconCheck className="h-4 w-4" /> Sudah Lunas
                      </span>
                    ) : bisaBayar ? (
                      <div className="mt-2 flex flex-col items-end gap-2">
                        <Button
                          onClick={() => handleBayar(p)}
                          disabled={payingId === p.id}
                          icon={<IconCreditCard className="h-4 w-4" />}
                        >
                          {payingId === p.id
                            ? "Memproses..."
                            : p.statusPembayaran === "PENDING"
                              ? "Lanjutkan Bayar"
                              : "Bayar Sekarang"}
                        </Button>
                        {p.statusPembayaran === "PENDING" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCekStatus(p)}
                            disabled={refreshingId === p.id}
                            icon={<IconClock className="h-3.5 w-3.5" />}
                          >
                            {refreshingId === p.id ? "Mengecek..." : "Cek Status"}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="mt-2 block text-sm text-slate-400">Dibatalkan</span>
                    )}
                  </div>
                </div>

                {p.catatan && (
                  <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-500">
                    <span className="text-slate-400">Catatan: </span>
                    {p.catatan}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-6 flex items-center gap-2 text-xs text-slate-400">
        <IconWallet className="h-4 w-4" />
        Pembayaran diproses aman melalui Midtrans.
      </p>
    </div>
  );
}
