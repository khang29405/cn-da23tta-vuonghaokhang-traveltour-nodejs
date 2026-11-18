import * as tourService from '../services/tour.service.js';
import { sendSuccess } from '../utils/response.js';
import { parseId } from '../utils/validation.js';

// /api/admin/tours (chỉ quản trị viên)

export const getTours = async (req, res) =>
  sendSuccess(res, await tourService.getTours(req.query), 'Danh sách tour');

export const getTourById = async (req, res) =>
  sendSuccess(res, await tourService.getTourDetail(parseId(req.params.id)), 'Chi tiết tour');

export const createTour = async (req, res) => {
  const tour = await tourService.createTour(req.body ?? {});
  sendSuccess(res, tour, 'Đã thêm tour', 201);
};

export const updateTour = async (req, res) => {
  const tour = await tourService.updateTour(parseId(req.params.id), req.body ?? {});
  sendSuccess(res, tour, 'Đã cập nhật tour');
};

export const deleteTour = async (req, res) => {
  await tourService.deleteTour(parseId(req.params.id));
  sendSuccess(res, null, 'Đã xóa tour');
};
