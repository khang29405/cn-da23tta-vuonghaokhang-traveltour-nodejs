import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleExclamation, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import AuthShell from '../../components/AuthShell/AuthShell.jsx';
import FormField from '../../components/FormField/FormField.jsx';
import PasswordInput from '../../components/PasswordInput/PasswordInput.jsx';
import { useAuth } from '../../context/authContext.js';
import { getErrorMessage } from '../../api/axiosClient.js';
import { EMAIL_PATTERN } from '../../utils/validation.js';

const validate = ({ email, mat_khau: matKhau }) => {
  const errors = {};
  if (!email.trim()) errors.email = 'Vui lòng nhập email';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Email không đúng định dạng';
  if (!matKhau) errors.mat_khau = 'Vui lòng nhập mật khẩu';
  return errors;
};

// Đăng nhập xong, GuestRoute tự chuyển sang trang phù hợp với vai trò
const LoginPage = () => {
  const { login } = useAuth();
  const { state } = useLocation();
  const registeredEmail = state?.registeredEmail;
  const from = state?.from;
  const isBooking = from?.pathname.endsWith('/dat-tour');

  const [form, setForm] = useState({ email: registeredEmail ?? '', mat_khau: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setServerError('');
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await login({ email: form.email.trim(), mat_khau: form.mat_khau });
    } catch (error) {
      setServerError(getErrorMessage(error));
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      heading="Chuyến đi tiếp theo đang chờ bạn"
      subheading="Chào mừng bạn trở lại, hành lý đã sẵn sàng chưa?"
      title="Đăng nhập"
    >
      {registeredEmail && !serverError && (
        <p className="alert alert--success auth-form__alert" role="status">
          <FontAwesomeIcon icon={faCircleCheck} />
          Đăng ký thành công. Mời bạn nhập mật khẩu để đăng nhập.
        </p>
      )}
      {isBooking && !registeredEmail && !serverError && (
        <p className="alert alert--info auth-form__alert" role="status">
          <FontAwesomeIcon icon={faCircleInfo} />
          Đăng nhập để tiếp tục đặt tour. Chưa có tài khoản thì đăng ký nhanh ở cuối trang.
        </p>
      )}
      {serverError && (
        <p className="alert alert--error auth-form__alert" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} />
          {serverError}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormField id="login-email" label="Email" error={errors.email}>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nguyenvanan@gmail.com"
            className={`input${errors.email ? ' input--error' : ''}`}
            value={form.email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.email)}
            aria-describedby="login-email-message"
          />
        </FormField>

        <FormField id="login-password" label="Mật khẩu" error={errors.mat_khau}>
          <PasswordInput
            id="login-password"
            name="mat_khau"
            autoComplete="current-password"
            placeholder="••••••••"
            className={errors.mat_khau ? 'input--error' : ''}
            value={form.mat_khau}
            onChange={handleChange}
            aria-invalid={Boolean(errors.mat_khau)}
            aria-describedby="login-password-message"
            autoFocus={Boolean(registeredEmail)}
          />
        </FormField>

        <button type="submit" className="btn btn--primary auth-form__submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <p className="auth-form__switch">
        Chưa có tài khoản?{' '}
        <Link to="/dang-ky" state={from ? { from } : undefined}>
          Đăng ký ngay
        </Link>
      </p>
    </AuthShell>
  );
};

export default LoginPage;
