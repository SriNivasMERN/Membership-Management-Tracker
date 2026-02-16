import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import MainLayout from './components/layout/MainLayout.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MemberPage from './pages/MemberPage.jsx';
import ConfigurationPage from './pages/ConfigurationPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import AccessDeniedPage from './pages/AccessDeniedPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import SetupPage from './pages/SetupPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';

function AppShell() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/forbidden" element={<AccessDeniedPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/members" element={<MemberPage />} />
            <Route element={<ProtectedRoute roles={['ADMIN']} />}>
              <Route path="/configuration" element={<ConfigurationPage />} />
              <Route path="/users" element={<UsersPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default App;

