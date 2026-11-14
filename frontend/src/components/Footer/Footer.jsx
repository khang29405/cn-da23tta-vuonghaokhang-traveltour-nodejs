import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faPhone, faEnvelope, faClock } from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faYoutube, faTiktok } from '@fortawesome/free-brands-svg-icons';
import Logo from '../Logo/Logo.jsx';
import siteInfo from '../../config/siteInfo.js';
import './Footer.css';

const currentYear = new Date().getFullYear();

const socialLinks = [
  { label: 'Facebook', icon: faFacebookF, url: siteInfo.socials.facebook },
  { label: 'YouTube', icon: faYoutube, url: siteInfo.socials.youtube },
  { label: 'TikTok', icon: faTiktok, url: siteInfo.socials.tiktok },
];

const hotlineHref = `tel:${siteInfo.hotline.replace(/\s/g, '')}`;

const Footer = () => (
  <footer className="footer">
    <div className="container footer__grid">
      <div className="footer__brand">
        <Logo variant="light" />
        <p className="footer__desc">{siteInfo.slogan}</p>
        <div className="footer__socials">
          {socialLinks.map(({ label, icon, url }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="footer__social"
              aria-label={label}
            >
              <FontAwesomeIcon icon={icon} />
            </a>
          ))}
        </div>
      </div>

      <div>
        <h3 className="footer__heading">Khám phá</h3>
        <ul className="footer__list">
          <li>
            <Link to="/">Trang chủ</Link>
          </li>
          <li>
            <Link to="/tour">Tour du lịch</Link>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="footer__heading">Hỗ trợ khách hàng</h3>
        <ul className="footer__list">
          <li>Giữ chỗ trước, thanh toán sau khi xác nhận</li>
          <li>Hủy miễn phí khi đơn chưa được xác nhận</li>
          <li>Theo dõi đơn trong mục “Đơn của tôi”</li>
        </ul>
      </div>

      <div>
        <h3 className="footer__heading">Liên hệ</h3>
        <ul className="footer__list footer__contact">
          <li>
            <FontAwesomeIcon icon={faLocationDot} />
            <span>{siteInfo.address}</span>
          </li>
          <li>
            <FontAwesomeIcon icon={faPhone} />
            <a href={hotlineHref}>Hotline: {siteInfo.hotline}</a>
          </li>
          <li>
            <FontAwesomeIcon icon={faEnvelope} />
            <a href={`mailto:${siteInfo.email}`}>{siteInfo.email}</a>
          </li>
          <li>
            <FontAwesomeIcon icon={faClock} />
            <span>{siteInfo.workingHours}</span>
          </li>
        </ul>
      </div>
    </div>

    <div className="footer__bottom">
      <div className="container">
        © {currentYear} {siteInfo.companyName}. Bảo lưu mọi quyền.
      </div>
    </div>
  </footer>
);

export default Footer;
