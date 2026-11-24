import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import TourImage from '../../components/TourImage/TourImage.jsx';
import { FEW_SEATS } from '../../components/TourCard/TourCard.jsx';
import { tourTypeCssVars } from '../../config/tourTypeStyles.js';
import { toAssetUrl } from '../../utils/assetUrl.js';
import { formatDuration, formatPrice, formatWeekdayShort } from '../../utils/format.js';
import './UpcomingDepartures.css';

// Bảng "Sắp khởi hành" ở trang chủ: mỗi dòng là lịch còn chỗ gần nhất của một tour, xếp theo ngày.
// Ảnh nhỏ chỉ để trang trí (tên tour đã có bên cạnh) nên alt rỗng.
const UpcomingDepartures = ({ tours }) => (
  <ol className="departure-board">
    {tours.map((tour) => {
      const [, month, day] = tour.ngay_khoi_hanh_gan_nhat.split('-');
      const seatsLeft = tour.so_cho_con_lai_gan_nhat;
      return (
        <li key={tour.ma_tour} style={tourTypeCssVars(tour.ten_loai_tour)}>
          <Link to={`/tour/${tour.ma_tour}`} className="departure-board__row">
            <div className="departure-board__media">
              <TourImage src={toAssetUrl(tour.anh_dai_dien)} alt="" imageClassName="departure-board__image" lazy />
              <span className="departure-board__date" aria-label={`Khởi hành ngày ${day} tháng ${Number(month)}`}>
                <span className="departure-board__month">Th {Number(month)}</span>
                <span className="departure-board__day">{day}</span>
                <span className="departure-board__weekday">{formatWeekdayShort(tour.ngay_khoi_hanh_gan_nhat)}</span>
              </span>
            </div>

            <span className="departure-board__info">
              <span className="departure-board__name">{tour.ten_tour}</span>
              <span className="departure-board__facts">
                {formatDuration(tour.so_ngay, tour.so_dem)} · Từ {tour.ten_diem_khoi_hanh}
              </span>
              <span className={`departure-board__seats${seatsLeft <= FEW_SEATS ? ' departure-board__seats--few' : ''}`}>
                Còn {seatsLeft} chỗ
              </span>
            </span>

            <span className="departure-board__price">
              {formatPrice(tour.gia)}
              <FontAwesomeIcon icon={faChevronRight} className="departure-board__arrow" />
            </span>
          </Link>
        </li>
      );
    })}
  </ol>
);

export const UpcomingDeparturesSkeleton = () => (
  <ul className="departure-board" aria-hidden="true">
    {Array.from({ length: 4 }, (_, index) => (
      <li key={index} className="departure-board__row">
        <span className="skeleton departure-board__media" />
        <span className="departure-board__info">
          <span className="skeleton departure-board__line" />
          <span className="skeleton departure-board__line departure-board__line--short" />
        </span>
      </li>
    ))}
  </ul>
);

export default UpcomingDepartures;
