import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// React Router không tự cuộn khi chuyển trang nên trang mới giữ vị trí cuộn của trang cũ.
// Đổi đường dẫn thì cuộn lên đầu; nút Back/Forward (POP) để trình duyệt tự trả về vị trí cũ.
// Chỉ đổi query (?tourType=...) thì không cuộn để đang lọc tour không bị nhảy trang.
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  // So với đường dẫn trước để không cuộn khi chỉ kiểu điều hướng đổi (ví dụ đổi bộ lọc sau lần vào trang đầu)
  const lastPathname = useRef(pathname);

  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    if (navigationType !== 'POP') window.scrollTo(0, 0);
  }, [pathname, navigationType]);

  return null;
};

export default ScrollToTop;
