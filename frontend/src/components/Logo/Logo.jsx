import { Link } from 'react-router-dom';
import { faPlane } from '@fortawesome/free-solid-svg-icons';
import siteInfo from '../../config/siteInfo.js';
import './Logo.css';

// Icon máy bay của Font Awesome (khung 576 x 512, mũi hướng sang phải); lấy đường vẽ để đặt trong SVG logo
const [PLANE_WIDTH, PLANE_HEIGHT, , , PLANE_PATH] = faPlane.icon;

// Chữ "o" của "Tour" là quả địa cầu (cùng màu chữ "Tour"); quỹ đạo cam vòng phía dưới rồi vút lên góc phải,
// cuối quỹ đạo là máy bay xoay theo hướng bay. Hình rộng hơn chữ "o" nên có lề âm để khoảng cách chữ vẫn đều.
const GlobeOrbit = () => (
  <svg className="logo__globe" viewBox="-13 -9 26 18" aria-hidden="true">
    <g fill="none" stroke="currentColor">
      <circle r="6.6" strokeWidth="2.3" />
      <ellipse rx="2.9" ry="6.6" strokeWidth="1.3" />
      <path d="M-6.6 0H6.6" strokeWidth="1.3" />
    </g>
    <path d="M-11.2 3.6C-7 7.6 5.4 5.6 9.4-1.4" fill="none" stroke="#ff6a13" strokeWidth="1.5" strokeLinecap="round" />
    <g className="logo__plane">
      <path
        d={PLANE_PATH}
        fill="#ff6a13"
        transform={`translate(11.7 -5.3) rotate(-60) scale(0.0174) translate(${-PLANE_WIDTH / 2} ${-PLANE_HEIGHT / 2})`}
      />
    </g>
  </svg>
);

// variant "dark" dùng trên nền sáng (navbar), "light" dùng trên nền tối (footer).
// Favicon (public/favicon.svg) là chữ T và máy bay cam vì ở cỡ 16px quả địa cầu bị rối.
const Logo = ({ variant = 'dark' }) => (
  <Link to="/" className={`logo logo--${variant}`} aria-label={`${siteInfo.name} - Trang chủ`}>
    <span className="logo__name">
      Travel
      <span className="logo__name-highlight">
        T<GlobeOrbit />
        ur
      </span>
    </span>
  </Link>
);

export default Logo;
