import AppError from '../utils/AppError.js';
import * as tourModel from '../models/tour.model.js';
import * as departureModel from '../models/departure.model.js';
import { getToday } from '../utils/date.js';
import { parsePagination, buildPagination, toPaginatedData } from '../utils/pagination.js';

// Xem tour dành cho khách (không cần đăng nhập): chỉ tour đang hiện (trang_thai_hien_thi = 1)

const HOME_GROUP_LIMIT = 8;
// Lưới thẻ tour mặc định 12 tour mỗi trang (quy ước phân trang ở mục 3 kehoach.md)
const CARD_GRID_LIMIT = 12;

// Gom các dòng (đã xếp theo loại tour) thành từng nhóm loại tour; bỏ cột thu_tu chỉ dùng để lọc trong SQL
const groupByTourType = (rows) => {
  const groups = [];
  for (const { thu_tu: _thuTu, ...tour } of rows) {
    let group = groups.at(-1);
    if (!group || group.ma_loai_tour !== tour.ma_loai_tour) {
      group = { ma_loai_tour: tour.ma_loai_tour, ten_loai_tour: tour.ten_loai_tour, danh_sach_tour: [] };
      groups.push(group);
    }
    group.danh_sach_tour.push(tour);
  }
  return groups;
};

// Dữ liệu các dải tour ở trang chủ trong một lần gọi, mỗi nhóm tối đa 8 tour
export const getHomeTours = async () => {
  const today = getToday();
  const [sapKhoiHanh, tourMoi, theoLoai] = await Promise.all([
    tourModel.findUpcomingTourCards(today, HOME_GROUP_LIMIT),
    tourModel.findNewestTourCards(today, HOME_GROUP_LIMIT),
    tourModel.findTourCardsByType(today, HOME_GROUP_LIMIT),
  ]);
  return { sap_khoi_hanh: sapKhoiHanh, tour_moi: tourMoi, theo_loai_tour: groupByTourType(theoLoai) };
};

// Danh sách tour có phân trang; tour có lịch còn chỗ gần nhất đứng trước (Bước 18 thêm lọc và sắp xếp)
export const getTours = async (query) => {
  const pagination = buildPagination(parsePagination(query, CARD_GRID_LIMIT), await tourModel.countVisibleTours());
  const tours = await tourModel.findVisibleTourCards(getToday(), pagination);
  return toPaginatedData(tours, pagination);
};

// Tour đang ẩn trả 404 giống tour không tồn tại để khách không biết được tour ẩn
export const getTourDetail = async (id) => {
  const tour = await tourModel.findTourById(id);
  if (!tour || !tour.trang_thai_hien_thi) throw new AppError('Không tìm thấy tour', 404);

  const [lichTrinh, anhTour, lichKhoiHanh] = await Promise.all([
    tourModel.findItineraryByTourId(id),
    tourModel.findImagesByTourId(id),
    departureModel.findBookableDeparturesByTour(id, getToday()),
  ]);
  const { trang_thai_hien_thi: _hienThi, ...publicTour } = tour;
  return { ...publicTour, lich_trinh: lichTrinh, anh_tour: anhTour, lich_khoi_hanh: lichKhoiHanh };
};
