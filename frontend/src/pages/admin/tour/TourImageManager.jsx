import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faCircleExclamation,
  faCloudArrowUp,
  faImages,
  faStar,
  faTrashCan,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog.jsx';
import { uploadTourImages, setTourCoverImage, deleteTourImage } from '../../../api/tourApi.js';
import { getErrorMessage } from '../../../api/axiosClient.js';
import { toAssetUrl } from '../../../utils/assetUrl.js';
import './TourImageManager.css';

// Cùng giới hạn với middlewares/upload.js ở backend; backend vẫn kiểm tra lại
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE_MB = 5;
const MAX_FILES_PER_UPLOAD = 10;

const getExtension = (name) => {
  const dotIndex = name.lastIndexOf('.');
  return dotIndex === -1 ? '' : name.slice(dotIndex).toLowerCase();
};

let nextPendingKey = 0;

const TourImageManager = ({ tourId, initialImages }) => {
  const [images, setImages] = useState(initialImages);
  const [pending, setPending] = useState([]);
  const [selectErrors, setSelectErrors] = useState([]);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Ảnh xem trước là URL tạm trong bộ nhớ trình duyệt, phải thu hồi khi không dùng nữa
  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  useEffect(() => () => pendingRef.current.forEach(({ url }) => URL.revokeObjectURL(url)), []);

  const isBusy = busy !== null;

  const addFiles = (fileList) => {
    const errors = [];
    const accepted = [];
    [...fileList].forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type) || !ACCEPTED_EXTENSIONS.includes(getExtension(file.name))) {
        errors.push(`"${file.name}" không phải ảnh JPG, PNG hoặc WEBP`);
      } else if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        errors.push(`"${file.name}" lớn hơn ${MAX_SIZE_MB} MB`);
      } else {
        accepted.push(file);
      }
    });

    const room = MAX_FILES_PER_UPLOAD - pending.length;
    if (accepted.length > room) {
      errors.push(`Mỗi lần tải tối đa ${MAX_FILES_PER_UPLOAD} ảnh, đã bỏ bớt ${accepted.length - room} ảnh`);
      accepted.length = Math.max(room, 0);
    }

    setSelectErrors(errors);
    setNotice(null);
    setPending((current) => [
      ...current,
      ...accepted.map((file) => ({ key: ++nextPendingKey, file, url: URL.createObjectURL(file) })),
    ]);
  };

  const handleInputChange = (event) => {
    addFiles(event.target.files);
    // Cho phép chọn lại đúng file vừa bỏ chọn
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (!isBusy) addFiles(event.dataTransfer.files);
  };

  const removePending = (key) => {
    const item = pending.find((pendingItem) => pendingItem.key === key);
    if (item) URL.revokeObjectURL(item.url);
    setPending((current) => current.filter((pendingItem) => pendingItem.key !== key));
  };

  const clearPending = () => {
    pending.forEach(({ url }) => URL.revokeObjectURL(url));
    setPending([]);
    setSelectErrors([]);
  };

  const run = async (action, work, successText) => {
    setBusy(action);
    setNotice(null);
    try {
      setImages(await work());
      setNotice({ type: 'success', text: successText });
      return true;
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const handleUpload = async () => {
    const count = pending.length;
    setProgress(0);
    setSelectErrors([]);
    const ok = await run(
      'upload',
      () => uploadTourImages(tourId, pending.map(({ file }) => file), setProgress),
      `Đã tải lên ${count} ảnh.`,
    );
    if (ok) clearPending();
  };

  const handleSetCover = (image) =>
    run('cover', () => setTourCoverImage(tourId, image.ma_anh), 'Đã chọn ảnh đại diện.');

  const handleConfirmDelete = async () => {
    await run('delete', () => deleteTourImage(tourId, deleteTarget.ma_anh), 'Đã xóa ảnh.');
    setDeleteTarget(null);
  };

  return (
    <section className="tour-form__section tour-images" aria-labelledby="tour-section-images">
      <h2 id="tour-section-images" className="tour-form__section-title">
        <FontAwesomeIcon icon={faImages} />
        Ảnh tour <span className="tour-images__count">({images.length})</span>
      </h2>

      {notice && (
        <p className={`alert alert--${notice.type} tour-images__alert`} role={notice.type === 'error' ? 'alert' : 'status'}>
          <FontAwesomeIcon icon={notice.type === 'error' ? faCircleExclamation : faCircleCheck} />
          {notice.text}
        </p>
      )}

      {images.length > 0 ? (
        <ul className="tour-images__grid">
          {images.map((image, index) => (
            <li
              key={image.ma_anh}
              className={`tour-images__item${image.la_anh_dai_dien ? ' tour-images__item--cover' : ''}`}
            >
              <img src={toAssetUrl(image.duong_dan_anh)} alt={`Ảnh ${index + 1} của tour`} loading="lazy" />
              {image.la_anh_dai_dien && <span className="tour-images__badge">Ảnh đại diện</span>}
              <div className="tour-images__actions">
                {!image.la_anh_dai_dien && (
                  <button
                    type="button"
                    className="tour-images__action"
                    onClick={() => handleSetCover(image)}
                    disabled={isBusy}
                    aria-label={`Chọn ảnh ${index + 1} làm ảnh đại diện`}
                    title="Chọn làm ảnh đại diện"
                  >
                    <FontAwesomeIcon icon={faStar} />
                  </button>
                )}
                <button
                  type="button"
                  className="tour-images__action tour-images__action--danger"
                  onClick={() => setDeleteTarget(image)}
                  disabled={isBusy}
                  aria-label={`Xóa ảnh ${index + 1}`}
                  title="Xóa ảnh"
                >
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="tour-images__empty">Chưa có ảnh.</p>
      )}

      <label
        className={`tour-images__dropzone${isDragging ? ' tour-images__dropzone--active' : ''}${isBusy ? ' tour-images__dropzone--disabled' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="tour-images__input"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          multiple
          onChange={handleInputChange}
          disabled={isBusy}
        />
        <FontAwesomeIcon icon={faCloudArrowUp} className="tour-images__dropzone-icon" />
        <span>
          Kéo thả hoặc <strong>chọn ảnh</strong>
        </span>
        <small>JPG, PNG, WEBP, tối đa {MAX_SIZE_MB} MB</small>
      </label>

      {selectErrors.length > 0 && (
        <ul className="alert alert--error tour-images__alert tour-images__errors" role="alert">
          {selectErrors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      {pending.length > 0 && (
        <div className="tour-images__pending">
          <p className="tour-images__pending-title">Ảnh chờ tải lên ({pending.length})</p>
          <ul className="tour-images__grid">
            {pending.map(({ key, file, url }) => (
              <li key={key} className="tour-images__item tour-images__item--pending">
                <img src={url} alt={file.name} />
                <button
                  type="button"
                  className="tour-images__remove"
                  onClick={() => removePending(key)}
                  disabled={isBusy}
                  aria-label={`Bỏ chọn ${file.name}`}
                  title="Bỏ chọn"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </li>
            ))}
          </ul>
          <div className="tour-images__pending-actions">
            <button type="button" className="btn btn--primary btn--sm" onClick={handleUpload} disabled={isBusy}>
              {busy === 'upload' ? `Đang tải lên ${progress}%` : `Tải lên ${pending.length} ảnh`}
            </button>
            <button type="button" className="btn btn--outline btn--sm" onClick={clearPending} disabled={isBusy}>
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa ảnh?"
        message={
          deleteTarget?.la_anh_dai_dien
            ? 'Ảnh đại diện này sẽ bị xóa vĩnh viễn. Ảnh kế tiếp trong danh sách sẽ tự thành ảnh đại diện.'
            : 'Ảnh này sẽ bị xóa vĩnh viễn.'
        }
        confirmLabel="Xóa ảnh"
        danger
        isProcessing={busy === 'delete'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
};

export default TourImageManager;
