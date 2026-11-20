import * as departureService from '../services/departure.service.js';
import { sendSuccess } from '../utils/response.js';
import { parseId } from '../utils/validation.js';

// /api/admin/tours/:id/departures và /api/admin/departures/:id (chỉ quản trị viên)

export const getDeparturesByTour = async (req, res) =>
  sendSuccess(res, await departureService.getDeparturesByTour(parseId(req.params.id)), 'Danh sách lịch khởi hành');

export const createDeparture = async (req, res) => {
  const departure = await departureService.createDeparture(parseId(req.params.id), req.body ?? {});
  sendSuccess(res, departure, 'Đã thêm lịch khởi hành', 201);
};

export const updateDeparture = async (req, res) => {
  const departure = await departureService.updateDeparture(parseId(req.params.id), req.body ?? {});
  sendSuccess(res, departure, 'Đã cập nhật lịch khởi hành');
};

export const deleteDeparture = async (req, res) => {
  await departureService.deleteDeparture(parseId(req.params.id));
  sendSuccess(res, null, 'Đã xóa lịch khởi hành');
};
