import { useId, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

// Mặc định mở ngày đầu để khách thấy ngay cách đọc lịch trình mà trang không bị dài
const TourItinerary = ({ title, days }) => {
  const baseId = useId();
  const [openDays, setOpenDays] = useState(() => new Set(days.slice(0, 1).map((day) => day.ma_lich_trinh)));
  const expandable = days.filter((day) => day.noi_dung_hoat_dong);
  const allOpen = expandable.length > 0 && expandable.every((day) => openDays.has(day.ma_lich_trinh));

  const toggleDay = (id) =>
    setOpenDays((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => setOpenDays(allOpen ? new Set() : new Set(expandable.map((day) => day.ma_lich_trinh)));

  return (
    <>
      <div className="tour-detail__section-head">
        <h2 className="tour-detail__heading">{title}</h2>
        {expandable.length > 1 && (
          <button type="button" className="tour-detail__head-action" onClick={toggleAll}>
            {allOpen ? 'Thu gọn tất cả' : 'Mở tất cả'}
          </button>
        )}
      </div>
      <ol className="day-plan">
        {days.map((day) => {
          const isOpen = openDays.has(day.ma_lich_trinh);
          const bodyId = `${baseId}-${day.ma_lich_trinh}`;
          return (
            <li key={day.ma_lich_trinh} className={`day-plan__day${isOpen ? ' day-plan__day--open' : ''}`}>
              <span className="day-plan__marker" aria-hidden="true">
                {day.ngay_thu}
              </span>
              <div className="day-plan__content">
                {day.noi_dung_hoat_dong ? (
                  <button
                    type="button"
                    className="day-plan__head"
                    aria-expanded={isOpen}
                    aria-controls={bodyId}
                    onClick={() => toggleDay(day.ma_lich_trinh)}
                  >
                    <span className="day-plan__label">Ngày {day.ngay_thu}</span>
                    <span className="day-plan__title">{day.tieu_de}</span>
                    <FontAwesomeIcon icon={faChevronDown} className="day-plan__chevron" />
                  </button>
                ) : (
                  <p className="day-plan__head">
                    <span className="day-plan__label">Ngày {day.ngay_thu}</span>
                    <span className="day-plan__title">{day.tieu_de}</span>
                  </p>
                )}
                {day.noi_dung_hoat_dong && (
                  <div id={bodyId} className="day-plan__body" hidden={!isOpen}>
                    <p>{day.noi_dung_hoat_dong}</p>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
};

export default TourItinerary;
