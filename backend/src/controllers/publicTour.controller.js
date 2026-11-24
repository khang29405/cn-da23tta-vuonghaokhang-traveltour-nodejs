import * as publicTourService from '../services/publicTour.service.js';
import { sendSuccess } from '../utils/response.js';
import { parseId } from '../utils/validation.js';

// /api/tours (công khai, không cần đăng nhập)

export const getHomeTours = async (req, res) =>
  sendSuccess(res, await publicTourService.getHomeTours(), 'Dữ liệu trang chủ');

export const getTours = async (req, res) =>
  sendSuccess(res, await publicTourService.getTours(req.query), 'Danh sách tour');

export const getTourById = async (req, res) =>
  sendSuccess(res, await publicTourService.getTourDetail(parseId(req.params.id)), 'Chi tiết tour');
