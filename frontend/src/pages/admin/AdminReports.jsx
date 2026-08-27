import React, { useState, useEffect } from 'react';
import { Download, Mail } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import SearchBar from '../../components/shared/SearchBar';
import FilterDropdown from '../../components/shared/FilterDropdown';
import Badge from '../../components/shared/Badge';
import { exportExcel } from '../../services/exportService';
import { getAttendanceReport } from '../../services/teacherService';
import { sendReport } from '../../services/adminService';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState([]);
  const [summary, setSummary] = useState({ total: 0, average: 0, below75: 0 });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getAttendanceReport({ subject, department, startDate, endDate, limit: 1000 });
      
      let filteredStats = data.studentStats || [];
      if (search) {
        const s = search.toLowerCase();
        filteredStats = filteredStats.filter(st => 
          st.fullName.toLowerCase().includes(s) || 
          (st.rollNumber && st.rollNumber.toLowerCase().includes(s))
        );
      }
      
      setStats(filteredStats);
      
      const totalRecs = filteredStats.length;
      let avg = 0;
      let below = 0;
      if (filteredStats.length > 0) {
        const sum = filteredStats.reduce((acc, curr) => acc + curr.percentage, 0);
        avg = (sum / filteredStats.length).toFixed(1);
        below = filteredStats.filter(s => s.percentage < 75).length;
      }
      
      setSummary({ total: totalRecs, average: avg, below75: below });
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    fetchReports();
  };

  const handleSendReport = async (studentId) => {
    try {
      toast.loading('Sending report...', { id: 'send-report' });
      await sendReport({ studentId });
      toast.success('Report emailed successfully', { id: 'send-report' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to send email report', { id: 'send-report' });
    }
  };

  const handleExport = async () => {
    try {
      toast.loading('Exporting to Excel...', { id: 'export' });
      await exportExcel({ subject, department, startDate, endDate });
      toast.success('Export started successfully', { id: 'export' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to export', { id: 'export' });
    }
  };

  const columns = [
    { key: 'fullName', label: 'Student Name' },
    { key: 'rollNumber', label: 'Roll No' },
    { key: 'department', label: 'Department' },
    { key: 'total', label: 'Total Classes' },
    { key: 'present', label: 'Present' },
    { key: 'percentage', label: 'Attendance %', render: (val) => (
      <Badge variant={val >= 75 ? 'success' : val >= 60 ? 'warning' : 'danger'}>{val?.toFixed(1)}%</Badge>
    )},
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <button 
        onClick={() => handleSendReport(row.studentId)} 
        className="p-1.5 text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-colors"
        title="Email Report to Student"
      >
        <Mail className="w-4 h-4" />
      </button>
    )}
  ];

  const departmentOptions = [
    { label: 'All Departments', value: '' },
    { label: 'Computer Science', value: 'Computer Science' },
    { label: 'Electronics', value: 'Electronics' },
    { label: 'Mechanical Engineering', value: 'Mechanical Engineering' }
  ];
  
  const subjectOptions = [
    { label: 'All Subjects', value: '' },
    { label: 'Data Structures', value: 'Data Structures' },
    { label: 'Algorithms', value: 'Algorithms' },
    { label: 'Digital Electronics', value: 'Digital Electronics' },
    { label: 'Circuit Theory', value: 'Circuit Theory' },
    { label: 'Database Systems', value: 'Database Systems' },
    { label: 'Web Development', value: 'Web Development' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Attendance Reports</h1>
        <button onClick={handleExport} className="btn-secondary">
          <Download className="w-4 h-4" /> Export to Excel
        </button>
      </div>

      <div className="glass-card p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <SearchBar value={search} onChange={setSearch} placeholder="Search student..." />
          <FilterDropdown 
            label="Department"
            value={department} 
            onChange={setDepartment} 
            options={departmentOptions} 
          />
          <FilterDropdown 
            label="Subject"
            value={subject} 
            onChange={setSubject} 
            options={subjectOptions} 
          />
          <div>
            <label className="text-xs font-medium text-surface-500 mb-1 block">Start Date</label>
            <input 
              type="date" 
              className="input-field py-2" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-surface-500 mb-1 block">End Date</label>
            <input 
              type="date" 
              className="input-field py-2" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button onClick={handleSearch} className="btn-primary py-2.5 h-[42px] ml-auto sm:ml-0">Generate</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 border-l-4 border-l-primary-500 text-center">
          <p className="text-sm text-surface-500">Total Students</p>
          <p className="text-2xl font-bold">{summary.total}</p>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-emerald-500 text-center">
          <p className="text-sm text-surface-500">Average Attendance</p>
          <p className="text-2xl font-bold">{summary.average}%</p>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-rose-500 text-center">
          <p className="text-sm text-surface-500">Below 75%</p>
          <p className="text-2xl font-bold text-rose-500">{summary.below75}</p>
        </div>
      </div>

      <DataTable 
        columns={columns}
        data={stats}
        loading={loading}
      />
    </div>
  );
}
