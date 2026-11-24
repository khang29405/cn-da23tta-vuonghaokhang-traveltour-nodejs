import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import './TourImage.css';

// Đang tải ảnh: khung xám nhấp nháy; chưa có ảnh hoặc đường dẫn ảnh hỏng: ảnh giữ chỗ.
// Lưu đường dẫn đã tải xong/đã lỗi thay vì một cờ trạng thái để khi đổi src (bộ ảnh) không phải reset bằng effect.
const TourImage = ({ src, alt, imageClassName = '', placeholderText, lazy = false }) => {
  const [loadedSrc, setLoadedSrc] = useState(null);
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) {
    return (
      <div
        className="tour-image tour-image--empty"
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
      >
        <FontAwesomeIcon icon={faImage} className="tour-image__icon" />
        {placeholderText && <span className="tour-image__text">{placeholderText}</span>}
      </div>
    );
  }

  const isLoaded = loadedSrc === src;
  return (
    <div className={`tour-image${isLoaded ? '' : ' skeleton'}`}>
      <img
        src={src}
        alt={alt}
        className={`tour-image__img${isLoaded ? ' tour-image__img--loaded' : ''} ${imageClassName}`}
        loading={lazy ? 'lazy' : undefined}
        onLoad={() => setLoadedSrc(src)}
        onError={() => setFailedSrc(src)}
      />
    </div>
  );
};

export default TourImage;
