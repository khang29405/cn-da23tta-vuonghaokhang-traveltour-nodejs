import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext.js';
import { canAccessPath, getHomePath } from '../config/roles.js';

// Trang đăng nhập/đăng ký: đã đăng nhập thì chuyển đi. Đây cũng là nơi chuyển hướng ngay sau khi đăng nhập:
// quay lại trang được bảo vệ vừa bị chặn (nếu vai trò vào được), nếu không thì về trang chính của vai trò.
const GuestRoute = () => {
  const { user } = useAuth();
  const { state } = useLocation();

  if (user) {
    const from = state?.from;
    const fromPath = from ? `${from.pathname}${from.search}` : null;
    const target = from && canAccessPath(user.vai_tro, from.pathname) ? fromPath : getHomePath(user.vai_tro);
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
