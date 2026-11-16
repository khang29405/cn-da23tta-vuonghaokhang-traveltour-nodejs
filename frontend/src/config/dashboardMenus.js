import {
  faChartLine,
  faMapLocationDot,
  faTags,
  faClipboardList,
  faStar,
  faUsers,
  faUserTie,
} from '@fortawesome/free-solid-svg-icons';

// path rỗng là trang mặc định của khu. Mỗi mục đang là trang tạm, bước ghi bên cạnh sẽ thay bằng trang thật.
export const adminMenu = [
  { path: '', label: 'Tổng quan', icon: faChartLine }, // Bước 33
  { path: 'tour', label: 'Tour', icon: faMapLocationDot }, // Bước 10
  { path: 'danh-muc', label: 'Loại tour và danh mục', icon: faTags }, // Bước 7
  { path: 'don-dat-tour', label: 'Đơn đặt tour', icon: faClipboardList }, // Bước 25
  { path: 'danh-gia', label: 'Đánh giá', icon: faStar }, // Bước 28
  { path: 'khach-hang', label: 'Khách hàng', icon: faUsers }, // Bước 35
  { path: 'nhan-vien', label: 'Nhân viên', icon: faUserTie }, // Bước 35
];

// Nhân viên chỉ xử lý đơn, không có các mục quản lý tour, khách hàng, nhân viên, thống kê
export const staffMenu = [
  { path: '', label: 'Đơn đặt tour', icon: faClipboardList }, // Bước 25
];
