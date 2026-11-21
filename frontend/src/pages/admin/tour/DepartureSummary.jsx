import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCalendarDays, faPlus } from '@fortawesome/free-solid-svg-icons';
import { getTourDepartures } from '../../../api/departureApi.js';
import { getErrorMessage } from '../../../api/axiosClient.js';
import { formatDateOnly, formatWeekday } from '../../../utils/format.js';
import { DEPARTURE_STATUS, SELLING_STATUSES } from './departureStatus.js';
import './DepartureSummary.css';

const DEPARTURES_TAB = { search: '?tab=lich-khoi-hanh' };
const MAX_FOLLOWING = 3;

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-badge--${DEPARTURE_STATUS[status].badge}`}>
    {DEPARTURE_STATUS[status].label}
  </span>
);

const DepartureSummary = ({ tourId }) => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  // Tải lại mỗi lần quay về tab Thông tin để số liệu khớp với những gì vừa sửa ở tab Lịch khởi hành
  useEffect(() => {
    if (activeTab === 'lich-khoi-hanh') return undefined;
    let ignore = false;
    getTourDepartures(tourId)
      .then((data) => {
        if (ignore) return;
        // API trả lịch của tháng sắp tới đầu tiên; ưu tiên lịch đang bán, lịch đã hủy xếp sau
        const selling = data.items.filter((item) => SELLING_STATUSES.includes(item.trang_thai));
        const ordered = [...selling, ...data.items.filter((item) => !selling.includes(item))];
        setSummary({ counts: data.counts, next: ordered[0] ?? null, following: ordered.slice(1, 1 + MAX_FOLLOWING) });
      })
      .catch((err) => {
        if (!ignore) setError(getErrorMessage(err));
      });
    return () => {
      ignore = true;
    };
  }, [tourId, activeTab]);

  const renderBody = () => {
    if (error) return <p className="departure-summary__text">{error}</p>;
    if (!summary) return <p className="departure-summary__text">Đang tải...</p>;

    const { counts, next, following } = summary;
    if (!next) {
      return (
        <div className="departure-summary__empty">
          <p className="departure-summary__text">Chưa có lịch khởi hành sắp tới, khách chưa đặt được tour này.</p>
          <Link to={DEPARTURES_TAB} className="btn btn--primary btn--sm">
            <FontAwesomeIcon icon={faPlus} />
            Thêm lịch
          </Link>
        </div>
      );
    }

    const booked = next.tong_so_cho - next.so_cho_con_lai;
    return (
      <>
        <div className="departure-summary__next">
          <span className="departure-summary__label">Gần nhất</span>
          <div className="departure-summary__next-row">
            <span className="departure-summary__date">
              {formatDateOnly(next.ngay_khoi_hanh)}
              <small>{formatWeekday(next.ngay_khoi_hanh)}</small>
            </span>
            <StatusBadge status={next.trang_thai} />
          </div>
          <div className="departure-summary__seats">
            <span>
              Còn <strong>{next.so_cho_con_lai}</strong>/{next.tong_so_cho} chỗ
            </span>
            <span>Đã đặt {booked}</span>
          </div>
        </div>

        {following.length > 0 && (
          <ul className="departure-summary__following">
            {following.map((item) => (
              <li key={item.ma_lich_khoi_hanh}>
                <span>{formatDateOnly(item.ngay_khoi_hanh)}</span>
                <span className="departure-summary__following-seats">
                  còn {item.so_cho_con_lai}/{item.tong_so_cho}
                </span>
                <StatusBadge status={item.trang_thai} />
              </li>
            ))}
          </ul>
        )}

        <p className="departure-summary__counts">
          {counts.upcoming} lịch sắp tới · {counts.past} lịch đã qua
        </p>
      </>
    );
  };

  return (
    <section className="tour-form__section departure-summary" aria-labelledby="tour-section-departures">
      <div className="departure-summary__header">
        <h2 id="tour-section-departures" className="tour-form__section-title departure-summary__title">
          <FontAwesomeIcon icon={faCalendarDays} />
          Lịch khởi hành
        </h2>
        <Link to={DEPARTURES_TAB} className="departure-summary__manage">
          Quản lý
          <FontAwesomeIcon icon={faArrowRight} />
        </Link>
      </div>
      {renderBody()}
    </section>
  );
};

export default DepartureSummary;
