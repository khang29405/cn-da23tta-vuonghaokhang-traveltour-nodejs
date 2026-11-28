import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import TourRail from '../../components/TourRail/TourRail.jsx';
import { getTours } from '../../api/publicTourApi.js';
import { useReveal } from '../../hooks/useReveal.js';

const MAX_TOURS = 8;

// Lấy dư một tour vì tour đang xem có thể nằm trong kết quả; lỗi thì ẩn cả dải, không làm hỏng trang chi tiết
const RelatedTours = ({ tourId, tourTypeId, tourTypeName }) => {
  const [result, setResult] = useState({ key: null, tours: [] });
  const [ref, isVisible] = useReveal();
  const key = `${tourTypeId}-${tourId}`;

  useEffect(() => {
    let ignore = false;
    getTours({ tourType: tourTypeId, limit: MAX_TOURS + 1 })
      .then((data) => {
        if (!ignore) setResult({ key, tours: data.items.filter((tour) => tour.ma_tour !== tourId).slice(0, MAX_TOURS) });
      })
      .catch(() => {
        if (!ignore) setResult({ key, tours: [] });
      });
    return () => {
      ignore = true;
    };
  }, [key, tourId, tourTypeId]);

  const isLoading = result.key !== key;
  if (!isLoading && result.tours.length === 0) return null;

  return (
    <section ref={ref} className={`related-tours reveal${isVisible ? ' reveal--visible' : ''}`}>
      <div className="related-tours__head">
        <h2 className="related-tours__title">Tour {tourTypeName.toLowerCase()} khác</h2>
        <Link to={`/tour?tourType=${tourTypeId}`} className="related-tours__more">
          Xem tất cả <FontAwesomeIcon icon={faChevronRight} />
        </Link>
      </div>
      <TourRail tours={result.tours} label={`Tour ${tourTypeName.toLowerCase()} khác`} isLoading={isLoading} />
    </section>
  );
};

export default RelatedTours;
