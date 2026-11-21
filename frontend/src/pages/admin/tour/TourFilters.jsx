import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';
import './TourFilters.css';

const SEARCH_DELAY = 400;

const VISIBILITY_OPTIONS = [
  { value: 'visible', label: 'Đang hiển thị' },
  { value: 'hidden', label: 'Đang ẩn' },
];

const TourFilters = ({ filters, tourTypes, destinations, onChange, onClear }) => {
  const [keyword, setKeyword] = useState(filters.keyword);
  const hasFilter = Object.values(filters).some(Boolean);

  // URL đổi từ bên ngoài (Xóa bộ lọc, nút Back) thì cập nhật ô tìm kiếm. So sánh sau khi trim
  // để không xóa mất dấu cách người dùng vừa gõ giữa hai từ ("da lat").
  useEffect(() => {
    setKeyword((current) => (current.trim() === filters.keyword ? current : filters.keyword));
  }, [filters.keyword]);

  // Gõ xong một lúc mới tìm, tránh gọi API sau mỗi phím
  useEffect(() => {
    const trimmed = keyword.trim();
    if (trimmed === filters.keyword) return undefined;
    const timer = setTimeout(() => onChange({ keyword: trimmed }), SEARCH_DELAY);
    return () => clearTimeout(timer);
  }, [keyword, filters.keyword, onChange]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onChange({ keyword: keyword.trim() });
  };

  const handleSelect = (event) => onChange({ [event.target.name]: event.target.value });

  // Xóa cả chữ đang gõ dở chưa kịp tìm, nếu không lát sau ô tìm kiếm lại tự lọc theo chữ đó
  const handleClear = () => {
    setKeyword('');
    onClear();
  };

  return (
    <form className="tour-filters" role="search" onSubmit={handleSubmit}>
      <div className="tour-filters__search">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="tour-filters__search-icon" />
        <input
          type="search"
          className="input tour-filters__search-input"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tên tour hoặc mã tour"
          aria-label="Tìm theo tên tour hoặc mã tour"
          maxLength={100}
        />
      </div>

      <select
        name="tourType"
        className="input tour-filters__select"
        value={filters.tourType}
        onChange={handleSelect}
        aria-label="Lọc theo loại tour"
      >
        <option value="">Tất cả loại tour</option>
        {tourTypes.map((type) => (
          <option key={type.ma_loai_tour} value={type.ma_loai_tour}>
            {type.ten_loai_tour}
          </option>
        ))}
      </select>

      <select
        name="destination"
        className="input tour-filters__select"
        value={filters.destination}
        onChange={handleSelect}
        aria-label="Lọc theo điểm đến"
      >
        <option value="">Tất cả điểm đến</option>
        {destinations.map((destination) => (
          <option key={destination.ma_diem_den} value={destination.ma_diem_den}>
            {destination.ten_diem_den}
          </option>
        ))}
      </select>

      <select
        name="visibility"
        className="input tour-filters__select"
        value={filters.visibility}
        onChange={handleSelect}
        aria-label="Lọc theo trạng thái"
      >
        <option value="">Tất cả trạng thái</option>
        {VISIBILITY_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {hasFilter && (
        <button type="button" className="btn btn--outline tour-filters__clear" onClick={handleClear}>
          <FontAwesomeIcon icon={faXmark} />
          Xóa bộ lọc
        </button>
      )}
    </form>
  );
};

export default TourFilters;
