// Định dạng response thống nhất: { success, message, data }

export const thanhCong = (res, data = null, message = 'Thành công', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

export const thatBai = (res, message = 'Có lỗi xảy ra', statusCode = 400) =>
  res.status(statusCode).json({ success: false, message });
