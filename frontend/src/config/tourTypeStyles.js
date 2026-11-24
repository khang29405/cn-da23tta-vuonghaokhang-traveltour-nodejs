import {
  faWater,
  faMountain,
  faLandmark,
  faUmbrellaBeach,
  faBowlFood,
  faCompass,
  faSailboat,
  faVihara,
  faSuitcaseRolling,
} from '@fortawesome/free-solid-svg-icons';

// Màu và icon riêng cho từng loại tour, nhận diện theo từ khóa trong tên loại tour (không theo mã vì mã đổi khi
// tạo lại dữ liệu). Bỏ dấu trước khi so để "Văn hoá"/"Văn hóa", "Biển - Đảo"/"biển đảo" đều khớp.
// Thứ tự quan trọng: loại cụ thể đứng trước, ví dụ "Tâm linh" trước "Biển đảo" vì "đạo" bỏ dấu cũng thành "dao".
const rules = [
  { keywords: ['tam linh', 'hanh huong'], color: '#94650c', soft: '#f7efdf', icon: faVihara },
  { keywords: ['song nuoc', 'mien tay'], color: '#5b7d1a', soft: '#eef3e2', icon: faSailboat },
  { keywords: ['am thuc'], color: '#c25a0c', soft: '#fbeee3', icon: faBowlFood },
  { keywords: ['kham pha', 'mao hiem', 'trekking', 'leo nui'], color: '#0d8285', soft: '#e1f3f3', icon: faCompass },
  { keywords: ['nghi duong', 'resort'], color: '#7458c0', soft: '#efebf9', icon: faUmbrellaBeach },
  { keywords: ['van hoa', 'lich su', 'di san'], color: '#8a5a3c', soft: '#f3ebe5', icon: faLandmark },
  { keywords: ['bien', 'dao'], color: '#0a6fb0', soft: '#e3f0f9', icon: faWater },
  { keywords: ['nui', 'rung', 'vung cao'], color: '#2e7d32', soft: '#e6f2e7', icon: faMountain },
];

// Loại tour không khớp từ khóa nào vẫn hiển thị bình thường với kiểu mặc định
const defaultStyle = { color: '#5f6b7a', soft: '#eef1f4', icon: faSuitcaseRolling };

const toPlainWords = (text) =>
  ` ${(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `;

// So theo nguyên từ (có khoảng trắng hai bên) để "bien" không khớp nhầm vào từ dài hơn
export const getTourTypeStyle = (name) => {
  const words = toPlainWords(name);
  return rules.find(({ keywords }) => keywords.some((keyword) => words.includes(` ${keyword} `))) ?? defaultStyle;
};

// Dùng cho thuộc tính style: các component đọc màu qua biến CSS --type-color, --type-soft
export const tourTypeCssVars = (name) => {
  const { color, soft } = getTourTypeStyle(name);
  return { '--type-color': color, '--type-soft': soft };
};
