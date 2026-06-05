import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api";
import { Alert, Spinner, StatusBadge } from "../components/ui";
import { formatRupiah, formatTanggal } from "../utils/format";
import type {
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

export default function LaporanPage() {
  const [tab, setTab] = useState<Tab>("peserta");

  return (
    <div>
      <h2 className="mb-1 text-2xl font-bold text-slate-800">Laporan</h2>
      <p className="mb-6 text-sm text-slate-500">Laporan peserta, pembayaran, dan pendapatan</p>

      {/* ─── Tab navigation ─── */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "peserta" && <TabPeserta />}
      {tab === "pembayaran" && <TabPembayaran />}
      {tab === "pendapatan" && <TabPendapatan />}
    </div>
  );
}

// ─── Tab 1: Daftar Peserta & Program ─────────────────────
function TabPeserta() {
  const [data, setData] = useState<LaporanPesertaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ data: LaporanPesertaItem[] }>("/laporan/peserta")
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Nama Peserta</th>
            <th className="px-4 py-3 font-medium">Program yang Diikuti</th>
            <th className="px-4 py-3 font-medium">Tanggal Daftar</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                Belum ada data.
              </td>
            </tr>
          )}
          {data.map((item) =>
            item.program.length === 0 ? (
              <tr key={item.peserta.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{item.peserta.nama}</td>
                <td className="px-4 py-3 text-slate-400" colSpan={3}>
                  Belum mendaftar program
                </td>
              </tr>
            ) : (
              item.program.map((pr, idx) => (
                <tr key={`${item.peserta.id}-${idx}`} className="hover:bg-slate-50">
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
  );
}

// ─── Tab 2: Pembayaran per Peserta ───────────────────────
function TabPembayaran() {
  const [data, setData] = useState<LaporanPembayaranItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ data: LaporanPembayaranItem[] }>("/laporan/pembayaran-peserta")
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Nama Peserta</th>
            <th className="px-4 py-3 text-center font-medium">Total Transaksi</th>
            <th className="px-4 py-3 text-right font-medium">Total Biaya</th>
            <th className="px-4 py-3 text-right font-medium">Total Diskon</th>
            <th className="px-4 py-3 text-right font-medium">Total Akhir</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                Belum ada data.
              </td>
            </tr>
          )}
          {data.map((item) => (
            <tr key={item.peserta.id} className="hover:bg-slate-50">
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tab 3: Pendapatan Lembaga ───────────────────────────
function TabPendapatan() {
  const [data, setData] = useState<LaporanPendapatan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<LaporanPendapatan>("/laporan/pendapatan")
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Total Pendapatan Kotor</p>
        <p className="mt-2 text-2xl font-bold text-slate-800">
          {formatRupiah(data.totalPendapatanKotor)}
        </p>
        <p className="mt-1 text-xs text-slate-400">{data.totalPendaftaran} pendaftaran</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Total Diskon Diberikan</p>
        <p className="mt-2 text-2xl font-bold text-red-600">
          - {formatRupiah(data.totalDiskonDiberikan)}
        </p>
      </div>
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-6 shadow-sm">
        <p className="text-sm text-brand-700">Total Pendapatan Bersih</p>
        <p className="mt-2 text-2xl font-bold text-brand-700">
          {formatRupiah(data.totalPendapatanBersih)}
        </p>
      </div>
    </div>
  );
}
