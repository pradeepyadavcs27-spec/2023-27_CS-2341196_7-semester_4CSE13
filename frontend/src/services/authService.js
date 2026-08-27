import api from './api';

export const login = async (data) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, data) => {
  const response = await api.post(`/auth/reset-password/${token}`, data);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const changePassword = async (data) => {
  const response = await api.put('/auth/change-password', data);
  return response.data;
};

export const uploadAvatar = async (formData) => {
  const response = await api.post('/auth/upload-avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
