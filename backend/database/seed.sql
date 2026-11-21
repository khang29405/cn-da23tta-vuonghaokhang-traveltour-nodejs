
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

-- 8 tour mẫu (1 tour đang ẩn); tra mã danh mục theo tên. ORDER BY giữ thứ tự mã tour theo thu_tu.
-- Ảnh tour không có trong seed: tải lên ở trang quản trị (Tour → Sửa → Ảnh tour).
INSERT INTO TOUR (ten_tour, mo_ta_tong_quan, so_ngay, so_dem, gia, trang_thai_hien_thi,
                  ma_loai_tour, ma_diem_den, ma_diem_khoi_hanh, ma_phuong_tien)
SELECT v.ten_tour, v.mo_ta, v.so_ngay, v.so_dem, v.gia, v.hien_thi,
       lt.ma_loai_tour, dd.ma_diem_den, dkh.ma_diem_khoi_hanh, pt.ma_phuong_tien
FROM (VALUES
  (1, N'Phú Quốc 3 ngày 2 đêm: Nam đảo và cáp treo Hòn Thơm',
   N'Bay thẳng từ TP. Hồ Chí Minh, ở khách sạn 4 sao gần bãi Trường. Đi cano 3 đảo phía nam, lặn ngắm san hô, đi cáp treo Hòn Thơm và ngắm hoàng hôn ở Sunset Town.',
   3, 2, 4590000, 1, N'Biển đảo', N'Phú Quốc', N'TP. Hồ Chí Minh', N'Máy bay'),
  (2, N'Đà Lạt 3 ngày 2 đêm: Langbiang và đồi chè Cầu Đất',
   N'Xe giường nằm đón tại TP. Hồ Chí Minh. Lịch trình nhẹ nhàng: đồi chè Cầu Đất lúc bình minh, núi Langbiang bằng xe jeep, chợ đêm Đà Lạt.',
   3, 2, 2890000, 1, N'Nghỉ dưỡng', N'Đà Lạt', N'TP. Hồ Chí Minh', N'Ô tô'),
  (3, N'Sa Pa 3 ngày 2 đêm: chinh phục Fansipan',
   N'Khởi hành từ Hà Nội bằng xe limousine. Đi cáp treo lên đỉnh Fansipan, đi bộ qua bản Cát Cát, thung lũng Mường Hoa và ruộng bậc thang Tả Van.',
   3, 2, 3250000, 1, N'Núi rừng', N'Sa Pa', N'Hà Nội', N'Ô tô'),
  (4, N'Hạ Long 2 ngày 1 đêm: ngủ đêm trên du thuyền',
   N'Du thuyền 5 sao trên vịnh Hạ Long và Lan Hạ, chèo kayak, thăm hang Sửng Sốt, lớp học nấu ăn trên tàu. Xe đưa đón khứ hồi từ phố cổ Hà Nội.',
   2, 1, 3690000, 1, N'Nghỉ dưỡng', N'Hạ Long', N'Hà Nội', N'Ô tô'),
  (5, N'Hội An 3 ngày 2 đêm: phố cổ và ẩm thực xứ Quảng',
   N'Bay từ TP. Hồ Chí Minh đến Đà Nẵng. Đi chợ Hội An cùng đầu bếp, học làm cao lầu và bánh xèo, dạo phố cổ đêm thả đèn hoa đăng trên sông Hoài.',
   3, 2, 5290000, 1, N'Ẩm thực', N'Hội An', N'TP. Hồ Chí Minh', N'Máy bay'),
  (6, N'Huế 4 ngày 3 đêm: cố đô và nhã nhạc cung đình',
   N'Tàu hỏa giường nằm từ Hà Nội. Tham quan Đại Nội, lăng Tự Đức, lăng Khải Định, chùa Thiên Mụ; nghe nhã nhạc cung đình và đi thuyền rồng trên sông Hương.',
   4, 3, 3990000, 1, N'Văn hóa – lịch sử', N'Huế', N'Hà Nội', N'Tàu hỏa'),
  (7, N'Ninh Bình trong ngày: Tràng An và hang Múa',
   N'Xe đón tại Hà Nội buổi sáng, đi thuyền Tràng An qua các hang xuyên núi, leo 500 bậc đá lên đỉnh hang Múa, về Hà Nội buổi tối.',
   1, 0, 1190000, 1, N'Khám phá', N'Ninh Bình', N'Hà Nội', N'Ô tô'),
  (8, N'Nha Trang 4 ngày 3 đêm: vịnh Nha Trang và tắm bùn',
   N'Xe giường nằm từ Cần Thơ. Đi cano 4 đảo, lặn ngắm san hô Hòn Mun, tắm bùn khoáng nóng, tham quan tháp Bà Ponagar.',
   4, 3, 3490000, 0, N'Biển đảo', N'Nha Trang', N'Cần Thơ', N'Ô tô')
) AS v (thu_tu, ten_tour, mo_ta, so_ngay, so_dem, gia, hien_thi, ten_loai_tour, ten_diem_den, ten_diem_khoi_hanh, ten_phuong_tien)
JOIN LOAI_TOUR lt       ON lt.ten_loai_tour = v.ten_loai_tour
JOIN DIEM_DEN dd        ON dd.ten_diem_den = v.ten_diem_den
JOIN DIEM_KHOI_HANH dkh ON dkh.ten_diem_khoi_hanh = v.ten_diem_khoi_hanh
JOIN PHUONG_TIEN pt     ON pt.ten_phuong_tien = v.ten_phuong_tien
ORDER BY v.thu_tu;

INSERT INTO LICH_TRINH (ma_tour, ngay_thu, tieu_de, noi_dung_hoat_dong)
SELECT t.ma_tour, v.ngay_thu, v.tieu_de, v.noi_dung
FROM (VALUES
  (N'Phú Quốc 3 ngày 2 đêm: Nam đảo và cáp treo Hòn Thơm', 1, N'TP. Hồ Chí Minh – Phú Quốc',
   N'Bay đến Phú Quốc, nhận phòng khách sạn. Chiều tắm biển bãi Trường, tối dạo chợ đêm Dương Đông.'),
  (N'Phú Quốc 3 ngày 2 đêm: Nam đảo và cáp treo Hòn Thơm', 2, N'Cano 3 đảo và cáp treo Hòn Thơm',
   N'Đi cano tham quan hòn Móng Tay, hòn Gầm Ghì, lặn ngắm san hô. Chiều đi cáp treo Hòn Thơm, ngắm hoàng hôn ở Sunset Town.'),
  (N'Phú Quốc 3 ngày 2 đêm: Nam đảo và cáp treo Hòn Thơm', 3, N'Phú Quốc – TP. Hồ Chí Minh',
   N'Tham quan nhà thùng nước mắm, vườn tiêu. Trả phòng, ra sân bay về TP. Hồ Chí Minh.'),

  (N'Đà Lạt 3 ngày 2 đêm: Langbiang và đồi chè Cầu Đất', 1, N'TP. Hồ Chí Minh – Đà Lạt',
   N'Xe đón lúc 6 giờ sáng, đến Đà Lạt buổi chiều. Nhận phòng, tối dạo chợ đêm và hồ Xuân Hương.'),
  (N'Đà Lạt 3 ngày 2 đêm: Langbiang và đồi chè Cầu Đất', 2, N'Đồi chè Cầu Đất – núi Langbiang',
   N'Sáng sớm ngắm bình minh ở đồi chè Cầu Đất. Chiều đi xe jeep lên đỉnh Langbiang, thăm làng Cù Lần.'),
  (N'Đà Lạt 3 ngày 2 đêm: Langbiang và đồi chè Cầu Đất', 3, N'Đà Lạt – TP. Hồ Chí Minh',
   N'Tham quan ga Đà Lạt, mua đặc sản ở chợ Đà Lạt. Trưa lên xe về TP. Hồ Chí Minh.'),

  (N'Sa Pa 3 ngày 2 đêm: chinh phục Fansipan', 1, N'Hà Nội – Sa Pa – bản Cát Cát',
   N'Xe limousine đón tại Hà Nội, đến Sa Pa buổi trưa. Chiều đi bộ xuống bản Cát Cát, xem thác Tiên Sa.'),
  (N'Sa Pa 3 ngày 2 đêm: chinh phục Fansipan', 2, N'Đỉnh Fansipan',
   N'Đi tàu leo núi Mường Hoa và cáp treo lên đỉnh Fansipan 3.143 m. Tối tự do dạo nhà thờ đá Sa Pa.'),
  (N'Sa Pa 3 ngày 2 đêm: chinh phục Fansipan', 3, N'Tả Van – Hà Nội',
   N'Đi bộ qua thung lũng Mường Hoa và ruộng bậc thang bản Tả Van. Chiều lên xe về Hà Nội.'),

  (N'Hạ Long 2 ngày 1 đêm: ngủ đêm trên du thuyền', 1, N'Hà Nội – vịnh Hạ Long',
   N'Xe đón tại phố cổ, trưa lên du thuyền. Thăm hang Sửng Sốt, chèo kayak, tối học nấu ăn trên tàu.'),
  (N'Hạ Long 2 ngày 1 đêm: ngủ đêm trên du thuyền', 2, N'Vịnh Lan Hạ – Hà Nội',
   N'Tập thái cực quyền trên boong tàu, ăn sáng ngắm vịnh Lan Hạ. Trưa trả phòng, xe đưa về Hà Nội.'),

  (N'Hội An 3 ngày 2 đêm: phố cổ và ẩm thực xứ Quảng', 1, N'TP. Hồ Chí Minh – Đà Nẵng – Hội An',
   N'Bay đến Đà Nẵng, xe đưa về Hội An. Tối dạo phố cổ, thả đèn hoa đăng trên sông Hoài.'),
  (N'Hội An 3 ngày 2 đêm: phố cổ và ẩm thực xứ Quảng', 2, N'Đi chợ và lớp học nấu ăn',
   N'Đi chợ Hội An cùng đầu bếp, học làm cao lầu và bánh xèo. Chiều đạp xe qua làng rau Trà Quế.'),
  (N'Hội An 3 ngày 2 đêm: phố cổ và ẩm thực xứ Quảng', 3, N'Hội An – TP. Hồ Chí Minh',
   N'Ăn sáng mì Quảng, tham quan chùa Cầu. Trưa ra sân bay Đà Nẵng về TP. Hồ Chí Minh.'),

  (N'Huế 4 ngày 3 đêm: cố đô và nhã nhạc cung đình', 1, N'Hà Nội – Huế (tàu đêm)',
   N'Tối lên tàu hỏa giường nằm tại ga Hà Nội, nghỉ đêm trên tàu.'),
  (N'Huế 4 ngày 3 đêm: cố đô và nhã nhạc cung đình', 2, N'Đại Nội – chùa Thiên Mụ',
   N'Đến Huế buổi sáng, tham quan Đại Nội, chùa Thiên Mụ. Tối đi thuyền rồng nghe ca Huế trên sông Hương.'),
  (N'Huế 4 ngày 3 đêm: cố đô và nhã nhạc cung đình', 3, N'Lăng Tự Đức – lăng Khải Định',
   N'Tham quan lăng Tự Đức, lăng Khải Định, làng hương Thủy Xuân. Tối xem biểu diễn nhã nhạc cung đình.'),
  (N'Huế 4 ngày 3 đêm: cố đô và nhã nhạc cung đình', 4, N'Huế – Hà Nội',
   N'Mua đặc sản ở chợ Đông Ba. Chiều ra ga Huế lên tàu về Hà Nội, kết thúc tour.'),

  (N'Ninh Bình trong ngày: Tràng An và hang Múa', 1, N'Hà Nội – Tràng An – hang Múa – Hà Nội',
   N'Xe đón lúc 7 giờ 30. Sáng đi thuyền Tràng An, trưa ăn cơm cháy dê núi, chiều leo hang Múa. Về Hà Nội khoảng 19 giờ.'),

  (N'Nha Trang 4 ngày 3 đêm: vịnh Nha Trang và tắm bùn', 1, N'Cần Thơ – Nha Trang',
   N'Xe giường nằm khởi hành buổi tối, nghỉ đêm trên xe.'),
  (N'Nha Trang 4 ngày 3 đêm: vịnh Nha Trang và tắm bùn', 2, N'Tháp Bà Ponagar – tắm bùn',
   N'Đến Nha Trang, nhận phòng. Chiều tham quan tháp Bà Ponagar, tắm bùn khoáng nóng.'),
  (N'Nha Trang 4 ngày 3 đêm: vịnh Nha Trang và tắm bùn', 3, N'Cano 4 đảo',
   N'Đi cano tham quan Hòn Mun, Hòn Tằm, lặn ngắm san hô, ăn trưa hải sản trên bè.'),
  (N'Nha Trang 4 ngày 3 đêm: vịnh Nha Trang và tắm bùn', 4, N'Nha Trang – Cần Thơ',
   N'Mua hải sản khô ở chợ Đầm, trưa lên xe về Cần Thơ.')
) AS v (ten_tour, ngay_thu, tieu_de, noi_dung)
JOIN TOUR t ON t.ten_tour = v.ten_tour;

-- Ngày khởi hành tính từ ngày chạy seed (so_ngay_toi: số ngày kể từ hôm nay) để lịch luôn ở tương lai;
-- một lịch đã qua (số âm, đã khởi hành) để xem được mục "Đã qua". Chưa có đơn nên số chỗ còn lại = tổng số chỗ.
INSERT INTO LICH_KHOI_HANH (ma_tour, ngay_khoi_hanh, tong_so_cho, so_cho_con_lai, trang_thai)
SELECT t.ma_tour, DATEADD(DAY, v.so_ngay_toi, CAST(GETDATE() AS DATE)), v.tong_so_cho, v.tong_so_cho, v.trang_thai
FROM (VALUES
  (N'Phú Quốc 3 ngày 2 đêm: Nam đảo và cáp treo Hòn Thơm', -20, 30, 'da_khoi_hanh'),
  (N'Phú Quốc 3 ngày 2 đêm: Nam đảo và cáp treo Hòn Thơm', 10, 30, 'mo'),
  (N'Phú Quốc 3 ngày 2 đêm: Nam đảo và cáp treo Hòn Thơm', 24, 30, 'mo'),
  (N'Phú Quốc 3 ngày 2 đêm: Nam đảo và cáp treo Hòn Thơm', 45, 30, 'mo'),
  (N'Đà Lạt 3 ngày 2 đêm: Langbiang và đồi chè Cầu Đất', 7, 35, 'mo'),
  (N'Đà Lạt 3 ngày 2 đêm: Langbiang và đồi chè Cầu Đất', 21, 35, 'mo'),
  (N'Sa Pa 3 ngày 2 đêm: chinh phục Fansipan', 12, 20, 'mo'),
  (N'Sa Pa 3 ngày 2 đêm: chinh phục Fansipan', 33, 20, 'mo'),
  (N'Hạ Long 2 ngày 1 đêm: ngủ đêm trên du thuyền', 9, 24, 'mo'),
  (N'Hạ Long 2 ngày 1 đêm: ngủ đêm trên du thuyền', 16, 24, 'mo'),
  (N'Hạ Long 2 ngày 1 đêm: ngủ đêm trên du thuyền', 30, 24, 'da_huy'),
  (N'Hội An 3 ngày 2 đêm: phố cổ và ẩm thực xứ Quảng', 14, 25, 'mo'),
  (N'Hội An 3 ngày 2 đêm: phố cổ và ẩm thực xứ Quảng', 40, 25, 'mo'),
  (N'Huế 4 ngày 3 đêm: cố đô và nhã nhạc cung đình', 18, 30, 'mo'),
  (N'Ninh Bình trong ngày: Tràng An và hang Múa', 3, 40, 'mo'),
  (N'Ninh Bình trong ngày: Tràng An và hang Múa', 10, 40, 'mo'),
  (N'Ninh Bình trong ngày: Tràng An và hang Múa', 17, 40, 'mo'),
  (N'Nha Trang 4 ngày 3 đêm: vịnh Nha Trang và tắm bùn', 28, 30, 'mo')
) AS v (ten_tour, so_ngay_toi, tong_so_cho, trang_thai)
JOIN TOUR t ON t.ten_tour = v.ten_tour;
GO

PRINT N'Đã thêm dữ liệu mẫu (8 tour, lịch trình, lịch khởi hành). Tài khoản mẫu: quantri@traveltour.vn, nhanvien@traveltour.vn, khachhang@gmail.com (mật khẩu: Matkhau@123).';
