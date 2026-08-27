import api from './api';

export const markAttendance = async (data) => {
  const response = await api.post('/teacher/mark-attendance', data);
  return response.data;
};

export const updateAttendance = async (data) => {
  const response = await api.put('/teacher/update-attendance', data);
  return response.data;
};

export const getStudents = async (params) => {
  const response = await api.get('/teacher/students', { params });
  return response.data;
};

export const getAttendanceReport = async (params) => {
  const response = await api.get('/teacher/attendance-report', { params });
  return response.data;
};

export const getSummary = async () => {
  const response = await api.get('/teacher/summary');
  return response.data;
};

export const generateQrSession = async (data) => {
  const response = await api.post('/teacher/qr-session', data);
  return response.data;
};

export const getQrSessionStatus = async (code) => {
  const response = await api.get(`/teacher/qr-session/${code}/status`);
  return response.data;
};

export const closeQrSession = async (code) => {
  const response = await api.post(`/teacher/qr-session/${code}/close`);
  return response.data;
};
