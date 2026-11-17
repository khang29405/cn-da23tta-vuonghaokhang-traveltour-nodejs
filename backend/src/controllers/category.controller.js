import * as categoryService from '../services/category.service.js';
import { sendSuccess } from '../utils/response.js';

// GET /api/categories/...: danh sách dùng cho ô chọn và bộ lọc
export const getTourTypes = async (req, res) =>
  sendSuccess(res, await categoryService.getTourTypes(), 'Danh sách loại tour');

export const getDestinations = async (req, res) =>
  sendSuccess(res, await categoryService.getDestinations(), 'Danh sách điểm đến');

export const getDeparturePoints = async (req, res) =>
  sendSuccess(res, await categoryService.getDeparturePoints(), 'Danh sách điểm khởi hành');

export const getTransports = async (req, res) =>
  sendSuccess(res, await categoryService.getTransports(), 'Danh sách phương tiện');

// /api/admin/tour-types
export const createTourType = async (req, res) => {
  const tourType = await categoryService.createTourType(req.body ?? {});
  sendSuccess(res, tourType, 'Đã thêm loại tour', 201);
};

export const updateTourType = async (req, res) => {
  const id = categoryService.parseId(req.params.id);
  const tourType = await categoryService.updateTourType(id, req.body ?? {});
  sendSuccess(res, tourType, 'Đã cập nhật loại tour');
};

export const deleteTourType = async (req, res) => {
  await categoryService.deleteTourType(categoryService.parseId(req.params.id));
  sendSuccess(res, null, 'Đã xóa loại tour');
};

// /api/admin/destinations
export const createDestination = async (req, res) => {
  const destination = await categoryService.createDestination(req.body ?? {});
  sendSuccess(res, destination, 'Đã thêm điểm đến', 201);
};

export const updateDestination = async (req, res) => {
  const id = categoryService.parseId(req.params.id);
  const destination = await categoryService.updateDestination(id, req.body ?? {});
  sendSuccess(res, destination, 'Đã cập nhật điểm đến');
};

// /api/admin/departure-points
export const createDeparturePoint = async (req, res) => {
  const departurePoint = await categoryService.createDeparturePoint(req.body ?? {});
  sendSuccess(res, departurePoint, 'Đã thêm điểm khởi hành', 201);
};

export const updateDeparturePoint = async (req, res) => {
  const id = categoryService.parseId(req.params.id);
  const departurePoint = await categoryService.updateDeparturePoint(id, req.body ?? {});
  sendSuccess(res, departurePoint, 'Đã cập nhật điểm khởi hành');
};
