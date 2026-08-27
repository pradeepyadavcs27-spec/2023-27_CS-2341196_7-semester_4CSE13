import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/shared/StatCard';
import { Users, BookOpen, Clock, FileBarChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import AttendanceBarChart from '../../components/charts/AttendanceBarChart';
import AttendanceLineChart from '../../components/charts/AttendanceLineChart';
import { useApi } from '../../hooks/useApi';
import { getSummary } from '../../services/teacherService';
import { StatCardSkeleton, ChartSkeleton } from '../../components/shared/LoadingSkeleton';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data, loading, execute } = useApi(getSummary);

  useEffect(() => {
    execute();
  }, [execute]);

  // Default values
  let totalStudents = 0;
  let classesToday = 0;
  let avgAttendance = '0%';
  let subjectsCount = 0;
  let subjectData = [];
  let recentActivity = [];

  if (data && data.success && data.data) {
    const d = data.data;
    totalStudents = d.totalStudents || 0;
    classesToday = d.todayCount || 0;
    avgAttendance = `${d.avgAttendance || 0}%`;
    subjectsCount = (d.subjects || []).length;
    subjectData = d.subjectPerformance || [];
    
    // Map recent activity for line chart
    recentActivity = (d.recentActivity || []).map(item => {
      const dateObj = new Date(item.date);
      return {
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        percentage: item.percentage
      };
    });
  }

  const stats = [
    { title: 'Classes Today', value: classesToday, icon: Clock, color: 'primary' },
    { title: 'Total Students', value: totalStudents, icon: Users, color: 'info' },
    { title: 'Avg Attendance', value: avgAttendance, icon: FileBarChart, color: 'success' },
    { title: 'Subjects', value: subjectsCount, icon: BookOpen, color: 'warning' },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Teacher Dashboard</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Good day, Prof. {user?.fullName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          stats.map((stat, i) => (
            <StatCard key={i} {...stat} delay={i * 0.1} />
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/teacher/mark-attendance" className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-gradient-to-br from-primary-500/10 to-primary-600/5 hover:from-primary-500/20 hover:to-primary-600/10 border border-primary-500/20 transition-all group">
              <div className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <span className="font-medium text-primary-700 dark:text-primary-300">Mark Attendance</span>
            </Link>
            
            <Link to="/teacher/reports" className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 hover:from-emerald-500/20 hover:to-emerald-600/10 border border-emerald-500/20 transition-all group">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileBarChart className="w-6 h-6" />
              </div>
              <span className="font-medium text-emerald-700 dark:text-emerald-300">View Reports</span>
            </Link>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">Class Performance</h3>
          <div className="h-48">
            {loading ? <ChartSkeleton className="h-full border-0 p-0 shadow-none bg-transparent" /> : <AttendanceBarChart data={subjectData} color="#8b5cf6" />}
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col lg:col-span-2">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">Attendance Trend (Last 7 Days)</h3>
          <div className="h-64">
            {loading ? <ChartSkeleton className="h-full border-0 p-0 shadow-none bg-transparent" /> : <AttendanceLineChart data={recentActivity} />}
          </div>
        </div>
      </div>
    </div>
  );
}
