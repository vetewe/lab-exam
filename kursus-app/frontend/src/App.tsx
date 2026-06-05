import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import { Spinner } from "./components/ui";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PesertaPage from "./pages/PesertaPage";
import ProgramKursusPage from "./pages/ProgramKursusPage";
import PendaftaranPage from "./pages/PendaftaranPage";
import LaporanPage from "./pages/LaporanPage";
import PesertaDashboardPage from "./pages/PesertaDashboardPage";
import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Batasi route ke role tertentu; jika tidak cocok, lempar ke beranda.
function RoleRoute({ allow, children }: { allow: string[]; children: ReactNode }) {
  const { user } = useAuth();
  if (user && !allow.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { token, isPeserta } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Beranda: peserta lihat dashboard pembayaran, staf lihat dashboard admin */}
        <Route path="/" element={isPeserta ? <PesertaDashboardPage /> : <DashboardPage />} />

        {/* Halaman khusus admin */}
        <Route
          path="/peserta"
          element={
            <RoleRoute allow={["ADMIN"]}>
              <PesertaPage />
            </RoleRoute>
          }
        />
        <Route
          path="/program-kursus"
          element={
            <RoleRoute allow={["ADMIN"]}>
              <ProgramKursusPage />
            </RoleRoute>
          }
        />
        <Route
          path="/pendaftaran"
          element={
            <RoleRoute allow={["ADMIN"]}>
              <PendaftaranPage />
            </RoleRoute>
          }
        />
        <Route
          path="/laporan"
          element={
            <RoleRoute allow={["ADMIN"]}>
              <LaporanPage />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
