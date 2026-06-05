import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";
import { Alert, Button, Field } from "../components/ui";
import { IconCheck } from "../components/icons";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@kursus.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function quickFill(role: "admin" | "peserta") {
    setEmail(role === "admin" ? "admin@kursus.com" : "budi@email.com");
    setPassword(role === "admin" ? "admin123" : "peserta123");
  }

  return (
    <div className="flex min-h-screen">
      {/* ─── Panel branding (kiri) ─── */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-12 text-white lg:flex">
        {/* dekorasi */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-brand-400/20 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <img src="/logo.svg" alt="BOOTS" className="h-7 w-7 brightness-0 invert" />
          </div>
          <span className="text-lg font-bold">BOOTS</span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight">
            Reinforce Your<br />Knowledge.
          </h1>
          <p className="mt-4 max-w-md text-brand-100">
            Manajemen peserta, program, pendaftaran, kalkulasi pembayaran otomatis, hingga laporan
            keuangan — semua dalam satu tempat.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "Kalkulasi diskon otomatis",
              "Laporan keuangan real-time",
              "Manajemen peserta & program",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <IconCheck className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-200">© 2026 BOOTS · Reinforce Your Knowledge</p>
      </div>

      {/* ─── Form (kanan) ─── */}
      <div className="flex w-full flex-col items-center justify-center bg-slate-50 px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm animate-slide-up">
          {/* logo mobile */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-soft ring-1 ring-slate-100">
              <img src="/logo.svg" alt="BOOTS" className="h-7 w-7" />
            </div>
            <span className="text-lg font-bold text-slate-900">BOOTS</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Selamat datang kembali</h2>
          <p className="mt-1 text-sm text-slate-500">Masuk ke akun Anda untuk melanjutkan.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && <Alert>{error}</Alert>}

            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              required
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          {/* Akun demo */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Akun Demo
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickFill("admin")}
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs transition hover:border-brand-300 hover:bg-brand-50"
              >
                <span className="block font-semibold text-slate-700">Admin</span>
                <span className="text-slate-400">admin@kursus.com</span>
              </button>
              <button
                type="button"
                onClick={() => quickFill("peserta")}
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs transition hover:border-brand-300 hover:bg-brand-50"
              >
                <span className="block font-semibold text-slate-700">Peserta</span>
                <span className="text-slate-400">budi@email.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
