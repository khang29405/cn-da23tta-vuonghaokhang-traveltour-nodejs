import { Link } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => (
  <section className="container not-found">
    <p className="not-found__code">Lỗi 404</p>
    <h1 className="not-found__title">Không tìm thấy trang bạn cần</h1>
    <p className="not-found__text">
      Đường dẫn có thể đã sai hoặc trang đã được chuyển đi. Bạn thử quay về trang chủ để tìm tour nhé.
    </p>
    <Link to="/" className="btn btn--primary">
      Về trang chủ
    </Link>
  </section>
);

export default NotFoundPage;
