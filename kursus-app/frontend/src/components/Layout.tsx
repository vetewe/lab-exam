import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  IconBook,
  IconChart,
  IconClipboard,
  IconDashboard,
  IconLogout,
  IconUsers,
} from "./icons";
import type { ComponentType, SVGProps } from "react";

interface NavItem {
  to: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  end?: boolean;
  roles?: string[]; // jika kosong, tampil untuk semua role
}

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", Icon: IconDashboard, end: true },
  { to: "/peserta", label: "Peserta", Icon: IconUsers, roles: ["ADMIN"] },
  { to: "/program-kursus", label: "Program Kursus", Icon: IconBook, roles: ["ADMIN"] },
  { to: "/pendaftaran", label: "Pendaftaran", Icon: IconClipboard, roles: ["ADMIN"] },
  { to: "/laporan", label: "Laporan", Icon: IconChart, roles: ["ADMIN"] },
];

function initials(nama: string) {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleNav = navItems.filter(
    (n) => !n.roles || (user && n.roles.includes(user.role))
  );

  const current = visibleNav.find((n) =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
  );

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* ─── Sidebar ─── */}
      <aside className="fixed inset-y-0 left-0 flex w-64 flex-col border-r border-slate-200 bg-white">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-soft ring-1 ring-slate-100">
            <img src="/logo.svg" alt="BOOTS" className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-slate-900">BOOTS</h1>
            <p className="text-xs text-slate-400">Reinforce Your Knowledge</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </p>
          {visibleNav.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-5 w-5 transition ${
                      isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  {label}
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-600" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {initials(user?.nama ?? "U")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{user?.nama}</p>
              <p className="truncate text-xs text-slate-400">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Keluar"
              title="Keluar"
            >
              <IconLogout className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Konten utama ─── */}
      <div className="flex flex-1 flex-col pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur">
          <div className="flex items-center gap-2.5">
            {current?.Icon && <current.Icon className="h-5 w-5 text-brand-600" />}
            <span className="text-sm font-semibold text-slate-700">{current?.label ?? "Halaman"}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-700">{user?.nama}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {initials(user?.nama ?? "U")}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-8 py-8 animate-slide-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
