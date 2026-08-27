import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AttendanceRingChart from '../../components/charts/AttendanceRingChart';
import AttendanceBarChart from '../../components/charts/AttendanceBarChart';
import { BookOpen, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/student/attendance-summary');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const monthlyData = stats?.monthlyTrend || [];

  const getStatusConfig = (percentage) => {
    if (percentage >= 80) return { color: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle };
    if (percentage >= 75) return { color: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: AlertTriangle };
    return { color: 'bg-red-500', text: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: XCircle };
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const overallPercentage = stats?.overall?.percentage || 0;
  const subjects = stats?.summary || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="glass-card p-8 flex-1 flex flex-col items-center justify-center text-center">
          <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">{user?.fullName}</h2>
          <p className="text-surface-500 dark:text-surface-400 mb-8">{user?.department || 'Computer Science'} • {user?.rollNumber || 'CS2024'}</p>
          
          <AttendanceRingChart percentage={overallPercentage} size={200} />
          
          <p className="mt-8 text-surface-600 dark:text-surface-300 max-w-sm">
            {overallPercentage >= 75 
              ? "Great job! Your attendance is well above the required 75% threshold." 
              : "Warning: Your overall attendance is below 75%. Try not to miss any more classes."}
          </p>
          
          <button 
            onClick={() => navigate('/student/qr-scan')}
            className="mt-6 btn-primary w-full max-w-xs flex items-center justify-center gap-2 py-3"
          >
            <BookOpen className="w-5 h-5" />
            Scan QR Code
          </button>
        </div>

        <div className="glass-card p-6 flex-[2] flex flex-col">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">Monthly Trend</h3>
          <div className="flex-1 min-h-[250px]">
            <AttendanceBarChart data={monthlyData} color="#6366f1" />
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-surface-900 dark:text-white mt-8 mb-4">Subject-wise Attendance</h3>
      
      {subjects.length === 0 ? (
        <div className="text-center py-8 text-surface-500 glass-card">
          No attendance records found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjects.map((sub, i) => {
            const config = getStatusConfig(sub.percentage);
            const Icon = config.icon;
            
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-5 group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl cursor-pointer"
                onClick={() => navigate('/student/history')}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("p-2 rounded-lg", config.bg, config.text)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-bold text-surface-900 dark:text-white">{sub.percentage}%</span>
                </div>
                
                <h4 className="font-semibold text-surface-900 dark:text-white mb-1 truncate" title={sub.subject}>{sub.subject}</h4>
                <p className="text-xs text-surface-500 mb-4">{sub.present} / {sub.totalClasses} Classes Attended</p>
                
                <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${sub.percentage}%` }}
                    transition={{ duration: 1, delay: 0.2 + (i * 0.1) }}
                    className={cn("h-full rounded-full", config.color)} 
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
