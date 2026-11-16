import jwt from 'jsonwebtoken';

const TOKEN_EXPIRES_IN = '1d';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Chưa cấu hình JWT_SECRET trong backend/.env');
  }
  return secret;
};

// Token chỉ chứa mã người dùng và vai trò; thông tin khác luôn đọc lại từ CSDL
export const signToken = ({ ma_nguoi_dung, vai_tro }) =>
  jwt.sign({ ma_nguoi_dung, vai_tro }, getSecret(), { expiresIn: TOKEN_EXPIRES_IN });

// Trả về payload; trả null nếu token sai chữ ký, sai định dạng hoặc đã hết hạn
// (TokenExpiredError kế thừa JsonWebTokenError). Lỗi khác như thiếu JWT_SECRET vẫn ném ra để thành lỗi 500.
export const verifyToken = (token) => {
  const secret = getSecret();
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) return null;
    throw err;
  }
};
