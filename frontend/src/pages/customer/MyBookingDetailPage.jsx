import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faBan,
  faBus,
  faCalendarCheck,
  faCalendarDays,
  faCircleExclamation,
  faClock,
  faFlag,
  faLocationDot,
  faMoneyBillWave,
  faPhone,
  faReceipt,
  faRotateRight,
  faUserGroup,
} from '@fortawesome/free-solid-svg-icons';
import TourImage from '../../components/TourImage/TourImage.jsx';
import StatusBadge from '../../components/StatusBadge/StatusBadge.jsx';
import BookingProgress from './BookingProgress.jsx';
import { getMyBooking } from '../../api/bookingApi.js';
import { getErrorMessage } from '../../api/axiosClient.js';
import { BOOKING_STATUS, MY_BOOKINGS_PATH, PAYMENT_STATUS } from '../../config/booking.js';
import siteInfo from '../../config/siteInfo.js';
import { toAssetUrl } from '../../utils/assetUrl.js';
import {
  addDays,
  formatDateOnly,
  formatDateTime,
  formatDuration,
  formatPrice,
  formatWeekday,
} from '../../utils/format.js';
import './MyBookingDetailPage.css';

const hotlineHref = `tel:${siteInfo.hotline.replace(/\s/g, '')}`;

// Dòng ngắn dưới thanh tiến trình, nói khách đang chờ việc gì
const NEXT_STEP_TEXT = {
  cho_xac_nhan: 'Nhân viên sẽ gọi số liên hệ để xác nhận đơn và hướng dẫn thanh toán.',
  da_xac_nhan: 'Đơn đã được xác nhận. Vui lòng thanh toán theo hướng dẫn của nhân viên trước ngày khởi hành.',
  hoan_tat: 'Chuyến đi đã hoàn tất. Cảm ơn bạn đã đồng hành cùng chúng tôi!',
};

// Chỉ dùng các mốc có thời gian thật trong CSDL (đặt đơn, từng phiếu thu, hủy), mới nhất trước
const buildTimeline = (booking) => {
  const events = [
    {
      time: booking.ngay_dat,
      icon: faReceipt,
      tone: 'primary',
      title: `Đặt đơn, giữ ${booking.so_luong_khach} chỗ`,
      text: `Phương thức thanh toán đã chọn: ${booking.phuong_thuc_thanh_toan}`,
    },
    ...booking.thanh_toan.map((payment) => ({
      time: payment.ngay_ghi_nhan,
      icon: faMoneyBillWave,
      tone: 'success',
      title: `Ghi nhận thanh toán ${formatPrice(payment.so_tien)}`,
      text: payment.phuong_thuc,
    })),
  ];
  if (booking.ngay_huy) {
    events.push({
      time: booking.ngay_huy,
      icon: faBan,
      tone: 'muted',
      title: 'Đơn đã hủy',
      text: 'Số chỗ đã được trả lại cho lịch khởi hành.',
    });
  }
  // Hai mốc trùng giây thì mốc thêm sau (theo thứ tự nghiệp vụ: đặt → thu tiền → hủy) đứng trước
  return events
    .map((event, order) => ({ ...event, order }))
    .sort((a, b) => b.time.localeCompare(a.time) || b.order - a.order);
};

const BackLink = () => (
  <Link to={MY_BOOKINGS_PATH} className="order-detail__back">
    <FontAwesomeIcon icon={faArrowLeft} />
    Đơn của tôi
  </Link>
);

const TripFact = ({ icon, label, children, sub }) => (
  <div className="trip-fact">
    <span className="trip-fact__icon" aria-hidden="true">
      <FontAwesomeIcon icon={icon} />
    </span>
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
      {sub && <dd className="trip-fact__sub">{sub}</dd>}
    </div>
  </div>
);

const DetailSkeleton = () => (
  <div className="container order-detail" aria-busy="true" aria-label="Đang tải chi tiết đơn">
    <div className="skeleton order-detail__skeleton-line" />
    <div className="skeleton order-detail__skeleton-title" />
    <div className="order-detail__layout">
      <div className="skeleton order-detail__skeleton-block" />
      <div className="skeleton order-detail__skeleton-side" />
    </div>
  </div>
);

const MyBookingDetailPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [isNotFound, setIsNotFound] = useState(false);

  const loadBooking = useCallback(async () => {
    setError('');
    try {
      setBooking(await getMyBooking(bookingId));
    } catch (err) {
      // 404 gồm cả đơn của khách khác (backend không cho biết đơn đó có tồn tại)
      if ([400, 404].includes(err.response?.status)) setIsNotFound(true);
      else setError(getErrorMessage(err));
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  if (isNotFound) {
    return (
      <div className="container order-detail">
        <BackLink />
        <div className="order-detail__message">
          <h1 className="order-detail__message-title">Không tìm thấy đơn đặt tour</h1>
          <p>Đơn này không tồn tại hoặc không thuộc tài khoản của bạn.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container order-detail">
        <BackLink />
        <div className="alert alert--error order-detail__error" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} />
          <span>Không tải được đơn đặt tour. {error}</span>
          <button type="button" className="btn btn--outline btn--sm" onClick={loadBooking}>
            <FontAwesomeIcon icon={faRotateRight} />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!booking) return <DetailSkeleton />;

  const isCancelled = booking.trang_thai_don === 'da_huy';
  const paid = booking.thanh_toan.reduce((sum, item) => sum + item.so_tien, 0);
  const paidPercent = Math.min(100, Math.round((paid / booking.tong_tien) * 100));
  const tourPath = `/tour/${booking.ma_tour}`;

  return (
    <div className="container order-detail">
      <BackLink />
      <header className="order-detail__head">
        <h1 className="order-detail__title">Đơn #{booking.ma_don}</h1>
        <StatusBadge statusMap={BOOKING_STATUS} value={booking.trang_thai_don} />
      </header>

      <div className="order-detail__layout">
        <div className="order-detail__main">
          <section className="order-panel order-panel--tour">
            <Link to={tourPath} className="order-detail__cover">
              <TourImage src={toAssetUrl(booking.anh_dai_dien)} alt="" placeholderText="Ảnh tour đang được cập nhật" />
            </Link>
            <div className="order-panel__body">
              <Link to={tourPath} className="order-detail__tour-name">
                {booking.ten_tour}
              </Link>
              <p className="order-detail__tour-meta">
                {formatDuration(booking.so_ngay, booking.so_dem)} · {booking.ten_diem_khoi_hanh} → {booking.ten_diem_den}
              </p>
              {isCancelled ? (
                <p className="order-detail__cancelled">
                  <FontAwesomeIcon icon={faBan} />
                  Đơn đã hủy{booking.ngay_huy && ` lúc ${formatDateTime(booking.ngay_huy)}`}.
                </p>
              ) : (
                <div className="order-detail__progress">
                  <BookingProgress status={booking.trang_thai_don} paymentStatus={booking.trang_thai_thanh_toan} />
                  <p className="order-detail__next">{NEXT_STEP_TEXT[booking.trang_thai_don]}</p>
                </div>
              )}
            </div>
          </section>

          <section className="order-panel">
            <h2 className="order-panel__title">Thông tin chuyến đi</h2>
            <dl className="trip-facts">
              <TripFact icon={faCalendarDays} label="Ngày đi" sub={formatWeekday(booking.ngay_khoi_hanh)}>
                {formatDateOnly(booking.ngay_khoi_hanh)}
              </TripFact>
              <TripFact
                icon={faCalendarCheck}
                label="Ngày về"
                sub={formatWeekday(addDays(booking.ngay_khoi_hanh, booking.so_ngay - 1))}
              >
                {formatDateOnly(addDays(booking.ngay_khoi_hanh, booking.so_ngay - 1))}
              </TripFact>
              <TripFact icon={faClock} label="Thời gian">
                {formatDuration(booking.so_ngay, booking.so_dem)}
              </TripFact>
              <TripFact icon={faLocationDot} label="Khởi hành từ">
                {booking.ten_diem_khoi_hanh}
              </TripFact>
              <TripFact icon={faFlag} label="Điểm đến">
                {booking.ten_diem_den}
              </TripFact>
              <TripFact icon={faBus} label="Phương tiện">
                {booking.ten_phuong_tien}
              </TripFact>
              <TripFact icon={faUserGroup} label="Số khách">
                {booking.so_luong_khach} khách
              </TripFact>
            </dl>
          </section>

          <section className="order-panel">
            <h2 className="order-panel__title">Người liên hệ</h2>
            <dl className="order-detail__rows">
              <div>
                <dt>Họ tên</dt>
                <dd>{booking.ho_ten_lien_he}</dd>
              </div>
              <div>
                <dt>Số điện thoại</dt>
                <dd>{booking.so_dien_thoai_lien_he}</dd>
              </div>
              {booking.ghi_chu && (
                <div>
                  <dt>Ghi chú</dt>
                  <dd className="order-detail__note">{booking.ghi_chu}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="order-panel">
            <h2 className="order-panel__title">Lịch sử đơn</h2>
            <ol className="timeline">
              {buildTimeline(booking).map((event, index) => (
                <li key={`${event.time}-${index}`} className={`timeline__item timeline__item--${event.tone}`}>
                  <span className="timeline__dot" aria-hidden="true">
                    <FontAwesomeIcon icon={event.icon} />
                  </span>
                  <div>
                    <p className="timeline__title">{event.title}</p>
                    <p className="timeline__text">{event.text}</p>
                    <p className="timeline__time">{formatDateTime(event.time)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="order-side" aria-label="Tóm tắt thanh toán">
          <div className="order-side__code">
            <span>Mã đơn</span>
            <strong>#{booking.ma_don}</strong>
            <span className="order-side__booked">Đặt lúc {formatDateTime(booking.ngay_dat)}</span>
          </div>

          <dl className="order-side__price">
            <div>
              <dt>Giá mỗi khách</dt>
              <dd>{formatPrice(booking.don_gia)}</dd>
            </div>
            <div>
              <dt>Số khách</dt>
              <dd>× {booking.so_luong_khach}</dd>
            </div>
            <div className="order-side__total">
              <dt>Tổng tiền</dt>
              <dd>{formatPrice(booking.tong_tien)}</dd>
            </div>
          </dl>

          <div className="pay-progress">
            <div className="pay-progress__head">
              <span>Thanh toán</span>
              <StatusBadge statusMap={PAYMENT_STATUS} value={booking.trang_thai_thanh_toan} />
            </div>
            <div
              className="pay-progress__bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={paidPercent}
              aria-label="Tỷ lệ đã thanh toán"
            >
              <span style={{ width: `${paidPercent}%` }} />
            </div>
            <dl className="pay-progress__rows">
              <div>
                <dt>Đã thanh toán ({paidPercent}%)</dt>
                <dd>{formatPrice(paid)}</dd>
              </div>
              {!isCancelled && (
                <div>
                  <dt>Còn lại</dt>
                  <dd className="pay-progress__remaining">{formatPrice(booking.tong_tien - paid)}</dd>
                </div>
              )}
              <div>
                <dt>Phương thức đã chọn</dt>
                <dd>{booking.phuong_thuc_thanh_toan}</dd>
              </div>
            </dl>
          </div>

          {/* Bước 23: nút "Hủy đơn" cho đơn còn chờ xác nhận đặt ở đây */}
          <div className="order-side__help">
            <p>Cần hỗ trợ về đơn này?</p>
            <a href={hotlineHref} className="btn btn--outline order-side__call">
              <FontAwesomeIcon icon={faPhone} />
              Gọi {siteInfo.hotline}
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MyBookingDetailPage;
