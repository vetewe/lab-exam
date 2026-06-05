import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api";
import { Alert, Spinner } from "../components/ui";
import { formatRupiah } from "../utils/format";
import type { LaporanRingkasan } from "../types";

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  accent: string;
}

function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${accent}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<LaporanRingkasan | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<LaporanRingkasan>("/laporan/ringkasan")
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;
  if (!data) return null;

  return (
    <div>
      <h2 className="mb-1 text-2xl font-bold text-slate-800">Dashboard</h2>
      <p className="mb-6 text-sm text-slate-500">Ringkasan statistik lembaga kursus</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Peserta"
          value={String(data.totalPeserta)}
          icon="👥"
          accent="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Program Kursus"
          value={String(data.totalProgram)}
          icon="📚"
          accent="bg-purple-100 text-purple-600"
        />
        <StatCard
          label="Pendaftaran Aktif"
          value={String(data.totalPendaftaranAktif)}
          icon="📝"
          accent="bg-amber-100 text-amber-600"
        />
        <StatCard
          label="Total Pendaftaran"
          value={String(data.totalPendaftaran)}
          icon="✅"
          accent="bg-green-100 text-green-600"
        />
      </div>

      <h3 className="mb-3 mt-8 text-lg font-semibold text-slate-700">Ringkasan Keuangan</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Pendapatan Kotor</p>
          <p className="mt-2 text-xl font-bold text-slate-800">
            {formatRupiah(data.totalPendapatanKotor)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Diskon Diberikan</p>
          <p className="mt-2 text-xl font-bold text-red-600">
            - {formatRupiah(data.totalDiskonDiberikan)}
          </p>
        </div>
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
          <p className="text-sm text-brand-700">Pendapatan Bersih</p>
          <p className="mt-2 text-xl font-bold text-brand-700">
            {formatRupiah(data.totalPendapatanBersih)}
          </p>
        </div>
      </div>
    </div>
  );
}
