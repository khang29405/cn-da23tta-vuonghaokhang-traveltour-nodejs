import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag,
  faCalendarCheck,
  faCircleXmark,
  faHeadset,
  faLocationDot,
  faPlaneDeparture,
  faCalendarDays,
  faMagnifyingGlass,
  faChevronRight,
  faCircleExclamation,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import HeroSlider from '../../components/HeroSlider/HeroSlider.jsx';
import TourRail from '../../components/TourRail/TourRail.jsx';
import UpcomingDepartures, { UpcomingDeparturesSkeleton } from './UpcomingDepartures.jsx';
import heroSlides from '../../config/heroSlides.js';
import { getTourTypeStyle, tourTypeCssVars } from '../../config/tourTypeStyles.js';
import { getHomeTours } from '../../api/publicTourApi.js';
import { getDeparturePoints } from '../../api/categoryApi.js';
import { getErrorMessage } from '../../api/axiosClient.js';
import { useReveal } from '../../hooks/useReveal.js';
import { toDateInputValue } from '../../utils/format.js';
import './HomePage.css';

const highlights = [
  { title: 'Giá rõ ràng', text: 'Tổng tiền tính sẵn theo số khách', icon: faTag },
  { title: 'Giữ chỗ ngay', text: 'Đặt trước, thanh toán sau khi xác nhận', icon: faCalendarCheck },
  { title: 'Hủy dễ dàng', text: 'Tự hủy khi đơn chưa được xác nhận', icon: faCircleXmark },
  { title: 'Có người xác nhận', text: 'Nhân viên kiểm tra từng đơn đặt tour', icon: faHeadset },
];

// Chiều cao navbar dính trên cùng; thanh tìm kiếm thu gọn hiện ngay dưới nó
const NAVBAR_HEIGHT = 60;

// Tham số query trùng với bộ lọc của trang /tour
const buildSearchQuery = ({ keyword, departurePoint, departureFrom }) => {
  const params = new URLSearchParams();
  if (keyword.trim()) params.set('keyword', keyword.trim());
  if (departurePoint) params.set('departurePoint', departurePoint);
  if (departureFrom) params.set('departureFrom', departureFrom);
  const query = params.toString();
  return query ? `/tour?${query}` : '/tour';
};

const HomeSection = ({ title, subtitle, moreLink, children }) => {
  const [ref, isVisible] = useReveal();
  return (
    <section ref={ref} className={`home-section reveal${isVisible ? ' reveal--visible' : ''}`}>
      <div className="home-section__header">
        <div>
          <h2 className="home-section__title">{title}</h2>
          {subtitle && <p className="home-section__subtitle">{subtitle}</p>}
        </div>
        {moreLink && (
          <Link to={moreLink} className="home-section__more">
            Xem tất cả <FontAwesomeIcon icon={faChevronRight} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
};

const TourTypeTabs = ({ groups, activeId, onSelect }) => (
  <div className="type-tabs" role="tablist" aria-label="Loại tour">
    {groups.map((group) => {
      const { icon } = getTourTypeStyle(group.ten_loai_tour);
      const isActive = group.ma_loai_tour === activeId;
      return (
        <button
          key={group.ma_loai_tour}
          type="button"
          role="tab"
          aria-selected={isActive}
          className={`type-tabs__tab${isActive ? ' type-tabs__tab--active' : ''}`}
          style={tourTypeCssVars(group.ten_loai_tour)}
          onClick={() => onSelect(group.ma_loai_tour)}
        >
          <span className="type-tabs__icon">
            <FontAwesomeIcon icon={icon} />
          </span>
          {group.ten_loai_tour}
        </button>
      );
    })}
  </div>
);

const HomePage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ keyword: '', departurePoint: '', departureFrom: '' });
  const [departurePoints, setDeparturePoints] = useState([]);
  const [home, setHome] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTypeId, setActiveTypeId] = useState(null);
  const [showCompactSearch, setShowCompactSearch] = useState(false);
  const searchPanelRef = useRef(null);

  const loadHome = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await getHomeTours();
      setHome(data);
      setActiveTypeId((current) => current ?? data.theo_loai_tour[0]?.ma_loai_tour ?? null);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  // Tải lỗi thì ô chọn chỉ còn "Tất cả điểm khởi hành", vẫn tìm được theo từ khóa
  useEffect(() => {
    getDeparturePoints()
      .then(setDeparturePoints)
      .catch(() => {});
  }, []);

  // Khung tìm kiếm đã cuộn lên khuất dưới navbar thì hiện thanh tìm kiếm thu gọn
  useEffect(() => {
    const panel = searchPanelRef.current;
    if (!panel || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setShowCompactSearch(!entry.isIntersecting && entry.boundingClientRect.top < NAVBAR_HEIGHT),
      { rootMargin: `-${NAVBAR_HEIGHT}px 0px 0px 0px` },
    );
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  const changeSearch = ({ target: { name, value } }) => setSearch((current) => ({ ...current, [name]: value }));

  const handleSearch = (event) => {
    event.preventDefault();
    navigate(buildSearchQuery(search));
  };

  const typeGroups = home?.theo_loai_tour ?? [];
  const activeGroup = typeGroups.find((group) => group.ma_loai_tour === activeTypeId) ?? typeGroups[0];
  const hasNoTour =
    home && home.sap_khoi_hanh.length === 0 && home.tour_moi.length === 0 && typeGroups.length === 0;

  const renderTours = () => {
    if (loadError) {
      return (
        <div className="alert alert--error home-error" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} />
          <span>Không tải được danh sách tour. {loadError}</span>
          <button type="button" className="btn btn--outline btn--sm" onClick={loadHome}>
            <FontAwesomeIcon icon={faRotateRight} />
            Thử lại
          </button>
        </div>
      );
    }

    if (isLoading && !home) {
      return (
        <div aria-busy="true" aria-label="Đang tải tour">
          <section className="home-section">
            <div className="skeleton home-section__title-skeleton" />
            <UpcomingDeparturesSkeleton />
          </section>
          <section className="home-section">
            <div className="skeleton home-section__title-skeleton" />
            <TourRail tours={[]} label="Đang tải tour" isLoading />
          </section>
        </div>
      );
    }

    if (hasNoTour) {
      return <div className="home-section home-section__empty">Hiện chưa có tour nào đang mở bán. Mời bạn quay lại sau.</div>;
    }

    return (
      <>
        {home.sap_khoi_hanh.length > 0 && (
          <HomeSection title="Sắp khởi hành" subtitle="Ngày đi gần nhất còn chỗ của từng tour" moreLink="/tour">
            <UpcomingDepartures tours={home.sap_khoi_hanh} />
          </HomeSection>
        )}

        {activeGroup && (
          <HomeSection title="Khám phá theo loại tour" moreLink={`/tour?tourType=${activeGroup.ma_loai_tour}`}>
            <TourTypeTabs groups={typeGroups} activeId={activeGroup.ma_loai_tour} onSelect={setActiveTypeId} />
            <TourRail tours={activeGroup.danh_sach_tour} label={`Tour ${activeGroup.ten_loai_tour}`} />
          </HomeSection>
        )}

        {home.tour_moi.length > 0 && (
          <HomeSection title="Tour mới" subtitle="Hành trình vừa được thêm vào hệ thống" moreLink="/tour?sort=newest">
            <TourRail tours={home.tour_moi} label="Tour mới" />
          </HomeSection>
        )}
      </>
    );
  };

  return (
    <>
      <HeroSlider slides={heroSlides}>
        <h1 className="hero__title">
          Tìm tour cho chuyến đi tiếp&nbsp;theo
        </h1>
        <p className="hero__subtitle">Biển gọi, núi chờ. Xem lịch còn chỗ và giữ chỗ trong vài phút.</p>
      </HeroSlider>

      <div
        className={`compact-search${showCompactSearch ? ' compact-search--visible' : ''}`}
        aria-hidden={!showCompactSearch}
      >
        <form className="container compact-search__form" onSubmit={handleSearch}>
          <div className="compact-search__control">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="compact-search__icon" />
            <input
              name="keyword"
              className="input"
              placeholder="Bạn muốn đi đâu?"
              aria-label="Bạn muốn đi đâu?"
              value={search.keyword}
              onChange={changeSearch}
              tabIndex={showCompactSearch ? 0 : -1}
            />
          </div>
          <button type="submit" className="btn btn--accent" tabIndex={showCompactSearch ? 0 : -1}>
            Tìm tour
          </button>
        </form>
      </div>

      <div className="container">
        <form className="search-panel" onSubmit={handleSearch} ref={searchPanelRef}>
          <div className="search-panel__fields">
            <div className="search-panel__field search-panel__field--wide">
              <label htmlFor="search-keyword" className="form-label">
                Bạn muốn đi đâu?
              </label>
              <div className="search-panel__control">
                <FontAwesomeIcon icon={faLocationDot} className="search-panel__icon" />
                <input
                  id="search-keyword"
                  name="keyword"
                  className="input"
                  placeholder="Phú Quốc, Đà Lạt, Sa Pa..."
                  value={search.keyword}
                  onChange={changeSearch}
                />
              </div>
            </div>

            <div className="search-panel__field">
              <label htmlFor="search-departure" className="form-label">
                Khởi hành từ
              </label>
              <div className="search-panel__control">
                <FontAwesomeIcon icon={faPlaneDeparture} className="search-panel__icon" />
                <select
                  id="search-departure"
                  name="departurePoint"
                  className="input"
                  value={search.departurePoint}
                  onChange={changeSearch}
                >
                  <option value="">Tất cả điểm khởi hành</option>
                  {departurePoints.map((point) => (
                    <option key={point.ma_diem_khoi_hanh} value={point.ma_diem_khoi_hanh}>
                      {point.ten_diem_khoi_hanh}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="search-panel__field">
              <label htmlFor="search-date" className="form-label">
                Ngày khởi hành
              </label>
              <div className="search-panel__control">
                <FontAwesomeIcon icon={faCalendarDays} className="search-panel__icon" />
                <input
                  id="search-date"
                  name="departureFrom"
                  type="date"
                  className="input"
                  min={toDateInputValue(new Date())}
                  value={search.departureFrom}
                  onChange={changeSearch}
                />
              </div>
            </div>

            <button type="submit" className="btn btn--accent search-panel__submit">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              Tìm tour
            </button>
          </div>
        </form>

        <ul className="highlights">
          {highlights.map(({ title, text, icon }) => (
            <li key={title} className="highlights__item">
              <FontAwesomeIcon icon={icon} className="highlights__icon" />
              <div>
                <p className="highlights__title">{title}</p>
                <p className="highlights__text">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        {renderTours()}
      </div>
    </>
  );
};

export default HomePage;
