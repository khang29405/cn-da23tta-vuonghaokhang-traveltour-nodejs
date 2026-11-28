import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faClock,
  faLocationDot,
  faFlag,
  faCircleExclamation,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import TourGallery from './TourGallery.jsx';
import TourItinerary from './TourItinerary.jsx';
import DepartureCards from './DepartureCards.jsx';
import TourBookingBox, { MobileBookingBar } from './TourBookingBox.jsx';
import RelatedTours from './RelatedTours.jsx';
import TourImage from '../../components/TourImage/TourImage.jsx';
import { getTour } from '../../api/publicTourApi.js';
import { getErrorMessage } from '../../api/axiosClient.js';
import { getTourTypeStyle, tourTypeCssVars } from '../../config/tourTypeStyles.js';
import { getTransportIcon } from '../../config/transportIcons.js';
import siteInfo from '../../config/siteInfo.js';
import { ROLES } from '../../config/roles.js';
import { useAuth } from '../../context/authContext.js';
import { formatDuration, formatPrice } from '../../utils/format.js';
import './TourDetailPage.css';

const hotlineHref = `tel:${siteInfo.hotline.replace(/\s/g, '')}`;

// Bước 27: thêm mục "Đánh giá" vào đây và vào phần nội dung
const SECTIONS = [
  { id: 'tong-quan', label: 'Tổng quan' },
  { id: 'lich-trinh', label: 'Lịch trình' },
  { id: 'lich-khoi-hanh', label: 'Lịch khởi hành' },
];

// Navbar 60px + thanh mục ~48px: mục được tính là "đang xem" khi đầu mục đã lên tới dưới thanh mục
const SPY_OFFSET = 130;

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const scrollToSection = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });

const useActiveSection = (enabled) => {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    if (!enabled) return undefined;
    const update = () => {
      let current = SECTIONS[0].id;
      SECTIONS.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= SPY_OFFSET) current = id;
      });
      setActive(current);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [enabled]);

  return active;
};

// Chỉ báo khi hộp đặt tour đã cuộn lên khỏi màn hình (không tính lúc nó còn nằm phía dưới)
const useScrolledPast = (ref, enabled) => {
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) =>
      setIsPast(!entry.isIntersecting && entry.boundingClientRect.top < 0),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, enabled]);

  return enabled && isPast;
};

const DetailSkeleton = () => (
  <div className="container tour-detail" aria-busy="true" aria-label="Đang tải thông tin tour">
    <div className="skeleton tour-detail__skeleton-line" />
    <div className="skeleton tour-detail__skeleton-title" />
    <div className="tour-detail__layout">
      <div className="skeleton tour-detail__gallery tour-detail__skeleton-gallery" />
      <div className="booking-box">
        <div className="skeleton tour-detail__skeleton-line tour-detail__skeleton-line--short" />
        <div className="skeleton tour-detail__skeleton-price" />
        <div className="skeleton tour-detail__skeleton-chips" />
        <div className="skeleton tour-detail__skeleton-button" />
      </div>
      <div className="tour-detail__content">
        <div className="skeleton tour-detail__skeleton-section" />
      </div>
    </div>
  </div>
);

const TourFact = ({ icon, label, value }) => (
  <div className="tour-facts__item">
    <span className="tour-facts__icon" aria-hidden="true">
      <FontAwesomeIcon icon={icon} />
    </span>
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
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
  const [selectedId, setSelectedId] = useState(null);
  const bookingBoxRef = useRef(null);

  const loadTour = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    setIsNotFound(false);
    try {
      const data = await getTour(tourId);
      setTour(data);
      setSelectedId(data.lich_khoi_hanh[0]?.ma_lich_khoi_hanh ?? null);
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

  const isReady = !isLoading && Boolean(tour);
  const selected = tour?.lich_khoi_hanh.find((departure) => departure.ma_lich_khoi_hanh === selectedId) ?? null;
  const activeSection = useActiveSection(isReady);
  const showBookBar = useScrolledPast(bookingBoxRef, isReady && canBook && Boolean(selected));

  // Thanh đặt tour dính đáy che mất phần cuối footer, nên chừa chỗ ở cuối trang khi thanh tồn tại
  const hasBookBar = isReady && canBook && Boolean(selected);
  useEffect(() => {
    document.body.classList.toggle('has-book-bar', hasBookBar);
    return () => document.body.classList.remove('has-book-bar');
  }, [hasBookBar]);

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

  if (!isReady) return <DetailSkeleton />;

  const typeStyle = getTourTypeStyle(tour.ten_loai_tour);
  const duration = formatDuration(tour.so_ngay, tour.so_dem);

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
          <Link to={`/tour?tourType=${tour.ma_loai_tour}`} className="tour-detail__type">
            <FontAwesomeIcon icon={typeStyle.icon} />
            {tour.ten_loai_tour}
          </Link>
          <span className="tour-detail__code">Mã tour {tour.ma_tour}</span>
        </p>
        <h1 className="tour-detail__title">{tour.ten_tour}</h1>
        {/* Bước 30: nút trái tim yêu thích đặt cạnh tiêu đề */}
      </header>

      <div className="tour-detail__layout">
        <div className="tour-detail__gallery">
          {tour.anh_tour.length > 0 ? (
            <TourGallery key={tour.ma_tour} images={tour.anh_tour} tourName={tour.ten_tour} />
          ) : (
            <div className="gallery__main">
              <TourImage alt={tour.ten_tour} placeholderText="Ảnh tour đang được cập nhật" />
            </div>
          )}

          <dl className="tour-facts">
            <TourFact icon={faClock} label="Thời gian" value={duration} />
            <TourFact icon={faFlag} label="Điểm đến" value={tour.ten_diem_den} />
            <TourFact icon={faLocationDot} label="Khởi hành từ" value={tour.ten_diem_khoi_hanh} />
            <TourFact icon={getTransportIcon(tour.ten_phuong_tien)} label="Phương tiện" value={tour.ten_phuong_tien} />
          </dl>
        </div>

        <TourBookingBox
          ref={bookingBoxRef}
          tour={tour}
          selected={selected}
          onSelect={setSelectedId}
          canBook={canBook}
          onShowAllDates={() => scrollToSection('lich-khoi-hanh')}
        />

        <div className="tour-detail__content">
          <nav className="section-tabs" aria-label="Các mục của tour">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`section-tabs__item${activeSection === section.id ? ' section-tabs__item--active' : ''}`}
                aria-current={activeSection === section.id ? 'true' : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection(section.id);
                }}
              >
                {section.label}
              </a>
            ))}
          </nav>

          <section id="tong-quan" className="tour-detail__section">
            <h2 className="tour-detail__heading">Tổng quan</h2>
            {tour.mo_ta_tong_quan ? (
              <p className="tour-detail__text">{tour.mo_ta_tong_quan}</p>
            ) : (
              <p className="tour-detail__muted">Thông tin tổng quan đang được cập nhật.</p>
            )}
          </section>

          <section id="lich-trinh" className="tour-detail__section">
            {tour.lich_trinh.length > 0 ? (
              <TourItinerary key={tour.ma_tour} title={`Lịch trình ${duration}`} days={tour.lich_trinh} />
            ) : (
              <>
                <h2 className="tour-detail__heading">Lịch trình</h2>
                <p className="tour-detail__muted">Lịch trình chi tiết đang được cập nhật.</p>
              </>
            )}
          </section>

          <section id="lich-khoi-hanh" className="tour-detail__section">
            <div className="tour-detail__section-head">
              <h2 className="tour-detail__heading">Lịch khởi hành</h2>
              {tour.lich_khoi_hanh.length > 1 && (
                <span className="tour-detail__head-note">Cùng giá {formatPrice(tour.gia)}/khách ở mọi ngày</span>
              )}
            </div>
            {tour.lich_khoi_hanh.length > 0 ? (
              <DepartureCards key={tour.ma_tour} departures={tour.lich_khoi_hanh} days={tour.so_ngay} tourId={tour.ma_tour} canBook={canBook} />
            ) : (
              <p className="tour-detail__muted">
                Tour hiện chưa có lịch khởi hành còn chỗ. Gọi <a href={hotlineHref}>{siteInfo.hotline}</a> để được tư vấn
                lịch mới.
              </p>
            )}
          </section>

          {/* Bước 27: mục "Đánh giá" của khách đã đi tour đặt ở đây */}
        </div>
      </div>

      <RelatedTours tourId={tour.ma_tour} tourTypeId={tour.ma_loai_tour} tourTypeName={tour.ten_loai_tour} />

      {hasBookBar && <MobileBookingBar tour={tour} selected={selected} visible={showBookBar} />}
    </div>
  );
};

export default TourDetailPage;
