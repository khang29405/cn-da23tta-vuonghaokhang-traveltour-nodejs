import axiosClient from './axiosClient.js';

const getData = async (request) => {
  const { data } = await request;
  return data.data;
};

// view: 'upcoming' | 'past'; month: 'YYYY-MM'. Bỏ trống thì backend tự chọn (sắp tới, tháng đầu tiên có lịch)
export const getTourDepartures = (tourId, { view, month } = {}) =>
  getData(axiosClient.get(`/admin/tours/${tourId}/departures`, { params: { view, month } }));
export const createDeparture = (tourId, payload) =>
  getData(axiosClient.post(`/admin/tours/${tourId}/departures`, payload));
export const updateDeparture = (id, payload) => getData(axiosClient.put(`/admin/departures/${id}`, payload));
export const deleteDeparture = (id) => getData(axiosClient.delete(`/admin/departures/${id}`));
