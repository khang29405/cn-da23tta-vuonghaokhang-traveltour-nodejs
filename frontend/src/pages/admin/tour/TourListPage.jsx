import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faCircleExclamation,
  faImage,
  faPen,
  faPlus,
  faRotateRight,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog.jsx';
import Pagination from '../../../components/Pagination/Pagination.jsx';
import { getAdminTours, deleteTour } from '../../../api/tourApi.js';
import { getErrorMessage } from '../../../api/axiosClient.js';
import { useFlashNotice } from '../../../hooks/useFlashNotice.js';
import { formatDuration, formatPrice } from '../../../utils/format.js';
import { toAssetUrl } from '../../../utils/assetUrl.js';
import { ADMIN_PATH } from '../../../config/roles.js';
import './TourListPage.css';

const TOUR_PATH = `${ADMIN_PATH}/tour`;
const COLUMN_COUNT = 8;

const parsePage = (value) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const TourListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get('page'));

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useFlashNotice();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const latestRequest = useRef(0);

  const goToPage = useCallback(
    (nextPage, options) =>
      setSearchParams((current) => {
        if (nextPage > 1) current.set('page', nextPage);
        else current.delete('page');
        return current;
      }, options),
    [setSearchParams],
  );

  const loadTours = useCallback(async () => {
    // Bấm chuyển trang liên tục: chỉ nhận kết quả của lần gọi mới nhất
    const requestId = ++latestRequest.current;
    setIsLoading(true);
    setLoadError('');
    try {
      const result = await getAdminTours({ page });
      if (requestId !== latestRequest.current) return;
      setData(result);
      // Backend đưa số trang vượt quá về trang cuối (ví dụ vừa xóa tour cuối cùng của trang cuối)
      if (result.pagination.page !== page) goToPage(result.pagination.page, { replace: true });
    } catch (error) {
      if (requestId === latestRequest.current) setLoadError(getErrorMessage(error));
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  }, [page, goToPage]);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  const openDelete = (tour) => {
    setNotice(null);
    setDeleteTarget(tour);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTour(deleteTarget.ma_tour);
      setNotice({ type: 'success', text: `Đã xóa tour "${deleteTarget.ten_tour}".` });
      await loadTours();
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const tours = data?.items ?? [];

  const renderTableBody = () => {
    if (tours.length === 0) {
      return (
        <tr>
          <td colSpan={COLUMN_COUNT} className="tour-table__empty">
            {isLoading ? 'Đang tải danh sách...' : 'Chưa có tour nào. Bấm "Thêm tour" để tạo tour đầu tiên.'}
          </td>
        </tr>
      );
    }
    return tours.map((tour) => (
      <tr key={tour.ma_tour}>
        <td className="tour-table__tour">
          <div className="tour-table__tour-inner">
            {tour.anh_dai_dien ? (
              <img src={toAssetUrl(tour.anh_dai_dien)} alt="" className="tour-table__thumb" loading="lazy" />
            ) : (
              <span className="tour-table__thumb tour-table__thumb--empty" title="Chưa có ảnh">
                <FontAwesomeIcon icon={faImage} />
              </span>
            )}
            <div>
              <Link to={`${TOUR_PATH}/${tour.ma_tour}`} className="tour-table__name">
                {tour.ten_tour}
              </Link>
              <span className="tour-table__meta">
                #{tour.ma_tour} · {formatDuration(tour.so_ngay, tour.so_dem)}
              </span>
            </div>
          </div>
        </td>
        <td>{tour.ten_loai_tour}</td>
        <td>{tour.ten_diem_den}</td>
        <td>{tour.ten_diem_khoi_hanh}</td>
        <td>{tour.ten_phuong_tien}</td>
        <td className="tour-table__price">{formatPrice(tour.gia)}</td>
        <td>
          <span className={`status-badge status-badge--${tour.trang_thai_hien_thi ? 'visible' : 'hidden'}`}>
            {tour.trang_thai_hien_thi ? 'Đang hiển thị' : 'Đang ẩn'}
          </span>
        </td>
        <td className="tour-table__actions-cell">
          <div className="tour-table__actions">
            <Link
              to={`${TOUR_PATH}/${tour.ma_tour}`}
              className="btn btn--outline btn--sm"
              aria-label={`Sửa ${tour.ten_tour}`}
            >
              <FontAwesomeIcon icon={faPen} />
              <span className="tour-table__action-text">Sửa</span>
            </Link>
            <button
              type="button"
              className="btn btn--outline btn--sm tour-table__delete"
              onClick={() => openDelete(tour)}
              aria-label={`Xóa ${tour.ten_tour}`}
            >
              <FontAwesomeIcon icon={faTrashCan} />
              <span className="tour-table__action-text">Xóa</span>
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <>
      <div className="tour-list__toolbar">
        <h1 className="dashboard-page__title tour-list__title">
          Tour <span className="tour-list__count">{data ? `(${data.pagination.total})` : ''}</span>
        </h1>
        <div className="tour-list__toolbar-actions">
          <button type="button" className="btn btn--outline btn--sm" onClick={loadTours} disabled={isLoading}>
            <FontAwesomeIcon icon={faRotateRight} />
            <span className="tour-list__toolbar-text">Tải lại</span>
          </button>
          <Link to={`${TOUR_PATH}/them`} className="btn btn--primary btn--sm">
            <FontAwesomeIcon icon={faPlus} />
            Thêm tour
          </Link>
        </div>
      </div>

      {notice && (
        <p className={`alert alert--${notice.type} tour-list__notice`} role={notice.type === 'error' ? 'alert' : 'status'}>
          <FontAwesomeIcon icon={notice.type === 'error' ? faCircleExclamation : faCircleCheck} />
          {notice.text}
        </p>
      )}

      {loadError ? (
        <p className="alert alert--error" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} />
          {loadError}
        </p>
      ) : (
        <>
          <div className={`tour-table__wrapper${isLoading && tours.length > 0 ? ' tour-table__wrapper--loading' : ''}`}>
            <table className="tour-table">
              <thead>
                <tr>
                  <th scope="col">Tour</th>
                  <th scope="col">Loại tour</th>
                  <th scope="col">Điểm đến</th>
                  <th scope="col">Khởi hành từ</th>
                  <th scope="col">Phương tiện</th>
                  <th scope="col" className="tour-table__price">
                    Giá / khách
                  </th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col" className="tour-table__actions-cell">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>{renderTableBody()}</tbody>
            </table>
          </div>
          {data && (
            <Pagination pagination={data.pagination} itemLabel="tour" onPageChange={goToPage} disabled={isLoading} />
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa tour?"
        message={
          deleteTarget &&
          `Tour "${deleteTarget.ten_tour}" sẽ bị xóa vĩnh viễn cùng lịch trình và ảnh. Tour đã có lịch khởi hành thì không xóa được, khi đó hãy sửa tour và bỏ chọn "Hiển thị trên website".`
        }
        confirmLabel="Xóa tour"
        danger
        isProcessing={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default TourListPage;
