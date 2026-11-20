// Nhãn và màu (lớp status-badge--...) của trạng thái lịch khởi hành, khớp giá trị trong CSDL
export const DEPARTURE_STATUS = {
  mo: { label: 'Mở bán', badge: 'visible' },
  het_cho: { label: 'Hết chỗ', badge: 'warning' },
  da_khoi_hanh: { label: 'Đã khởi hành', badge: 'hidden' },
  da_huy: { label: 'Đã hủy', badge: 'danger' },
};

// Hai trạng thái lịch đang bán; "hết chỗ" do hệ thống tự đặt theo số chỗ còn lại
export const SELLING_STATUSES = ['mo', 'het_cho'];
