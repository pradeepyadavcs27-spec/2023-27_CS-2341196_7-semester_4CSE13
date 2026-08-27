import api from './api';

export const applyLeave = async (data) => {
  const response = await api.post('/leave', data);
  return response.data;
};

export const getMyLeaveRequests = async () => {
  const response = await api.get('/leave/my');
  return response.data;
};

export const getAllLeaveRequests = async (params) => {
  const response = await api.get('/leave', { params });
  return response.data;
};

export const updateLeaveStatus = async (id, status) => {
  const response = await api.put(`/leave/${id}`, { status });
  return response.data;
};
