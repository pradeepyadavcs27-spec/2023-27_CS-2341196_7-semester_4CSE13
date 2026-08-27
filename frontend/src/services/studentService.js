import api from './api';

export const getAttendance = async (params) => {
  const response = await api.get('/student/attendance', { params });
  return response.data;
};

export const getAttendanceSummary = async () => {
  const response = await api.get('/student/attendance-summary');
  return response.data;
};

export const getCalendarData = async (params) => {
  const response = await api.get('/student/calendar', { params });
  return response.data;
};

export const markQrAttendance = async (code) => {
  const response = await api.post('/student/mark-qr-attendance', { code });
  return response.data;
};
