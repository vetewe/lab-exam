import { useEffect, useMemo, useState, type FormEvent } from "react";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Pagination,
  PaymentBadge,
  SearchInput,
  Spinner,
  StatusBadge,
  Th,
} from "../components/ui";
import { IconClipboard, IconEye, IconPlus, IconTrash } from "../components/icons";
import { usePagination } from "../hooks/usePagination";
import { formatRupiah, formatTanggal } from "../utils/format";
import type {
  HasilKalkulasi,
  Pendaftaran,
  Peserta,
  ProgramKursus,
  StatusPendaftaran,
} from "../types";

const STATUS_OPTIONS: StatusPendaftaran[] = ["AKTIF", "SELESAI", "DIBATALKAN"];

export default function PendaftaranPage() {
  const { isAdmin } = useAuth();
  const [list, setList] = useState<Pendaftaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ─── Form state ─────────────────────────────────────────
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [program, setProgram] = useState<ProgramKursus[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [pesertaId, setPesertaId] = useState<number | "">("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [catatan, setCatatan] = useState("");
  const [preview, setPreview] = useState<HasilKalkulasi | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // ─── Detail & edit status ───────────────────────────────
  const [detail, setDetail] = useState<Pendaftaran | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pendaftaran | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | StatusPendaftaran>("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((p) => {
      const matchStatus = !statusFilter || p.status === statusFilter;
      const matchSearch =
        !q ||
        (p.peserta?.nama ?? "").toLowerCase().includes(q) ||
        p.detail.some((d) => d.programKursus.namaProgram.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [list, search, statusFilter]);

  const pg = usePagination(filtered, 8);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ data: Pendaftaran[] }>("/pendaftaran");
      setList(res.data.data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ─── Preview kalkulasi real-time saat pilihan berubah ───
  useEffect(() => {
    if (selectedIds.length === 0) {
      setPreview(null);
      return;
    }
    const ids = selectedIds.join(",");
    const controller = new AbortController();
    api
      .get<{ data: HasilKalkulasi }>(`/pendaftaran/preview?programKursusIds=${ids}`, {
        signal: controller.signal,
      })
      .then((res) => setPreview(res.data.data))
      .catch(() => {
        // request dibatalkan saat pilihan berubah cepat — abaikan
      });
    return () => controller.abort();
  }, [selectedIds]);

  async function openForm() {
    setPesertaId("");
    setSelectedIds([]);
    setCatatan("");
    setPreview(null);
    setFormError("");
    setFormOpen(true);
    try {
      const [resPeserta, resProgram] = await Promise.all([
        api.get<{ data: Peserta[] }>("/peserta"),
        api.get<{ data: ProgramKursus[] }>("/program-kursus"),
      ]);
      setPeserta(resPeserta.data.data);
      setProgram(resProgram.data.data);
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  }

  function toggleProgram(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pesertaId) {
      setFormError("Pilih peserta terlebih dahulu.");
      return;
    }
    if (selectedIds.length === 0) {
      setFormError("Pilih minimal 1 program kursus.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await api.post("/pendaftaran", {
        pesertaId: Number(pesertaId),
        programKursusIds: selectedIds,
        catatan: catatan || null,
      });
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(p: Pendaftaran, status: StatusPendaftaran) {
    try {
      await api.put(`/pendaftaran/${p.id}`, { status });
      await load();
      if (detail?.id === p.id) setDetail({ ...detail, status });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/pendaftaran/${deleteTarget.id}`);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Pendaftaran"
        subtitle="Kelola pendaftaran peserta ke program kursus"
        action={
          <Button onClick={openForm} icon={<IconPlus className="h-4 w-4" />}>
            Buat Pendaftaran
          </Button>
        }
      />

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari peserta atau program..."
          className="max-w-sm flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | StatusPendaftaran)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <Th>Peserta</Th>
                  <Th>Program</Th>
                  <Th>Tanggal</Th>
                  <Th className="text-right">Total Akhir</Th>
                  <Th>Status</Th>
                  <Th>Pembayaran</Th>
                  <Th className="text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pg.pageItems.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.peserta?.nama}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600">
                      {p.detail.map((d) => d.programKursus.namaProgram).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatTanggal(p.tanggalDaftar)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {formatRupiah(p.totalAkhir)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={p.statusPembayaran} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setDetail(p)}
                          icon={<IconEye className="h-3.5 w-3.5" />}
                        >
                          Detail
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="subtle"
                            size="sm"
                            onClick={() => setDeleteTarget(p)}
                            icon={<IconTrash className="h-3.5 w-3.5" />}
                          >
                            Batalkan
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pg.total === 0 ? (
            <EmptyState
              icon={<IconClipboard className="h-6 w-6" />}
              message={
                search || statusFilter
                  ? "Tidak ada pendaftaran yang cocok."
                  : "Belum ada pendaftaran."
              }
            />
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
      )}

      {/* ─── Form Buat Pendaftaran ─── */}
      <Modal
        open={formOpen}
        title="Buat Pendaftaran Baru"
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="pendaftaran-form" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Pendaftaran"}
            </Button>
          </>
        }
      >
        <form id="pendaftaran-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert>{formError}</Alert>}

          {/* Pilih peserta */}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Peserta</span>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              value={pesertaId}
              onChange={(e) => setPesertaId(e.target.value ? Number(e.target.value) : "")}
              required
            >
              <option value="">— Pilih Peserta —</option>
              {peserta.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama} ({p.email})
                </option>
              ))}
            </select>
          </label>

          {/* Multi-pilih program */}
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Program Kursus (pilih 1 atau lebih)
            </span>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {program.map((pr) => (
                <label key={pr.id} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    checked={selectedIds.includes(pr.id)}
                    onChange={() => toggleProgram(pr.id)}
                  />
                  <span className="flex-1 text-slate-700">{pr.namaProgram}</span>
                  <span className="font-medium text-slate-600">{formatRupiah(pr.biaya)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Catatan */}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Catatan (opsional)</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="contoh: Bayar via transfer BCA"
            />
          </label>

          {/* ─── Preview kalkulasi real-time ─── */}
          {preview && (
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
              <p className="mb-2 text-sm font-semibold text-brand-700">Preview Kalkulasi</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Biaya</span>
                  <span className="font-medium">{formatRupiah(preview.totalBiaya)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Diskon ({(preview.persentaseDiskon * 100).toFixed(0)}%)
                  </span>
                  <span className="font-medium text-red-600">
                    - {formatRupiah(preview.diskon)}
                  </span>
                </div>
                <p className="text-xs italic text-slate-500">{preview.keteranganDiskon}</p>
                <div className="mt-2 flex justify-between border-t border-brand-200 pt-2">
                  <span className="font-semibold text-slate-700">Total Akhir</span>
                  <span className="text-lg font-bold text-brand-700">
                    {formatRupiah(preview.totalAkhir)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* ─── Detail Pendaftaran ─── */}
      <Modal
        open={!!detail}
        title="Detail Pendaftaran"
        onClose={() => setDetail(null)}
        footer={
          <Button variant="secondary" onClick={() => setDetail(null)}>
            Tutup
          </Button>
        }
      >
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Peserta</span>
              <span className="font-medium text-slate-800">{detail.peserta?.nama}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal Daftar</span>
              <span className="text-slate-700">{formatTanggal(detail.tanggalDaftar)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Status Pembayaran</span>
              <PaymentBadge status={detail.statusPembayaran} />
            </div>

            <div>
              <p className="mb-2 text-slate-500">Program yang Diikuti</p>
              <ul className="space-y-1">
                {detail.detail.map((d) => (
                  <li key={d.id} className="flex justify-between rounded bg-slate-50 px-3 py-2">
                    <span className="text-slate-700">{d.programKursus.namaProgram}</span>
                    <span className="font-medium">{formatRupiah(d.biayaSatuan)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1 border-t border-slate-200 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Biaya</span>
                <span className="font-medium">{formatRupiah(detail.totalBiaya)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Diskon</span>
                <span className="font-medium text-red-600">- {formatRupiah(detail.diskon)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-700">Total Akhir</span>
                <span className="text-lg font-bold text-brand-700">
                  {formatRupiah(detail.totalAkhir)}
                </span>
              </div>
            </div>

            {detail.catatan && (
              <div className="rounded bg-slate-50 px-3 py-2 text-slate-600">
                <span className="text-slate-400">Catatan: </span>
                {detail.catatan}
              </div>
            )}

            {/* Ubah status */}
            <div className="border-t border-slate-200 pt-3">
              <span className="mb-1 block text-slate-500">Ubah Status</span>
              <div className="flex gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => changeStatus(detail, s)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      detail.status === s
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Konfirmasi Batalkan ─── */}
      <Modal
        open={!!deleteTarget}
        title="Batalkan Pendaftaran"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Ya, Batalkan
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Yakin ingin menghapus pendaftaran milik <strong>{deleteTarget?.peserta?.nama}</strong>?
        </p>
      </Modal>
    </div>
  );
}
