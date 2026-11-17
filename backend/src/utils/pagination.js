// Phân trang dùng chung (quy ước ở mục 3 kehoach.md):
// query ?page=2&limit=10; response data = { items, pagination: { page, limit, total, totalPages } }.
// Giá trị sai hoặc vượt giới hạn được đưa về giá trị hợp lệ gần nhất, không báo lỗi.

export const MAX_LIMIT = 50;

const toPositiveInteger = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : fallback;
};

export const parsePagination = (query, defaultLimit = 10) => ({
  page: toPositiveInteger(query.page, 1),
  limit: Math.min(toPositiveInteger(query.limit, defaultLimit), MAX_LIMIT),
});

// Trang vượt quá trang cuối thì lùi về trang cuối (danh sách rỗng thì là trang 1)
export const buildPagination = ({ page, limit }, total) => {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const currentPage = Math.min(page, totalPages);
  return { page: currentPage, limit, total, totalPages, offset: (currentPage - 1) * limit };
};

// Bỏ offset (chỉ dùng nội bộ để truy vấn) trước khi trả về client
export const toPaginatedData = (items, { page, limit, total, totalPages }) => ({
  items,
  pagination: { page, limit, total, totalPages },
});
