import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TourImage from '../TourImage/TourImage.jsx';
import { getTourTypeStyle, tourTypeCssVars } from '../../config/tourTypeStyles.js';
import { formatDayMonth, formatDuration, formatPrice, formatWeekdayShort } from '../../utils/format.js';
import { toAssetUrl } from '../../utils/assetUrl.js';
import './TourCard.css';

// Nhãn "Còn N chỗ" chỉ hiện khi lịch gần nhất sắp hết chỗ
export const FEW_SEATS = 5;

const TourCard = ({ tour }) => {
  const typeStyle = getTourTypeStyle(tour.ten_loai_tour);
  const date = tour.ngay_khoi_hanh_gan_nhat;
  const seatsLeft = tour.so_cho_con_lai_gan_nhat;

  return (
    <article className="tour-card" style={tourTypeCssVars(tour.ten_loai_tour)}>
      <Link to={`/tour/${tour.ma_tour}`} className="tour-card__link">
        <div className="tour-card__media">
          <TourImage src={toAssetUrl(tour.anh_dai_dien)} alt={tour.ten_tour} imageClassName="tour-card__image" lazy />
          <span className="tour-card__type">
            <FontAwesomeIcon icon={typeStyle.icon} />
            {tour.ten_loai_tour}
          </span>
          {/* Bước 30: nút trái tim yêu thích đặt ở góc phải ảnh */}
        </div>

        <div className="tour-card__body">
          <h3 className="tour-card__title">{tour.ten_tour}</h3>
          <p className="tour-card__facts">
            {formatDuration(tour.so_ngay, tour.so_dem)} · {tour.ten_phuong_tien} · Từ {tour.ten_diem_khoi_hanh}
          </p>
          {/* Bước 27: số sao đánh giá trung bình đặt dưới dòng thông tin */}

          <div className="tour-card__footer">
            <div className="tour-card__departure">
              {date ? (
                <>
                  <span className="tour-card__label">Khởi hành</span>
                  <span className="tour-card__date">
                    {formatWeekdayShort(date)}, {formatDayMonth(date)}
                  </span>
                  {seatsLeft <= FEW_SEATS && <span className="tour-card__seats">Còn {seatsLeft} chỗ</span>}
                </>
              ) : (
                <span className="tour-card__label">Chưa có lịch khởi hành</span>
              )}
            </div>
            <div className="tour-card__price">
              <span className="tour-card__price-value">{formatPrice(tour.gia)}</span>
              <span className="tour-card__label">mỗi khách</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export const TourCardSkeleton = () => (
  <div className="tour-card tour-card--skeleton" aria-hidden="true">
    <div className="tour-card__media skeleton" />
    <div className="tour-card__body">
      <div className="skeleton tour-card__line" />
      <div className="skeleton tour-card__line tour-card__line--short" />
      <div className="skeleton tour-card__line tour-card__line--price" />
    </div>
  </div>
);

export default TourCard;
