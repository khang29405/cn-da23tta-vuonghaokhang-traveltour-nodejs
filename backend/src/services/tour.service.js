import AppError from '../utils/AppError.js';
import * as tourModel from '../models/tour.model.js';
import { runInTransaction } from '../utils/transaction.js';
import { removeUploadedFiles } from '../utils/uploadStorage.js';
import { parsePagination, buildPagination, toPaginatedData } from '../utils/pagination.js';
import {
  requireText,
  optionalText,
  requireInteger,
  requireId,
  optionalBoolean,
} from '../utils/validation.js';

const SQL_FOREIGN_KEY_ERROR = 547;
const TOUR_NOT_FOUND = 'Không tìm thấy tour';

// Giới hạn hợp lý cho tour trong nước; cột gia là DECIMAL(12, 0)
const MAX_DAYS = 30;
const MAX_PRICE = 999_999_999_999;
const MAX_LONG_TEXT = 4000;

/* ---------- Kiểm tra dữ liệu ---------- */

// Lịch trình gửi lên là mảng theo thứ tự ngày; ngày thứ mấy do server đánh số theo vị trí (1, 2, 3...)
// nên không thể bị trùng hay nhảy cóc.
const validateItinerary = (lichTrinh, soNgay) => {
  if (!Array.isArray(lichTrinh)) throw new AppError('Lịch trình phải là danh sách các ngày', 400);
  if (lichTrinh.length === 0) throw new AppError('Lịch trình phải có ít nhất 1 ngày', 400);
  if (lichTrinh.length > soNgay) {
    throw new AppError(`Lịch trình có ${lichTrinh.length} ngày, vượt quá số ngày của tour (${soNgay})`, 400);
  }

  return lichTrinh.map((day, index) => {
    const ngayThu = index + 1;
    if (typeof day !== 'object' || day === null) throw new AppError(`Ngày ${ngayThu} của lịch trình không hợp lệ`, 400);
    return {
      ngayThu,
      tieuDe: requireText(day.tieu_de, `tiêu đề ngày ${ngayThu}`, 200),
      noiDung: optionalText(day.noi_dung_hoat_dong, `nội dung ngày ${ngayThu}`, MAX_LONG_TEXT),
    };
  });
};

const validateTour = (body, defaultVisibility) => {
  const soNgay = requireInteger(body.so_ngay, 'số ngày', { min: 1, max: MAX_DAYS });
  const soDem = requireInteger(body.so_dem, 'số đêm', { min: 0 });
  // Tour N ngày có N - 1 đêm (3 ngày 2 đêm, tour trong ngày 1 ngày 0 đêm) hoặc N đêm (có đêm đi xe/tàu)
  if (soDem > soNgay || soDem < soNgay - 1) {
    throw new AppError(`Tour ${soNgay} ngày chỉ có thể có ${soNgay - 1} hoặc ${soNgay} đêm`, 400);
  }

  return {
    tenTour: requireText(body.ten_tour, 'tên tour', 200),
    moTaTongQuan: optionalText(body.mo_ta_tong_quan, 'mô tả tổng quan', MAX_LONG_TEXT),
    soNgay,
    soDem,
    gia: requireInteger(body.gia, 'giá tour', { min: 1, max: MAX_PRICE }),
    trangThaiHienThi: optionalBoolean(body.trang_thai_hien_thi, 'trạng thái hiển thị', defaultVisibility),
    maLoaiTour: requireId(body.ma_loai_tour, 'loại tour'),
    maDiemDen: requireId(body.ma_diem_den, 'điểm đến'),
    maDiemKhoiHanh: requireId(body.ma_diem_khoi_hanh, 'điểm khởi hành'),
    maPhuongTien: requireId(body.ma_phuong_tien, 'phương tiện'),
    lichTrinh: validateItinerary(body.lich_trinh, soNgay),
  };
};

const ensureCategoriesExist = async (tour) => {
  const found = await tourModel.checkCategoryReferences(tour);
  if (!found.co_loai_tour) throw new AppError('Loại tour không tồn tại', 400);
  if (!found.co_diem_den) throw new AppError('Điểm đến không tồn tại', 400);
  if (!found.co_diem_khoi_hanh) throw new AppError('Điểm khởi hành không tồn tại', 400);
  if (!found.co_phuong_tien) throw new AppError('Phương tiện không tồn tại', 400);
};

const saveItinerary = async (tourId, lichTrinh, transaction) => {
  for (const day of lichTrinh) {
    await tourModel.insertItineraryDay(tourId, day, transaction);
  }
};

/* ---------- Bộ lọc danh sách ---------- */

const MAX_KEYWORD = 100;

const toVisibleFilter = (value) => {
  if (value === 'visible') return true;
  if (value === 'hidden') return false;
  return null;
};

// Thoát các ký tự có nghĩa riêng trong LIKE (\ % _ [) để từ khóa được tìm đúng nguyên văn
const toLikePattern = (text) => `%${text.replace(/[\\%_[]/g, (char) => `\\${char}`)}%`;

const toFilterId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// Giống quy ước phân trang: giá trị lọc sai thì bỏ qua bộ lọc đó, không báo lỗi.
// keyword "12" hoặc "#12" tìm cả tour mã 12 lẫn tour có "12" trong tên.
const parseTourFilters = (query) => {
  const keyword = (typeof query.keyword === 'string' ? query.keyword.trim() : '').slice(0, MAX_KEYWORD);
  const code = /^#?(\d{1,9})$/.exec(keyword);
  return {
    keyword: keyword ? toLikePattern(keyword) : null,
    tourCode: code ? Number(code[1]) : null,
    tourType: toFilterId(query.tourType),
    destination: toFilterId(query.destination),
    visible: toVisibleFilter(query.visibility),
  };
};

/* ---------- Nghiệp vụ ---------- */

// Danh sách tour của quản trị: lọc theo keyword, tourType, destination, visibility (kết hợp được), có phân trang
export const getTours = async (query) => {
  const filters = parseTourFilters(query);
  const pagination = buildPagination(parsePagination(query), await tourModel.countTours(filters));
  const tours = await tourModel.findTours(filters, pagination);
  return toPaginatedData(tours, pagination);
};

export const getTourDetail = async (id) => {
  const tour = await tourModel.findTourById(id);
  if (!tour) throw new AppError(TOUR_NOT_FOUND, 404);
  const [lichTrinh, anhTour] = await Promise.all([
    tourModel.findItineraryByTourId(id),
    tourModel.findImagesByTourId(id),
  ]);
  return { ...tour, lich_trinh: lichTrinh, anh_tour: anhTour };
};

// Tour mới mặc định hiện; ghi tour và lịch trình trong cùng một transaction
export const createTour = async (body) => {
  const tour = validateTour(body, true);
  await ensureCategoriesExist(tour);

  const tourId = await runInTransaction(async (transaction) => {
    const newId = await tourModel.insertTour(tour, transaction);
    await saveItinerary(newId, tour.lichTrinh, transaction);
    return newId;
  });
  return getTourDetail(tourId);
};

// Sửa tour: lịch trình gửi lên thay hoàn toàn lịch trình cũ.
// Không gửi trang_thai_hien_thi thì giữ trạng thái hiện tại.
export const updateTour = async (id, body) => {
  const current = await tourModel.findTourById(id);
  if (!current) throw new AppError(TOUR_NOT_FOUND, 404);

  const tour = validateTour(body, current.trang_thai_hien_thi);
  await ensureCategoriesExist(tour);

  await runInTransaction(async (transaction) => {
    await tourModel.updateTour(id, tour, transaction);
    await tourModel.deleteItineraryByTourId(id, transaction);
    await saveItinerary(id, tour.lichTrinh, transaction);
  });
  return getTourDetail(id);
};

// Tour đã có lịch khởi hành (và có thể đã có đơn đặt) thì không xóa cứng, chỉ được ẩn
export const deleteTour = async (id) => {
  if (!(await tourModel.findTourById(id))) throw new AppError(TOUR_NOT_FOUND, 404);

  const soLich = await tourModel.countDeparturesByTour(id);
  if (soLich > 0) {
    throw new AppError(
      `Không thể xóa: tour đã có ${soLich} lịch khởi hành. Hãy chuyển tour sang trạng thái ẩn thay vì xóa`,
      409,
    );
  }

  // Lấy danh sách ảnh trước khi xóa dòng trong CSDL; file trên đĩa chỉ xóa khi CSDL đã xóa xong
  const images = await tourModel.findImagesByTourId(id);
  try {
    await runInTransaction((transaction) => tourModel.deleteTourWithChildren(id, transaction));
  } catch (err) {
    // Có lịch khởi hành vừa được thêm giữa lúc kiểm tra và lúc xóa
    if (err.number === SQL_FOREIGN_KEY_ERROR) {
      throw new AppError('Không thể xóa: tour đã có lịch khởi hành. Hãy chuyển tour sang trạng thái ẩn', 409);
    }
    throw err;
  }
  await removeUploadedFiles(images.map((image) => image.duong_dan_anh));
};
