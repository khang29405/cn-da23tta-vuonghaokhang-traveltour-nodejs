// API trả đường dẫn ảnh dạng /uploads/<ten-file>, nằm trên máy chủ backend chứ không phải máy chủ giao diện.
// Ghép với địa chỉ gốc của VITE_API_URL (bỏ phần /api): http://localhost:5000/uploads/<ten-file>
export const toAssetUrl = (path) => (path ? new URL(path, import.meta.env.VITE_API_URL).href : null);
