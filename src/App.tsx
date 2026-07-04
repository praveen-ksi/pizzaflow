/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RouteGuard } from './components/RouteGuard';
import { Home } from './pages/Home';
import { AdminLogin } from './pages/AdminLogin';
import { StaffLogin } from './pages/StaffLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaffDashboard } from './pages/StaffDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Guest Home Portal */}
          <Route path="/" element={<Home />} />

          {/* Authentication Portals */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/staff/login" element={<StaffLogin />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <RouteGuard allowedRole="admin">
                <AdminDashboard />
              </RouteGuard>
            }
          />

          {/* Protected Staff Routes */}
          <Route
            path="/staff/dashboard"
            element={
              <RouteGuard allowedRole="staff">
                <StaffDashboard />
              </RouteGuard>
            }
          />

          {/* Fallback Catch-All Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
