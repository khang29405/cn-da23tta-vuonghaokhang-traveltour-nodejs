import AppError from '../utils/AppError.js';
import * as categoryModel from '../models/category.model.js';

// Mã lỗi SQL Server: vi phạm UNIQUE (2601, 2627) và vi phạm khóa ngoại (547)
const SQL_DUPLICATE_KEY_ERRORS = [2601, 2627];
const SQL_FOREIGN_KEY_ERROR = 547;

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const toText = (value) => (typeof value === 'string' ? value.trim() : '');

const requireText = (value, label, maxLength) => {
  const text = toText(value);
  if (!text) throw new AppError(`Vui lòng nhập ${label}`, 400);
  if (text.length > maxLength) throw new AppError(`${capitalize(label)} tối đa ${maxLength} ký tự`, 400);
  return text;
};

const optionalText = (value, label, maxLength) => {
  const text = toText(value);
  if (text.length > maxLength) throw new AppError(`${capitalize(label)} tối đa ${maxLength} ký tự`, 400);
  return text || null;
};

// Mã trên đường dẫn (:id) phải là số nguyên dương
export const parseId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Mã không hợp lệ', 400);
  return id;
};

// Chạy thao tác ghi; nếu CSDL báo trùng tên (hai người thêm cùng lúc) thì đổi thành lỗi 409
const withDuplicateCheck = async (action, duplicateMessage) => {
  try {
    return await action();
  } catch (err) {
    if (SQL_DUPLICATE_KEY_ERRORS.includes(err.number)) throw new AppError(duplicateMessage, 409);
    throw err;
  }
};

/* ---------- Danh sách công khai ---------- */

export const getTourTypes = () => categoryModel.findAllTourTypes();
export const getDestinations = () => categoryModel.findAllDestinations();
export const getDeparturePoints = () => categoryModel.findAllDeparturePoints();
export const getTransports = () => categoryModel.findAllTransports();

/* ---------- Loại tour ---------- */

const TOUR_TYPE_DUPLICATE = 'Tên loại tour đã tồn tại';
const TOUR_TYPE_NOT_FOUND = 'Không tìm thấy loại tour';

const validateTourType = (body) => ({
  tenLoaiTour: requireText(body.ten_loai_tour, 'tên loại tour', 100),
  moTaNgan: optionalText(body.mo_ta_ngan, 'mô tả ngắn', 500),
});

export const createTourType = async (body) => {
  const data = validateTourType(body);
  if (await categoryModel.existsTourTypeName(data.tenLoaiTour)) throw new AppError(TOUR_TYPE_DUPLICATE, 409);
  return withDuplicateCheck(() => categoryModel.createTourType(data), TOUR_TYPE_DUPLICATE);
};

export const updateTourType = async (id, body) => {
  const data = validateTourType(body);
  if (!(await categoryModel.findTourTypeById(id))) throw new AppError(TOUR_TYPE_NOT_FOUND, 404);
  if (await categoryModel.existsTourTypeName(data.tenLoaiTour, id)) throw new AppError(TOUR_TYPE_DUPLICATE, 409);
  return withDuplicateCheck(() => categoryModel.updateTourType(id, data), TOUR_TYPE_DUPLICATE);
};

// Không xóa loại tour còn tour thuộc về nó (kể cả tour đang ẩn)
export const deleteTourType = async (id) => {
  if (!(await categoryModel.findTourTypeById(id))) throw new AppError(TOUR_TYPE_NOT_FOUND, 404);

  const soTour = await categoryModel.countToursByTourType(id);
  const inUseMessage = `Không thể xóa: loại tour đang có ${soTour} tour. Hãy chuyển các tour này sang loại khác trước`;
  if (soTour > 0) throw new AppError(inUseMessage, 409);

  try {
    await categoryModel.deleteTourType(id);
  } catch (err) {
    // Có tour vừa được thêm vào loại này giữa lúc đếm và lúc xóa
    if (err.number === SQL_FOREIGN_KEY_ERROR) throw new AppError('Không thể xóa: loại tour đang có tour', 409);
    throw err;
  }
};

/* ---------- Điểm đến ---------- */

const DESTINATION_DUPLICATE = 'Tên điểm đến đã tồn tại';

const validateDestination = (body) => ({
  tenDiemDen: requireText(body.ten_diem_den, 'tên điểm đến', 100),
  tinhThanh: requireText(body.tinh_thanh, 'tỉnh/thành', 100),
  moTaNgan: optionalText(body.mo_ta_ngan, 'mô tả ngắn', 500),
});

export const createDestination = async (body) => {
  const data = validateDestination(body);
  if (await categoryModel.existsDestinationName(data.tenDiemDen)) throw new AppError(DESTINATION_DUPLICATE, 409);
  return withDuplicateCheck(() => categoryModel.createDestination(data), DESTINATION_DUPLICATE);
};

export const updateDestination = async (id, body) => {
  const data = validateDestination(body);
  if (!(await categoryModel.findDestinationById(id))) throw new AppError('Không tìm thấy điểm đến', 404);
  if (await categoryModel.existsDestinationName(data.tenDiemDen, id)) {
    throw new AppError(DESTINATION_DUPLICATE, 409);
  }
  return withDuplicateCheck(() => categoryModel.updateDestination(id, data), DESTINATION_DUPLICATE);
};

/* ---------- Điểm khởi hành ---------- */

const DEPARTURE_DUPLICATE = 'Tên điểm khởi hành đã tồn tại';

const validateDeparturePoint = (body) => ({
  tenDiemKhoiHanh: requireText(body.ten_diem_khoi_hanh, 'tên điểm khởi hành', 100),
  tinhThanh: requireText(body.tinh_thanh, 'tỉnh/thành', 100),
});

export const createDeparturePoint = async (body) => {
  const data = validateDeparturePoint(body);
  if (await categoryModel.existsDeparturePointName(data.tenDiemKhoiHanh)) {
    throw new AppError(DEPARTURE_DUPLICATE, 409);
  }
  return withDuplicateCheck(() => categoryModel.createDeparturePoint(data), DEPARTURE_DUPLICATE);
};

export const updateDeparturePoint = async (id, body) => {
  const data = validateDeparturePoint(body);
  if (!(await categoryModel.findDeparturePointById(id))) throw new AppError('Không tìm thấy điểm khởi hành', 404);
  if (await categoryModel.existsDeparturePointName(data.tenDiemKhoiHanh, id)) {
    throw new AppError(DEPARTURE_DUPLICATE, 409);
  }
  return withDuplicateCheck(() => categoryModel.updateDeparturePoint(id, data), DEPARTURE_DUPLICATE);
};
