import React, { useState, useRef, useEffect } from 'react';
import { Menu, Sun, Moon, User as UserIcon, LogOut } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ onMenuToggle }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const pathnames = location.pathname.split('/').filter((x) => x);
  const currentPath = pathnames[pathnames.length - 1];
  const breadcrumb = currentPath ? currentPath.charAt(0).toUpperCase() + currentPath.slice(1).replace('-', ' ') : 'Dashboard';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 glass border-b sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-surface-900 dark:text-surface-100 hidden sm:block">
          {breadcrumb}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors relative overflow-hidden"
          title="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ y: -20, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 20, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.div>
          </AnimatePresence>
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors border border-transparent hover:border-surface-200 dark:hover:border-surface-700"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-500 to-primary-600 text-white flex items-center justify-center font-medium shadow-sm overflow-hidden">
              {user?.avatar ? (
                <img src={`http://localhost:5000${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials(user?.fullName)
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100 leading-tight">
                {user?.fullName || 'User'}
              </p>
              <p className="text-xs text-surface-500 capitalize">{user?.role}</p>
            </div>
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 glass-card !bg-white/85 dark:!bg-surface-800/90 !backdrop-blur-2xl shadow-2xl z-[100] py-2 border border-surface-200 dark:border-surface-700"
              >
                <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700/50 mb-2">
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                    {user?.fullName}
                  </p>
                  <p className="text-xs text-surface-500 truncate">{user?.email}</p>
                </div>
                
                <Link
                  to={`/${user?.role}/profile`}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  Profile Settings
                </Link>
                
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
