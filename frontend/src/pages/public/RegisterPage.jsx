import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import AuthShell from '../../components/AuthShell/AuthShell.jsx';
import FormField from '../../components/FormField/FormField.jsx';
import PasswordInput from '../../components/PasswordInput/PasswordInput.jsx';
import * as authApi from '../../api/authApi.js';
import { getErrorMessage } from '../../api/axiosClient.js';
import { EMAIL_PATTERN, PHONE_PATTERN, PASSWORD_HINT, getPasswordError } from '../../utils/validation.js';

const initialForm = { ho_ten: '', email: '', so_dien_thoai: '', mat_khau: '', xac_nhan_mat_khau: '' };

const validate = (form) => {
  const errors = {};
  const hoTen = form.ho_ten.trim();
  const email = form.email.trim();
  const soDienThoai = form.so_dien_thoai.trim();

  if (!hoTen) errors.ho_ten = 'Vui lòng nhập họ tên';
  else if (hoTen.length > 100) errors.ho_ten = 'Họ tên tối đa 100 ký tự';

  if (!email) errors.email = 'Vui lòng nhập email';
  else if (!EMAIL_PATTERN.test(email) || email.length > 100) errors.email = 'Email không đúng định dạng';

  if (soDienThoai && !PHONE_PATTERN.test(soDienThoai)) {
    errors.so_dien_thoai = 'Số điện thoại gồm 10 chữ số và bắt đầu bằng 0';
  }

  const passwordError = getPasswordError(form.mat_khau);
  if (passwordError) errors.mat_khau = passwordError;
  if (!form.xac_nhan_mat_khau) errors.xac_nhan_mat_khau = 'Vui lòng nhập lại mật khẩu';
  else if (form.xac_nhan_mat_khau !== form.mat_khau) errors.xac_nhan_mat_khau = 'Mật khẩu nhập lại không khớp';

  return errors;
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
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
      // xac_nhan_mat_khau chỉ kiểm tra ở giao diện, không gửi lên backend
      const newUser = await authApi.register({
        ho_ten: form.ho_ten.trim(),
        email: form.email.trim(),
        so_dien_thoai: form.so_dien_thoai.trim() || undefined,
        mat_khau: form.mat_khau,
      });
      navigate('/dang-nhap', { state: { registeredEmail: newUser.email } });
    } catch (error) {
      if (error.response?.status === 409) {
        setErrors({ email: getErrorMessage(error) });
      } else {
        setServerError(getErrorMessage(error));
      }
      setIsSubmitting(false);
    }
  };

  const fieldProps = (name, id) => ({
    id,
    name,
    value: form[name],
    onChange: handleChange,
    className: `input${errors[name] ? ' input--error' : ''}`,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': `${id}-message`,
  });

  return (
    <AuthShell
      heading="Mỗi hành trình đẹp bắt đầu từ một lần giữ chỗ"
      subheading="Tạo tài khoản một lần, đi bao nhiêu chuyến cũng được."
      title="Tạo tài khoản"
    >
      {serverError && (
        <p className="alert alert--error auth-form__alert" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} />
          {serverError}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormField id="register-name" label="Họ và tên" error={errors.ho_ten}>
          <input {...fieldProps('ho_ten', 'register-name')} autoComplete="name" placeholder="Nguyễn Văn An" />
        </FormField>

        <div className="auth-form__row">
          <FormField id="register-email" label="Email" error={errors.email}>
            <input
              {...fieldProps('email', 'register-email')}
              type="email"
              autoComplete="email"
              placeholder="nguyenvanan@gmail.com"
            />
          </FormField>

          <FormField id="register-phone" label="Số điện thoại (tùy chọn)" error={errors.so_dien_thoai}>
            <input
              {...fieldProps('so_dien_thoai', 'register-phone')}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="0912345678"
            />
          </FormField>
        </div>

        <div className="auth-form__row">
          <FormField id="register-password" label="Mật khẩu" error={errors.mat_khau} hint={PASSWORD_HINT}>
            <PasswordInput
              {...fieldProps('mat_khau', 'register-password')}
              className={errors.mat_khau ? 'input--error' : ''}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </FormField>

          <FormField id="register-password-confirm" label="Nhập lại mật khẩu" error={errors.xac_nhan_mat_khau}>
            <PasswordInput
              {...fieldProps('xac_nhan_mat_khau', 'register-password-confirm')}
              className={errors.xac_nhan_mat_khau ? 'input--error' : ''}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </FormField>
        </div>

        <button type="submit" className="btn btn--primary auth-form__submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </button>
      </form>

      <p className="auth-form__switch">
        Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link>
      </p>
    </AuthShell>
  );
};

export default RegisterPage;
