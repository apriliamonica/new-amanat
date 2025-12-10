import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";
import Layout from "./components/layout/Layout";

// Pages
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import SuratMasukList from "./pages/surat-masuk/SuratMasukList";
import SuratMasukDetail from "./pages/surat-masuk/SuratMasukDetail";
import SuratMasukCreate from "./pages/surat-masuk/SuratMasukCreate";
import SuratKeluarList from "./pages/surat-keluar/SuratKeluarList";
import SuratKeluarDetail from "./pages/surat-keluar/SuratKeluarDetail";
import SuratKeluarCreate from "./pages/surat-keluar/SuratKeluarCreate";
import SuratKeluarEdit from "./pages/surat-keluar/SuratKeluarEdit";
import DisposisiList from "./pages/disposisi/DisposisiList";
import UserList from "./pages/users/UserList";

import { ROLES, getKabagRoles } from "./utils/constants";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Guest Routes */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Surat Masuk */}
            <Route path="/surat-masuk" element={<SuratMasukList />} />
            <Route path="/surat-masuk/:id" element={<SuratMasukDetail />} />
            <Route
              path="/surat-masuk/create"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SEKRETARIS_KANTOR]}>
                  <SuratMasukCreate />
                </ProtectedRoute>
              }
            />

            {/* Surat Keluar */}
            <Route path="/surat-keluar" element={<SuratKeluarList />} />
            <Route path="/surat-keluar/:id" element={<SuratKeluarDetail />} />
            <Route
              path="/surat-keluar/create"
              element={
                <ProtectedRoute
                  allowedRoles={[ROLES.SEKRETARIS_KANTOR, ...getKabagRoles()]}
                >
                  <SuratKeluarCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surat-keluar/edit/:id"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SEKRETARIS_KANTOR]}>
                  <SuratKeluarEdit />
                </ProtectedRoute>
              }
            />

            {/* Disposisi */}
            <Route path="/disposisi" element={<DisposisiList />} />

            {/* User Management (Admin only) */}
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SEKRETARIS_KANTOR]}>
                  <UserList />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
