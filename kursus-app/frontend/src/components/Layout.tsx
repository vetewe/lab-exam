import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: "📊", end: true },
  { to: "/peserta", label: "Peserta", icon: "👥" },
  { to: "/program-kursus", label: "Program Kursus", icon: "📚" },
  { to: "/pendaftaran", label: "Pendaftaran", icon: "📝" },
  { to: "/laporan", label: "Laporan", icon: "📈" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* ─── Sidebar ─── */}
      <aside className="flex w-64 flex-col bg-slate-900 text-slate-100">
        <div className="border-b border-slate-700 px-6 py-5">
          <h1 className="text-lg font-bold">Manajemen Kursus</h1>
          <p className="text-xs text-slate-400">Sistem Pendaftaran</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-700 px-4 py-4">
          <div className="mb-3">
            <p className="text-sm font-medium">{user?.nama}</p>
            <p className="text-xs text-slate-400">
              {user?.email} · <span className="font-semibold text-brand-400">{user?.role}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-red-600 hover:text-white"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* ─── Konten utama ─── */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
