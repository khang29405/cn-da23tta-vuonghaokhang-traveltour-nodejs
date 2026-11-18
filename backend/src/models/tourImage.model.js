import { sql, getPool } from '../config/db.js';

// Bảng ANH_TOUR. Hàm ghi nhận `transaction` từ service khi cần; không truyền thì chạy thẳng trên pool.

const createRequest = async (transaction) => new sql.Request(transaction ?? (await getPool()));

// Chỉ tìm ảnh thuộc đúng tour trên đường dẫn
export const findImage = async (tourId, imageId) => {
  const request = await createRequest();
  const result = await request
    .input('tourId', sql.Int, tourId)
    .input('imageId', sql.Int, imageId)
    .query(`SELECT ma_anh, duong_dan_anh, la_anh_dai_dien, thu_tu_hien_thi
            FROM ANH_TOUR WHERE ma_anh = @imageId AND ma_tour = @tourId`);
  return result.recordset[0] ?? null;
};

// Ảnh mới xếp cuối; nếu tour chưa có ảnh đại diện thì ảnh này thành ảnh đại diện
export const insertImage = async (tourId, duongDanAnh, transaction) => {
  const request = await createRequest(transaction);
  await request
    .input('tourId', sql.Int, tourId)
    .input('duongDan', sql.VarChar(255), duongDanAnh).query(`
      INSERT INTO ANH_TOUR (duong_dan_anh, la_anh_dai_dien, thu_tu_hien_thi, ma_tour)
      SELECT @duongDan,
        CASE WHEN EXISTS (SELECT 1 FROM ANH_TOUR WHERE ma_tour = @tourId AND la_anh_dai_dien = 1) THEN 0 ELSE 1 END,
        ISNULL((SELECT MAX(thu_tu_hien_thi) FROM ANH_TOUR WHERE ma_tour = @tourId), 0) + 1,
        @tourId`);
};

// Một câu lệnh: bật ảnh được chọn và tắt mọi ảnh khác của tour, nên tour luôn chỉ có một ảnh đại diện
export const setCoverImage = async (tourId, imageId) => {
  const request = await createRequest();
  await request
    .input('tourId', sql.Int, tourId)
    .input('imageId', sql.Int, imageId)
    .query(`UPDATE ANH_TOUR
            SET la_anh_dai_dien = CASE WHEN ma_anh = @imageId THEN 1 ELSE 0 END
            WHERE ma_tour = @tourId`);
};

export const deleteImage = async (imageId, transaction) => {
  const request = await createRequest(transaction);
  await request.input('imageId', sql.Int, imageId).query('DELETE FROM ANH_TOUR WHERE ma_anh = @imageId');
};

// Dùng sau khi xóa ảnh đại diện: ảnh đứng đầu trong các ảnh còn lại thành ảnh đại diện mới
export const promoteFirstImageToCover = async (tourId, transaction) => {
  const request = await createRequest(transaction);
  await request.input('tourId', sql.Int, tourId).query(`
    UPDATE ANH_TOUR SET la_anh_dai_dien = 1
    WHERE ma_anh = (SELECT TOP 1 ma_anh FROM ANH_TOUR WHERE ma_tour = @tourId ORDER BY thu_tu_hien_thi, ma_anh)`);
};
