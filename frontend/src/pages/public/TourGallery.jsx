import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import TourImage from '../../components/TourImage/TourImage.jsx';
import { toAssetUrl } from '../../utils/assetUrl.js';

// API trả ảnh đại diện đứng đầu nên ảnh lớn mặc định là ảnh đại diện
const TourGallery = ({ images, tourName }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];
  const goTo = (index) => setActiveIndex((index + images.length) % images.length);

  return (
    <div className="gallery">
      <div className="gallery__main">
        <TourImage src={toAssetUrl(active.duong_dan_anh)} alt={`${tourName} – ảnh ${activeIndex + 1}`} />
        {images.length > 1 && (
          <>
            <button type="button" className="gallery__arrow gallery__arrow--prev" aria-label="Ảnh trước" onClick={() => goTo(activeIndex - 1)}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button type="button" className="gallery__arrow gallery__arrow--next" aria-label="Ảnh sau" onClick={() => goTo(activeIndex + 1)}>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
            <span className="gallery__counter">
              {activeIndex + 1}/{images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <ul className="gallery__thumbs">
          {images.map((image, index) => (
            <li key={image.ma_anh}>
              <button
                type="button"
                className={`gallery__thumb${index === activeIndex ? ' gallery__thumb--active' : ''}`}
                aria-label={`Xem ảnh ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              >
                <TourImage src={toAssetUrl(image.duong_dan_anh)} alt="" lazy />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TourGallery;
