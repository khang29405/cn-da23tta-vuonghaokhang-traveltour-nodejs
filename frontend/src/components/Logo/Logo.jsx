import { Link } from 'react-router-dom';
import siteInfo from '../../config/siteInfo.js';
import './Logo.css';

// variant "dark" dùng trên nền sáng (navbar), "light" dùng trên nền tối (footer)
const Logo = ({ variant = 'dark' }) => (
  <Link to="/" className={`logo logo--${variant}`} aria-label={`${siteInfo.name} - Trang chủ`}>
    <svg className="logo__mark" viewBox="0 0 32 40" aria-hidden="true">
      <path
        className="logo__pin"
        d="M16 1C8.3 1 2 7.1 2 14.7 2 24.6 16 39 16 39s14-14.4 14-24.3C30 7.1 23.7 1 16 1Z"
      />
      <circle cx="16" cy="14.6" r="9.2" fill="#fff" />
      <circle cx="19.2" cy="11" r="3.3" fill="#ff6a13" />
      <path
        className="logo__wave"
        d="M8.2 17.6c2 0 2-1.5 3.9-1.5s2 1.5 3.9 1.5 2-1.5 3.9-1.5 2 1.5 3.9 1.5M9.6 21.2c1.7 0 1.7-1.3 3.2-1.3s1.6 1.3 3.2 1.3 1.6-1.3 3.2-1.3 1.6 1.3 3.2 1.3"
      />
    </svg>
    <span className="logo__text">
      <span className="logo__name">
        Travel<span className="logo__name-highlight">Tour</span>
      </span>
      <span className="logo__tagline">Du lịch trong nước</span>
    </span>
  </Link>
);

export default Logo;
