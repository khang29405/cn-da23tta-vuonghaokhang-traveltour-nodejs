import Modal from '../Modal/Modal.jsx';
import './ConfirmDialog.css';

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  danger = false,
  isProcessing = false,
  onConfirm,
  onCancel,
}) => (
  <Modal
    open={open}
    title={title}
    size="sm"
    onClose={onCancel}
    closeDisabled={isProcessing}
    footer={
      <>
        <button type="button" className="btn btn--outline" onClick={onCancel} disabled={isProcessing}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`}
          onClick={onConfirm}
          disabled={isProcessing}
        >
          {isProcessing ? 'Đang xử lý...' : confirmLabel}
        </button>
      </>
    }
  >
    <p className="confirm-dialog__message">{message}</p>
  </Modal>
);

export default ConfirmDialog;
