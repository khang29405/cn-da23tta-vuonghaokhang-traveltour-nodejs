import AppError from '../utils/AppError.js';
import * as tourModel from '../models/tour.model.js';
import * as departureModel from '../models/departure.model.js';
import { getToday } from '../utils/date.js';
import { parsePagination, buildPagination, toPaginatedData } from '../utils/pagination.js';
import { toKeyword, toLikePattern, toFilterId, toFilterAmount } from '../utils/queryFilter.js';
import { requireDate } from '../utils/validation.js';

// Xem tour dành cho khách (không cần đăng nhập): chỉ tour đang hiện (trang_thai_hien_thi = 1)

const HOME_GROUP_LIMIT = 8;
// Lưới thẻ tour mặc định 12 tour mỗi trang (quy ước phân trang ở mục 3 kehoach.md)
const CARD_GRID_LIMIT = 12;
// Cột gia là DECIMAL(12, 0); giá lọc lớn hơn thì lấy giá trị này
const MAX_PRICE = 999_999_999_999;

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

// Đọc bộ lọc của khách. Giống bộ lọc ở trang quản trị: giá trị sai thì bỏ qua bộ lọc đó, không báo lỗi;
// riêng departureFrom sai định dạng hoặc không có thật thì trả 400 để giao diện báo ô ngày nhập sai.
// minPrice > maxPrice không báo lỗi, chỉ là không có tour nào khớp.
const parsePublicFilters = (query) => {
  const keyword = toKeyword(query.keyword);
  return {
    keyword: keyword ? toLikePattern(keyword) : null,
    tourType: toFilterId(query.tourType),
    destination: toFilterId(query.destination),
    departurePoint: toFilterId(query.departurePoint),
    transport: toFilterId(query.transport),
    minPrice: toFilterAmount(query.minPrice, MAX_PRICE),
    maxPrice: toFilterAmount(query.maxPrice, MAX_PRICE),
    departureFrom:
      query.departureFrom === undefined || query.departureFrom === ''
        ? null
        : requireDate(query.departureFrom, 'ngày khởi hành'),
    sort: tourModel.PUBLIC_TOUR_SORTS.includes(query.sort) ? query.sort : null,
  };
};

// Danh sách tour có lọc, sắp xếp, phân trang. Các bộ lọc kết hợp với nhau (AND).
// Không chọn sort thì tour có lịch còn chỗ gần nhất đứng trước.
export const getTours = async (query) => {
  const filters = parsePublicFilters(query);
  const today = getToday();
  const total = await tourModel.countPublicTours(today, filters);
  const pagination = buildPagination(parsePagination(query, CARD_GRID_LIMIT), total);
  const tours = await tourModel.findPublicTourCards(today, filters, pagination);
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
