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
