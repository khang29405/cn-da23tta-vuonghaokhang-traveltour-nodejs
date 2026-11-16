import { Link } from 'react-router-dom';
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
} from '@fortawesome/free-solid-svg-icons';
import HeroSlider from '../../components/HeroSlider/HeroSlider.jsx';
import heroSlides from '../../config/heroSlides.js';
import './HomePage.css';

// Dữ liệu tạm, Bước 16 và 19 thay bằng API danh mục
const departurePoints = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ'];

const highlights = [
  { title: 'Giá rõ ràng', text: 'Tổng tiền tính sẵn theo số khách', icon: faTag },
  { title: 'Giữ chỗ ngay', text: 'Đặt trước, thanh toán sau khi xác nhận', icon: faCalendarCheck },
  { title: 'Hủy dễ dàng', text: 'Tự hủy khi đơn chưa được xác nhận', icon: faCircleXmark },
  { title: 'Có người xác nhận', text: 'Nhân viên kiểm tra từng đơn đặt tour', icon: faHeadset },
];

const HomePage = () => {
  const handleSearch = (event) => event.preventDefault();

  return (
    <>
      <HeroSlider slides={heroSlides}>
        <h1 className="hero__title">
          Tour trong nước,
          <br />
          khởi hành mỗi tuần
        </h1>
        <p className="hero__subtitle">Chọn điểm đến, xem lịch còn chỗ và giữ chỗ trong vài phút.</p>
      </HeroSlider>

      <div className="container">
        <form className="search-panel" onSubmit={handleSearch}>
          <div className="search-panel__fields">
            <div className="search-panel__field search-panel__field--wide">
              <label htmlFor="search-keyword" className="form-label">
                Bạn muốn đi đâu?
              </label>
              <div className="search-panel__control">
                <FontAwesomeIcon icon={faLocationDot} className="search-panel__icon" />
                <input id="search-keyword" className="input" placeholder="Phú Quốc, Đà Lạt, Sa Pa..." />
              </div>
            </div>

            <div className="search-panel__field">
              <label htmlFor="search-departure" className="form-label">
                Khởi hành từ
              </label>
              <div className="search-panel__control">
                <FontAwesomeIcon icon={faPlaneDeparture} className="search-panel__icon" />
                <select id="search-departure" className="input">
                  {departurePoints.map((point) => (
                    <option key={point}>{point}</option>
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
                <input id="search-date" type="date" className="input" />
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

        <section className="home-section">
          <div className="home-section__header">
            <h2 className="home-section__title">Sắp khởi hành</h2>
            <Link to="/tour" className="home-section__more">
              Xem tất cả <FontAwesomeIcon icon={faChevronRight} />
            </Link>
          </div>
          {/* Bước 16 thay khối này bằng các dải TourRail lấy từ GET /api/tours/home */}
          <div className="home-section__empty">
            Chưa có lịch khởi hành nào. Các tour sắp khởi hành sẽ xuất hiện tại đây.
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;
