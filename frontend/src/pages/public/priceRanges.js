// Mốc giá chọn nhanh ở trang /tour, đặt theo mặt bằng tour trong nước; mốc cuối không giới hạn trên
// nên tour giá cao thêm sau vẫn lọc được. Muốn đổi mốc thì chỉ sửa danh sách này.
// URL vẫn nhận khoảng bất kỳ (minPrice, maxPrice); khi đó ô chọn giá hiện đúng khoảng trên URL.
export const PRICE_RANGES = [
  { label: 'Dưới 2 triệu', minPrice: '', maxPrice: '2000000' },
  { label: '2 – 5 triệu', minPrice: '2000000', maxPrice: '5000000' },
  { label: '5 – 10 triệu', minPrice: '5000000', maxPrice: '10000000' },
  { label: 'Trên 10 triệu', minPrice: '10000000', maxPrice: '' },
];
