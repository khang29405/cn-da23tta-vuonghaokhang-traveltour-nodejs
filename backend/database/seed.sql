
USE TourDuLich;
GO

SET NOCOUNT ON;

INSERT INTO VAI_TRO (ten_vai_tro) VALUES
  ('khach_hang'),
  ('nhan_vien'),
  ('quan_tri');

-- Tra mã vai trò theo tên để không phụ thuộc giá trị IDENTITY
INSERT INTO NGUOI_DUNG (ho_ten, email, mat_khau, so_dien_thoai, dia_chi, ma_vai_tro)
SELECT tk.ho_ten, tk.email, tk.mat_khau, tk.so_dien_thoai, tk.dia_chi, vt.ma_vai_tro
FROM (VALUES
  (N'Trần Minh Quân', 'quantri@traveltour.vn',
   '$2b$10$0n2JJjw61fd1tAD2/ZI0rOLRXY51IkJLWf0SReXq3Ez9bd0d88lsO',
   '0901000001', N'Phường Trà Vinh, Tỉnh Vĩnh Long', 'quan_tri'),
  (N'Lê Thị Ngọc Hân', 'nhanvien@traveltour.vn',
   '$2b$10$ABSM2Cdej20kpr7DazBNLukrgftEPqYjGz/n6r/OyfRDyodiDgjPm',
   '0901000002', N'Phường Trà Vinh, Tỉnh Vĩnh Long', 'nhan_vien'),
  (N'Phạm Gia Bảo', 'khachhang@gmail.com',
   '$2b$10$fgBDX4yZ4RT2rNompiO4.us3NmhsBQDrMXec1SePgnWZ7rsABsTfC',
   '0901000003', N'Phường Ninh Kiều, TP. Cần Thơ', 'khach_hang')
) AS tk (ho_ten, email, mat_khau, so_dien_thoai, dia_chi, ten_vai_tro)
JOIN VAI_TRO vt ON vt.ten_vai_tro = tk.ten_vai_tro;

INSERT INTO DIEM_DEN (ten_diem_den, tinh_thanh, mo_ta_ngan) VALUES
  (N'Phú Quốc',  N'An Giang',        N'Đảo ngọc với biển xanh, cát trắng và hoàng hôn ở Dinh Cậu.'),
  (N'Đà Lạt',    N'Lâm Đồng',        N'Thành phố ngàn hoa trên cao nguyên, khí hậu mát quanh năm.'),
  (N'Sa Pa',     N'Lào Cai',         N'Thị trấn trong sương, ruộng bậc thang và đỉnh Fansipan.'),
  (N'Hạ Long',   N'Quảng Ninh',      N'Vịnh di sản với hàng nghìn đảo đá vôi, du thuyền ngủ đêm.'),
  (N'Hội An',    N'Đà Nẵng',         N'Phố cổ đèn lồng bên sông Hoài, ẩm thực và làng nghề.'),
  (N'Nha Trang', N'Khánh Hòa',       N'Thành phố biển với vịnh đẹp, lặn ngắm san hô và tắm bùn.'),
  (N'Huế',       N'Huế',             N'Cố đô với Đại Nội, lăng tẩm và nhã nhạc cung đình.'),
  (N'Ninh Bình', N'Ninh Bình',       N'Tràng An, Tam Cốc với núi đá vôi và đi thuyền trong hang.'),
  (N'Côn Đảo',   N'TP. Hồ Chí Minh', N'Quần đảo hoang sơ, di tích lịch sử và mùa rùa đẻ trứng.');

-- Tên điểm khởi hành khớp với ô "Khởi hành từ" ở trang chủ
INSERT INTO DIEM_KHOI_HANH (ten_diem_khoi_hanh, tinh_thanh) VALUES
  (N'TP. Hồ Chí Minh', N'TP. Hồ Chí Minh'),
  (N'Hà Nội',          N'Hà Nội'),
  (N'Đà Nẵng',         N'Đà Nẵng'),
  (N'Cần Thơ',         N'Cần Thơ');

INSERT INTO PHUONG_TIEN (ten_phuong_tien) VALUES
  (N'Máy bay'),
  (N'Ô tô'),
  (N'Tàu hỏa');

-- Tên loại tour khớp với bảng màu/icon ở frontend (src/config/tourTypeStyles.js, Bước 16)
INSERT INTO LOAI_TOUR (ten_loai_tour, mo_ta_ngan) VALUES
  (N'Biển đảo',          N'Tắm biển, lặn ngắm san hô, khám phá các đảo.'),
  (N'Núi rừng',          N'Trekking, săn mây, ngắm ruộng bậc thang và bản làng.'),
  (N'Văn hóa – lịch sử', N'Di tích, phố cổ, bảo tàng và lễ hội truyền thống.'),
  (N'Nghỉ dưỡng',        N'Khu nghỉ dưỡng, lịch trình nhẹ nhàng, nhiều thời gian thư giãn.'),
  (N'Ẩm thực',           N'Chợ địa phương, đặc sản vùng miền, lớp học nấu ăn.'),
  (N'Khám phá',          N'Hang động, cung đường mới, trải nghiệm mạo hiểm.');
GO

PRINT N'Đã thêm dữ liệu mẫu. Tài khoản mẫu: quantri@traveltour.vn, nhanvien@traveltour.vn, khachhang@gmail.com (mật khẩu: Matkhau@123).';
