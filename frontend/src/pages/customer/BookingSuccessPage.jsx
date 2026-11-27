import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCamera,
  faCheck,
  faCircleExclamation,
  faHeart,
  faMapLocationDot,
  faPhone,
  faPlaneDeparture,
  faSuitcaseRolling,
} from '@fortawesome/free-solid-svg-icons';
import TourImage from '../../components/TourImage/TourImage.jsx';
import BookingProgress from './BookingProgress.jsx';
import { getMyBooking } from '../../api/bookingApi.js';
import { getErrorMessage } from '../../api/axiosClient.js';
import { BOOKING_STATUS, MY_BOOKINGS_PATH, PAYMENT_STATUS } from '../../config/booking.js';
import siteInfo from '../../config/siteInfo.js';
import { toAssetUrl } from '../../utils/assetUrl.js';
import { addDays, formatDateOnly, formatDuration, formatPrice, formatWeekday } from '../../utils/format.js';
import './BookingSuccessPage.css';

// Chùm hạt tỏa ra quanh dấu tick (một lần khi vào trang), màu theo bảng màu của website
const SPARKS = ['#0b63ce', '#ff6a13', '#12854a', '#0f8a8a', '#f5a524', '#0b63ce', '#ff6a13', '#12854a', '#0f8a8a', '#f5a524'];
const ORBIT_ICONS = [
  { name: 'plane', icon: faPlaneDeparture },
  { name: 'bag', icon: faSuitcaseRolling },
  { name: 'camera', icon: faCamera },
  { name: 'map', icon: faMapLocationDot },
];

const SuccessSkeleton = () => (
  <div className="container booking-success" aria-busy="true" aria-label="Đang tải đơn đặt tour">
    <div className="skeleton booking-success__skeleton" />
  </div>
);

// Vừa đặt xong thì dùng đơn có sẵn từ trang đặt tour; tải lại trang thì đọc đơn từ máy chủ
const BookingSuccessPage = () => {
  const { bookingId } = useParams();
  const { state } = useLocation();
  const passed = state?.booking;
  const [booking, setBooking] = useState(passed?.ma_don === Number(bookingId) ? passed : null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (booking) return;
    getMyBooking(bookingId)
      .then(setBooking)
      .catch((err) => setError(getErrorMessage(err)));
  }, [booking, bookingId]);

  if (error) {
    return (
      <div className="container booking-success">
        <p className="alert alert--error" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} />
          {error}
        </p>
      </div>
    );
  }

  if (!booking) return <SuccessSkeleton />;

  return (
    <div className="container booking-success">
      <article className="confirm">
        <header className="confirm__head">
          <div className="confirm__badge" aria-hidden="true">
            <span className="confirm__ring" />
            <span className="confirm__ring confirm__ring--late" />
            {SPARKS.map((color, index) => (
              <span
                key={index}
                className="confirm__spark"
                style={{ '--angle': `${index * (360 / SPARKS.length)}deg`, '--spark-color': color }}
              />
            ))}
            <span className="confirm__check">
              <FontAwesomeIcon icon={faCheck} />
            </span>
            {ORBIT_ICONS.map(({ name, icon }) => (
              <span key={name} className={`confirm__orbit confirm__orbit--${name}`}>
                <FontAwesomeIcon icon={icon} />
              </span>
            ))}
          </div>
          <p className="confirm__eyebrow">Đã gửi đơn đặt tour</p>
          <h1 className="confirm__title">
            Cảm ơn bạn đã chọn{' '}
            <span className="confirm__brand">
              {siteInfo.name}!
              <FontAwesomeIcon icon={faHeart} className="confirm__heart" aria-hidden="true" />
            </span>
          </h1>
          <p className="confirm__lead">
            Chúng tôi đã giữ <strong>{booking.so_luong_khach} chỗ</strong> cho bạn · Mã đơn{' '}
            <strong>#{booking.ma_don}</strong>
            <span className="confirm__status">{BOOKING_STATUS[booking.trang_thai_don].label}</span>
          </p>
        </header>

        <div className="confirm__body">
          <div className="confirm__tour">
            <div className="confirm__image">
              <TourImage src={toAssetUrl(booking.anh_dai_dien)} alt="" />
            </div>
            <div>
              <p className="confirm__tour-name">{booking.ten_tour}</p>
              <p className="confirm__tour-meta">
                {formatDuration(booking.so_ngay, booking.so_dem)} · Khởi hành từ {booking.ten_diem_khoi_hanh}
              </p>
              {booking.ghi_chu && <p className="confirm__tour-note">Ghi chú: {booking.ghi_chu}</p>}
            </div>
          </div>

          <dl className="confirm__facts">
            <div className="confirm__fact">
              <dt>Ngày đi</dt>
              <dd>{formatDateOnly(booking.ngay_khoi_hanh)}</dd>
              <dd className="confirm__fact-sub">
                {booking.so_ngay > 1
                  ? `Về ${formatDateOnly(addDays(booking.ngay_khoi_hanh, booking.so_ngay - 1))}`
                  : formatWeekday(booking.ngay_khoi_hanh)}
              </dd>
            </div>
            <div className="confirm__fact">
              <dt>Số khách</dt>
              <dd>{booking.so_luong_khach} khách</dd>
              <dd className="confirm__fact-sub">{formatPrice(booking.don_gia)} / khách</dd>
            </div>
            <div className="confirm__fact">
              <dt>Thanh toán</dt>
              <dd>{booking.phuong_thuc_thanh_toan}</dd>
              <dd className="confirm__fact-sub">{PAYMENT_STATUS[booking.trang_thai_thanh_toan].label}</dd>
            </div>
            <div className="confirm__fact confirm__fact--total">
              <dt>Tổng tiền</dt>
              <dd>{formatPrice(booking.tong_tien)}</dd>
            </div>
          </dl>

          <BookingProgress status={booking.trang_thai_don} paymentStatus={booking.trang_thai_thanh_toan} />

          <p className="confirm__next">
            <FontAwesomeIcon icon={faPhone} className="confirm__next-icon" />
            Nhân viên sẽ gọi <strong>{booking.so_dien_thoai_lien_he}</strong> để xác nhận đơn và hướng dẫn thanh toán.
          </p>
        </div>

        <footer className="confirm__foot">
          <Link to="/tour" className="btn btn--outline">
            Xem tour khác
          </Link>
          <Link to={MY_BOOKINGS_PATH} className="btn btn--primary">
            Xem đơn của tôi
          </Link>
        </footer>
      </article>
    </div>
  );
};

export default BookingSuccessPage;
