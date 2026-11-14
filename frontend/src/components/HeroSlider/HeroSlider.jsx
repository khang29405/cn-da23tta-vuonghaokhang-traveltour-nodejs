import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import './HeroSlider.css';

const SLIDE_DURATION = 6000;
const SWIPE_DISTANCE = 50;

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const HeroSlider = ({ slides, children }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  // Chỉ tải ảnh đang hiện và ảnh kế tiếp, không tải cả 5 ảnh ngay từ đầu
  const [loadedSlides, setLoadedSlides] = useState([0, 1]);
  const touchStartX = useRef(null);

  const goTo = (index) => {
    const nextIndex = (index + slides.length) % slides.length;
    setActiveIndex(nextIndex);
    setLoadedSlides((loaded) => [...new Set([...loaded, nextIndex, (nextIndex + 1) % slides.length])]);
  };

  // Hẹn giờ lại mỗi khi đổi ảnh, nên bấm chấm xong vẫn đủ 6 giây mới chuyển tiếp
  useEffect(() => {
    if (isPaused || slides.length < 2 || prefersReducedMotion()) return undefined;

    const timer = setTimeout(() => {
      if (!document.hidden) goTo(activeIndex + 1);
    }, SLIDE_DURATION);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, isPaused, slides.length]);

  // Chuyển focus giữa các nút bên trong banner thì vẫn giữ tạm dừng
  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(distance) >= SWIPE_DISTANCE) goTo(activeIndex + (distance < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  const activeSlide = slides[activeIndex];

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="Ảnh điểm đến nổi bật"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="hero__slides" aria-hidden="true">
        {slides.map((slide, index) => (
          <div
            key={slide.image}
            className={`hero__slide${index === activeIndex ? ' hero__slide--active' : ''}`}
            style={{
              backgroundImage: loadedSlides.includes(index) ? `url('${slide.image}')` : undefined,
              backgroundPosition: slide.position,
            }}
          />
        ))}
      </div>
      <div className="hero__overlay" />

      <div className="container hero__inner">{children}</div>

      <div className="container hero__controls">
        <p className="hero__location" aria-live="polite">
          <FontAwesomeIcon icon={faLocationDot} /> {activeSlide.location}
        </p>

        {slides.length > 1 && (
          <div className="hero__nav">
            <button
              type="button"
              className="hero__arrow"
              aria-label="Ảnh trước"
              onClick={() => goTo(activeIndex - 1)}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <div className="hero__dots">
              {slides.map((slide, index) => (
                <button
                  key={slide.image}
                  type="button"
                  className={`hero__dot${index === activeIndex ? ' hero__dot--active' : ''}`}
                  aria-label={`Ảnh ${index + 1}: ${slide.location}`}
                  aria-current={index === activeIndex}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>
            <button
              type="button"
              className="hero__arrow"
              aria-label="Ảnh tiếp theo"
              onClick={() => goTo(activeIndex + 1)}
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSlider;
