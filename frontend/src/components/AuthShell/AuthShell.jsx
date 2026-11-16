import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faClipboardCheck, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import Landscape from './Landscape.jsx';
import useTimeOfDay from '../../hooks/useTimeOfDay.js';
import './AuthShell.css';

const benefits = [
  { icon: faCalendarCheck, text: 'Biết ngay số chỗ còn trống' },
  { icon: faClipboardCheck, text: 'Giữ chỗ trước, thanh toán sau' },
  { icon: faRotateLeft, text: 'Tự hủy khi đơn chưa xác nhận' },
];

// Vị trí sao tính theo % khung cột trái, chỉ hiện ban đêm
const stars = [
  [8, 12], [22, 6], [37, 16], [52, 8], [66, 14], [81, 5], [92, 18],
  [14, 30], [46, 26], [74, 32], [88, 40], [6, 46], [30, 42], [60, 44],
];

// Khung chung của trang đăng nhập/đăng ký: phần giới thiệu bên trái, form bên phải
const AuthShell = ({ heading, subheading, title, children }) => {
  const { scene, greeting } = useTimeOfDay();

  return (
    <section className="container auth-page">
      <div className="auth-shell">
        <aside className={`auth-visual auth-visual--${scene}`}>
          {scene === 'night' &&
            stars.map(([left, top], index) => (
              <span
                key={`${left}-${top}`}
                className="auth-visual__star"
                style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${(index % 5) * 0.6}s` }}
              />
            ))}

          <div className="auth-visual__content">
            <p className="auth-visual__greeting">{greeting}</p>
            <p className="auth-visual__heading">{heading}</p>
            <p className="auth-visual__subheading">{subheading}</p>
            <ul className="auth-visual__benefits">
              {benefits.map(({ icon, text }) => (
                <li key={text} className="auth-visual__benefit">
                  <span className="auth-visual__benefit-icon">
                    <FontAwesomeIcon icon={icon} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <Landscape scene={scene} />
        </aside>

        <div className="auth-form">
          <h1 className="auth-form__title">{title}</h1>
          {children}
        </div>
      </div>
    </section>
  );
};

export default AuthShell;
