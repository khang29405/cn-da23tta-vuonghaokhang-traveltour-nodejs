// Đọc tham số lọc trên query string, dùng chung cho các danh sách có bộ lọc.
// Giá trị sai thì trả null (bỏ qua bộ lọc đó), không báo lỗi, giống quy ước phân trang.

const MAX_KEYWORD = 100;

// Từ khóa đã cắt khoảng trắng, tối đa 100 ký tự; không phải chuỗi (ví dụ ?keyword=a&keyword=b) thì coi như rỗng
export const toKeyword = (value) => (typeof value === 'string' ? value.trim() : '').slice(0, MAX_KEYWORD);

// Thoát các ký tự có nghĩa riêng trong LIKE (\ % _ [) để từ khóa được tìm đúng nguyên văn
export const toLikePattern = (text) => `%${text.replace(/[\\%_[]/g, (char) => `\\${char}`)}%`;

// Mã danh mục phải là số nguyên dương
export const toFilterId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// Số nguyên không âm (chỉ gồm chữ số), lớn hơn max thì lấy max
export const toFilterAmount = (value, max) =>
  typeof value === 'string' && /^\d{1,15}$/.test(value.trim()) ? Math.min(Number(value), max) : null;
