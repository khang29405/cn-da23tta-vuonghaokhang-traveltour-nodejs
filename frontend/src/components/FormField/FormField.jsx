import './FormField.css';

// Ô nhập bên trong nên có aria-describedby={`${id}-message`} để trình đọc màn hình đọc kèm lỗi/gợi ý
const FormField = ({ id, label, error, hint, children }) => (
  <div className="form-field">
    <label htmlFor={id} className="form-label">
      {label}
    </label>
    {children}
    {error ? (
      <p id={`${id}-message`} className="form-error">
        {error}
      </p>
    ) : (
      hint && (
        <p id={`${id}-message`} className="form-field__hint">
          {hint}
        </p>
      )
    )}
  </div>
);

export default FormField;
