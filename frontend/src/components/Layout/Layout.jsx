import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar/Navbar.jsx';
import Footer from '../Footer/Footer.jsx';
import './Layout.css';

// Dùng làm layout của route (hiện Outlet) hoặc bọc trực tiếp một trang qua children
const Layout = ({ children }) => (
  <div className="layout">
    <Navbar />
    <main className="layout__content">{children ?? <Outlet />}</main>
    <Footer />
  </div>
);

export default Layout;
