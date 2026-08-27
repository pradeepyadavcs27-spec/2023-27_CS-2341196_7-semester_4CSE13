import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminReports from './pages/admin/AdminReports';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import MarkAttendance from './pages/teacher/MarkAttendance';
import TeacherReports from './pages/teacher/TeacherReports';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import AttendanceCalendar from './pages/student/AttendanceCalendar';
import AttendanceHistory from './pages/student/AttendanceHistory';

// Shared Pages
import ProfilePage from './pages/shared/ProfilePage';
import ApplyLeave from './pages/shared/ApplyLeave';
import LeaveApprovals from './pages/shared/LeaveApprovals';
import NotFoundPage from './pages/shared/NotFoundPage';
import QRScanner from './pages/student/QRScanner';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin" />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<UserManagement type="students" />} />
            <Route path="teachers" element={<UserManagement type="teachers" />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="leaves" element={<LeaveApprovals />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Teacher Routes */}
          <Route path="/teacher" element={
            <ProtectedRoute role="teacher">
              <DashboardLayout role="teacher" />
            </ProtectedRoute>
          }>
            <Route index element={<TeacherDashboard />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="mark-attendance" element={<MarkAttendance />} />
            <Route path="reports" element={<TeacherReports />} />
            <Route path="leave-approvals" element={<LeaveApprovals />} />
            <Route path="apply-leave" element={<ApplyLeave />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={
            <ProtectedRoute role="student">
              <DashboardLayout role="student" />
            </ProtectedRoute>
          }>
            <Route index element={<StudentDashboard />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="calendar" element={<AttendanceCalendar />} />
            <Route path="history" element={<AttendanceHistory />} />
            <Route path="leaves" element={<ApplyLeave />} />
            <Route path="qr-scan" element={<QRScanner />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
