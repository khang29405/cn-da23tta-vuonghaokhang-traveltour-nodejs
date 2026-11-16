import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser } from '@fortawesome/free-solid-svg-icons';
import Logo from '../Logo/Logo.jsx';
import AccountMenu from './AccountMenu.jsx';
import { useAuth } from '../../context/authContext.js';
import './Navbar.css';

const linkClassName = ({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`;

const Navbar = () => {
  const { user } = useAuth();

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Logo />

        <nav className="navbar__menu" aria-label="Menu chính">
          <NavLink to="/" end className={(state) => `${linkClassName(state)} navbar__link--home`}>
            Trang chủ
          </NavLink>
          <NavLink to="/tour" className={linkClassName}>
            Tour du lịch
          </NavLink>
        </nav>

        <div className="navbar__actions">
          {user ? (
            <AccountMenu user={user} />
          ) : (
            <>
              <Link to="/dang-nhap" className="btn btn--outline btn--sm navbar__login" aria-label="Đăng nhập">
                <FontAwesomeIcon icon={faCircleUser} />
                <span className="navbar__login-text">Đăng nhập</span>
              </Link>
              <Link to="/dang-ky" className="btn btn--primary btn--sm navbar__register">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
