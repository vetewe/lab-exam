import { useEffect, useMemo, useState, type FormEvent } from "react";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  PageHeader,
  Pagination,
  Pill,
  SearchInput,
  Spinner,
  Th,
} from "../components/ui";
import { IconEdit, IconPlus, IconTrash, IconUsers } from "../components/icons";
import { usePagination } from "../hooks/usePagination";
import type { Peserta } from "../types";

const emptyForm = { nama: "", email: "", password: "", noTelepon: "", alamat: "" };

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

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.nama.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.noTelepon.toLowerCase().includes(q)
    );
  }, [list, search]);

  const pg = usePagination(filtered, 8);

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
    setForm({ nama: p.nama, email: p.email, password: "", noTelepon: p.noTelepon, alamat: p.alamat });
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
      <PageHeader
        title="Peserta"
        subtitle="Kelola data peserta kursus"
        action={
          <Button onClick={openCreate} icon={<IconPlus className="h-4 w-4" />}>
            Tambah Peserta
          </Button>
        }
      />

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      <div className="mb-4 max-w-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari nama, email, atau telepon..."
        />
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <Th>Nama</Th>
                  <Th>Email</Th>
                  <Th>No. Telepon</Th>
                  <Th>Alamat</Th>
                  <Th>Pendaftaran</Th>
                  <Th className="text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pg.pageItems.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.nama}</td>
                    <td className="px-4 py-3 text-slate-600">{p.email}</td>
                    <td className="px-4 py-3 text-slate-600">{p.noTelepon}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600">{p.alamat}</td>
                    <td className="px-4 py-3">
                      <Pill>{p._count?.pendaftaran ?? 0}x</Pill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEdit(p)}
                          icon={<IconEdit className="h-3.5 w-3.5" />}
                        >
                          Edit
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="subtle"
                            size="sm"
                            onClick={() => setDeleteTarget(p)}
                            icon={<IconTrash className="h-3.5 w-3.5" />}
                          >
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

          {pg.total === 0 ? (
            <EmptyState
              icon={<IconUsers className="h-6 w-6" />}
              message={search ? "Tidak ada peserta yang cocok." : "Belum ada data peserta."}
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
            label="Email (untuk login peserta)"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Field
            label={editing ? "Password (kosongkan jika tidak diubah)" : "Password"}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Minimal 6 karakter"
            hint={editing ? "Isi hanya jika ingin mengganti password peserta." : undefined}
            required={!editing}
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
