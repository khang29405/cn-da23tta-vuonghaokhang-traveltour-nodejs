import { Link, NavLink, Outlet } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare, faCircleUser, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import Logo from '../Logo/Logo.jsx';
import { useAuth } from '../../context/authContext.js';
import { ROLE_LABELS } from '../../config/roles.js';
import './DashboardLayout.css';

const linkClassName = ({ isActive }) => `dashboard__link${isActive ? ' dashboard__link--active' : ''}`;

const DashboardLayout = ({ title, basePath, menu }) => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__brand">
          <Logo />
          <span className="dashboard__area">{title}</span>
        </div>

        <div className="dashboard__account">
          <Link to="/" className="dashboard__site-link" target="_blank" rel="noreferrer">
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
            <span className="dashboard__hide-mobile">Xem trang web</span>
          </Link>
          <span className="dashboard__user">
            <FontAwesomeIcon icon={faCircleUser} className="dashboard__user-icon" />
            <span className="dashboard__hide-mobile">
              {user.ho_ten}
              <small className="dashboard__user-role">{ROLE_LABELS[user.vai_tro]}</small>
            </span>
          </span>
          {/* Không tự chuyển trang: ProtectedRoute thấy đã đăng xuất sẽ đưa về trang đăng nhập */}
          <button type="button" className="btn btn--outline btn--sm" onClick={logout} aria-label="Đăng xuất">
            <FontAwesomeIcon icon={faRightFromBracket} />
            <span className="dashboard__hide-mobile">Đăng xuất</span>
          </button>
        </div>
      </header>

      <div className="dashboard__body">
        <nav className="dashboard__sidebar" aria-label={`Menu ${title.toLowerCase()}`}>
          {menu.map(({ path, label, icon }) => (
            <NavLink key={path} to={path ? `${basePath}/${path}` : basePath} end={!path} className={linkClassName}>
              <FontAwesomeIcon icon={icon} className="dashboard__link-icon" />
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="dashboard__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
