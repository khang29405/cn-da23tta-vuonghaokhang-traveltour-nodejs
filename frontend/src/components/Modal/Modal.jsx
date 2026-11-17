import { useEffect, useId, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import './Modal.css';

// Dùng thẻ <dialog> có sẵn của trình duyệt: tự giữ focus bên trong và đóng bằng phím Esc.
// Phần tử có data-autofocus được focus khi mở (thuộc tính autoFocus của React không có tác dụng ở đây
// vì nội dung đã gắn vào trang trước khi hộp thoại mở).
const Modal = ({ open, title, onClose, closeDisabled = false, footer, size = 'md', children }) => {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector('[data-autofocus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleCancel = (event) => {
    // Chặn trình duyệt tự đóng để state `open` ở component cha luôn khớp với hộp thoại
    event.preventDefault();
    if (!closeDisabled) onClose();
  };

  return (
    <dialog ref={dialogRef} className={`modal modal--${size}`} onCancel={handleCancel} aria-labelledby={titleId}>
      {open && (
        <>
          <div className="modal__header">
            <h2 id={titleId} className="modal__title">
              {title}
            </h2>
            <button
              type="button"
              className="modal__close"
              onClick={onClose}
              disabled={closeDisabled}
              aria-label="Đóng"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
          <div className="modal__body">{children}</div>
          {footer && <div className="modal__footer">{footer}</div>}
        </>
      )}
    </dialog>
  );
};

export default Modal;
