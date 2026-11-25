import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { getTourTypeStyle, tourTypeCssVars } from '../../config/tourTypeStyles.js';
import { toDateInputValue } from '../../utils/format.js';
import './TourSearchFilters.css';

const FilterGroup = ({ title, children }) => (
  <div className="filter-group" role="group" aria-label={title}>
    <p className="filter-group__title">{title}</p>
    {children}
  </div>
);

const ListSkeleton = ({ rows }) => (
  <div className="type-options" aria-hidden="true">
    {Array.from({ length: rows }, (_, index) => (
      <span key={index} className="skeleton filter-skeleton" />
    ))}
  </div>
);

// Mỗi nhóm chọn một giá trị; bấm lại mục đang chọn thì bỏ chọn (không cần dòng "Tất cả")
const TourSearchFilters = ({ filters, categories, onChange }) => {
  const [today] = useState(() => toDateInputValue(new Date()));
  const isLoading = !categories;
  const { tourTypes = [], destinations = [], departurePoints = [] } = categories ?? {};

  const toggle = (key, value) => onChange({ [key]: filters[key] === value ? '' : value });

  return (
    <div className="tour-search-filters">
      {/* Ngày đi thường là điều kiện khách quyết định đầu tiên nên đặt đầu cột và làm nổi bật */}
      <div className="filter-date" role="group" aria-labelledby="filter-date-title">
        <label id="filter-date-title" htmlFor="filter-date" className="filter-date__title">
          <span className="filter-date__icon">
            <FontAwesomeIcon icon={faCalendarDays} />
          </span>
          Ngày khởi hành
        </label>
        <input
          id="filter-date"
          type="date"
          name="departureFrom"
          className={`input filter-group__input${filters.departureFrom ? ' filter-date__input--active' : ''}`}
          min={today}
          value={filters.departureFrom}
          onChange={(event) => onChange({ departureFrom: event.target.value })}
        />
      </div>

      <FilterGroup title="Loại tour">
        {isLoading ? (
          <ListSkeleton rows={8} />
        ) : (
          <div className="type-options">
            {tourTypes.map((type) => {
              const value = String(type.ma_loai_tour);
              const selected = filters.tourType === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={`type-option${selected ? ' type-option--selected' : ''}`}
                  style={tourTypeCssVars(type.ten_loai_tour)}
                  aria-pressed={selected}
                  onClick={() => toggle('tourType', value)}
                >
                  <span className="type-option__icon">
                    <FontAwesomeIcon icon={getTourTypeStyle(type.ten_loai_tour).icon} />
                  </span>
                  <span className="type-option__name">{type.ten_loai_tour}</span>
                </button>
              );
            })}
          </div>
        )}
      </FilterGroup>

      <FilterGroup title="Khởi hành từ">
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : (
          <div className="type-options">
            {departurePoints.map((point) => {
              const value = String(point.ma_diem_khoi_hanh);
              const selected = filters.departurePoint === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={`type-option type-option--point${selected ? ' type-option--selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() => toggle('departurePoint', value)}
                >
                  <span className="type-option__name">{point.ten_diem_khoi_hanh}</span>
                </button>
              );
            })}
          </div>
        )}
      </FilterGroup>

      <FilterGroup title="Điểm đến">
        {isLoading ? (
          <span className="skeleton filter-group__input-skeleton" />
        ) : (
          <select
            name="destination"
            className="input filter-group__input"
            value={filters.destination}
            onChange={(event) => onChange({ destination: event.target.value })}
            aria-label="Điểm đến"
          >
            <option value="">Tất cả điểm đến</option>
            {destinations.map((destination) => (
              <option key={destination.ma_diem_den} value={destination.ma_diem_den}>
                {destination.ten_diem_den}
              </option>
            ))}
          </select>
        )}
      </FilterGroup>
    </div>
  );
};

export default TourSearchFilters;
