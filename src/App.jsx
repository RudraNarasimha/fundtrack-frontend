import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from "./components/Dashboard";
import AdminLogin from './components/AdminLogin';

export default function App() {
  return (
    <Routes>
      {/* Dashboard opens first, accessible to everyone */}
      <Route path="/" element={<Dashboard />} />

      {/* Admin login page */}
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Redirect unknown routes to Dashboard */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
