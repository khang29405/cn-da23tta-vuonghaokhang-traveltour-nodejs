import axiosClient from './axiosClient.js';

const getData = async (request) => {
  const { data } = await request;
  return data.data;
};

export const getTourTypes = () => getData(axiosClient.get('/categories/tour-types'));
export const getDestinations = () => getData(axiosClient.get('/categories/destinations'));
export const getDeparturePoints = () => getData(axiosClient.get('/categories/departure-points'));
export const getTransports = () => getData(axiosClient.get('/categories/transports'));

export const createTourType = (payload) => getData(axiosClient.post('/admin/tour-types', payload));
export const updateTourType = (id, payload) => getData(axiosClient.put(`/admin/tour-types/${id}`, payload));
export const deleteTourType = (id) => getData(axiosClient.delete(`/admin/tour-types/${id}`));

export const createDestination = (payload) => getData(axiosClient.post('/admin/destinations', payload));
export const updateDestination = (id, payload) => getData(axiosClient.put(`/admin/destinations/${id}`, payload));

export const createDeparturePoint = (payload) => getData(axiosClient.post('/admin/departure-points', payload));
export const updateDeparturePoint = (id, payload) =>
  getData(axiosClient.put(`/admin/departure-points/${id}`, payload));
