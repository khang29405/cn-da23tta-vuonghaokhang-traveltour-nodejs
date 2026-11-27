import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faClock,
  faLocationDot,
  faFlag,
  faCalendarDays,
  faCircleExclamation,
  faRotateRight,
  faPhone,
} from '@fortawesome/free-solid-svg-icons';
import TourGallery from './TourGallery.jsx';
import TourImage from '../../components/TourImage/TourImage.jsx';
import { getTour } from '../../api/publicTourApi.js';
import { getErrorMessage } from '../../api/axiosClient.js';
import { getTourTypeStyle, tourTypeCssVars } from '../../config/tourTypeStyles.js';
import { getTransportIcon } from '../../config/transportIcons.js';
import siteInfo from '../../config/siteInfo.js';
import { bookingPath } from '../../config/booking.js';
import { ROLES } from '../../config/roles.js';
import { useAuth } from '../../context/authContext.js';
import { FEW_SEATS } from '../../components/TourCard/TourCard.jsx';
import { addDays, formatDateOnly, formatDuration, formatPrice, formatWeekday } from '../../utils/format.js';
import './TourDetailPage.css';

const hotlineHref = `tel:${siteInfo.hotline.replace(/\s/g, '')}`;

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const DateCell = ({ date }) => (
  <>
    <span className="departure-list__date">{formatDateOnly(date)}</span>
    <span className="departure-list__weekday">{formatWeekday(date)}</span>
  </>
);

// Giá giống nhau ở mọi lịch (giá theo tour) nên bảng không lặp cột giá; ngày về = ngày đi + (số ngày - 1),
// tour trong ngày thì không cần cột ngày về
const DepartureTable = ({ departures, days, tourId, canBook }) => {
  const hasReturnDate = days > 1;
  if (departures.length === 0) {
    return (
      <p className="tour-detail__empty">
        Tour hiện chưa có lịch khởi hành còn chỗ. Gọi <a href={hotlineHref}>{siteInfo.hotline}</a> để được tư vấn lịch
        mới.
      </p>
    );
  }

  return (
    <div className="departure-list">
      <table className="departure-list__table">
        <thead>
          <tr>
            <th scope="col">Ngày đi</th>
            {hasReturnDate && <th scope="col">Ngày về</th>}
            <th scope="col" className="departure-list__seats-col">
              Chỗ trống
            </th>
            {canBook && (
              <th scope="col" className="departure-list__action-col">
                <span className="visually-hidden">Đặt tour</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {departures.map((departure) => (
            <tr key={departure.ma_lich_khoi_hanh}>
              <td>
                <DateCell date={departure.ngay_khoi_hanh} />
              </td>
              {hasReturnDate && (
                <td>
                  <DateCell date={addDays(departure.ngay_khoi_hanh, days - 1)} />
                </td>
              )}
              <td className="departure-list__seats-col">
                <span
                  className={`departure-list__seats${departure.so_cho_con_lai <= FEW_SEATS ? ' departure-list__seats--few' : ''}`}
                >
                  {departure.so_cho_con_lai} chỗ
                </span>
                <span className="departure-list__total">trên {departure.tong_so_cho} chỗ</span>
              </td>
              {canBook && (
                <td className="departure-list__action-col">
                  <Link
                    to={bookingPath(tourId, departure.ma_lich_khoi_hanh)}
                    className="btn btn--outline btn--sm"
                    aria-label={`Đặt tour ngày ${formatDateOnly(departure.ngay_khoi_hanh)}`}
                  >
                    Chọn
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DetailSkeleton = () => (
  <div className="container tour-detail" aria-busy="true" aria-label="Đang tải thông tin tour">
    <div className="skeleton tour-detail__skeleton-line" />
    <div className="skeleton tour-detail__skeleton-title" />
    <div className="skeleton tour-detail__skeleton-facts" />
    <div className="tour-detail__layout">
      <div className="skeleton tour-detail__gallery tour-detail__skeleton-gallery" />
      <div className="booking-box">
        <div className="skeleton tour-detail__skeleton-line tour-detail__skeleton-line--short" />
        <div className="skeleton tour-detail__skeleton-price" />
        <div className="skeleton tour-detail__skeleton-line" />
        <div className="skeleton tour-detail__skeleton-button" />
      </div>
      <div className="tour-detail__content">
        <div className="skeleton tour-detail__skeleton-section" />
      </div>
    </div>
  </div>
);

const TourDetailPage = () => {
  const { tourId } = useParams();
  const { user } = useAuth();
  // Chưa đăng nhập vẫn thấy nút đặt: bấm vào sẽ qua đăng nhập rồi quay lại trang đặt tour
  const canBook = !user || user.vai_tro === ROLES.CUSTOMER;
  const [tour, setTour] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isNotFound, setIsNotFound] = useState(false);
  const departuresRef = useRef(null);

  const loadTour = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    setIsNotFound(false);
    try {
      setTour(await getTour(tourId));
    } catch (error) {
      // 400 (mã không phải số) và 404 (không có hoặc đang ẩn) đều coi là không tìm thấy tour
      if ([400, 404].includes(error.response?.status)) setIsNotFound(true);
      else setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [tourId]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    loadTour();
  }, [loadTour]);

  const scrollToDepartures = () =>
    departuresRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });

  if (isNotFound) {
    return (
      <section className="container tour-detail tour-detail__not-found">
        <p className="tour-detail__not-found-code">Không tìm thấy tour</p>
        <h1 className="tour-detail__not-found-title">Tour này không tồn tại hoặc đã ngừng mở bán</h1>
        <Link to="/tour" className="btn btn--primary">
          Xem các tour khác
        </Link>
      </section>
    );
  }

  if (loadError) {
    return (
      <div className="container tour-detail">
        <div className="alert alert--error tour-detail__error" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} />
          <span>Không tải được thông tin tour. {loadError}</span>
          <button type="button" className="btn btn--outline btn--sm" onClick={loadTour}>
            <FontAwesomeIcon icon={faRotateRight} />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !tour) return <DetailSkeleton />;

  const typeStyle = getTourTypeStyle(tour.ten_loai_tour);
  const nearest = tour.lich_khoi_hanh[0];

  return (
    <div className="container tour-detail" style={tourTypeCssVars(tour.ten_loai_tour)}>
      <nav className="breadcrumb" aria-label="Đường dẫn">
        <Link to="/">Trang chủ</Link>
        <FontAwesomeIcon icon={faChevronRight} />
        <Link to="/tour">Tour du lịch</Link>
        <FontAwesomeIcon icon={faChevronRight} />
        <span aria-current="page">{tour.ten_tour}</span>
      </nav>

      <header className="tour-detail__header">
        <p className="tour-detail__eyebrow">
          <span className="tour-detail__type">
            <FontAwesomeIcon icon={typeStyle.icon} />
            {tour.ten_loai_tour}
          </span>
          <span className="tour-detail__code">Mã tour {tour.ma_tour}</span>
        </p>
        <h1 className="tour-detail__title">{tour.ten_tour}</h1>
        {/* Bước 30: nút trái tim yêu thích đặt cạnh tiêu đề */}
      </header>

      <dl className="tour-facts">
        <div className="tour-facts__item">
          <dt>
            <FontAwesomeIcon icon={faClock} /> Thời gian
          </dt>
          <dd>{formatDuration(tour.so_ngay, tour.so_dem)}</dd>
        </div>
        <div className="tour-facts__item">
          <dt>
            <FontAwesomeIcon icon={faFlag} /> Điểm đến
          </dt>
          <dd>{tour.ten_diem_den}</dd>
        </div>
        <div className="tour-facts__item">
          <dt>
            <FontAwesomeIcon icon={faLocationDot} /> Khởi hành từ
          </dt>
          <dd>{tour.ten_diem_khoi_hanh}</dd>
        </div>
        <div className="tour-facts__item">
          <dt>
            <FontAwesomeIcon icon={getTransportIcon(tour.ten_phuong_tien)} /> Phương tiện
          </dt>
          <dd>{tour.ten_phuong_tien}</dd>
        </div>
      </dl>

      <div className="tour-detail__layout">
        <div className="tour-detail__gallery">
          {tour.anh_tour.length > 0 ? (
            <TourGallery images={tour.anh_tour} tourName={tour.ten_tour} />
          ) : (
            <div className="gallery__main">
              <TourImage alt={tour.ten_tour} placeholderText="Ảnh tour đang được cập nhật" />
            </div>
          )}
        </div>

        <aside className="booking-box" aria-label="Giá và lịch khởi hành">
          <p className="booking-box__label">Giá mỗi khách</p>
          <p className="booking-box__price">{formatPrice(tour.gia)}</p>

          <p className="booking-box__nearest">
            <FontAwesomeIcon icon={faCalendarDays} />
            {nearest ? (
              <span>
                Gần nhất: <strong>{formatDateOnly(nearest.ngay_khoi_hanh)}</strong>, còn{' '}
                <strong className={nearest.so_cho_con_lai <= FEW_SEATS ? 'booking-box__few' : ''}>
                  {nearest.so_cho_con_lai} chỗ
                </strong>
              </span>
            ) : (
              <span>Chưa có lịch khởi hành còn chỗ</span>
            )}
          </p>

          {nearest && canBook ? (
            <>
              <Link to={bookingPath(tour.ma_tour, nearest.ma_lich_khoi_hanh)} className="btn btn--accent booking-box__action">
                Đặt tour
              </Link>
              <button type="button" className="booking-box__link" onClick={scrollToDepartures}>
                Chọn ngày khác ({tour.lich_khoi_hanh.length} ngày khởi hành)
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--accent booking-box__action" onClick={scrollToDepartures}>
              {nearest ? `Xem ${tour.lich_khoi_hanh.length} ngày khởi hành` : 'Xem lịch khởi hành'}
            </button>
          )}
          {!canBook && <p className="booking-box__staff-note">Chỉ tài khoản khách hàng mới đặt được tour.</p>}

          <p className="booking-box__help">
            Cần tư vấn?{' '}
            <a href={hotlineHref}>
              <FontAwesomeIcon icon={faPhone} /> {siteInfo.hotline}
            </a>
          </p>
        </aside>

        <div className="tour-detail__content">
          <section className="tour-detail__section">
            <h2 className="tour-detail__heading">Tổng quan</h2>
            {tour.mo_ta_tong_quan ? (
              <p className="tour-detail__text">{tour.mo_ta_tong_quan}</p>
            ) : (
              <p className="tour-detail__muted">Thông tin tổng quan đang được cập nhật.</p>
            )}
          </section>

          <section className="tour-detail__section">
            <h2 className="tour-detail__heading">Lịch trình {formatDuration(tour.so_ngay, tour.so_dem)}</h2>
            <ol className="day-plan">
              {tour.lich_trinh.map((day) => (
                <li key={day.ma_lich_trinh} className="day-plan__day">
                  <span className="day-plan__badge">Ngày {day.ngay_thu}</span>
                  <div className="day-plan__body">
                    <h3 className="day-plan__title">{day.tieu_de}</h3>
                    {day.noi_dung_hoat_dong && <p className="tour-detail__text">{day.noi_dung_hoat_dong}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="tour-detail__section tour-detail__departures" ref={departuresRef}>
            <h2 className="tour-detail__heading">Lịch khởi hành</h2>
            <DepartureTable departures={tour.lich_khoi_hanh} days={tour.so_ngay} tourId={tour.ma_tour} canBook={canBook} />
          </section>

          {/* Bước 27: mục "Đánh giá" của khách đã đi tour đặt ở đây */}
        </div>
      </div>
    </div>
  );
};

export default TourDetailPage;
