import { useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Pagination,
  PaymentBadge,
  Spinner,
  StatusBadge,
  Th,
} from "../components/ui";
import { IconCalendar, IconPrinter, IconTag, IconTrendingUp, IconWallet } from "../components/icons";
import Modal from "../components/Modal";
import { usePagination } from "../hooks/usePagination";
import { formatRupiah, formatTanggal } from "../utils/format";
import { printDocument, esc } from "../utils/print";
import type {
  LaporanDetailPeserta,
  LaporanPembayaranItem,
  LaporanPendapatan,
  LaporanPesertaItem,
} from "../types";

type Tab = "peserta" | "pembayaran" | "pendapatan";

const TABS: { key: Tab; label: string }[] = [
  { key: "peserta", label: "Daftar Peserta & Program" },
  { key: "pembayaran", label: "Pembayaran per Peserta" },
  { key: "pendapatan", label: "Pendapatan Lembaga" },
];

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const TAHUN_SEKARANG = 2026;
const TAHUN_OPSI = [TAHUN_SEKARANG, TAHUN_SEKARANG - 1, TAHUN_SEKARANG - 2];

interface Periode {
  bulan: string; // "" = semua
  tahun: string; // "" = semua
}

function periodeQuery(p: Periode): string {
  const params = new URLSearchParams();
  if (p.tahun) params.set("tahun", p.tahun);
  if (p.bulan) params.set("bulan", p.bulan);
  const q = params.toString();
  return q ? `?${q}` : "";
}

function periodeLabel(p: Periode): string {
  if (!p.tahun) return "Semua Periode";
  if (!p.bulan) return `Tahun ${p.tahun}`;
  return `${BULAN[Number(p.bulan) - 1]} ${p.tahun}`;
}

// ─── Toolbar filter periode ──────────────────────────────
function FilterPeriode({
  periode,
  onChange,
}: {
  periode: Periode;
  onChange: (p: Periode) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-sm text-slate-500">
        <IconCalendar className="h-4 w-4" /> Periode:
      </span>
      <select
        value={periode.bulan}
        onChange={(e) => onChange({ ...periode, bulan: e.target.value })}
        disabled={!periode.tahun}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
      >
        <option value="">Semua Bulan</option>
        {BULAN.map((b, i) => (
          <option key={b} value={i + 1}>
            {b}
          </option>
        ))}
      </select>
      <select
        value={periode.tahun}
        onChange={(e) =>
          onChange({ tahun: e.target.value, bulan: e.target.value ? periode.bulan : "" })
        }
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      >
        <option value="">Semua Tahun</option>
        {TAHUN_OPSI.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function LaporanPage() {
  const [tab, setTab] = useState<Tab>("peserta");
  const [periode, setPeriode] = useState<Periode>({ bulan: "", tahun: "" });

  return (
    <div>
      <PageHeader title="Laporan" subtitle="Laporan peserta, pembayaran, dan pendapatan lembaga" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-card">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === t.key
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <FilterPeriode periode={periode} onChange={setPeriode} />
      </div>

      {tab === "peserta" && <TabPeserta periode={periode} />}
      {tab === "pembayaran" && <TabPembayaran periode={periode} />}
      {tab === "pendapatan" && <TabPendapatan periode={periode} />}
    </div>
  );
}

// ─── Tab 1: Daftar Peserta & Program ─────────────────────
function TabPeserta({ periode }: { periode: Periode }) {
  const { user } = useAuth();
  const [data, setData] = useState<LaporanPesertaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get<{ data: LaporanPesertaItem[] }>(`/laporan/peserta${periodeQuery(periode)}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [periode]);

  const pg = usePagination(data, 8);

  function cetak() {
    const rows = data
      .flatMap((item) =>
        item.program.length === 0
          ? [
              `<tr><td>${esc(item.peserta.nama)}</td><td colspan="3" class="muted">Belum mendaftar program</td></tr>`,
            ]
          : item.program.map(
              (pr, idx) =>
                `<tr>${
                  idx === 0
                    ? `<td rowspan="${item.program.length}"><strong>${esc(item.peserta.nama)}</strong></td>`
                    : ""
                }<td>${esc(pr.namaProgram)}</td><td>${esc(formatTanggal(pr.tanggalDaftar))}</td><td>${esc(pr.status)}</td></tr>`
            )
      )
      .join("");

    printDocument({
      title: "Laporan Daftar Peserta & Program",
      subtitle: `Periode: ${periodeLabel(periode)}`,
      signer: user?.nama,
      bodyHtml: `<table>
        <thead><tr><th>Nama Peserta</th><th>Program yang Diikuti</th><th>Tanggal Daftar</th><th>Status</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4" class="muted">Tidak ada data.</td></tr>'}</tbody>
      </table>`,
    });
  }

  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;

  return (
    <Card>
      <div className="flex justify-end border-b border-slate-100 p-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={cetak}
          disabled={data.length === 0}
          icon={<IconPrinter className="h-3.5 w-3.5" />}
        >
          Cetak / PDF
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80">
            <tr>
              <Th>Nama Peserta</Th>
              <Th>Program yang Diikuti</Th>
              <Th>Tanggal Daftar</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pg.pageItems.map((item) =>
              item.program.length === 0 ? (
                <tr key={item.peserta.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.peserta.nama}</td>
                  <td className="px-4 py-3 text-slate-400" colSpan={3}>
                    Belum mendaftar program
                  </td>
                </tr>
              ) : (
                item.program.map((pr, idx) => (
                  <tr key={`${item.peserta.id}-${idx}`} className="hover:bg-slate-50/70">
                    {idx === 0 && (
                      <td
                        className="px-4 py-3 align-top font-medium text-slate-800"
                        rowSpan={item.program.length}
                      >
                        {item.peserta.nama}
                      </td>
                    )}
                    <td className="px-4 py-3 text-slate-600">{pr.namaProgram}</td>
                    <td className="px-4 py-3 text-slate-600">{formatTanggal(pr.tanggalDaftar)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={pr.status} />
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>

      {pg.total === 0 ? (
        <EmptyState message="Tidak ada data untuk periode ini." />
      ) : (
        <Pagination
          page={pg.page}
          totalPages={pg.totalPages}
          from={pg.from}
          to={pg.to}
          total={pg.total}
          onPageChange={pg.setPage}
        />
      )}
    </Card>
  );
}

// ─── Tab 2: Pembayaran per Peserta ───────────────────────
function TabPembayaran({ periode }: { periode: Periode }) {
  const [data, setData] = useState<LaporanPembayaranItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailId, setDetailId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<{ data: LaporanPembayaranItem[] }>(`/laporan/pembayaran-peserta${periodeQuery(periode)}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [periode]);

  const pg = usePagination(data, 8);

  function cetak() {
    const rows = data
      .map(
        (item) =>
          `<tr><td>${esc(item.peserta.nama)}</td><td class="text-center">${item.jumlahTransaksi}x</td><td class="text-right">${esc(formatRupiah(item.totalBiayaKotor))}</td><td class="text-right">- ${esc(formatRupiah(item.totalDiskon))}</td><td class="text-right">${esc(formatRupiah(item.totalAkhir))}</td><td class="text-right">${esc(formatRupiah(item.totalLunas))}</td></tr>`
      )
      .join("");

    printDocument({
      title: "Laporan Pembayaran per Peserta",
      subtitle: `Periode: ${periodeLabel(periode)}`,
      bodyHtml: `<table>
        <thead><tr><th>Nama Peserta</th><th class="text-center">Transaksi</th><th class="text-right">Total Biaya</th><th class="text-right">Total Diskon</th><th class="text-right">Total Akhir</th><th class="text-right">Sudah Lunas</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6" class="muted">Tidak ada data.</td></tr>'}</tbody>
      </table>`,
    });
  }

  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;

  return (
    <Card>
      <div className="flex justify-end border-b border-slate-100 p-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={cetak}
          disabled={data.length === 0}
          icon={<IconPrinter className="h-3.5 w-3.5" />}
        >
          Cetak / PDF
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80">
            <tr>
              <Th>Nama Peserta</Th>
              <Th className="text-center">Transaksi</Th>
              <Th className="text-right">Total Biaya</Th>
              <Th className="text-right">Total Diskon</Th>
              <Th className="text-right">Total Akhir</Th>
              <Th className="text-right">Sudah Lunas</Th>
              <Th className="text-right">Aksi</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pg.pageItems.map((item) => (
              <tr key={item.peserta.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3 font-medium text-slate-800">{item.peserta.nama}</td>
                <td className="px-4 py-3 text-center text-slate-600">{item.jumlahTransaksi}x</td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {formatRupiah(item.totalBiayaKotor)}
                </td>
                <td className="px-4 py-3 text-right text-red-600">
                  - {formatRupiah(item.totalDiskon)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">
                  {formatRupiah(item.totalAkhir)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-emerald-600">
                  {formatRupiah(item.totalLunas)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDetailId(item.peserta.id)}
                    icon={<IconPrinter className="h-3.5 w-3.5" />}
                  >
                    Cetak
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pg.total === 0 ? (
        <EmptyState message="Tidak ada data untuk periode ini." />
      ) : (
        <Pagination
          page={pg.page}
          totalPages={pg.totalPages}
          from={pg.from}
          to={pg.to}
          total={pg.total}
          onPageChange={pg.setPage}
        />
      )}

      <DetailPesertaModal pesertaId={detailId} onClose={() => setDetailId(null)} />
    </Card>
  );
}

// ─── Tab 3: Pendapatan Lembaga ───────────────────────────
function TabPendapatan({ periode }: { periode: Periode }) {
  const [data, setData] = useState<LaporanPendapatan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get<LaporanPendapatan>(`/laporan/pendapatan${periodeQuery(periode)}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [periode]);

  function cetak() {
    if (!data) return;
    printDocument({
      title: "Laporan Pendapatan Lembaga",
      subtitle: `Periode: ${periodeLabel(periode)}`,
      bodyHtml: `
        <table class="summary">
          <tbody>
            <tr><td class="label">Jumlah Pendaftaran</td><td class="val">${data.totalPendaftaran}</td></tr>
            <tr><td class="label">Total Pendapatan Kotor</td><td class="val">${esc(formatRupiah(data.totalPendapatanKotor))}</td></tr>
            <tr><td class="label">Total Diskon Diberikan</td><td class="val">- ${esc(formatRupiah(data.totalDiskonDiberikan))}</td></tr>
            <tr class="grand"><td class="label">Total Pendapatan Bersih</td><td class="val">${esc(formatRupiah(data.totalPendapatanBersih))}</td></tr>
            <tr><td class="label">Sudah Diterima (Lunas)</td><td class="val">${esc(formatRupiah(data.totalPendapatanLunas))}</td></tr>
            <tr><td class="label">Belum Diterima (Tertunda)</td><td class="val">${esc(formatRupiah(data.totalPendapatanTertunda))}</td></tr>
          </tbody>
        </table>`,
    });
  }

  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={cetak}
          icon={<IconPrinter className="h-3.5 w-3.5" />}
        >
          Cetak / PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <IconWallet className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-slate-500">Total Pendapatan Kotor</p>
          </div>
          <p className="mt-4 text-2xl font-bold text-slate-900">
            {formatRupiah(data.totalPendapatanKotor)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{data.totalPendaftaran} pendaftaran</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <IconTag className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-slate-500">Total Diskon Diberikan</p>
          </div>
          <p className="mt-4 text-2xl font-bold text-red-600">
            - {formatRupiah(data.totalDiskonDiberikan)}
          </p>
        </Card>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-soft">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <IconTrendingUp className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-brand-100">Total Pendapatan Bersih</p>
          </div>
          <p className="relative mt-4 text-2xl font-bold">
            {formatRupiah(data.totalPendapatanBersih)}
          </p>
          <p className="relative mt-1 text-xs text-brand-200">setelah diskon, semua status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-emerald-500 p-6">
          <p className="text-sm font-medium text-slate-500">Sudah Diterima (Lunas)</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatRupiah(data.totalPendapatanLunas)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Uang yang benar-benar masuk dari pembayaran lunas.
          </p>
        </Card>
        <Card className="border-l-4 border-l-amber-500 p-6">
          <p className="text-sm font-medium text-slate-500">Belum Diterima (Tertunda)</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {formatRupiah(data.totalPendapatanTertunda)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Tagihan yang belum dibayar peserta.</p>
        </Card>
      </div>
    </div>
  );
}

// ─── Modal detail per siswa (cetak) ──────────────────────
function DetailPesertaModal({
  pesertaId,
  onClose,
}: {
  pesertaId: number | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<LaporanDetailPeserta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (id: number) => {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await api.get<{ data: LaporanDetailPeserta }>(`/laporan/peserta/${id}`);
      setData(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pesertaId != null) load(pesertaId);
  }, [pesertaId, load]);

  function cetak() {
    if (!data) return;
    const blokPendaftaran = data.pendaftaran
      .map((d) => {
        const programRows = d.program
          .map(
            (pr) =>
              `<tr><td>${esc(pr.namaProgram)}</td><td class="text-right">${esc(formatRupiah(pr.biayaSatuan))}</td></tr>`
          )
          .join("");
        return `<div style="margin-bottom:10px">
          <p style="font-size:11px;color:#64748b;margin-bottom:4px">Pendaftaran #${d.id} · ${esc(formatTanggal(d.tanggalDaftar))} · Status: ${esc(d.status)} · Bayar: ${esc(d.statusPembayaran)}</p>
          <table><tbody>${programRows}
            <tr><td class="muted">Diskon</td><td class="text-right">- ${esc(formatRupiah(d.diskon))}</td></tr>
            <tr><td><strong>Total</strong></td><td class="text-right"><strong>${esc(formatRupiah(d.totalAkhir))}</strong></td></tr>
          </tbody></table>
        </div>`;
      })
      .join("");

    printDocument({
      title: "Laporan Peserta",
      subtitle: `${data.peserta.nama} — ${data.peserta.email}`,
      bodyHtml: `
        <div class="ident">
          <div class="nama">${esc(data.peserta.nama)}</div>
          <p>${esc(data.peserta.email)}</p>
          ${data.peserta.noTelepon ? `<p>Telp: ${esc(data.peserta.noTelepon)}</p>` : ""}
          ${data.peserta.alamat ? `<p>Alamat: ${esc(data.peserta.alamat)}</p>` : ""}
        </div>
        <div class="section-title">Riwayat Pendaftaran (${data.ringkasan.jumlahPendaftaran})</div>
        ${blokPendaftaran || '<p class="muted">Belum ada pendaftaran.</p>'}
        <div class="section-title">Ringkasan</div>
        <table class="summary"><tbody>
          <tr><td class="label">Total Biaya</td><td class="val">${esc(formatRupiah(data.ringkasan.totalBiaya))}</td></tr>
          <tr><td class="label">Total Diskon</td><td class="val">- ${esc(formatRupiah(data.ringkasan.totalDiskon))}</td></tr>
          <tr class="grand"><td class="label">Total Tagihan</td><td class="val">${esc(formatRupiah(data.ringkasan.totalAkhir))}</td></tr>
          <tr><td class="label">Sudah Lunas</td><td class="val">${esc(formatRupiah(data.ringkasan.totalLunas))}</td></tr>
          <tr><td class="label">Belum Dibayar</td><td class="val">${esc(formatRupiah(data.ringkasan.totalTertunda))}</td></tr>
        </tbody></table>`,
    });
  }

  return (
    <Modal
      open={pesertaId != null}
      title="Laporan Peserta"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
          <Button onClick={cetak} disabled={!data} icon={<IconPrinter className="h-4 w-4" />}>
            Cetak / PDF
          </Button>
        </>
      }
    >
      {loading && <Spinner />}
      {error && <Alert>{error}</Alert>}
      {data && (
        <div className="space-y-4 text-sm">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-lg font-bold text-slate-900">{data.peserta.nama}</p>
            <p className="text-slate-500">{data.peserta.email}</p>
            {data.peserta.noTelepon && (
              <p className="text-slate-500">Telp: {data.peserta.noTelepon}</p>
            )}
            {data.peserta.alamat && <p className="text-slate-500">Alamat: {data.peserta.alamat}</p>}
          </div>

          <div>
            <p className="mb-2 font-semibold text-slate-700">
              Riwayat Pendaftaran ({data.ringkasan.jumlahPendaftaran})
            </p>
            <div className="space-y-2">
              {data.pendaftaran.map((d) => (
                <div key={d.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">
                      #{d.id} · {formatTanggal(d.tanggalDaftar)}
                    </span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={d.status} />
                      <PaymentBadge status={d.statusPembayaran} />
                    </div>
                  </div>
                  <ul className="mb-2 space-y-0.5">
                    {d.program.map((pr, i) => (
                      <li key={i} className="flex justify-between text-slate-600">
                        <span>{pr.namaProgram}</span>
                        <span>{formatRupiah(pr.biayaSatuan)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between border-t border-slate-100 pt-1 text-slate-500">
                    <span>Diskon: {formatRupiah(d.diskon)}</span>
                    <span className="font-semibold text-slate-800">
                      Total: {formatRupiah(d.totalAkhir)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1 rounded-lg bg-slate-50 p-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Biaya</span>
              <span className="font-medium">{formatRupiah(data.ringkasan.totalBiaya)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Diskon</span>
              <span className="font-medium text-red-600">
                - {formatRupiah(data.ringkasan.totalDiskon)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1">
              <span className="font-semibold text-slate-700">Total Tagihan</span>
              <span className="font-bold text-slate-900">
                {formatRupiah(data.ringkasan.totalAkhir)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sudah Lunas</span>
              <span className="font-medium text-emerald-600">
                {formatRupiah(data.ringkasan.totalLunas)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Belum Dibayar</span>
              <span className="font-medium text-amber-600">
                {formatRupiah(data.ringkasan.totalTertunda)}
              </span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
