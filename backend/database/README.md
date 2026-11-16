# Cơ sở dữ liệu TourDuLich

SQL Server, gồm 14 bảng theo mô hình ERD trong `docs/`.

| File | Nội dung |
|---|---|
| `schema.sql` | Tạo cơ sở dữ liệu `TourDuLich` (nếu chưa có) và 14 bảng với khóa chính, khóa ngoại, `CHECK`, `UNIQUE` |
| `seed.sql` | Dữ liệu mẫu: 3 vai trò, 3 tài khoản mẫu, điểm đến, điểm khởi hành, phương tiện, loại tour |

## Cách chạy (SSMS)

1. Mở SQL Server Management Studio, kết nối tới SQL Server (ví dụ `localhost\SQLEXPRESS`).
2. **File → Open → File...**, mở `schema.sql`, nhấn **Execute** (F5).
3. Mở tiếp `seed.sql`, nhấn **Execute**.

Phải chạy đúng thứ tự `schema.sql` rồi `seed.sql`.

> Chạy lại `schema.sql` sẽ **xóa toàn bộ bảng và dữ liệu** rồi tạo lại từ đầu. Sau đó chạy lại `seed.sql`.

Có thể chạy bằng dòng lệnh thay cho SSMS (`-E` là đăng nhập bằng tài khoản Windows):

```bash
sqlcmd -S localhost\SQLEXPRESS -E -C -i schema.sql
sqlcmd -S localhost\SQLEXPRESS -E -C -i seed.sql
```

## Tài khoản mẫu

Cả 3 tài khoản dùng chung mật khẩu **`Matkhau@123`**.

| Vai trò | Email |
|---|---|
| Quản trị viên | `quantri@traveltour.vn` |
| Nhân viên | `nhanvien@traveltour.vn` |
| Khách hàng | `khachhang@gmail.com` |

Mật khẩu trong CSDL là mã băm bcrypt. Muốn thêm tài khoản mẫu khác, sinh mã băm bằng lệnh sau (chạy trong thư mục `backend`) rồi dán vào `seed.sql`:

```bash
npm run hash-password -- MatKhauMoi
```

## Kết nối từ backend

Backend đọc thông tin kết nối từ `backend/.env`:

```env
DB_SERVER=localhost\SQLEXPRESS   # máy cài SQL Server Express thường có tên instance SQLEXPRESS
DB_NAME=TourDuLich
DB_USER=sa
DB_PASSWORD=mat_khau_cua_tai_khoan_sa
```

Backend đăng nhập bằng tài khoản SQL Server (không dùng đăng nhập Windows), nên cần:

- Bật **SQL Server and Windows Authentication mode**: chuột phải vào server trong SSMS → **Properties → Security**, rồi khởi động lại dịch vụ SQL Server.
- Tài khoản `sa` (hoặc tài khoản khác) được bật và có mật khẩu: **Security → Logins → sa → Properties**.
- Dịch vụ **SQL Server Browser** đang chạy nếu `DB_SERVER` có tên instance.

Kiểm tra: chạy backend rồi mở <http://localhost:5000/api/health>. Nếu kết nối được, phần `data.database` sẽ có `"connected": true`. Nếu không, API trả mã 503 và terminal của backend in lý do lỗi (sai mật khẩu, sai tên server...).
