import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';
import './DashboardPlaceholder.css';

// Trang tạm cho các mục menu quản trị/nhân viên chưa làm (xem dashboardMenus.js)
const DashboardPlaceholder = ({ title }) => (
  <>
    <h1 className="dashboard-page__title">{title}</h1>
    <div className="dashboard-placeholder">
      <FontAwesomeIcon icon={faScrewdriverWrench} className="dashboard-placeholder__icon" />
      <p>Chức năng này đang được hoàn thiện.</p>
    </div>
  </>
);

export default DashboardPlaceholder;
