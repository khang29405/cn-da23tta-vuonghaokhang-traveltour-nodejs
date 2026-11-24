import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout/Layout.jsx';
import DashboardLayout from '../components/DashboardLayout/DashboardLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import GuestRoute from './GuestRoute.jsx';
import HomePage from '../pages/public/HomePage.jsx';
import ToursPage from '../pages/public/ToursPage.jsx';
import TourDetailPage from '../pages/public/TourDetailPage.jsx';
import LoginPage from '../pages/public/LoginPage.jsx';
import RegisterPage from '../pages/public/RegisterPage.jsx';
import NotFoundPage from '../pages/public/NotFoundPage.jsx';
import DashboardPlaceholder from '../pages/admin/DashboardPlaceholder.jsx';
import CategoryPage from '../pages/admin/category/CategoryPage.jsx';
import TourListPage from '../pages/admin/tour/TourListPage.jsx';
import TourFormPage from '../pages/admin/tour/TourFormPage.jsx';
import { ROLES, ADMIN_PATH, STAFF_PATH } from '../config/roles.js';
import { adminMenu, staffMenu } from '../config/dashboardMenus.js';

// Mục menu chưa có trong bảng này thì hiện trang tạm
const adminPages = {
  tour: TourListPage,
  'danh-muc': CategoryPage,
};

const renderMenuRoutes = (menu, pages = {}) =>
  menu.map(({ path, label }) => {
    const Page = pages[path];
    const element = Page ? <Page /> : <DashboardPlaceholder title={label} />;
    return path ? <Route key={path} path={path} element={element} /> : <Route key="index" index element={element} />;
  });

const AppRouter = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="tour" element={<ToursPage />} />
      <Route path="tour/:tourId" element={<TourDetailPage />} />
      <Route element={<GuestRoute />}>
        <Route path="dang-nhap" element={<LoginPage />} />
        <Route path="dang-ky" element={<RegisterPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Route>

    {/* Quản trị viên kế thừa quyền nhân viên nên vào được cả khu nhân viên */}
    <Route element={<ProtectedRoute roles={[ROLES.STAFF, ROLES.ADMIN]} />}>
      <Route path={STAFF_PATH} element={<DashboardLayout title="Nhân viên" basePath={STAFF_PATH} menu={staffMenu} />}>
        {renderMenuRoutes(staffMenu)}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
      <Route path={ADMIN_PATH} element={<DashboardLayout title="Quản trị" basePath={ADMIN_PATH} menu={adminMenu} />}>
        {renderMenuRoutes(adminMenu, adminPages)}
        <Route path="tour/them" element={<TourFormPage />} />
        <Route path="tour/:tourId" element={<TourFormPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  </Routes>
);

export default AppRouter;
