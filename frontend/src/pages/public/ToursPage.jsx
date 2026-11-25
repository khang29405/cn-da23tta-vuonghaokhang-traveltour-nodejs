import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleExclamation,
  faRotateRight,
  faChevronRight,
  faMagnifyingGlass,
  faSliders,
  faXmark,
  faMapLocationDot,
} from '@fortawesome/free-solid-svg-icons';
import TourCard, { TourCardSkeleton } from '../../components/TourCard/TourCard.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import TourSearchFilters from './TourSearchFilters.jsx';
import { PRICE_RANGES } from './priceRanges.js';
import { getTours } from '../../api/publicTourApi.js';
import { getTourTypes, getDestinations, getDeparturePoints, getTransports } from '../../api/categoryApi.js';
import { getErrorMessage } from '../../api/axiosClient.js';
import { formatDateOnly, formatNumber } from '../../utils/format.js';
import './ToursPage.css';

const PAGE_SIZE = 12;

// Trùng tên tham số query của GET /api/tours, nên URL trang và URL API giống nhau
const FILTER_KEYS = [
  'keyword',
  'tourType',
  'destination',
  'departurePoint',
  'transport',
  'minPrice',
  'maxPrice',
  'departureFrom',
];

const SORT_OPTIONS = [
  { value: '', label: 'Khởi hành gần nhất' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
  { value: 'newest', label: 'Tour mới nhất' },
];

const parsePage = (value) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

// Tham số gửi GET /api/tours từ chuỗi query của trang; bỏ tham số rỗng và tham số lạ
const toApiParams = (search) => {
  const query = new URLSearchParams(search);
  const params = { page: parsePage(query.get('page')), limit: PAGE_SIZE };
  [...FILTER_KEYS, 'sort'].forEach((key) => {
    const value = query.get(key);
    if (value) params[key] = value;
  });
  return params;
};

const formatMillion =(value) => `${formatNumber(Number(value) / 1_000_000)} triệu`;

// Giá trị của ô chọn giá: "minPrice-maxPrice", đầu nào để trống thì không giới hạn đầu đó
const toPriceValue = ({ minPrice, maxPrice }) => (minPrice || maxPrice ? `${minPrice}-${maxPrice}` : '');

const getPriceLabel = ({ minPrice, maxPrice }) => {
  const preset = PRICE_RANGES.find((range) => range.minPrice === minPrice && range.maxPrice === maxPrice);
  if (preset) return preset.label;
  if (minPrice && maxPrice) return `${formatMillion(minPrice)} – ${formatMillion(maxPrice)}`;
  return minPrice ? `Từ ${formatMillion(minPrice)}` : `Đến ${formatMillion(maxPrice)}`;
};

const findName = (list, idKey, nameKey, value) =>
  list?.find((item) => String(item[idKey]) === value)?.[nameKey] ?? `Mã ${value}`;

// Nhãn các bộ lọc đang chọn; mỗi nhãn kèm các khóa URL cần xóa khi bấm bỏ
const buildActiveFilters = (filters, categories) => {
  const active = [];
  if (filters.keyword) active.push({ keys: ['keyword'], label: `“${filters.keyword}”` });
  if (filters.tourType) {
    active.push({
      keys: ['tourType'],
      label: findName(categories?.tourTypes, 'ma_loai_tour', 'ten_loai_tour', filters.tourType),
    });
  }
  if (filters.departureFrom) {
    // Ngày sai định dạng thì formatDateOnly ra "Invalid Date"; vẫn hiện nguyên chữ để người dùng bấm bỏ
    const date = /^\d{4}-\d{2}-\d{2}$/.test(filters.departureFrom)
      ? formatDateOnly(filters.departureFrom)
      : filters.departureFrom;
    active.push({ keys: ['departureFrom'], label: `Đi từ ${date}` });
  }
  if (filters.departurePoint) {
    const name = findName(categories?.departurePoints, 'ma_diem_khoi_hanh', 'ten_diem_khoi_hanh', filters.departurePoint);
    active.push({ keys: ['departurePoint'], label: `Khởi hành từ ${name}` });
  }
  if (filters.destination) {
    active.push({
      keys: ['destination'],
      label: findName(categories?.destinations, 'ma_diem_den', 'ten_diem_den', filters.destination),
    });
  }
  if (filters.minPrice || filters.maxPrice) {
    active.push({ keys: ['minPrice', 'maxPrice'], label: getPriceLabel(filters) });
  }
  if (filters.transport) {
    active.push({
      keys: ['transport'],
      label: findName(categories?.transports, 'ma_phuong_tien', 'ten_phuong_tien', filters.transport),
    });
  }
  return active;
};

const ToursPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = searchParams.get('sort') ?? '';
  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) ?? '']));
  // Là chuỗi nên danh sách chỉ tải lại khi URL thật sự đổi
  const search = searchParams.toString();

  const [keywordInput, setKeywordInput] = useState(filters.keyword);
  const [syncedKeyword, setSyncedKeyword] = useState(filters.keyword);
  const [categories, setCategories] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const latestRequest = useRef(0);

  const activeFilters = buildActiveFilters(filters, categories);
  // Nút "Bộ lọc" (màn hình nhỏ) chỉ đếm các bộ lọc nằm trong cột bộ lọc
  const sidebarFilterCount = ['tourType', 'departurePoint', 'destination', 'departureFrom'].filter((key) => filters[key]).length;

  // Từ khóa trên URL đổi (bấm bỏ nhãn, Xóa bộ lọc, nút Back, link ở footer) thì ô tìm kiếm hiện theo URL
  if (syncedKeyword !== filters.keyword) {
    setSyncedKeyword(filters.keyword);
    setKeywordInput(filters.keyword);
  }

  useEffect(() => {
    if (!isFilterOpen) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && setIsFilterOpen(false);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isFilterOpen]);

  // Danh mục chỉ để đổ vào bộ lọc; tải lỗi thì bộ lọc chỉ còn lựa chọn "Tất cả", danh sách tour vẫn dùng được
  useEffect(() => {
    Promise.all([getTourTypes(), getDestinations(), getDeparturePoints(), getTransports()])
      .then(([tourTypes, destinations, departurePoints, transports]) =>
        setCategories({ tourTypes, destinations, departurePoints, transports }),
      )
      .catch(() => setCategories({ tourTypes: [], destinations: [], departurePoints: [], transports: [] }));
  }, []);

  const goToPage = useCallback(
    (nextPage, options) =>
      setSearchParams((current) => {
        if (nextPage > 1) current.set('page', nextPage);
        else current.delete('page');
        return current;
      }, options),
    [setSearchParams],
  );

  // Đổi bộ lọc hoặc cách sắp xếp thì quay về trang 1
  const changeParams = useCallback(
    (changes) =>
      setSearchParams((current) => {
        Object.entries(changes).forEach(([key, value]) => {
          if (value) current.set(key, value);
          else current.delete(key);
        });
        current.delete('page');
        return current;
      }),
    [setSearchParams],
  );

  // Khoảng giá trên URL không trùng mốc nào (ví dụ link chia sẻ) thì thêm một lựa chọn ghi đúng khoảng đó
  const priceValue = toPriceValue(filters);
  const isCustomPrice = priceValue !== '' && !PRICE_RANGES.some((range) => toPriceValue(range) === priceValue);

  const changePrice = (value) => {
    const [minPrice = '', maxPrice = ''] = value.split('-');
    changeParams({ minPrice, maxPrice });
  };

  const clearFilters = () => changeParams(Object.fromEntries(FILTER_KEYS.map((key) => [key, ''])));

  const loadTours = useCallback(async () => {
    // Đổi bộ lọc, chuyển trang liên tục: chỉ nhận kết quả của lần gọi mới nhất
    const requestId = ++latestRequest.current;
    setIsLoading(true);
    setLoadError('');
    const params = toApiParams(search);
    try {
      const result = await getTours(params);
      if (requestId !== latestRequest.current) return;
      setData(result);
      // Backend đưa số trang vượt quá về trang cuối
      if (result.pagination.page !== params.page) goToPage(result.pagination.page, { replace: true });
    } catch (error) {
      if (requestId === latestRequest.current) setLoadError(getErrorMessage(error));
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  }, [search, goToPage]);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  const handleSearch = (event) => {
    event.preventDefault();
    changeParams({ keyword: keywordInput.trim() });
  };

  const changePage = (nextPage) => {
    goToPage(nextPage);
    window.scrollTo({ top: 0 });
  };

  const tours = data?.items ?? [];
  const total = data?.pagination.total ?? 0;

  const renderResults = () => {
    if (loadError) {
      return (
        <div className="alert alert--error tours-page__error" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} />
          <span>Không tải được danh sách tour. {loadError}</span>
          <div className="tours-page__error-actions">
            {activeFilters.length > 0 && (
              <button type="button" className="btn btn--outline btn--sm" onClick={clearFilters}>
                Xóa bộ lọc
              </button>
            )}
            <button type="button" className="btn btn--outline btn--sm" onClick={loadTours}>
              <FontAwesomeIcon icon={faRotateRight} />
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    if (!data) {
      return (
        <ul className="tours-page__grid" aria-busy="true" aria-label="Đang tải danh sách tour">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index}>
              <TourCardSkeleton />
            </li>
          ))}
        </ul>
      );
    }

    if (tours.length === 0) {
      return activeFilters.length > 0 ? (
        <div className="tours-page__empty">
          <FontAwesomeIcon icon={faMapLocationDot} className="tours-page__empty-icon" />
          <p className="tours-page__empty-title">Không tìm thấy tour phù hợp</p>
          <button type="button" className="btn btn--outline btn--sm" onClick={clearFilters}>
            <FontAwesomeIcon icon={faXmark} />
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="tours-page__empty">
          <p>Hiện chưa có tour nào đang mở bán. Mời bạn quay lại sau.</p>
        </div>
      );
    }

    return (
      <>
        {/* key đổi theo danh sách tour nên mỗi lần kết quả đổi, các thẻ chạy lại hiệu ứng hiện dần */}
        <ul
          key={`${data.pagination.page}-${tours.map((tour) => tour.ma_tour).join('-')}`}
          className={`tours-page__grid${isLoading ? ' tours-page__grid--loading' : ''}`}
          aria-busy={isLoading}
        >
          {tours.map((tour, index) => (
            <li key={tour.ma_tour} className="tours-page__item" style={{ '--item-index': index }}>
              <TourCard tour={tour} />
            </li>
          ))}
        </ul>
        <Pagination
          pagination={data.pagination}
          itemLabel="tour"
          onPageChange={changePage}
          disabled={isLoading}
          showSummary={false}
        />
      </>
    );
  };

  return (
    <div className="container tours-page">
      <nav className="breadcrumb" aria-label="Đường dẫn">
        <Link to="/">Trang chủ</Link>
        <FontAwesomeIcon icon={faChevronRight} />
        <span aria-current="page">Tour du lịch</span>
      </nav>

      <header className="tours-page__header">
        <h1 className="tours-page__title">Tour du lịch trong nước</h1>
        <form className="tours-search" role="search" onSubmit={handleSearch}>
          <FontAwesomeIcon icon={faMagnifyingGlass} className="tours-search__icon" />
          <input
            type="search"
            className="tours-search__input"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="Phú Quốc, Đà Lạt, Sa Pa..."
            aria-label="Tìm theo tên tour"
            maxLength={100}
          />
          <button type="submit" className="btn btn--accent tours-search__submit">
            Tìm tour
          </button>
        </form>
      </header>

      <div className="tours-page__layout">
        <aside
          id="tour-filters"
          className={`tours-page__filters${isFilterOpen ? ' tours-page__filters--open' : ''}`}
          aria-label="Bộ lọc tour"
        >
          <div className="tours-page__filters-header">
            <h2 className="tours-page__filters-title">
              <FontAwesomeIcon icon={faSliders} />
              Bộ lọc
            </h2>
            {activeFilters.length > 0 && (
              <button type="button" className="tours-page__clear" onClick={clearFilters}>
                Xóa bộ lọc
              </button>
            )}
            <button
              type="button"
              className="tours-page__filters-close"
              onClick={() => setIsFilterOpen(false)}
              aria-label="Đóng bộ lọc"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
          <TourSearchFilters filters={filters} categories={categories} onChange={changeParams} />
          <div className="tours-page__filters-footer">
            <button type="button" className="btn btn--primary" onClick={() => setIsFilterOpen(false)}>
              {data ? `Xem ${total} tour` : 'Xem kết quả'}
            </button>
          </div>
        </aside>

        <section className="tours-page__results" aria-label="Kết quả tìm kiếm">
          {/* Lọc nhanh bên trái, sắp xếp bên phải; nút Bộ lọc chỉ hiện khi cột bộ lọc bị ẩn (màn hình nhỏ) */}
          <div className="tours-toolbar">
            <button
              type="button"
              className="tours-toolbar__control tours-toolbar__filter-toggle"
              aria-expanded={isFilterOpen}
              aria-controls="tour-filters"
              onClick={() => setIsFilterOpen((open) => !open)}
            >
              <FontAwesomeIcon icon={faSliders} />
              Bộ lọc{sidebarFilterCount > 0 && ` (${sidebarFilterCount})`}
            </button>
            <select
              className={`tours-toolbar__control${priceValue ? ' tours-toolbar__control--active' : ''}`}
              value={priceValue}
              onChange={(event) => changePrice(event.target.value)}
              aria-label="Mức giá"
            >
              <option value="">Mọi mức giá</option>
              {PRICE_RANGES.map((range) => (
                <option key={range.label} value={toPriceValue(range)}>
                  {range.label}
                </option>
              ))}
              {isCustomPrice && <option value={priceValue}>{getPriceLabel(filters)}</option>}
            </select>
            <select
              className={`tours-toolbar__control${filters.transport ? ' tours-toolbar__control--active' : ''}`}
              value={filters.transport}
              onChange={(event) => changeParams({ transport: event.target.value })}
              aria-label="Phương tiện"
            >
              <option value="">Mọi phương tiện</option>
              {categories?.transports.map((transport) => (
                <option key={transport.ma_phuong_tien} value={transport.ma_phuong_tien}>
                  {transport.ten_phuong_tien}
                </option>
              ))}
            </select>
            <label className="tours-toolbar__sort">
              <span className="tours-toolbar__sort-label">Sắp xếp:</span>
              <select
                className="tours-toolbar__control"
                value={sort}
                onChange={(event) => changeParams({ sort: event.target.value })}
              >
                {SORT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {activeFilters.length > 0 && (
            <ul className="active-filters" aria-label="Bộ lọc đang chọn">
              {activeFilters.map(({ keys, label }) => (
                <li key={keys.join()}>
                  <button
                    type="button"
                    className="active-filters__chip"
                    onClick={() => changeParams(Object.fromEntries(keys.map((key) => [key, ''])))}
                    aria-label={`Bỏ bộ lọc ${label}`}
                  >
                    {label}
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {renderResults()}
        </section>
      </div>
    </div>
  );
};

export default ToursPage;
