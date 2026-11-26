import * as bookingService from '../services/booking.service.js';
import { sendSuccess } from '../utils/response.js';
import { parseId } from '../utils/validation.js';

export const createBooking = async (req, res) => {
  const booking = await bookingService.createBooking(req.user.ma_nguoi_dung, req.body ?? {});
  sendSuccess(res, booking, 'Đặt tour thành công, đơn đang chờ xác nhận', 201);
};

export const getMyBookings = async (req, res) =>
  sendSuccess(res, await bookingService.getMyBookings(req.user.ma_nguoi_dung, req.query), 'Lịch sử đặt tour');

export const getMyBookingById = async (req, res) =>
  sendSuccess(
    res,
    await bookingService.getMyBookingDetail(req.user.ma_nguoi_dung, parseId(req.params.id)),
    'Chi tiết đơn đặt tour',
  );
