import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarDays,
  faChevronRight,
  faCircleUser,
  faCircleExclamation,
  faPlaneDeparture,
  faRotateRight,
  faSuitcaseRolling,
  faUserGroup,
} from '@fortawesome/free-solid-svg-icons';
import TourImage from '../../components/TourImage/TourImage.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import StatusBadge from '../../components/StatusBadge/StatusBadge.jsx';
import { getMyBookings } from '../../api/bookingApi.js';
import { useAuth } from '../../context/authContext.js';
import { getErrorMessage } from '../../api/axiosClient.js';
import { BOOKING_STATUS, PAYMENT_STATUS, myBookingPath } from '../../config/booking.js';
import { toAssetUrl } from '../../utils/assetUrl.js';
import { addDays, formatDateOnly, formatDateTime, formatPrice, toDateInputValue } from '../../utils/format.js';
import './MyBookingsPage.css';

const TABS = [{ value: '', label: 'Tất cả' }, ...Object.entries(BOOKING_STATUS).map(([value, { label }]) => ({ value, label }))];

const parsePage = (value) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

// So theo ngày UTC để không lệch một ngày khi đổi giờ mùa hè/mùa đông
const toUtcDay = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};

const daysBetween = (from, to) => Math.round((toUtcDay(to) - toUtcDay(from)) / 86_400_000);

// Nhãn đếm ngược tới ngày đi; đơn đã hủy không cần, chuyến đã qua chỉ ghi nhẹ
const getCountdown = (booking, today) => {
  if (booking.trang_thai_don === 'da_huy') return null;
  if (booking.trang_thai_don === 'hoan_tat') return { text: 'Chuyến đi đã hoàn tất', tone: 'past' };
  const days = daysBetween(today, booking.ngay_khoi_hanh);
  if (days < 0) return { text: 'Đã khởi hành', tone: 'past' };
  if (days === 0) return { text: 'Khởi hành hôm nay', tone: 'soon' };
  if (days === 1) return { text: 'Khởi hành ngày mai', tone: 'soon' };
  return { text: `Còn ${days} ngày khởi hành`, tone: days <= 7 ? 'soon' : 'normal' };
};

const ListSkeleton = () => (
  <ul className="my-bookings__list" aria-busy="true" aria-label="Đang tải danh sách đơn">
    {[1, 2, 3].map((item) => (
      <li key={item} className="skeleton ticket-row__skeleton" />
    ))}
  </ul>
);

const BookingTicket = ({ booking, today }) => {
  const returnDate = booking.so_ngay > 1 ? addDays(booking.ngay_khoi_hanh, booking.so_ngay - 1) : null;
  const countdown = getCountdown(booking, today);
  return (
    <li>
      <Link
        to={myBookingPath(booking.ma_don)}
        className={`ticket-row${booking.trang_thai_don === 'da_huy' ? ' ticket-row--cancelled' : ''}`}
      >
        <span className="ticket-row__main">
          <span className="ticket-row__image">
            <TourImage src={toAssetUrl(booking.anh_dai_dien)} alt="" lazy />
          </span>
          <span className="ticket-row__info">
            {countdown && (
              <span className={`ticket-row__countdown ticket-row__countdown--${countdown.tone}`}>
                <FontAwesomeIcon icon={faPlaneDeparture} />
                {countdown.text}
              </span>
            )}
            <span className="ticket-row__name">{booking.ten_tour}</span>
            <span className="ticket-row__meta">
              <span>
                <FontAwesomeIcon icon={faCalendarDays} />
                {formatDateOnly(booking.ngay_khoi_hanh)}
                {returnDate && ` → ${formatDateOnly(returnDate)}`}
              </span>
              <span>
                <FontAwesomeIcon icon={faUserGroup} />
                {booking.so_luong_khach} khách
              </span>
            </span>
          </span>
        </span>

        <span className="ticket-row__stub">
          <span className="ticket-row__code">
            <span className="ticket-row__label">Mã đơn</span>#{booking.ma_don}
            <span className="ticket-row__booked">Đặt lúc {formatDateTime(booking.ngay_dat)}</span>
          </span>
          <span className="ticket-row__badges">
            <StatusBadge statusMap={BOOKING_STATUS} value={booking.trang_thai_don} />
            <StatusBadge statusMap={PAYMENT_STATUS} value={booking.trang_thai_thanh_toan} />
          </span>
          <span className="ticket-row__total">{formatPrice(booking.tong_tien)}</span>
          <span className="ticket-row__more">
            Xem chi tiết
            <FontAwesomeIcon icon={faChevronRight} />
          </span>
        </span>
      </Link>
    </li>
  );
};

const MyBookingsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get('page'));
  const status = BOOKING_STATUS[searchParams.get('status')] ? searchParams.get('status') : '';
  const [today] = useState(() => toDateInputValue(new Date()));
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const updateQuery = useCallback(
    ({ nextStatus = status, nextPage = 1 }, options) => {
      const query = {};
      if (nextStatus) query.status = nextStatus;
      if (nextPage > 1) query.page = nextPage;
      setSearchParams(query, options);
    },
    [status, setSearchParams],
  );

  const goToPage = useCallback(
    (nextPage, options) => {
      updateQuery({ nextPage }, options);
      window.scrollTo({ top: 0 });
    },
    [updateQuery],
  );

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await getMyBookings({ page, status: status || undefined });
      setData(result);
      // Trang trên URL vượt quá số trang thật thì máy chủ đã lùi về trang cuối; đưa URL về cho khớp
      if (result.pagination.page !== page) goToPage(result.pagination.page, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, status, goToPage]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Lấy trạng thái từ dữ liệu máy chủ đã trả, không lấy từ URL: vừa đổi tab thì URL đã đổi nhưng data vẫn là của tab cũ
  const allCount = data?.counts.all ?? 0;
  const total = data?.pagination.total ?? 0;

  return (
    <div className="container my-bookings">
      <aside className="account-side" aria-label="Tài khoản">
        <div className="account-side__user">
          <FontAwesomeIcon icon={faCircleUser} className="account-side__avatar" />
          <div className="account-side__who">
            <p className="account-side__name">{user.ho_ten}</p>
            <p className="account-side__email">{user.email}</p>
          </div>
        </div>

        <dl className="account-side__stats">
          <div>
            <dt>Chuyến sắp tới</dt>
            <dd>{data ? data.counts.cho_xac_nhan + data.counts.da_xac_nhan : '–'}</dd>
          </div>
          <div>
            <dt>Đã hoàn tất</dt>
            <dd>{data ? data.counts.hoan_tat : '–'}</dd>
          </div>
        </dl>

        {data && allCount > 0 && (
          <div className="booking-filter" role="tablist" aria-label="Lọc theo trạng thái đơn">
            {TABS.map((tab) => {
              const count = tab.value ? data.counts[tab.value] : allCount;
              return (
                <button
                  key={tab.value || 'all'}
                  type="button"
                  role="tab"
                  aria-selected={status === tab.value}
                  className={`booking-filter__item${status === tab.value ? ' booking-filter__item--active' : ''}`}
                  onClick={() => updateQuery({ nextStatus: tab.value })}
                >
                  {tab.label}
                  <span className="booking-filter__count">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </aside>

      <section className="my-bookings__main">
        <header className="my-bookings__head">
          <h1 className="my-bookings__title">Đơn của tôi</h1>
        </header>

        {error && (
          <div className="alert alert--error my-bookings__error" role="alert">
            <FontAwesomeIcon icon={faCircleExclamation} />
            <span>Không tải được danh sách đơn. {error}</span>
            <button type="button" className="btn btn--outline btn--sm" onClick={loadBookings}>
              <FontAwesomeIcon icon={faRotateRight} />
              Thử lại
            </button>
          </div>
        )}

        {!error && isLoading && !data && <ListSkeleton />}

        {!error && data && total === 0 && (
          <div className="my-bookings__empty">
            <FontAwesomeIcon icon={faSuitcaseRolling} className="my-bookings__empty-icon" />
            {allCount === 0 ? (
              <>
                <p className="my-bookings__empty-title">Bạn chưa có đơn đặt tour nào</p>
                <p className="my-bookings__empty-text">Chọn một tour và ngày khởi hành, đơn của bạn sẽ hiện ở đây.</p>
                <Link to="/tour" className="btn btn--primary">
                  Tìm tour
                </Link>
              </>
            ) : (
              <p className="my-bookings__empty-title">
                Không có đơn nào ở trạng thái "{BOOKING_STATUS[data.filter.status]?.label}"
              </p>
            )}
          </div>
        )}

        {!error && data && total > 0 && (
          <>
            <ul className={`my-bookings__list${isLoading ? ' my-bookings__list--loading' : ''}`}>
              {data.items.map((booking) => (
                <BookingTicket key={booking.ma_don} booking={booking} today={today} />
              ))}
            </ul>
            <Pagination pagination={data.pagination} itemLabel="đơn" onPageChange={goToPage} disabled={isLoading} />
          </>
        )}
      </section>
    </div>
  );
};

export default MyBookingsPage;
