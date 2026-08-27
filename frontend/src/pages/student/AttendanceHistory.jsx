import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import FilterDropdown from '../../components/shared/FilterDropdown';
import Badge from '../../components/shared/Badge';
import { format } from 'date-fns';
import { getAttendance } from '../../services/studentService';
import { exportExcel } from '../../services/exportService';
import toast from 'react-hot-toast';

export default function AttendanceHistory() {
  const [subject, setSubject] = useState('');
  const [month, setMonth] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const fetchHistory = async () => {
    try {
      setLoading(true);
      // Basic param structure, you can adjust depending on your backend date filtering
      const params = { page, limit: 10, subject };
      if (month === 'current') {
        const start = new Date(); start.setDate(1);
        params.startDate = start.toISOString();
      } else if (month === 'last') {
        const start = new Date(); start.setMonth(start.getMonth() - 1); start.setDate(1);
        const end = new Date(); end.setDate(0); // last day of previous month
        params.startDate = start.toISOString();
        params.endDate = end.toISOString();
      }
      
      const data = await getAttendance(params);
      setHistory(data.records || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
    } catch (error) {
      console.error(error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, subject, month]);

  const handleExport = async () => {
    try {
      const params = { subject };
      if (month === 'current') {
        const start = new Date(); start.setDate(1);
        params.startDate = start.toISOString();
      } else if (month === 'last') {
        const start = new Date(); start.setMonth(start.getMonth() - 1); start.setDate(1);
        const end = new Date(); end.setDate(0);
        params.startDate = start.toISOString();
        params.endDate = end.toISOString();
      }
      
      await exportExcel(params);
      toast.success('Download started');
    } catch (error) {
      console.error(error);
      toast.error('Failed to download records');
    }
  };

  const columns = [
    { key: 'date', label: 'Date', render: (val) => format(new Date(val), 'MMM dd, yyyy') },
    { key: 'subject', label: 'Subject' },
    { key: 'status', label: 'Status', render: (val) => (
      <Badge variant={val === 'Present' ? 'success' : 'danger'} className="uppercase px-3 py-1">
        {val}
      </Badge>
    )},
    { key: 'markedBy', label: 'Marked By', render: (_, row) => row.teacherId?.fullName || 'Teacher' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Attendance History</h1>
        <button className="btn-secondary" onClick={handleExport}>
          <Download className="w-4 h-4" /> Download Records
        </button>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-4">
        <FilterDropdown 
          value={subject} 
          onChange={(v) => { setSubject(v); setPage(1); }} 
          options={[
            {label: 'All Subjects', value: ''}, 
            {label: 'Data Structures', value: 'Data Structures'},
            {label: 'Algorithms', value: 'Algorithms'},
            {label: 'Computer Networks', value: 'Computer Networks'},
            {label: 'Operating Systems', value: 'Operating Systems'},
            {label: 'Database Systems', value: 'Database Systems'},
          ]} 
        />
        <FilterDropdown 
          value={month} 
          onChange={(v) => { setMonth(v); setPage(1); }} 
          options={[
            {label: 'All Months', value: ''}, 
            {label: 'Current Month', value: 'current'},
            {label: 'Last Month', value: 'last'}
          ]} 
        />
      </div>

      <DataTable 
        columns={columns}
        data={history}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
