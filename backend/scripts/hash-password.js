// Sinh mã băm bcrypt cho mật khẩu để dán vào database/seed.sql
// Cách dùng: npm run hash-password -- <mat_khau>
import bcrypt from 'bcrypt';

// Số vòng băm; dùng chung giá trị này khi đăng ký tài khoản ở Bước 4
const SALT_ROUNDS = 10;

const password = process.argv[2];

if (!password) {
  console.error('Thiếu mật khẩu. Ví dụ: npm run hash-password -- Matkhau@123');
  process.exit(1);
}

const hash = await bcrypt.hash(password, SALT_ROUNDS);
console.log(hash);
