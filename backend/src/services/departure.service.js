import AppError from '../utils/AppError.js';
import * as tourModel from '../models/tour.model.js';
import * as departureModel from '../models/departure.model.js';
import { runInTransaction } from '../utils/transaction.js';
import { requireDate, requireInteger } from '../utils/validation.js';
import { getToday, formatDate } from '../utils/date.js';
import { DEPARTURE_STATUS } from '../utils/constants.js';

const SQL_FOREIGN_KEY_ERROR = 547;
const MAX_SEATS = 500;
const DEPARTURE_NOT_FOUND = 'Không tìm thấy lịch khởi hành';

// Quản trị chỉ chọn được 3 trạng thái này; "hết chỗ" do hệ thống tự đặt theo số chỗ còn lại
const SETTABLE_STATUSES = [DEPARTURE_STATUS.OPEN, DEPARTURE_STATUS.DEPARTED, DEPARTURE_STATUS.CANCELLED];
const SELLING_STATUSES = [DEPARTURE_STATUS.OPEN, DEPARTURE_STATUS.FULL];

/* ---------- Kiểm tra dữ liệu ---------- */

const ensureTourExists = async (tourId) => {
  if (!(await tourModel.findTourById(tourId))) throw new AppError('Không tìm thấy tour', 404);
};

const findDepartureOrFail = async (id, options) => {
  const departure = await departureModel.findDepartureById(id, options);
  if (!departure) throw new AppError(DEPARTURE_NOT_FOUND, 404);
  return departure;
};

const ensureFutureDate = (ngayKhoiHanh) => {
  if (ngayKhoiHanh <= getToday()) throw new AppError('Ngày khởi hành phải sau ngày hôm nay', 400);
};

const ensureNoOtherDepartureOnDate = async (tourId, ngayKhoiHanh, excludeId) => {
  if (await departureModel.existsDepartureOnDate(tourId, ngayKhoiHanh, excludeId)) {
    throw new AppError(`Tour đã có lịch khởi hành ngày ${formatDate(ngayKhoiHanh)}`, 409);
  }
};

const parseSeats = (value) => requireInteger(value, 'tổng số chỗ', { min: 1, max: MAX_SEATS });

const parseStatus = (value, currentStatus) => {
  if (value === undefined || value === null || value === '') return currentStatus;
  if (value === DEPARTURE_STATUS.FULL) {
    throw new AppError('Trạng thái "hết chỗ" được hệ thống tự cập nhật theo số chỗ còn lại', 400);
  }
  if (!SETTABLE_STATUSES.includes(value)) {
    throw new AppError(`Trạng thái chỉ nhận một trong các giá trị: ${SETTABLE_STATUSES.join(', ')}`, 400);
  }
  return value;
};

// Lịch đang bán: còn 0 chỗ thì là "hết chỗ", còn chỗ thì là "mở"
const resolveSellingStatus = (status, soChoConLai) => {
  if (!SELLING_STATUSES.includes(status)) return status;
  return soChoConLai === 0 ? DEPARTURE_STATUS.FULL : DEPARTURE_STATUS.OPEN;
};

/* ---------- Nghiệp vụ ---------- */

export const getDeparturesByTour = async (tourId) => {
  await ensureTourExists(tourId);
  return departureModel.findDeparturesByTour(tourId);
};

// Lịch mới luôn ở trạng thái mở, số chỗ còn lại bằng tổng số chỗ
export const createDeparture = async (tourId, body) => {
  await ensureTourExists(tourId);
  const ngayKhoiHanh = requireDate(body.ngay_khoi_hanh, 'ngày khởi hành');
  ensureFutureDate(ngayKhoiHanh);
  const tongSoCho = parseSeats(body.tong_so_cho);
  await ensureNoOtherDepartureOnDate(tourId, ngayKhoiHanh);

  const id = await departureModel.insertDeparture({
    tourId,
    ngayKhoiHanh,
    tongSoCho,
    trangThai: DEPARTURE_STATUS.OPEN,
  });
  return departureModel.findDepartureById(id);
};

// Sửa ngày, tổng số chỗ, trạng thái. Không gửi trang_thai thì giữ trạng thái hiện tại.
// Số chỗ còn lại = tổng mới - số chỗ đã đặt (đơn chưa hủy); tính trong transaction có khóa dòng
// để không lệch khi có khách đặt chỗ cùng lúc.
export const updateDeparture = async (id, body) => {
  const before = await findDepartureOrFail(id);
  const ngayKhoiHanh = requireDate(body.ngay_khoi_hanh, 'ngày khởi hành');
  const tongSoCho = parseSeats(body.tong_so_cho);
  const requestedStatus = parseStatus(body.trang_thai, before.trang_thai);

  const dateChanged = ngayKhoiHanh !== before.ngay_khoi_hanh;
  const reopening = SELLING_STATUSES.includes(requestedStatus) && !SELLING_STATUSES.includes(before.trang_thai);
  if (dateChanged || reopening) ensureFutureDate(ngayKhoiHanh);
  if (requestedStatus === DEPARTURE_STATUS.DEPARTED && ngayKhoiHanh > getToday()) {
    throw new AppError(`Chưa tới ngày khởi hành (${formatDate(ngayKhoiHanh)}) nên chưa thể chuyển sang "đã khởi hành"`, 400);
  }
  if (dateChanged) await ensureNoOtherDepartureOnDate(before.ma_tour, ngayKhoiHanh, id);

  await runInTransaction(async (transaction) => {
    const current = await findDepartureOrFail(id, { transaction, lock: true });
    // Khách đã đặt theo ngày cũ nên không âm thầm đổi ngày của họ
    if (dateChanged && current.so_cho_da_dat > 0) {
      throw new AppError(
        `Lịch đã có ${current.so_cho_da_dat} chỗ được đặt nên không thể đổi ngày. Hãy hủy lịch này và tạo lịch mới`,
        409,
      );
    }
    if (tongSoCho < current.so_cho_da_dat) {
      throw new AppError(`Tổng số chỗ không được nhỏ hơn số chỗ đã đặt (${current.so_cho_da_dat})`, 400);
    }

    const soChoConLai = tongSoCho - current.so_cho_da_dat;
    await departureModel.updateDeparture(
      id,
      { ngayKhoiHanh, tongSoCho, soChoConLai, trangThai: resolveSellingStatus(requestedStatus, soChoConLai) },
      transaction,
    );
  });
  return departureModel.findDepartureById(id);
};

// Lịch đã có đơn (kể cả đơn đã hủy, vì đơn vẫn tham chiếu tới lịch) thì chỉ được chuyển sang "đã hủy"
export const deleteDeparture = async (id) => {
  const departure = await findDepartureOrFail(id);
  const cannotDelete = `Không thể xóa: lịch đã có ${departure.so_don} đơn đặt. Hãy chuyển lịch sang trạng thái đã hủy`;
  if (departure.so_don > 0) throw new AppError(cannotDelete, 409);

  try {
    await departureModel.deleteDeparture(id);
  } catch (err) {
    // Có đơn vừa được đặt giữa lúc kiểm tra và lúc xóa
    if (err.number === SQL_FOREIGN_KEY_ERROR) {
      throw new AppError('Không thể xóa: lịch vừa có đơn đặt. Hãy chuyển lịch sang trạng thái đã hủy', 409);
    }
    throw err;
  }
};
