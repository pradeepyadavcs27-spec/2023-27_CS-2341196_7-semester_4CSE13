import api from './api';

export const getDashboardStats = async () => {
  const response = await api.get('/admin/dashboard-stats');
  return response.data;
};

export const getStudents = async (params) => {
  const response = await api.get('/admin/students', { params });
  return response.data;
};

export const getTeachers = async (params) => {
  const response = await api.get('/admin/teachers', { params });
  return response.data;
};

export const registerStudent = async (data) => {
  const response = await api.post('/admin/register-student', data);
  return response.data;
};

export const registerTeacher = async (data) => {
  const response = await api.post('/admin/register-teacher', data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.put(`/admin/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

export const getRecentRecords = async () => {
  const response = await api.get('/admin/recent-records');
  return response.data;
};

export const sendReport = async (data) => {
  const response = await api.post('/admin/send-report', data);
  return response.data;
};
