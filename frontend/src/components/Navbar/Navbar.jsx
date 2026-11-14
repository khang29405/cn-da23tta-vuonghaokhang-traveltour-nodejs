import { NavLink } from 'react-router-dom';
import Logo from '../Logo/Logo.jsx';
import './Navbar.css';

const linkClassName = ({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`;

// Navbar tạm: nút Đăng nhập/Đăng ký và menu theo vai trò sẽ làm ở Bước 5
const Navbar = () => (
  <header className="navbar">
    <div className="container navbar__inner">
      <Logo />

      <nav className="navbar__menu" aria-label="Menu chính">
        <NavLink to="/" end className={linkClassName}>
          Trang chủ
        </NavLink>
        <NavLink to="/tour" className={linkClassName}>
          Tour du lịch
        </NavLink>
      </nav>
    </div>
  </header>
);

export default Navbar;
