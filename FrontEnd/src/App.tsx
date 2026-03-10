import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { AdminDashboard } from './pages/AdminDashboard';
import { TechnicianBoard } from './pages/TechnicianBoard';
import { Inventory } from './pages/Inventory';
import { CustomerTracking } from './pages/CustomerTracking';
import Settings from './pages/Settings';
import { Help } from './pages/Help';
import { EmployeeManagement } from './pages/EmployeeManagement';
import { ReceptionistBoard } from './pages/ReceptionistBoard';
import Activate from './pages/ActivateAccount';

const AuthInitializer = () => {
  const { fetchUserProfile } = useAuth();

  useEffect(() => {
    if (localStorage.getItem('techcare_user')) fetchUserProfile();
  }, [fetchUserProfile]);

  return null;
};

const roleHome = (role: string) => {
  if (role === 'manager') return '/admin';
  if (role === 'frontdesk') return '/frontdesk';
  if (role === 'technician') return '/technician';
  if (role === 'storekeeper') return '/inventory';
  return '/';
};

const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode; allowedRoles: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />;

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={!user ? <Login /> : <Navigate to={roleHome(user.role)} replace />} />
      <Route path="/activate" element={<Activate />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/tracking" element={<Layout><CustomerTracking /></Layout>} />

      <Route path="/admin" element={<ProtectedRoute allowedRoles={['manager']}><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
      <Route path="/frontdesk" element={<ProtectedRoute allowedRoles={['manager', 'frontdesk']}><Layout><ReceptionistBoard /></Layout></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute allowedRoles={['manager']}><Layout><EmployeeManagement /></Layout></ProtectedRoute>} />
      <Route path="/technician" element={<ProtectedRoute allowedRoles={['manager', 'technician']}><Layout><TechnicianBoard /></Layout></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute allowedRoles={['manager', 'storekeeper']}><Layout><Inventory /></Layout></ProtectedRoute>} />
      <Route path="/customer-lookup" element={<ProtectedRoute allowedRoles={['manager', 'frontdesk']}><Layout><CustomerTracking /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute allowedRoles={['manager', 'technician', 'storekeeper', 'frontdesk']}><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute allowedRoles={['manager', 'technician', 'storekeeper', 'frontdesk']}><Layout><Help /></Layout></ProtectedRoute>} />

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
