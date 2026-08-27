import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import SearchBar from '../../components/shared/SearchBar';
import FilterDropdown from '../../components/shared/FilterDropdown';
import Badge from '../../components/shared/Badge';
import { exportExcel } from '../../services/exportService';
import { getAttendanceReport } from '../../services/teacherService';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function TeacherReports() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState([]);
  const [summary, setSummary] = useState({ totalStudents: 0, average: 0, classesHeld: 0 });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getAttendanceReport({ subject, startDate, endDate, limit: 1000 });
      
      let filteredStats = data.studentStats || [];
      if (search) {
        const s = search.toLowerCase();
        filteredStats = filteredStats.filter(st => 
          st.fullName.toLowerCase().includes(s) || 
          (st.rollNumber && st.rollNumber.toLowerCase().includes(s))
        );
      }
      
      setStats(filteredStats);
      
      const totalStuds = filteredStats.length;
      let avg = 0;
      let maxClasses = 0;
      if (totalStuds > 0) {
        const sum = filteredStats.reduce((acc, curr) => acc + curr.percentage, 0);
        avg = (sum / totalStuds).toFixed(1);
        maxClasses = Math.max(...filteredStats.map(s => s.total));
      }
      
      setSummary({ totalStudents: totalStuds, average: avg, classesHeld: maxClasses });
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

  const handleExport = async () => {
    try {
      toast.loading('Exporting to Excel...', { id: 'export' });
      await exportExcel({ subject, startDate, endDate });
      toast.success('Export started successfully', { id: 'export' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to export', { id: 'export' });
    }
  };

  const columns = [
    { key: 'fullName', label: 'Name' },
    { key: 'rollNumber', label: 'Roll No' },
    { key: 'department', label: 'Dept' },
    { key: 'total', label: 'Total Classes' },
    { key: 'present', label: 'Present' },
    { key: 'absent', label: 'Absent' },
    { key: 'percentage', label: 'Attendance %', render: (val) => (
      <Badge variant={val >= 75 ? 'success' : val >= 60 ? 'warning' : 'danger'}>{val?.toFixed(1)}%</Badge>
    )}
  ];

  // Derive subjects from user if teacher, otherwise use generic list
  const teacherSubjects = user?.subjects?.map(sub => ({ label: sub, value: sub })) || [];
  const subjectOptions = [
    { label: 'Select Subject', value: '' },
    ...teacherSubjects
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Class Reports</h1>
        <button onClick={handleExport} className="btn-secondary">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      <div className="glass-card p-5">
        <div className="flex flex-wrap gap-4 items-end">
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
          <button onClick={() => fetchReports()} className="btn-primary py-2.5 h-[42px] mr-4">Generate</button>
          
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-surface-500 mb-1 block">Search Student</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Name or Roll No..." />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center border-l-4 border-l-emerald-500">
          <p className="text-sm text-surface-500">Class Average</p>
          <p className="text-2xl font-bold text-emerald-500">{summary.average}%</p>
        </div>
        <div className="glass-card p-4 text-center border-l-4 border-l-primary-500">
          <p className="text-sm text-surface-500">Total Students</p>
          <p className="text-2xl font-bold">{summary.totalStudents}</p>
        </div>
        <div className="glass-card p-4 text-center border-l-4 border-l-purple-500">
          <p className="text-sm text-surface-500">Classes Held (Max)</p>
          <p className="text-2xl font-bold">{summary.classesHeld}</p>
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
