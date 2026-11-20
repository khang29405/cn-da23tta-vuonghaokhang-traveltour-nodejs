// Giá trị cố định khớp với CHECK trong database/schema.sql

export const ROLES = {
  CUSTOMER: 'khach_hang',
  STAFF: 'nhan_vien',
  ADMIN: 'quan_tri',
};

export const ACCOUNT_STATUS = {
  ACTIVE: 'hoat_dong',
  LOCKED: 'bi_khoa',
};

export const DEPARTURE_STATUS = {
  OPEN: 'mo',
  FULL: 'het_cho',
  DEPARTED: 'da_khoi_hanh',
  CANCELLED: 'da_huy',
};

export const BOOKING_STATUS = {
  PENDING: 'cho_xac_nhan',
  CONFIRMED: 'da_xac_nhan',
  CANCELLED: 'da_huy',
  COMPLETED: 'hoan_tat',
};
