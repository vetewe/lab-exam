import { useEffect, useState, type FormEvent } from "react";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import { Alert, Button, Field, Spinner } from "../components/ui";
import { formatRupiah } from "../utils/format";
import type { ProgramKursus } from "../types";

const emptyForm = { namaProgram: "", deskripsi: "", biaya: "", durasi: "" };

export default function ProgramKursusPage() {
  const { isAdmin } = useAuth();
  const [list, setList] = useState<ProgramKursus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProgramKursus | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ProgramKursus | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ data: ProgramKursus[] }>("/program-kursus");
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

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(p: ProgramKursus) {
    setEditing(p);
    setForm({
      namaProgram: p.namaProgram,
      deskripsi: p.deskripsi ?? "",
      biaya: String(p.biaya),
      durasi: p.durasi,
    });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        namaProgram: form.namaProgram,
        deskripsi: form.deskripsi || null,
        biaya: Number(form.biaya),
        durasi: form.durasi,
      };
      if (editing) {
        await api.put(`/program-kursus/${editing.id}`, payload);
      } else {
        await api.post("/program-kursus", payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/program-kursus/${deleteTarget.id}`);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Program Kursus</h2>
          <p className="text-sm text-slate-500">Kelola daftar program kursus</p>
        </div>
        {isAdmin && <Button onClick={openCreate}>+ Tambah Program</Button>}
      </div>

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nama Program</th>
                <th className="px-4 py-3 font-medium">Deskripsi</th>
                <th className="px-4 py-3 font-medium">Durasi</th>
                <th className="px-4 py-3 text-right font-medium">Biaya</th>
                {isAdmin && <th className="px-4 py-3 text-right font-medium">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-slate-400">
                    Belum ada program kursus.
                  </td>
                </tr>
              )}
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.namaProgram}</td>
                  <td className="max-w-xs px-4 py-3 text-slate-600">
                    {p.deskripsi || <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.durasi}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">
                    {formatRupiah(p.biaya)}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => openEdit(p)}>
                          Edit
                        </Button>
                        <Button variant="danger" onClick={() => setDeleteTarget(p)}>
                          Hapus
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Modal Tambah/Edit ─── */}
      <Modal
        open={modalOpen}
        title={editing ? "Edit Program Kursus" : "Tambah Program Kursus"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="program-form" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <form id="program-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert>{formError}</Alert>}
          <Field
            label="Nama Program"
            value={form.namaProgram}
            onChange={(e) => setForm({ ...form, namaProgram: e.target.value })}
            required
          />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Deskripsi</span>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              rows={3}
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
            />
          </label>
          <Field
            label="Biaya (Rp)"
            type="number"
            min="0"
            value={form.biaya}
            onChange={(e) => setForm({ ...form, biaya: e.target.value })}
            required
          />
          <Field
            label="Durasi"
            placeholder="contoh: 3 bulan"
            value={form.durasi}
            onChange={(e) => setForm({ ...form, durasi: e.target.value })}
            required
          />
        </form>
      </Modal>

      {/* ─── Konfirmasi Hapus ─── */}
      <Modal
        open={!!deleteTarget}
        title="Konfirmasi Hapus"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Ya, Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Yakin ingin menghapus program <strong>{deleteTarget?.namaProgram}</strong>?
        </p>
      </Modal>
    </div>
  );
}
