import axiosClient from './axiosClient.js';

const getData = async (request) => {
  const { data } = await request;
  return data.data;
};

export const getHomeTours = () => getData(axiosClient.get('/tours/home'));
export const getTours = (params = {}) => getData(axiosClient.get('/tours', { params }));
export const getTour = (id) => getData(axiosClient.get(`/tours/${id}`));
