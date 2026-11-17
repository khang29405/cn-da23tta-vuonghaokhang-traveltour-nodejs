import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faCircleExclamation,
  faPen,
  faPlus,
  faRotateRight,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import FormField from '../../../components/FormField/FormField.jsx';
import Modal from '../../../components/Modal/Modal.jsx';
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog.jsx';
import { getErrorMessage } from '../../../api/axiosClient.js';

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const toForm = (fields, item = {}) => Object.fromEntries(fields.map(({ name }) => [name, item[name] ?? '']));

const validate = (fields, form) => {
  const errors = {};
  fields.forEach(({ name, label, required, maxLength }) => {
    const value = form[name].trim();
    if (required && !value) errors[name] = `Vui lòng nhập ${label.toLowerCase()}`;
    else if (value.length > maxLength) errors[name] = `${label} tối đa ${maxLength} ký tự`;
  });
  return errors;
};

const CategoryManager = ({ config }) => {
  const { slug, label, itemLabel, idField, nameField, fields, list, create, update, remove } = config;
  const formId = `${slug}-form`;

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(null);

  // editingItem = null: hộp thoại đang ở chế độ thêm
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(() => toForm(fields));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      setItems(await list());
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [list]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const openForm = (item = null) => {
    setEditingItem(item);
    setForm(toForm(fields, item ?? {}));
    setErrors({});
    setFormError('');
    setNotice(null);
    setIsFormOpen(true);
  };

  const closeForm = () => setIsFormOpen(false);

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(fields, form);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    const payload = Object.fromEntries(Object.entries(form).map(([name, value]) => [name, value.trim()]));
    setIsSaving(true);
    try {
      if (editingItem) {
        await update(editingItem[idField], payload);
        setNotice({ type: 'success', text: `Đã cập nhật ${itemLabel} "${payload[nameField]}".` });
      } else {
        await create(payload);
        setNotice({ type: 'success', text: `Đã thêm ${itemLabel} "${payload[nameField]}".` });
      }
      setIsFormOpen(false);
      await loadItems();
    } catch (error) {
      // Trùng tên (409) thì báo ngay dưới ô tên để người dùng sửa
      if (error.response?.status === 409) setErrors({ [nameField]: getErrorMessage(error) });
      else setFormError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const openDelete = (item) => {
    setNotice(null);
    setDeleteTarget(item);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await remove(deleteTarget[idField]);
      setNotice({ type: 'success', text: `Đã xóa ${itemLabel} "${deleteTarget[nameField]}".` });
      await loadItems();
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const columnCount = fields.length + 1;

  const renderTableBody = () => {
    if (isLoading || items.length === 0) {
      return (
        <tr>
          <td colSpan={columnCount} className="category-table__empty">
            {isLoading ? 'Đang tải danh sách...' : `Chưa có ${itemLabel} nào.`}
          </td>
        </tr>
      );
    }
    return items.map((item) => (
      <tr key={item[idField]}>
        {fields.map(({ name }) => (
          <td key={name} className={name === nameField ? 'category-table__name' : undefined}>
            {item[name] || <span className="category-table__muted">Chưa có</span>}
          </td>
        ))}
        <td className="category-table__actions-cell">
          <div className="category-table__actions">
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => openForm(item)}
              aria-label={`Sửa ${item[nameField]}`}
            >
              <FontAwesomeIcon icon={faPen} />
              <span className="category-table__action-text">Sửa</span>
            </button>
            {remove && (
              <button
                type="button"
                className="btn btn--outline btn--sm category-table__delete"
                onClick={() => openDelete(item)}
                aria-label={`Xóa ${item[nameField]}`}
              >
                <FontAwesomeIcon icon={faTrashCan} />
                <span className="category-table__action-text">Xóa</span>
              </button>
            )}
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <section className="category-manager" aria-label={`Danh sách ${itemLabel}`}>
      <div className="category-manager__toolbar">
        <h2 className="category-manager__heading">
          {label} <span className="category-manager__count">{isLoading ? '' : `(${items.length})`}</span>
        </h2>
        <div className="category-manager__toolbar-actions">
          <button type="button" className="btn btn--outline btn--sm" onClick={loadItems} disabled={isLoading}>
            <FontAwesomeIcon icon={faRotateRight} />
            <span className="category-manager__toolbar-text">Tải lại</span>
          </button>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => openForm()}>
            <FontAwesomeIcon icon={faPlus} />
            Thêm {itemLabel}
          </button>
        </div>
      </div>

      {notice && (
        <p
          className={`alert alert--${notice.type} category-manager__notice`}
          role={notice.type === 'error' ? 'alert' : 'status'}
        >
          <FontAwesomeIcon icon={notice.type === 'error' ? faCircleExclamation : faCircleCheck} />
          {notice.text}
        </p>
      )}

      {loadError ? (
        <p className="alert alert--error" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} />
          {loadError}
        </p>
      ) : (
        <div className="category-table__wrapper">
          <table className="category-table">
            <thead>
              <tr>
                {fields.map(({ name, label: fieldLabel }) => (
                  <th key={name} scope="col">
                    {fieldLabel}
                  </th>
                ))}
                <th scope="col" className="category-table__actions-cell">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>{renderTableBody()}</tbody>
          </table>
        </div>
      )}

      <Modal
        open={isFormOpen}
        title={editingItem ? `Sửa ${itemLabel}` : `Thêm ${itemLabel}`}
        onClose={closeForm}
        closeDisabled={isSaving}
        footer={
          <>
            <button type="button" className="btn btn--outline" onClick={closeForm} disabled={isSaving}>
              Hủy
            </button>
            <button type="submit" form={formId} className="btn btn--primary" disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : editingItem ? 'Lưu thay đổi' : `Thêm ${itemLabel}`}
            </button>
          </>
        }
      >
        {formError && (
          <p className="alert alert--error category-manager__form-error" role="alert">
            <FontAwesomeIcon icon={faCircleExclamation} />
            {formError}
          </p>
        )}
        <form id={formId} onSubmit={handleSubmit} noValidate>
          {fields.map(({ name, label: fieldLabel, required, maxLength, multiline, placeholder }, index) => {
            const id = `${slug}-${name}`;
            const inputProps = {
              id,
              name,
              placeholder,
              className: `input${errors[name] ? ' input--error' : ''}${multiline ? ' category-form__textarea' : ''}`,
              value: form[name],
              onChange: handleChange,
              'aria-invalid': Boolean(errors[name]),
              'aria-describedby': `${id}-message`,
              'data-autofocus': index === 0 ? true : undefined,
            };
            return (
              <FormField
                key={name}
                id={id}
                label={required ? fieldLabel : `${fieldLabel} (không bắt buộc)`}
                error={errors[name]}
                hint={multiline ? `Tối đa ${maxLength} ký tự` : undefined}
              >
                {multiline ? (
                  <textarea {...inputProps} rows={4} />
                ) : (
                  <input {...inputProps} type="text" autoComplete="off" />
                )}
              </FormField>
            );
          })}
        </form>
      </Modal>

      {remove && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title={`Xóa ${itemLabel}?`}
          message={
            deleteTarget &&
            `${capitalize(itemLabel)} "${deleteTarget[nameField]}" sẽ bị xóa vĩnh viễn. Chỉ xóa được khi chưa có tour nào thuộc ${itemLabel} này.`
          }
          confirmLabel="Xóa"
          danger
          isProcessing={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </section>
  );
};

export default CategoryManager;
