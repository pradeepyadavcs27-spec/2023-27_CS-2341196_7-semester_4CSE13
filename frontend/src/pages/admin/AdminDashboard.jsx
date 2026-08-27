import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { getDashboardStats, getRecentRecords } from '../../services/adminService';
import StatCard from '../../components/shared/StatCard';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/shared/Badge';
import { StatCardSkeleton, ChartSkeleton } from '../../components/shared/LoadingSkeleton';
import AttendanceLineChart from '../../components/charts/AttendanceLineChart';
import AttendanceBarChart from '../../components/charts/AttendanceBarChart';
import AttendancePieChart from '../../components/charts/AttendancePieChart';
import { Users, GraduationCap, FileText, TrendingUp, AlertTriangle, CalendarCheck } from 'lucide-react';
import { formatDate } from '../../lib/utils';

// Mock data for initial render if API is not ready
const mockData = {
  stats: {
    totalStudents: 1250, totalTeachers: 85, attendanceRecords: 45000,
    overallAttendance: "82.5%", belowThreshold: 124, todayAttendance: "85%"
  },
  trendData: [
    { date: 'Mon', percentage: 82 }, { date: 'Tue', percentage: 84 },
    { date: 'Wed', percentage: 80 }, { date: 'Thu', percentage: 85 },
    { date: 'Fri', percentage: 87 }
  ],
  monthlyData: [
    { name: 'Jan', value: 78 }, { name: 'Feb', value: 80 },
    { name: 'Mar', value: 83 }, { name: 'Apr', value: 81 },
    { name: 'May', value: 85 }, { name: 'Jun', value: 86 }
  ],
  departmentData: [
    { name: 'CSE', value: 400 }, { name: 'ECE', value: 300 },
    { name: 'ME', value: 200 }, { name: 'CE', value: 150 }
  ],
  subjectData: [
    { name: 'Data Struct', value: 88 }, { name: 'Algorithms', value: 82 },
    { name: 'OS', value: 75 }, { name: 'Networks', value: 79 }
  ],
  recentRecords: [
    { id: 1, date: new Date().toISOString(), subject: 'Computer Networks', class: 'CS-A', present: 45, total: 50, markedBy: 'Dr. Smith' },
    { id: 2, date: new Date().toISOString(), subject: 'Data Structures', class: 'CS-B', present: 48, total: 50, markedBy: 'Prof. Johnson' }
  ]
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, loading, execute } = useApi(getDashboardStats);
  const { data: recentData, loading: recentLoading, execute: executeRecent } = useApi(getRecentRecords);

  useEffect(() => {
    execute();
    executeRecent();
  }, [execute, executeRecent]);

  // Map real data if available
  let dashboardData = mockData;
  if (data && data.success && data.data) {
    const d = data.data;
    dashboardData = {
      stats: {
        totalStudents: d.totalStudents || 0,
        totalTeachers: d.totalTeachers || 0,
        attendanceRecords: d.totalRecords || 0,
        overallAttendance: `${d.overallAttendance || 0}%`,
        belowThreshold: d.belowThreshold || 0,
        todayAttendance: `${d.todayAttendance || 0}`,
      },
      trendData: (d.attendanceTrend || []).map(item => {
        const dateObj = new Date(item.date);
        return { 
          date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
          percentage: item.percentage 
        };
      }),
      monthlyData: (d.monthlyAttendance || []).map(item => {
        // item.month is 'YYYY-MM'
        const [year, monthStr] = item.month.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[parseInt(monthStr, 10) - 1];
        return { name: monthName, value: item.percentage };
      }),
      departmentData: (d.departmentWise || []).map(item => ({ name: item.department, value: item.percentage })),
      subjectData: (d.subjectWise || []).map(item => ({ name: item.subject, value: item.percentage })),
      recentRecords: (recentData && recentData.success && recentData.records) ? recentData.records : []
    };
  }

  const { stats, trendData, monthlyData, departmentData, subjectData, recentRecords } = dashboardData;

  const statCards = [
    { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'info' },
    { title: 'Total Teachers', value: stats.totalTeachers, icon: GraduationCap, color: 'primary' },
    { title: 'Attendance Records', value: stats.attendanceRecords, icon: FileText, color: 'primary' },
    { title: 'Overall Attendance', value: stats.overallAttendance, icon: TrendingUp, color: 'success', trend: 'up', trendValue: '+2.1%' },
    { title: 'Below 75% Attendance', value: stats.belowThreshold, icon: AlertTriangle, color: 'danger', trend: 'down', trendValue: '-5' },
    { title: "Today's Attendance", value: stats.todayAttendance, icon: CalendarCheck, color: 'warning' }
  ];

  const columns = [
    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'student', label: 'Student', render: (_, row) => row.studentId?.fullName || 'Unknown' },
    { key: 'subject', label: 'Subject' },
    { key: 'status', label: 'Status', render: (_, row) => (
      <Badge variant={row.status === 'Present' ? 'success' : 'danger'}>
        {row.status}
      </Badge>
    ) },
    { key: 'markedBy', label: 'Marked By', render: (_, row) => row.markedBy?.fullName || 'Unknown' }
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">System Overview</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Administrator Portal &mdash; Session Active</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {loading ? (
          [...Array(6)].map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          statCards.map((card, i) => (
            <StatCard key={i} {...card} delay={i * 0.1} />
          ))
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">Attendance Trend (Last 7 Days)</h3>
          <div className="h-64">
            {loading ? <ChartSkeleton className="h-full border-0 p-0 shadow-none bg-transparent" /> : <AttendanceLineChart data={trendData} />}
          </div>
        </div>
        
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">Monthly Overview</h3>
          <div className="h-64">
            {loading ? <ChartSkeleton className="h-full border-0 p-0 shadow-none bg-transparent" /> : <AttendanceBarChart data={monthlyData} color="#10b981" />}
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">Department Distribution</h3>
          <div className="h-64">
            {loading ? <ChartSkeleton className="h-full border-0 p-0 shadow-none bg-transparent" /> : <AttendancePieChart data={departmentData} />}
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">Subject Performance</h3>
          <div className="h-64">
            {loading ? <ChartSkeleton className="h-full border-0 p-0 shadow-none bg-transparent" /> : <AttendanceBarChart data={subjectData} color="#8b5cf6" horizontal />}
          </div>
        </div>
      </div>

      {/* Recent Records Table */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Recent Attendance Records</h3>
        </div>
        <DataTable 
          columns={columns} 
          data={recentRecords} 
          loading={loading} 
        />
      </div>
    </>
  );
}
