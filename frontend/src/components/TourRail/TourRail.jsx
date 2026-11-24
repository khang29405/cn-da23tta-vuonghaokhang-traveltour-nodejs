import { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import TourCard, { TourCardSkeleton } from '../TourCard/TourCard.jsx';
import './TourRail.css';

const SKELETON_COUNT = 4;

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Dải thẻ tour cuộn ngang: điện thoại vuốt (scroll-snap), máy tính có thêm nút trái/phải
const TourRail = ({ tours, label, isLoading = false }) => {
  const trackRef = useRef(null);
  const [canScroll, setCanScroll] = useState({ prev: false, next: false });

  // Sai số vài px vì trình duyệt làm tròn vị trí cuộn
  const updateButtons = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScroll({
      prev: track.scrollLeft > 4,
      next: track.scrollLeft + track.clientWidth < track.scrollWidth - 4,
    });
  }, []);

  // Đổi danh sách tour (ví dụ đổi tab loại tour) thì cuộn về đầu dải
  useEffect(() => {
    if (trackRef.current) trackRef.current.scrollLeft = 0;
    updateButtons();
    window.addEventListener('resize', updateButtons);
    return () => window.removeEventListener('resize', updateButtons);
  }, [tours, isLoading, updateButtons]);

  const scrollByPage = (direction) => {
    const track = trackRef.current;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <div className="tour-rail">
      <ul className="tour-rail__track" ref={trackRef} onScroll={updateButtons} aria-label={label} aria-busy={isLoading}>
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <li key={index} className="tour-rail__item">
                <TourCardSkeleton />
              </li>
            ))
          : tours.map((tour) => (
              <li key={tour.ma_tour} className="tour-rail__item">
                <TourCard tour={tour} />
              </li>
            ))}
      </ul>

      {canScroll.prev && (
        <button type="button" className="tour-rail__arrow tour-rail__arrow--prev" aria-label="Xem các tour trước" onClick={() => scrollByPage(-1)}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
      )}
      {canScroll.next && (
        <button type="button" className="tour-rail__arrow tour-rail__arrow--next" aria-label="Xem thêm tour" onClick={() => scrollByPage(1)}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      )}
    </div>
  );
};

export default TourRail;
