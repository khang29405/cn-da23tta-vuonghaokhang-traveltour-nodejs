import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Thông báo gửi kèm khi chuyển trang: navigate(path, { state: { notice } }).
// Đọc xong thì xóa khỏi lịch sử trình duyệt, nếu không tải lại trang sẽ hiện lại thông báo cũ.
export const useFlashNotice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(() => location.state?.notice ?? null);
  const hasFlash = Boolean(location.state?.notice);
  const { pathname, search } = location;

  useEffect(() => {
    if (hasFlash) navigate({ pathname, search }, { replace: true, state: null });
  }, [hasFlash, pathname, search, navigate]);

  return [notice, setNotice];
};
