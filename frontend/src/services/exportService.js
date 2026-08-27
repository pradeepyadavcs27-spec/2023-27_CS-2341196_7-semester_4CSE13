import api from './api';

export const exportExcel = async (params) => {
  const response = await api.get('/export/excel', {
    params,
    responseType: 'blob',
  });
  
  // Create a blob and trigger download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  
  // Extract filename from headers if possible or use default
  const contentDisposition = response.headers['content-disposition'];
  let fileName = 'export.xlsx';
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      fileName = match[1];
    }
  }
  
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
