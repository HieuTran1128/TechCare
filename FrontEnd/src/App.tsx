import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout';

import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import Activate from './pages/ActivateAccount';
import { PaymentResult } from './pages/PaymentResult';
import { CustomerTracking } from './pages/CustomerTracking';
import { ComplaintForm } from './pages/ComplaintForm';

import { AdminDashboard } from './pages/AdminDashboard';
import { ReceptionistBoard } from './pages/ReceptionistBoard';
import { TechnicianBoard } from './pages/TechnicianBoard';
import { Inventory } from './pages/Inventory';
import { EmployeeManagement } from './pages/EmployeeManagement';
import { KPIDashboard } from './pages/KPIDashboard';
import { Warranty } from './pages/Warranty';
import { ComplaintManagement } from './pages/ComplaintManagement';
import { PayrollManagement } from './pages/PayrollManagement';
import { PersonalSchedule } from './pages/PersonalSchedule';
import { ManagerSchedule } from './pages/ManagerSchedule';
import { ChatPage } from './pages/ChatPage';
import { Help } from './pages/Help';
import Settings from './pages/Settings';

const roleHome = (role: string) => {
  if (role === 'manager') return '/admin';
  if (role === 'frontdesk') return '/frontdesk';
  if (role === 'technician') return '/technician';
  if (role === 'storekeeper') return '/inventory';
  return '/';
};

const AuthInitializer = () => {
  const { fetchUserProfile } = useAuth();
  useEffect(() => {
    if (localStorage.getItem('techcare_user')) fetchUserProfile();
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
  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={!user ? <Login /> : <Navigate to={roleHome(user.role)} replace />} />
      <Route path="/activate" element={<Activate />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/payment-result" element={<PaymentResult />} />
      <Route path="/tracking" element={<Layout><CustomerTracking /></Layout>} />
      <Route path="/complaint/:token" element={<ComplaintForm />} />

      {/* Manager */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['manager']}><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute allowedRoles={['manager']}><Layout><EmployeeManagement /></Layout></ProtectedRoute>} />
      <Route path="/kpi" element={<ProtectedRoute allowedRoles={['manager']}><Layout><KPIDashboard /></Layout></ProtectedRoute>} />
      <Route path="/schedules" element={<ProtectedRoute allowedRoles={['manager']}><Layout><ManagerSchedule /></Layout></ProtectedRoute>} />
      <Route path="/complaints" element={<ProtectedRoute allowedRoles={['manager']}><Layout><ComplaintManagement /></Layout></ProtectedRoute>} />

      {/* Frontdesk + Manager */}
      <Route path="/frontdesk" element={<ProtectedRoute allowedRoles={['manager', 'frontdesk']}><Layout><ReceptionistBoard /></Layout></ProtectedRoute>} />
      <Route path="/warranty" element={<ProtectedRoute allowedRoles={['manager', 'frontdesk']}><Layout><Warranty /></Layout></ProtectedRoute>} />
      <Route path="/customer-lookup" element={<ProtectedRoute allowedRoles={['manager', 'frontdesk']}><Layout><CustomerTracking /></Layout></ProtectedRoute>} />

      {/* Technician + Frontdesk */}
      <Route path="/technician" element={<ProtectedRoute allowedRoles={['frontdesk', 'technician']}><Layout><TechnicianBoard /></Layout></ProtectedRoute>} />

      {/* Storekeeper + Manager */}
      <Route path="/inventory" element={<ProtectedRoute allowedRoles={['manager', 'storekeeper']}><Layout><Inventory /></Layout></ProtectedRoute>} />

      {/* All roles */}
      <Route path="/my-schedule" element={<ProtectedRoute allowedRoles={['technician', 'storekeeper', 'frontdesk']}><Layout><PersonalSchedule /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute allowedRoles={['manager', 'technician', 'storekeeper', 'frontdesk']}><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute allowedRoles={['manager', 'technician', 'storekeeper', 'frontdesk']}><Layout><ChatPage /></Layout></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute allowedRoles={['manager', 'technician', 'storekeeper', 'frontdesk']}><Layout><Help /></Layout></ProtectedRoute>} />
      <Route path="/payroll" element={<ProtectedRoute allowedRoles={['manager', 'technician', 'storekeeper', 'frontdesk']}><Layout><PayrollManagement /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AuthInitializer />
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
