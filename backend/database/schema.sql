
IF DB_ID(N'TourDuLich') IS NULL
  CREATE DATABASE TourDuLich COLLATE Vietnamese_CI_AS;
GO

USE TourDuLich;
GO

-- Xóa bảng con trước, bảng cha sau (ngược thứ tự khóa ngoại)
DROP TABLE IF EXISTS
  YEU_THICH, DANH_GIA, THANH_TOAN, DON_DAT_TOUR, LICH_KHOI_HANH,
  ANH_TOUR, LICH_TRINH, TOUR, LOAI_TOUR, PHUONG_TIEN,
  DIEM_KHOI_HANH, DIEM_DEN, NGUOI_DUNG, VAI_TRO;
GO

/* ========== Tài khoản ========== */

CREATE TABLE VAI_TRO (
  ma_vai_tro  INT IDENTITY(1, 1) CONSTRAINT PK_VAI_TRO PRIMARY KEY,
  ten_vai_tro VARCHAR(20) NOT NULL
    CONSTRAINT UQ_VAI_TRO_ten UNIQUE
    CONSTRAINT CK_VAI_TRO_ten CHECK (ten_vai_tro IN ('khach_hang', 'nhan_vien', 'quan_tri'))
);

CREATE TABLE NGUOI_DUNG (
  ma_nguoi_dung        INT IDENTITY(1, 1) CONSTRAINT PK_NGUOI_DUNG PRIMARY KEY,
  ho_ten               NVARCHAR(100) NOT NULL,
  email                VARCHAR(100)  NOT NULL CONSTRAINT UQ_NGUOI_DUNG_email UNIQUE,
  mat_khau             VARCHAR(255)  NOT NULL, -- chỉ lưu mã băm bcrypt
  so_dien_thoai        VARCHAR(15)   NULL,
  dia_chi              NVARCHAR(255) NULL,
  trang_thai_tai_khoan VARCHAR(20)   NOT NULL
    CONSTRAINT DF_NGUOI_DUNG_trang_thai DEFAULT 'hoat_dong'
    CONSTRAINT CK_NGUOI_DUNG_trang_thai CHECK (trang_thai_tai_khoan IN ('hoat_dong', 'bi_khoa')),
  ngay_tao             DATETIME2 NOT NULL CONSTRAINT DF_NGUOI_DUNG_ngay_tao DEFAULT SYSDATETIME(),
  ma_vai_tro           INT NOT NULL
    CONSTRAINT FK_NGUOI_DUNG_VAI_TRO REFERENCES VAI_TRO (ma_vai_tro)
);

/* ========== Danh mục ========== */

CREATE TABLE DIEM_DEN (
  ma_diem_den  INT IDENTITY(1, 1) CONSTRAINT PK_DIEM_DEN PRIMARY KEY,
  ten_diem_den NVARCHAR(100) NOT NULL CONSTRAINT UQ_DIEM_DEN_ten UNIQUE,
  tinh_thanh   NVARCHAR(100) NOT NULL,
  mo_ta_ngan   NVARCHAR(500) NULL
);

CREATE TABLE DIEM_KHOI_HANH (
  ma_diem_khoi_hanh  INT IDENTITY(1, 1) CONSTRAINT PK_DIEM_KHOI_HANH PRIMARY KEY,
  ten_diem_khoi_hanh NVARCHAR(100) NOT NULL CONSTRAINT UQ_DIEM_KHOI_HANH_ten UNIQUE,
  tinh_thanh         NVARCHAR(100) NOT NULL
);

CREATE TABLE PHUONG_TIEN (
  ma_phuong_tien  INT IDENTITY(1, 1) CONSTRAINT PK_PHUONG_TIEN PRIMARY KEY,
  ten_phuong_tien NVARCHAR(50) NOT NULL CONSTRAINT UQ_PHUONG_TIEN_ten UNIQUE
);

CREATE TABLE LOAI_TOUR (
  ma_loai_tour  INT IDENTITY(1, 1) CONSTRAINT PK_LOAI_TOUR PRIMARY KEY,
  ten_loai_tour NVARCHAR(100) NOT NULL CONSTRAINT UQ_LOAI_TOUR_ten UNIQUE,
  mo_ta_ngan    NVARCHAR(500) NULL
);

/* ========== Tour ========== */

CREATE TABLE TOUR (
  ma_tour             INT IDENTITY(1, 1) CONSTRAINT PK_TOUR PRIMARY KEY,
  ten_tour            NVARCHAR(200) NOT NULL,
  mo_ta_tong_quan     NVARCHAR(MAX) NULL,
  so_ngay             INT NOT NULL CONSTRAINT CK_TOUR_so_ngay CHECK (so_ngay >= 1),
  so_dem              INT NOT NULL CONSTRAINT CK_TOUR_so_dem CHECK (so_dem >= 0),
  gia                 DECIMAL(12, 0) NOT NULL CONSTRAINT CK_TOUR_gia CHECK (gia > 0),
  trang_thai_hien_thi BIT NOT NULL CONSTRAINT DF_TOUR_hien_thi DEFAULT 1, -- 1 = hiện, 0 = ẩn
  ngay_tao            DATETIME2 NOT NULL CONSTRAINT DF_TOUR_ngay_tao DEFAULT SYSDATETIME(),
  ma_loai_tour        INT NOT NULL CONSTRAINT FK_TOUR_LOAI_TOUR REFERENCES LOAI_TOUR (ma_loai_tour),
  ma_diem_den         INT NOT NULL CONSTRAINT FK_TOUR_DIEM_DEN REFERENCES DIEM_DEN (ma_diem_den),
  ma_diem_khoi_hanh   INT NOT NULL CONSTRAINT FK_TOUR_DIEM_KHOI_HANH REFERENCES DIEM_KHOI_HANH (ma_diem_khoi_hanh),
  ma_phuong_tien      INT NOT NULL CONSTRAINT FK_TOUR_PHUONG_TIEN REFERENCES PHUONG_TIEN (ma_phuong_tien)
);

CREATE TABLE LICH_TRINH (
  ma_lich_trinh      INT IDENTITY(1, 1) CONSTRAINT PK_LICH_TRINH PRIMARY KEY,
  ngay_thu           INT NOT NULL CONSTRAINT CK_LICH_TRINH_ngay_thu CHECK (ngay_thu >= 1),
  tieu_de            NVARCHAR(200) NOT NULL,
  noi_dung_hoat_dong NVARCHAR(MAX) NULL,
  ma_tour            INT NOT NULL CONSTRAINT FK_LICH_TRINH_TOUR REFERENCES TOUR (ma_tour),
  -- Mỗi ngày của một tour chỉ có một dòng lịch trình
  CONSTRAINT UQ_LICH_TRINH_tour_ngay UNIQUE (ma_tour, ngay_thu)
);

CREATE TABLE ANH_TOUR (
  ma_anh           INT IDENTITY(1, 1) CONSTRAINT PK_ANH_TOUR PRIMARY KEY,
  duong_dan_anh    VARCHAR(255) NOT NULL, -- ví dụ: /uploads/tour-1-1712345678.jpg
  la_anh_dai_dien  BIT NOT NULL CONSTRAINT DF_ANH_TOUR_dai_dien DEFAULT 0,
  thu_tu_hien_thi  INT NOT NULL CONSTRAINT DF_ANH_TOUR_thu_tu DEFAULT 0,
  ma_tour          INT NOT NULL CONSTRAINT FK_ANH_TOUR_TOUR REFERENCES TOUR (ma_tour)
);

CREATE TABLE LICH_KHOI_HANH (
  ma_lich_khoi_hanh INT IDENTITY(1, 1) CONSTRAINT PK_LICH_KHOI_HANH PRIMARY KEY,
  ngay_khoi_hanh    DATE NOT NULL,
  tong_so_cho       INT NOT NULL CONSTRAINT CK_LICH_KHOI_HANH_tong_cho CHECK (tong_so_cho > 0),
  so_cho_con_lai    INT NOT NULL,
  trang_thai        VARCHAR(20) NOT NULL
    CONSTRAINT DF_LICH_KHOI_HANH_trang_thai DEFAULT 'mo'
    CONSTRAINT CK_LICH_KHOI_HANH_trang_thai CHECK (trang_thai IN ('mo', 'het_cho', 'da_khoi_hanh', 'da_huy')),
  ma_tour           INT NOT NULL CONSTRAINT FK_LICH_KHOI_HANH_TOUR REFERENCES TOUR (ma_tour),
  CONSTRAINT CK_LICH_KHOI_HANH_con_lai CHECK (so_cho_con_lai BETWEEN 0 AND tong_so_cho)
);

/* ========== Đặt tour ========== */

CREATE TABLE DON_DAT_TOUR (
  ma_don                INT IDENTITY(1, 1) CONSTRAINT PK_DON_DAT_TOUR PRIMARY KEY,
  ngay_dat              DATETIME2 NOT NULL CONSTRAINT DF_DON_DAT_TOUR_ngay_dat DEFAULT SYSDATETIME(),
  so_luong_khach        INT NOT NULL CONSTRAINT CK_DON_DAT_TOUR_so_khach CHECK (so_luong_khach >= 1),
  don_gia               DECIMAL(12, 0) NOT NULL CONSTRAINT CK_DON_DAT_TOUR_don_gia CHECK (don_gia > 0), -- giá tour lúc đặt
  tong_tien             DECIMAL(12, 0) NOT NULL CONSTRAINT CK_DON_DAT_TOUR_tong_tien CHECK (tong_tien > 0),
  trang_thai_don        VARCHAR(20) NOT NULL
    CONSTRAINT DF_DON_DAT_TOUR_trang_thai DEFAULT 'cho_xac_nhan'
    CONSTRAINT CK_DON_DAT_TOUR_trang_thai CHECK (trang_thai_don IN ('cho_xac_nhan', 'da_xac_nhan', 'da_huy', 'hoan_tat')),
  ho_ten_lien_he        NVARCHAR(100) NOT NULL,
  so_dien_thoai_lien_he VARCHAR(15)   NOT NULL,
  ghi_chu               NVARCHAR(500) NULL,
  ngay_huy              DATETIME2 NULL,
  ma_lich_khoi_hanh     INT NOT NULL CONSTRAINT FK_DON_DAT_TOUR_LICH REFERENCES LICH_KHOI_HANH (ma_lich_khoi_hanh),
  ma_khach_hang         INT NOT NULL CONSTRAINT FK_DON_DAT_TOUR_KHACH REFERENCES NGUOI_DUNG (ma_nguoi_dung),
  -- Nhân viên xử lý đơn; NULL khi đơn chưa có ai xử lý
  ma_nhan_vien          INT NULL CONSTRAINT FK_DON_DAT_TOUR_NHAN_VIEN REFERENCES NGUOI_DUNG (ma_nguoi_dung)
);

CREATE TABLE THANH_TOAN (
  ma_thanh_toan         INT IDENTITY(1, 1) CONSTRAINT PK_THANH_TOAN PRIMARY KEY,
  phuong_thuc           NVARCHAR(50) NOT NULL, -- ví dụ: Tiền mặt, Chuyển khoản
  so_tien               DECIMAL(12, 0) NOT NULL CONSTRAINT CK_THANH_TOAN_so_tien CHECK (so_tien > 0),
  trang_thai_thanh_toan VARCHAR(20) NOT NULL
    CONSTRAINT DF_THANH_TOAN_trang_thai DEFAULT 'chua_thanh_toan'
    CONSTRAINT CK_THANH_TOAN_trang_thai CHECK (trang_thai_thanh_toan IN ('chua_thanh_toan', 'da_dat_coc', 'da_thanh_toan')),
  ngay_ghi_nhan         DATETIME2 NOT NULL CONSTRAINT DF_THANH_TOAN_ngay DEFAULT SYSDATETIME(),
  ma_don                INT NOT NULL CONSTRAINT FK_THANH_TOAN_DON REFERENCES DON_DAT_TOUR (ma_don)
);

/* ========== Chức năng mở rộng: đánh giá, yêu thích ========== */

-- Đánh giá gắn với đơn (không gắn trực tiếp với tour): mỗi đơn tối đa một đánh giá
CREATE TABLE DANH_GIA (
  ma_danh_gia         INT IDENTITY(1, 1) CONSTRAINT PK_DANH_GIA PRIMARY KEY,
  so_sao              TINYINT NOT NULL CONSTRAINT CK_DANH_GIA_so_sao CHECK (so_sao BETWEEN 1 AND 5),
  noi_dung            NVARCHAR(1000) NULL,
  ngay_danh_gia       DATETIME2 NOT NULL CONSTRAINT DF_DANH_GIA_ngay DEFAULT SYSDATETIME(),
  trang_thai_hien_thi BIT NOT NULL CONSTRAINT DF_DANH_GIA_hien_thi DEFAULT 1, -- 1 = hiện, 0 = ẩn
  ma_don              INT NOT NULL
    CONSTRAINT UQ_DANH_GIA_don UNIQUE
    CONSTRAINT FK_DANH_GIA_DON REFERENCES DON_DAT_TOUR (ma_don)
);

CREATE TABLE YEU_THICH (
  ma_yeu_thich  INT IDENTITY(1, 1) CONSTRAINT PK_YEU_THICH PRIMARY KEY,
  ngay_them     DATETIME2 NOT NULL CONSTRAINT DF_YEU_THICH_ngay DEFAULT SYSDATETIME(),
  ma_nguoi_dung INT NOT NULL CONSTRAINT FK_YEU_THICH_NGUOI_DUNG REFERENCES NGUOI_DUNG (ma_nguoi_dung),
  ma_tour       INT NOT NULL CONSTRAINT FK_YEU_THICH_TOUR REFERENCES TOUR (ma_tour),
  CONSTRAINT UQ_YEU_THICH_nguoi_tour UNIQUE (ma_nguoi_dung, ma_tour)
);
GO

PRINT N'Đã tạo xong 14 bảng. Tiếp theo: chạy seed.sql.';
