import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import DataTable from '../../components/shared/DataTable';
import SearchBar from '../../components/shared/SearchBar';
import FilterDropdown from '../../components/shared/FilterDropdown';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import Badge from '../../components/shared/Badge';
import { cn } from '../../lib/utils';
import { getStudents, getTeachers, deleteUser, registerStudent, registerTeacher, updateUser } from '../../services/adminService';

export default function UserManagement({ type = 'students' }) {
  const [activeTab, setActiveTab] = useState(type);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'fullName', direction: 'asc' });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Actual fetcher function
  const fetchUsers = React.useCallback(async (params) => {
    if (params.type === 'students') {
      return await getStudents(params);
    } else {
      return await getTeachers(params);
    }
  }, []);

  const { data: responseData, loading, execute } = useApi(fetchUsers);

  useEffect(() => {
    setActiveTab(type);
    setPage(1);
  }, [type]);

  useEffect(() => {
    execute({ type: activeTab, search: debouncedSearch, department, semester, section, page, sortBy: sortConfig.key, order: sortConfig.direction });
  }, [activeTab, debouncedSearch, department, semester, section, page, sortConfig, execute]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const openModal = (user = null) => {
    setEditingUser(user);
    if (user) {
      const formData = { ...user };
      if (formData.subjects && Array.isArray(formData.subjects)) {
        formData.subjects = formData.subjects.join(', ');
      }
      reset(formData);
    } else {
      reset({});
    }
    setModalOpen(true);
  };

  const onSubmitForm = async (data) => {
    try {
      const payload = { ...data };
      if (activeTab === 'teachers' && typeof payload.subjects === 'string') {
        payload.subjects = payload.subjects.split(',').map(s => s.trim()).filter(Boolean);
      }

      if (editingUser) {
        await updateUser(editingUser._id || editingUser.id, payload);
      } else {
        if (activeTab === 'students') {
          await registerStudent(payload);
        } else {
          await registerTeacher(payload);
        }
      }
      toast.success(`${activeTab === 'students' ? 'Student' : 'Teacher'} ${editingUser ? 'updated' : 'added'} successfully`);
      setModalOpen(false);
      execute({ type: activeTab, search: debouncedSearch, department, semester, section, page, sortBy: sortConfig.key, order: sortConfig.direction });
    } catch (error) {
      console.error("Save User Error:", error);
      toast.error(error.response?.data?.message || error.message || 'Failed to save user');
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(userToDelete._id || userToDelete.id);
      toast.success('User deleted successfully');
      setDeleteOpen(false);
      execute({ type: activeTab, search: debouncedSearch, department, semester, section, page, sortBy: sortConfig.key, order: sortConfig.direction });
    } catch (error) {
      console.error("Delete User Error:", error);
      toast.error(error.response?.data?.message || error.message || 'Failed to delete user');
    }
  };

  const columns = activeTab === 'students' ? [
    { key: 'fullName', label: 'Name', sortable: true },
    { key: 'rollNumber', label: 'Roll No', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'semester', label: 'Sem', sortable: true },
    { key: 'section', label: 'Section', render: (val) => val ? (
      <Badge variant={val === 'A' ? 'primary' : val === 'B' ? 'secondary' : 'warning'}>Section {val}</Badge>
    ) : '-' },
    { key: 'attendancePercentage', label: 'Attendance %', sortable: true, render: (val) => (
      <Badge variant={val >= 75 ? 'success' : val >= 60 ? 'warning' : 'danger'}>{val ?? 0}%</Badge>
    )},
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openModal(row)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => { setUserToDelete(row); setDeleteOpen(true); }} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    )}
  ] : [
    { key: 'fullName', label: 'Name', sortable: true },
    { key: 'rollNumber', label: 'Employee ID', sortable: true, render: (val) => val || '-' },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'subjects', label: 'Subjects', render: (val) => val?.join(', ') || '-' },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openModal(row)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => { setUserToDelete(row); setDeleteOpen(true); }} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white capitalize">
          {activeTab} Management
        </h1>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-4 h-4" /> Add {activeTab === 'students' ? 'Student' : 'Teacher'}
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4 w-full items-start sm:items-center">
          <div className="flex gap-2 p-1 bg-surface-200/50 dark:bg-surface-800/50 rounded-xl w-full sm:w-fit">
            <button 
              onClick={() => setActiveTab('students')}
              className={cn("px-6 py-2 rounded-lg text-sm font-medium transition-all", activeTab === 'students' ? "bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-white" : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white")}
            >
              Students
            </button>
            <button 
              onClick={() => setActiveTab('teachers')}
              className={cn("px-6 py-2 rounded-lg text-sm font-medium transition-all", activeTab === 'teachers' ? "bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-white" : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white")}
            >
              Teachers
            </button>
          </div>
          <div className="w-full sm:w-72">
            <SearchBar value={search} onChange={setSearch} placeholder={`Search ${activeTab}...`} />
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none border-b border-surface-200 dark:border-surface-700">
          {[
            { label: 'All Streams', value: '' },
            { label: 'Computer Science', value: 'Computer Science' },
            { label: 'Mechanical Engineering', value: 'Mechanical Engineering' },
            { label: 'Electronics', value: 'Electronics' }
          ].map(opt => (
            <button
              key={opt.label}
              onClick={() => setDepartment(opt.value)}
              className={cn("whitespace-nowrap px-4 py-2 border-b-2 font-medium text-sm transition-colors", department === opt.value ? "border-primary-500 text-primary-600 dark:text-primary-400" : "border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300")}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {activeTab === 'students' && (
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none border-b border-surface-200 dark:border-surface-700 w-full sm:w-auto">
              {[
                { label: 'All Sections', value: '' },
                { label: 'Section A', value: 'A' },
                { label: 'Section B', value: 'B' },
                { label: 'Section C', value: 'C' }
              ].map(opt => (
                <button
                  key={opt.label}
                  onClick={() => setSection(opt.value)}
                  className={cn("whitespace-nowrap px-4 py-2 border-b-2 font-medium text-sm transition-colors", section === opt.value ? "border-primary-500 text-primary-600 dark:text-primary-400" : "border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            <FilterDropdown 
              value={semester} 
              onChange={setSemester} 
              options={[{label: 'All Semesters', value: ''}, {label: 'Semester 1', value: '1'}, {label: 'Semester 2', value: '2'}, {label: 'Semester 3', value: '3'}, {label: 'Semester 4', value: '4'}, {label: 'Semester 5', value: '5'}, {label: 'Semester 6', value: '6'}, {label: 'Semester 7', value: '7'}, {label: 'Semester 8', value: '8'}]} 
            />
          </div>
        )}
      </div>

      <DataTable 
        columns={columns}
        data={activeTab === 'students' ? (responseData?.students || []) : (responseData?.teachers || [])}
        loading={loading}
        onSort={handleSort}
        sortConfig={sortConfig}
        pagination={{ page, limit: 10, total: responseData?.pagination?.total || 0, pages: responseData?.pagination?.pages || 1 }}
        onPageChange={setPage}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`${editingUser ? 'Edit' : 'Add'} ${activeTab === 'students' ? 'Student' : 'Teacher'}`}>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Full Name</label>
              <input {...register('fullName', { required: true })} className="input-field" placeholder="John Doe" />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Email</label>
              <input type="email" {...register('email', { required: true })} className="input-field" placeholder="john@example.com" />
            </div>
            {!editingUser && (
              <div>
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Password</label>
                <input type="password" {...register('password', { required: true })} className="input-field" placeholder="••••••••" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Department</label>
              <select {...register('department', { required: true })} className="input-field">
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Electronics">Electronics</option>
              </select>
            </div>

            {activeTab === 'teachers' && (
              <>
                <div>
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Employee ID</label>
                  <input {...register('rollNumber')} className="input-field" placeholder="e.g. EMP-101" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Subjects (Comma separated)</label>
                  <input {...register('subjects')} className="input-field" placeholder="e.g. Data Structures, Algorithms" />
                </div>
              </>
            )}

            {activeTab === 'students' && (
              <>
                <div>
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Roll Number</label>
                  <input {...register('rollNumber', { required: true })} className="input-field" placeholder="CS2021001" />
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Semester</label>
                  <select {...register('semester', { required: true })} className="input-field">
                    {[...Array(8)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Section</label>
                  <select {...register('section', { required: true })} className="input-field">
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save {activeTab === 'students' ? 'Student' : 'Teacher'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={deleteOpen} 
        onClose={() => setDeleteOpen(false)} 
        onConfirm={confirmDelete} 
        title="Delete User" 
        message={`Are you sure you want to delete ${userToDelete?.fullName}? This action cannot be undone.`} 
      />
    </div>
  );
}
