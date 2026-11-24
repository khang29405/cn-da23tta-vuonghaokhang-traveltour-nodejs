import { faPlane, faBus, faTrain, faShip, faRoute } from '@fortawesome/free-solid-svg-icons';

// Tra theo tên phương tiện; phương tiện quản trị thêm sau mà chưa có ở đây thì dùng icon chung
const icons = {
  'máy bay': faPlane,
  'ô tô': faBus,
  'tàu hỏa': faTrain,
  'tàu thủy': faShip,
  'du thuyền': faShip,
};

export const getTransportIcon = (name) => icons[(name ?? '').normalize('NFC').toLowerCase().trim()] ?? faRoute;
