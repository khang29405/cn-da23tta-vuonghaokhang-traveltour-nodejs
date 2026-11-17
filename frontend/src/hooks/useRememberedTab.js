import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// localStorage có thể bị chặn (chế độ riêng tư, chặn cookie) nên mọi lần đọc/ghi đều bọc try/catch
const readStored = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStored = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Không lưu được thì chỉ mất phần ghi nhớ, trang vẫn chạy bình thường
  }
};

// Tab đang chọn nằm trên URL (?tab=...) và được ghi nhớ trong trình duyệt:
// rời sang trang khác rồi quay lại bằng menu (URL không có ?tab) vẫn mở đúng tab đã chọn lần trước.
export const useRememberedTab = (storageKey, tabs) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromUrl = searchParams.get('tab');
  const stored = readStored(storageKey);

  let activeTab = tabs[0];
  if (tabs.includes(fromUrl)) activeTab = fromUrl;
  else if (tabs.includes(stored)) activeTab = stored;

  useEffect(() => {
    writeStored(storageKey, activeTab);
    // Ghi tab lên URL (không tạo thêm mục lịch sử) để URL luôn khớp với tab đang mở
    if (fromUrl !== activeTab) {
      setSearchParams(
        (current) => {
          current.set('tab', activeTab);
          return current;
        },
        { replace: true },
      );
    }
  }, [storageKey, activeTab, fromUrl, setSearchParams]);

  const selectTab = useCallback(
    (tab) =>
      setSearchParams((current) => {
        current.set('tab', tab);
        return current;
      }),
    [setSearchParams],
  );

  return [activeTab, selectTab];
};
