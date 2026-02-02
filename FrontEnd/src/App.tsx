import React, { useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { AdminDashboard } from "./pages/AdminDashboard";
import { TechnicianBoard } from "./pages/TechnicianBoard";
import { Inventory } from "./pages/Inventory";
import { CustomerTracking } from "./pages/CustomerTracking";
import Settings from "./pages/Settings";
import { Help } from "./pages/Help";
import { EmployeeManagement } from "./pages/EmployeeManagement";
import { ReceptionistBoard } from "./pages/ReceptionistBoard";
import Activate from "./pages/ActivateAccount";
import { fetchUserProfile } from "./context/AuthContext";

const AuthInitializer = () => {
  const { fetchUserProfile } = useAuth();

  useEffect(() => {
    if (localStorage.getItem('techcare_user')) {
      fetchUserProfile();
    }
  }, [fetchUserProfile]);

  return null;
};

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children?: React.ReactNode;
  allowedRoles: string[];
}) => {
  const { user, isLoading } = useAuth();

  console.log("ProtectedRoute check - user.role:", user?.role);
  console.log("Allowed roles:", allowedRoles);
  console.log("Có được phép không?", allowedRoles.includes(user?.role ?? ""));

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center dark:bg-slate-900 text-slate-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Nếu role không nằm trong allowedRoles → redirect về trang phù hợp
  if (!allowedRoles.includes(user.role)) {
    // Chỉ sửa phần manager trước
    if (user.role === "manager") {
      return <Navigate to="/admin" replace />;
    }
    // Các role khác tạm giữ nguyên hoặc comment nếu chưa cần test
    if (user.role === "receptionist")
      return <Navigate to="/receptionist" replace />;
    if (user.role === "technician")
      return <Navigate to="/technician" replace />;
    if (user.role === "warehouse") return <Navigate to="/inventory" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Trang gốc: nếu chưa login → Login, đã login → redirect theo role */}
      <Route
        path="/"
        element={
          !user ? (
            <Login />
          ) : (
            <Navigate
              to={
                user.role === "manager"
                  ? "/admin"
                  : user.role === "receptionist"
                    ? "/receptionist"
                    : user.role === "technician"
                      ? "/technician"
                      : user.role === "warehouse"
                        ? "/inventory"
                        : "/admin" 
              }
              replace
            />
          )
        }
      />
      <Route path="/activate" element={<Activate />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/tracking"
        element={
          <Layout>
            <CustomerTracking />
          </Layout>
        }
      />

      {/* Route admin - chỉ cho phép manager */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["manager"]}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/receptionist"
        element={
          <ProtectedRoute allowedRoles={["manager", "receptionist"]}>
            <Layout>
              <ReceptionistBoard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute allowedRoles={["manager"]}>
            <Layout>
              <EmployeeManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/technician"
        element={
          <ProtectedRoute allowedRoles={["manager", "technician"]}>
            <Layout>
              <TechnicianBoard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute allowedRoles={["manager", "technician", "warehouse"]}>
            <Layout>
              <Inventory />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer-lookup"
        element={
          <ProtectedRoute allowedRoles={["manager"]}>
            <Layout>
              <CustomerTracking />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute
            allowedRoles={[
              "manager",
              "technician",
              "warehouse",
              "receptionist",
            ]}
          >
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/help"
        element={
          <ProtectedRoute
            allowedRoles={[
              "manager",
              "technician",
              "warehouse",
              "customer",
              "receptionist",
            ]}
          >
            <Layout>
              <Help />
            </Layout>
          </ProtectedRoute>
        }
      />
      

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AuthInitializer />
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
