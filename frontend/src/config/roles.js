// Giá trị khớp cột VAI_TRO.ten_vai_tro ở backend
export const ROLES = {
  CUSTOMER: 'khach_hang',
  STAFF: 'nhan_vien',
  ADMIN: 'quan_tri',
};

export const ROLE_LABELS = {
  [ROLES.CUSTOMER]: 'Khách hàng',
  [ROLES.STAFF]: 'Nhân viên',
  [ROLES.ADMIN]: 'Quản trị viên',
};

export const ADMIN_PATH = '/admin';
export const STAFF_PATH = '/nhan-vien';

const HOME_PATHS = {
  [ROLES.CUSTOMER]: '/',
  [ROLES.STAFF]: STAFF_PATH,
  [ROLES.ADMIN]: ADMIN_PATH,
};

export const getHomePath = (role) => HOME_PATHS[role] ?? '/';

const isUnder = (path, basePath) => path === basePath || path.startsWith(`${basePath}/`);

// Chỉ dùng để chọn trang chuyển tới sau khi đăng nhập; quyền thật do ProtectedRoute và backend kiểm tra.
// Quản trị viên kế thừa quyền của nhân viên nên vào được cả khu nhân viên.
export const canAccessPath = (role, path) => {
  if (isUnder(path, ADMIN_PATH)) return role === ROLES.ADMIN;
  if (isUnder(path, STAFF_PATH)) return role === ROLES.STAFF || role === ROLES.ADMIN;
  return true;
};
