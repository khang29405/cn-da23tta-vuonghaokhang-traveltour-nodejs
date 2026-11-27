import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import './BookingProgress.css';

const STEPS = ['Giữ chỗ', 'Gọi xác nhận', 'Thanh toán', 'Khởi hành'];

// Bước hiện tại suy từ trạng thái thật của đơn; hoàn tất thì mọi bước đã xong (trả về STEPS.length)
const getCurrentStep = (status, paymentStatus) => {
  if (status === 'cho_xac_nhan') return 1;
  if (status === 'da_xac_nhan') return paymentStatus === 'da_thanh_toan' ? 3 : 2;
  return STEPS.length;
};

// Đơn đã hủy không có tiến trình, trang gọi tự hiện thông báo đã hủy
const BookingProgress = ({ status, paymentStatus }) => {
  if (status === 'da_huy') return null;
  const current = getCurrentStep(status, paymentStatus);

  return (
    <ol className="progress" aria-label="Tiến trình đơn đặt tour">
      {STEPS.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'upcoming';
        return (
          <li key={step} className={`progress__step progress__step--${state}`}>
            <span className="progress__marker" aria-hidden="true">
              {state === 'done' ? <FontAwesomeIcon icon={faCheck} /> : index + 1}
            </span>
            <span className="progress__label">
              {step}
              {state === 'current' && <span className="visually-hidden"> (bước hiện tại)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

export default BookingProgress;
