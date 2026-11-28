import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faPhone } from '@fortawesome/free-solid-svg-icons';
import siteInfo from '../../config/siteInfo.js';
import { bookingPath } from '../../config/booking.js';
import { FEW_SEATS } from '../../components/TourCard/TourCard.jsx';
import { addDays, formatDateOnly, formatPrice, formatWeekday } from '../../utils/format.js';

const hotlineHref = `tel:${siteInfo.hotline.replace(/\s/g, '')}`;
const CHIP_COUNT = 4;

// Đúng quy trình đặt tour của hệ thống (Bước 20–23), không phải câu quảng cáo
const PROMISES = [
  'Giữ chỗ ngay, chưa cần thanh toán',
  'Nhân viên gọi xác nhận rồi mới thu tiền',
  'Tự hủy được khi đơn chưa được xác nhận',
];

const shortDate = (date) => formatDateOnly(date).slice(0, 5);

const TourBookingBox = ({ ref, tour, selected, onSelect, canBook, onShowAllDates }) => {
  const departures = tour.lich_khoi_hanh;
  const chips = departures.slice(0, CHIP_COUNT);
  const moreCount = departures.length - chips.length;
  const returnDate = selected && tour.so_ngay > 1 ? addDays(selected.ngay_khoi_hanh, tour.so_ngay - 1) : null;

  return (
    <aside className="booking-box" aria-label="Giá và đặt tour" ref={ref}>
      <p className="booking-box__label">Giá mỗi khách</p>
      <p className="booking-box__price">{formatPrice(tour.gia)}</p>

      {departures.length > 0 ? (
        <div className="booking-box__dates">
          <p className="booking-box__dates-label">Chọn ngày khởi hành</p>
          <div className="date-chips" role="radiogroup" aria-label="Ngày khởi hành">
            {chips.map((departure) => {
              const isSelected = departure.ma_lich_khoi_hanh === selected?.ma_lich_khoi_hanh;
              const isFew = departure.so_cho_con_lai <= FEW_SEATS;
              return (
                <button
                  key={departure.ma_lich_khoi_hanh}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`date-chip${isSelected ? ' date-chip--selected' : ''}`}
                  onClick={() => onSelect(departure.ma_lich_khoi_hanh)}
                >
                  <span className="date-chip__date">{shortDate(departure.ngay_khoi_hanh)}</span>
                  <span className="date-chip__weekday">{formatWeekday(departure.ngay_khoi_hanh)}</span>
                  <span className={`date-chip__seats${isFew ? ' date-chip__seats--few' : ''}`}>
                    Còn {departure.so_cho_con_lai} chỗ
                  </span>
                </button>
              );
            })}
          </div>
          {moreCount > 0 && (
            <button type="button" className="booking-box__link" onClick={onShowAllDates}>
              Xem thêm {moreCount} ngày khởi hành khác
            </button>
          )}
          {selected && (
            <p className="booking-box__trip">
              {formatWeekday(selected.ngay_khoi_hanh)}, {formatDateOnly(selected.ngay_khoi_hanh)}
              {returnDate && ` → ${formatDateOnly(returnDate)}`}
            </p>
          )}
        </div>
      ) : (
        <p className="booking-box__empty">
          Tour hiện chưa có lịch khởi hành còn chỗ. Gọi <a href={hotlineHref}>{siteInfo.hotline}</a> để được báo khi có lịch
          mới.
        </p>
      )}

      {selected && canBook && (
        <Link to={bookingPath(tour.ma_tour, selected.ma_lich_khoi_hanh)} className="btn btn--accent booking-box__action">
          Đặt tour
        </Link>
      )}
      {!canBook && <p className="booking-box__staff-note">Chỉ tài khoản khách hàng mới đặt được tour.</p>}

      {departures.length > 0 && (
        <ul className="booking-box__promises">
          {PROMISES.map((text) => (
            <li key={text}>
              <FontAwesomeIcon icon={faCircleCheck} />
              {text}
            </li>
          ))}
        </ul>
      )}

      <p className="booking-box__help">
        Cần tư vấn?{' '}
        <a href={hotlineHref}>
          <FontAwesomeIcon icon={faPhone} /> {siteInfo.hotline}
        </a>
      </p>
    </aside>
  );
};

// Điện thoại: hộp đặt tour đã cuộn khuất thì thanh này giữ giá và nút đặt luôn trong tầm tay
export const MobileBookingBar = ({ tour, selected, visible }) => (
  <div className={`book-bar${visible ? ' book-bar--visible' : ''}`} aria-hidden={!visible}>
    <div className="book-bar__info">
      <span className="book-bar__price">{formatPrice(tour.gia)}</span>
      <span className="book-bar__date">
        / khách · {shortDate(selected.ngay_khoi_hanh)}, còn {selected.so_cho_con_lai} chỗ
      </span>
    </div>
    <Link
      to={bookingPath(tour.ma_tour, selected.ma_lich_khoi_hanh)}
      className="btn btn--accent book-bar__action"
      tabIndex={visible ? undefined : -1}
    >
      Đặt tour
    </Link>
  </div>
);

export default TourBookingBox;
