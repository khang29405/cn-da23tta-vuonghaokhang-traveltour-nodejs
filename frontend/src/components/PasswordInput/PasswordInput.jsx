import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import './PasswordInput.css';

const PasswordInput = ({ className = '', ...inputProps }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="password-input">
      <input {...inputProps} type={isVisible ? 'text' : 'password'} className={`input ${className}`} />
      <button
        type="button"
        className="password-input__toggle"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={isVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-pressed={isVisible}
      >
        <FontAwesomeIcon icon={isVisible ? faEyeSlash : faEye} />
      </button>
    </div>
  );
};

export default PasswordInput;
