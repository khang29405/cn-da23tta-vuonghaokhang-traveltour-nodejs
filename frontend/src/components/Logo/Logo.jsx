import { useId } from 'react';
import { Link } from 'react-router-dom';
import siteInfo from '../../config/siteInfo.js';
import './Logo.css';

// variant "dark" dùng trên nền sáng (navbar), "light" dùng trên nền tối (footer)
const Logo = ({ variant = 'dark' }) => {
  // Logo xuất hiện 2 lần trên trang (navbar, footer) nên id của clipPath phải khác nhau
  const clipId = `logo-badge-${useId().replace(/[^\w-]/g, '')}`;

  return (
    <Link to="/" className={`logo logo--${variant}`} aria-label={`${siteInfo.name} - Trang chủ`}>
      <svg className="logo__mark" viewBox="0 0 40 40" aria-hidden="true">
        <clipPath id={clipId}>
          <circle cx="20" cy="20" r="20" />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          <rect width="40" height="40" fill="#dcebfd" />
          <circle cx="26.5" cy="13" r="5" fill="#ff6a13" />
          <path d="M-2 31 11 14.5 16.5 21 22 15.5 42 31Z" fill="#0850a8" />
          <path d="M-2 26c1.5 0 1.5-1.8 3-1.8s1.5 1.8 3 1.8c1.5 0 1.5-1.8 3-1.8s1.5 1.8 3 1.8c1.5 0 1.5-1.8 3-1.8s1.5 1.8 3 1.8c1.5 0 1.5-1.8 3-1.8s1.5 1.8 3 1.8c1.5 0 1.5-1.8 3-1.8s1.5 1.8 3 1.8c1.5 0 1.5-1.8 3-1.8s1.5 1.8 3 1.8c1.5 0 1.5-1.8 3-1.8s1.5 1.8 3 1.8c1.5 0 1.5-1.8 3-1.8s1.5 1.8 3 1.8V44H-2Z" fill="#5aa2f5" />
          <path d="M-2 31.5c1.5 0 1.5-1.8 3-1.8s1.5 1.8 3 1.8c1.5 0 1.5-1.8 3-1.8s1.5 1.8 3 1.8c1.5 0 1.5-1.8 3-1.8s1.5 1.8 3 1.8c1.5 0 1.5-1.8 3-1.8s1.5 1.8 3 1.8c1.5 0 1.5-1.8 3-1.8s1.5 1.8 3 1.8c1.5 0 1.5-1.8 3-1.8s1.5 1.8 3 1.8c1.5 0 1.5-1.8 3-1.8s1.5 1.8 3 1.8c1.5 0 1.5-1.8 3-1.8s1.5 1.8 3 1.8V44H-2Z" fill="#0b63ce" />
        </g>
      </svg>
      <span className="logo__name">
        Travel<span className="logo__name-highlight">Tour</span>
      </span>
    </Link>
  );
};

export default Logo;
