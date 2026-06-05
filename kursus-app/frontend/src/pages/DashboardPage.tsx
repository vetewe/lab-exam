import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api";
import { Alert, Card, PageHeader, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { formatRupiah } from "../utils/format";
import {
  IconBook,
  IconCheck,
  IconClipboard,
  IconTag,
  IconTrendingUp,
  IconUsers,
  IconWallet,
} from "../components/icons";
import type { LaporanRingkasan } from "../types";
import type { ComponentType, SVGProps } from "react";

interface StatCardProps {
  label: string;
  value: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  accent: string;
}

function StatCard({ label, value, Icon, accent }: StatCardProps) {
  return (
    <Card className="p-5 transition hover:shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
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

  const netRatio =
    data.totalPendapatanKotor > 0
      ? Math.round((data.totalPendapatanBersih / data.totalPendapatanKotor) * 100)
      : 0;

  return (
    <div>
      <PageHeader
        title={`Halo, ${user?.nama ?? "Pengguna"} 👋`}
        subtitle="Berikut ringkasan aktivitas lembaga kursus Anda."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Peserta"
          value={String(data.totalPeserta)}
          Icon={IconUsers}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Program Kursus"
          value={String(data.totalProgram)}
          Icon={IconBook}
          accent="bg-purple-50 text-purple-600"
        />
        <StatCard
          label="Pendaftaran Aktif"
          value={String(data.totalPendaftaranAktif)}
          Icon={IconClipboard}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Total Pendaftaran"
          value={String(data.totalPendaftaran)}
          Icon={IconCheck}
          accent="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Keuangan */}
      <h3 className="mb-3 mt-8 text-lg font-semibold text-slate-800">Ringkasan Keuangan</h3>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <IconWallet className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-slate-500">Pendapatan Kotor</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-slate-900">
            {formatRupiah(data.totalPendapatanKotor)}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <IconTag className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-slate-500">Total Diskon Diberikan</span>
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
            <span className="text-sm font-medium text-brand-100">Pendapatan Bersih</span>
          </div>
          <p className="relative mt-4 text-2xl font-bold">
            {formatRupiah(data.totalPendapatanBersih)}
          </p>
          <p className="relative mt-1 text-xs text-brand-200">
            {netRatio}% dari pendapatan kotor
          </p>
        </div>
      </div>
    </div>
  );
}
