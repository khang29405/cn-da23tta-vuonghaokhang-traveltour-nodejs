import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLocationDot,
  faPhone,
  faEnvelope,
  faClock,
  faHeadset,
  faMoneyBillWave,
  faBuildingColumns,
  faArrowUp,
} from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faTiktok } from '@fortawesome/free-brands-svg-icons';
import Logo from '../Logo/Logo.jsx';
import siteInfo from '../../config/siteInfo.js';
import './Footer.css';

const currentYear = new Date().getFullYear();

const socialLinks = [
  { label: 'Facebook', icon: faFacebookF, url: siteInfo.socials.facebook },
  // Font Awesome bản miễn phí không có icon Zalo nên hiện chữ
  { label: 'Zalo', text: 'Zalo', url: siteInfo.socials.zalo },
  { label: 'TikTok', icon: faTiktok, url: siteInfo.socials.tiktok },
];

const bookingSteps = [
  { title: 'Chọn tour và ngày khởi hành', text: 'Mỗi lịch khởi hành ghi rõ số chỗ còn lại.' },
  { title: 'Gửi yêu cầu giữ chỗ', text: 'Nhân viên kiểm tra và xác nhận đơn của bạn.' },
  { title: 'Thanh toán sau khi xác nhận', text: 'Theo dõi trạng thái đơn trong mục “Đơn của tôi”.' },
];

const paymentIcons = { cash: faMoneyBillWave, bank: faBuildingColumns };

const hotlineHref = `tel:${siteInfo.hotline.replace(/\s/g, '')}`;

const scrollToTop = () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
};

const Footer = () => (
  <footer className="footer">
    <div className="footer__help">
      <div className="container footer__help-inner">
        <div className="footer__help-text">
          <FontAwesomeIcon icon={faHeadset} className="footer__help-icon" />
          <div>
            <p className="footer__help-title">Cần tư vấn chọn tour?</p>
            <p className="footer__help-sub">Tổng đài trả lời {siteInfo.workingHours}</p>
          </div>
        </div>
        <div className="footer__help-actions">
          <a href={hotlineHref} className="btn btn--primary">
            <FontAwesomeIcon icon={faPhone} />
            Gọi {siteInfo.hotline}
          </a>
          <a href={`mailto:${siteInfo.email}`} className="btn btn--outline">
            <FontAwesomeIcon icon={faEnvelope} />
            Gửi email
          </a>
        </div>
      </div>
    </div>

    <div className="container footer__grid">
      <div className="footer__brand">
        <Logo variant="light" />
        <p className="footer__desc">{siteInfo.slogan}</p>
        <div className="footer__socials">
          {socialLinks.map(({ label, icon, text, url }) => (
            <a key={label} href={url} target="_blank" rel="noreferrer" className="footer__social" aria-label={label}>
              {icon ? <FontAwesomeIcon icon={icon} /> : <span className="footer__social-text">{text}</span>}
            </a>
          ))}
        </div>
      </div>

      <div>
        <h3 className="footer__heading">Đặt tour tại {siteInfo.name}</h3>
        <ol className="footer__steps">
          {bookingSteps.map(({ title, text }) => (
            <li key={title} className="footer__step">
              <span className="footer__step-title">{title}</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        <p className="footer__note">Bạn tự hủy được khi đơn chưa được xác nhận.</p>
      </div>

      <div>
        <h3 className="footer__heading">Liên hệ</h3>
        <ul className="footer__list footer__contact">
          <li>
            <FontAwesomeIcon icon={faLocationDot} />
            <span>{siteInfo.address}</span>
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

        <h3 className="footer__heading footer__heading--spaced">Thanh toán</h3>
        <ul className="footer__list footer__contact">
          {siteInfo.paymentMethods.map(({ type, label }) => (
            <li key={label}>
              <FontAwesomeIcon icon={paymentIcons[type] ?? faMoneyBillWave} />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div className="footer__bottom">
      <div className="container footer__bottom-inner">
        <span>
          © {currentYear} {siteInfo.companyName}
        </span>
        <button type="button" className="footer__top" onClick={scrollToTop}>
          Lên đầu trang
          <FontAwesomeIcon icon={faArrowUp} />
        </button>
      </div>
    </div>
  </footer>
);

export default Footer;
