import { Link } from 'react-router-dom';
import { useAuth } from '../../context/authContext.js';
import './NotFoundPage.css';

// Chỉ cần đăng xuất: ProtectedRoute sẽ tự chuyển sang trang đăng nhập và nhớ trang đang mở,
// đăng nhập đúng tài khoản xong sẽ quay lại đây
const ForbiddenPage = () => {
  const { logout } = useAuth();

  return (
    <section className="container not-found">
      <p className="not-found__code">Lỗi 403</p>
      <h1 className="not-found__title">Bạn không có quyền truy cập trang này</h1>
      <p className="not-found__text">
        Tài khoản đang đăng nhập không được phép xem trang này. Nếu bạn có tài khoản phù hợp, hãy đăng nhập bằng tài
        khoản đó.
      </p>
      <div className="not-found__actions">
        <Link to="/" className="btn btn--primary">
          Về trang chủ
        </Link>
        <button type="button" className="btn btn--outline" onClick={logout}>
          Đăng nhập tài khoản khác
        </button>
      </div>
    </section>
  );
};

export default ForbiddenPage;
