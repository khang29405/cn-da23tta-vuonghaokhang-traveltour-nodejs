import axiosClient from './axiosClient.js';

const getData = async (request) => {
  const { data } = await request;
  return data.data;
};

export const getAdminTours = ({ page, limit } = {}) =>
  getData(axiosClient.get('/admin/tours', { params: { page, limit } }));
export const getAdminTour = (id) => getData(axiosClient.get(`/admin/tours/${id}`));
export const createTour = (payload) => getData(axiosClient.post('/admin/tours', payload));
export const updateTour = (id, payload) => getData(axiosClient.put(`/admin/tours/${id}`, payload));
export const deleteTour = (id) => getData(axiosClient.delete(`/admin/tours/${id}`));

// axiosClient mặc định gửi JSON; phải khai báo multipart để axios gửi nguyên FormData
// (trình duyệt tự thêm boundary). Tải nhiều ảnh lớn có thể lâu nên nới thời gian chờ.
export const uploadTourImages = (id, files, onProgress) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('anh', file));
  return getData(
    axiosClient.post(`/admin/tours/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
      onUploadProgress: (event) => event.total && onProgress?.(Math.round((event.loaded / event.total) * 100)),
    }),
  );
};

export const setTourCoverImage = (id, imageId) =>
  getData(axiosClient.put(`/admin/tours/${id}/images/${imageId}/cover`));
export const deleteTourImage = (id, imageId) => getData(axiosClient.delete(`/admin/tours/${id}/images/${imageId}`));
