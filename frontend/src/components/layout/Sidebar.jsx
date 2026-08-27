import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Users, GraduationCap, FileBarChart, 
  ClipboardCheck, CalendarDays, Clock, LogOut, 
  ChevronLeft, ChevronRight, X, CheckSquare, Calendar, History, QrCode
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const getNavItems = (role) => {
  const links = {
    admin: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
      { label: 'Students', icon: Users, path: '/admin/students' },
      { label: 'Teachers', icon: GraduationCap, path: '/admin/teachers' },
      { label: 'Reports', icon: FileBarChart, path: '/admin/reports' },
      { label: 'Leaves', icon: ClipboardCheck, path: '/admin/leaves' },
    ],
    teacher: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher/dashboard' },
      { label: 'Mark Attendance', icon: CheckSquare, path: '/teacher/mark-attendance' },
      { label: 'Reports', icon: FileBarChart, path: '/teacher/reports' },
      { label: 'Leave Approvals', icon: ClipboardCheck, path: '/teacher/leave-approvals' },
      { label: 'Apply Leave', icon: Clock, path: '/teacher/apply-leave' },
    ],
    student: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
      { label: 'Calendar', icon: Calendar, path: '/student/calendar' },
      { label: 'History', icon: History, path: '/student/history' },
      { label: 'Scan QR Code', icon: QrCode, path: '/student/qr-scan' },
      { label: 'Leaves', icon: Clock, path: '/student/leaves' },
    ]
  };

  return links[role] || [];
};

export default function Sidebar({ role, isOpen, onClose, collapsed, onToggleCollapse }) {
  const { logout } = useAuth();
  const navItems = getNavItems(role);

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: collapsed ? 80 : 280,
          x: isOpen ? 0 : (window.innerWidth < 1024 ? -280 : 0)
        }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        className={cn(
          "fixed top-0 left-0 z-50 h-full glass border-r flex flex-col transition-all duration-300 lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-surface-200 dark:border-surface-700/50">
          <div className="flex items-center gap-3 overflow-hidden">
            {!collapsed && (
              <motion.span 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400 whitespace-nowrap"
              >
                Attendance System
              </motion.span>
            )}
          </div>
          
          <button onClick={onClose} className="lg:hidden p-2 text-surface-500 hover:text-surface-900 dark:hover:text-surface-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => window.innerWidth < 1024 && onClose()}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary-500/10 text-primary-600 dark:text-primary-400" 
                  : "text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100"
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 w-1 h-8 bg-primary-500 rounded-r-full"
                    />
                  )}
                  <item.icon className={cn("w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive && "scale-110")} />
                  {!collapsed && <span className="font-medium truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-surface-200 dark:border-surface-700/50 space-y-2">
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl w-full transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10",
              collapsed ? "justify-center" : ""
            )}
            title="Logout"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
          
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-full p-2 rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
