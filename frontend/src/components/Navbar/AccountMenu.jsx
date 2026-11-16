import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleUser,
  faChevronDown,
  faGaugeHigh,
  faClipboardList,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/authContext.js';
import { ROLES, ROLE_LABELS, ADMIN_PATH, STAFF_PATH } from '../../config/roles.js';

// Mục riêng theo vai trò; mục của khách hàng (lịch sử đặt tour, yêu thích, hồ sơ) thêm ở Bước 22, 30, 36
const roleLinks = {
  [ROLES.ADMIN]: [{ to: ADMIN_PATH, label: 'Trang quản trị', icon: faGaugeHigh }],
  [ROLES.STAFF]: [{ to: STAFF_PATH, label: 'Xử lý đơn đặt tour', icon: faClipboardList }],
};

const AccountMenu = ({ user }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/');
  };

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className="account-menu__toggle"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Tài khoản: ${user.ho_ten}`}
      >
        <FontAwesomeIcon icon={faCircleUser} className="account-menu__avatar" />
        <span className="account-menu__name">{user.ho_ten}</span>
        <FontAwesomeIcon icon={faChevronDown} className="account-menu__caret" />
      </button>

      {isOpen && (
        <div className="account-menu__panel">
          <div className="account-menu__info">
            <p className="account-menu__info-name">{user.ho_ten}</p>
            <p className="account-menu__info-email">{user.email}</p>
            <p className="account-menu__role">{ROLE_LABELS[user.vai_tro]}</p>
          </div>

          {roleLinks[user.vai_tro]?.map(({ to, label, icon }) => (
            <Link key={to} to={to} className="account-menu__item" onClick={() => setIsOpen(false)}>
              <FontAwesomeIcon icon={icon} />
              {label}
            </Link>
          ))}

          <button type="button" className="account-menu__item account-menu__item--logout" onClick={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
