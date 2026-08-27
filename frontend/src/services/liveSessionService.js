import api from './api';

export const startLiveSession = async (data) => {
  const response = await api.post('/live-session/start', data);
  return response.data;
};

export const stopLiveSession = async (id) => {
  const response = await api.post(`/live-session/${id}/stop`);
  return response.data;
};

export const refreshSessionSecret = async (id) => {
  const response = await api.post(`/live-session/${id}/refresh`);
  return response.data;
};

export const checkInStudent = async (data) => {
  const response = await api.post('/live-session/checkin', data);
  return response.data;
};
