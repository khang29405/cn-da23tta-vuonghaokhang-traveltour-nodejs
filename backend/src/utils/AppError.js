// Lỗi nghiệp vụ có mã HTTP; service ném ra, middleware xuLyLoi trả về client
export default class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}
