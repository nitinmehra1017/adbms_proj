import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { AuthProvider } from './hooks/useAuth';
import { ApplicationShell } from './layouts/ApplicationShell';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { AdminAuditPage } from './pages/AdminAuditPage';
import { DoctorReportsPage } from './pages/DoctorReportsPage';
import { DoctorPrescriptionsPage } from './pages/DoctorPrescriptionsPage';
import { PharmacyDashboardPage } from './pages/PharmacyDashboardPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter><AuthProvider><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<ProtectedRoute><ApplicationShell><DashboardPage /></ApplicationShell></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><ApplicationShell><DashboardPage /></ApplicationShell></ProtectedRoute>} />
    <Route path="/doctor/reports" element={<ProtectedRoute><RoleProtectedRoute role="DOCTOR"><ApplicationShell><DoctorReportsPage /></ApplicationShell></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/doctor/prescriptions" element={<ProtectedRoute><RoleProtectedRoute role="DOCTOR"><ApplicationShell><DoctorPrescriptionsPage /></ApplicationShell></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/pharmacy" element={<ProtectedRoute><RoleProtectedRoute role="PHARMACY"><ApplicationShell><PharmacyDashboardPage /></ApplicationShell></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/admin/audit" element={<ProtectedRoute><RoleProtectedRoute role="ADMIN"><ApplicationShell><AdminAuditPage /></ApplicationShell></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AuthProvider></BrowserRouter>
);
