import { useEffect, useState, type FormEvent } from "react";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import { Alert, Button, Field, Spinner } from "../components/ui";
import type { Peserta } from "../types";

const emptyForm = { nama: "", email: "", noTelepon: "", alamat: "" };

export default function PesertaPage() {
  const { isAdmin } = useAuth();
  const [list, setList] = useState<Peserta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Peserta | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Peserta | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ data: Peserta[] }>("/peserta");
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

  function openEdit(p: Peserta) {
    setEditing(p);
    setForm({ nama: p.nama, email: p.email, noTelepon: p.noTelepon, alamat: p.alamat });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await api.put(`/peserta/${editing.id}`, form);
      } else {
        await api.post("/peserta", form);
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
      await api.delete(`/peserta/${deleteTarget.id}`);
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
          <h2 className="text-2xl font-bold text-slate-800">Peserta</h2>
          <p className="text-sm text-slate-500">Kelola data peserta kursus</p>
        </div>
        <Button onClick={openCreate}>+ Tambah Peserta</Button>
      </div>

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">No. Telepon</th>
                <th className="px-4 py-3 font-medium">Alamat</th>
                <th className="px-4 py-3 font-medium">Pendaftaran</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Belum ada data peserta.
                  </td>
                </tr>
              )}
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.nama}</td>
                  <td className="px-4 py-3 text-slate-600">{p.email}</td>
                  <td className="px-4 py-3 text-slate-600">{p.noTelepon}</td>
                  <td className="px-4 py-3 text-slate-600">{p.alamat}</td>
                  <td className="px-4 py-3 text-slate-600">{p._count?.pendaftaran ?? 0}x</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => openEdit(p)}>
                        Edit
                      </Button>
                      {isAdmin && (
                        <Button variant="danger" onClick={() => setDeleteTarget(p)}>
                          Hapus
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Modal Tambah/Edit ─── */}
      <Modal
        open={modalOpen}
        title={editing ? "Edit Peserta" : "Tambah Peserta"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="peserta-form" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <form id="peserta-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert>{formError}</Alert>}
          <Field
            label="Nama"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            required
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Field
            label="No. Telepon"
            value={form.noTelepon}
            onChange={(e) => setForm({ ...form, noTelepon: e.target.value })}
            required
          />
          <Field
            label="Alamat"
            value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
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
          Yakin ingin menghapus peserta <strong>{deleteTarget?.nama}</strong>? Tindakan ini
          tidak bisa dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
