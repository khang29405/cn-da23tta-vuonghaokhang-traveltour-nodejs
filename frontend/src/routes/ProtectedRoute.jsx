import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext.js';
import Layout from '../components/Layout/Layout.jsx';
import ForbiddenPage from '../pages/public/ForbiddenPage.jsx';

// Chặn ở giao diện cho người dùng dễ hiểu; quyền thật vẫn do backend kiểm tra ở từng API
const ProtectedRoute = ({ roles }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/dang-nhap" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.vai_tro)) {
    return (
      <Layout>
        <ForbiddenPage />
      </Layout>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
