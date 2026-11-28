import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { bookingPath } from '../../config/booking.js';
import { FEW_SEATS } from '../../components/TourCard/TourCard.jsx';
import { addDays, formatDateOnly, formatWeekday } from '../../utils/format.js';

const seatTone = (left) => (left <= FEW_SEATS ? 'few' : 'ok');

// Có tab tháng thì tab đã ghi tháng, thẻ không lặp lại
const CardBody = ({ departure, days, showMonth }) => {
  const [year, month, day] = departure.ngay_khoi_hanh.split('-');
  const returnDate = days > 1 ? addDays(departure.ngay_khoi_hanh, days - 1) : null;
  const left = departure.so_cho_con_lai;
  return (
    <>
      {showMonth && (
        <span className="departure-card__month">
          Tháng {Number(month)}/{year}
        </span>
      )}
      <span className="departure-card__day">{day}</span>
      <span className="departure-card__weekday">{formatWeekday(departure.ngay_khoi_hanh)}</span>
      <span className="departure-card__return">
        {returnDate ? `Về ${formatDateOnly(returnDate)}` : 'Đi về trong ngày'}
      </span>
      <span className={`departure-card__seats departure-card__seats--${seatTone(left)}`}>
        <span className="departure-card__seat-text">
          {left <= FEW_SEATS ? `Chỉ còn ${left} chỗ` : `Còn ${left}/${departure.tong_so_cho} chỗ`}
        </span>
        <span className="departure-card__bar" aria-hidden="true">
          <span style={{ width: `${Math.max((left / departure.tong_so_cho) * 100, 4)}%` }} />
        </span>
      </span>
    </>
  );
};

// Lịch đã sắp theo ngày nên các tháng ra đúng thứ tự; khóa YYYY-MM lấy từ chuỗi ngày, không qua Date để khỏi lệch múi giờ
const groupByMonth = (departures) => {
  const groups = [];
  departures.forEach((departure) => {
    const key = departure.ngay_khoi_hanh.slice(0, 7);
    const last = groups.at(-1);
    if (last?.key === key) last.items.push(departure);
    else groups.push({ key, items: [departure] });
  });
  return groups;
};

const monthLabel = (key) => {
  const [year, month] = key.split('-');
  return `Tháng ${Number(month)}/${year}`;
};

// Giá như nhau ở mọi lịch (giá theo tour) nên thẻ không lặp giá; bấm thẻ là đặt đúng ngày đó.
// Tour mở lịch nhiều tháng thì chia tab theo tháng để phần này không kéo dài trang
const DepartureCards = ({ departures, days, tourId, canBook }) => {
  const months = groupByMonth(departures);
  const [activeKey, setActiveKey] = useState(months[0].key);
  const activeMonth = months.find((month) => month.key === activeKey) ?? months[0];
  const panelId = useId();

  return (
    <>
      {months.length > 1 && (
        <div className="month-tabs" role="tablist" aria-label="Tháng khởi hành">
          {months.map((month) => {
            const isActive = month.key === activeMonth.key;
            return (
              <button
                key={month.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId}
                className={`month-tabs__item${isActive ? ' month-tabs__item--active' : ''}`}
                onClick={() => setActiveKey(month.key)}
              >
                {monthLabel(month.key)}
                <span className="month-tabs__count">{month.items.length}</span>
              </button>
            );
          })}
        </div>
      )}
      <ul id={panelId} className="departure-cards" role={months.length > 1 ? 'tabpanel' : undefined}>
        {activeMonth.items.map((departure) => (
          <li key={departure.ma_lich_khoi_hanh}>
            {canBook ? (
              <Link
                to={bookingPath(tourId, departure.ma_lich_khoi_hanh)}
                className="departure-card departure-card--link"
                aria-label={`Đặt tour ngày ${formatDateOnly(departure.ngay_khoi_hanh)}, còn ${departure.so_cho_con_lai} chỗ`}
              >
                <CardBody departure={departure} days={days} showMonth={months.length === 1} />
                <span className="departure-card__cta">
                  Đặt ngày này <FontAwesomeIcon icon={faArrowRight} />
                </span>
              </Link>
            ) : (
              <div className="departure-card">
                <CardBody departure={departure} days={days} showMonth={months.length === 1} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
};

export default DepartureCards;
