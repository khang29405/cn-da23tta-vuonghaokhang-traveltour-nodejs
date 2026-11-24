import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation, faRotateRight, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import TourCard, { TourCardSkeleton } from '../../components/TourCard/TourCard.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import { getTours } from '../../api/publicTourApi.js';
import { getErrorMessage } from '../../api/axiosClient.js';
import './ToursPage.css';

const PAGE_SIZE = 12;

const parsePage = (value) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

// Bước 19 thêm thanh tìm kiếm, bộ lọc, sắp xếp và đọc keyword/departurePoint/departureFrom trên URL
const ToursPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get('page'));
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
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
      const result = await getTours({ page, limit: PAGE_SIZE });
      if (requestId !== latestRequest.current) return;
      setData(result);
      // Backend đưa số trang vượt quá về trang cuối
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

  const changePage = (nextPage) => {
    goToPage(nextPage);
    window.scrollTo({ top: 0 });
  };

  const tours = data?.items ?? [];

  const renderContent = () => {
    if (loadError) {
      return (
        <div className="alert alert--error tours-page__error" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} />
          <span>Không tải được danh sách tour. {loadError}</span>
          <button type="button" className="btn btn--outline btn--sm" onClick={loadTours}>
            <FontAwesomeIcon icon={faRotateRight} />
            Thử lại
          </button>
        </div>
      );
    }

    if (!data) {
      return (
        <ul className="tours-page__grid" aria-busy="true" aria-label="Đang tải danh sách tour">
          {Array.from({ length: 8 }, (_, index) => (
            <li key={index}>
              <TourCardSkeleton />
            </li>
          ))}
        </ul>
      );
    }

    if (tours.length === 0) {
      return <p className="tours-page__empty">Hiện chưa có tour nào đang mở bán. Mời bạn quay lại sau.</p>;
    }

    return (
      <>
        <ul className={`tours-page__grid${isLoading ? ' tours-page__grid--loading' : ''}`} aria-busy={isLoading}>
          {tours.map((tour) => (
            <li key={tour.ma_tour}>
              <TourCard tour={tour} />
            </li>
          ))}
        </ul>
        <Pagination pagination={data.pagination} itemLabel="tour" onPageChange={changePage} disabled={isLoading} />
      </>
    );
  };

  return (
    <div className="container tours-page">
      <nav className="breadcrumb" aria-label="Đường dẫn">
        <Link to="/">Trang chủ</Link>
        <FontAwesomeIcon icon={faChevronRight} />
        <span aria-current="page">Tour du lịch</span>
      </nav>

      <header className="tours-page__header">
        <h1 className="tours-page__title">Tour du lịch trong nước</h1>
        <p className="tours-page__subtitle">Tour có lịch khởi hành còn chỗ gần nhất được xếp trước.</p>
      </header>

      {renderContent()}
    </div>
  );
};

export default ToursPage;
