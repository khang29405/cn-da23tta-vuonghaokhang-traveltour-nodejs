import axiosClient from './axiosClient.js';

const getData = async (request) => {
  const { data } = await request;
  return data.data;
};

export const createBooking = (payload) => getData(axiosClient.post('/bookings', payload));
export const getMyBookings = (params = {}) => getData(axiosClient.get('/bookings/me', { params }));
export const getMyBooking = (id) => getData(axiosClient.get(`/bookings/${id}`));
