import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBan,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faCircleExclamation,
  faPen,
  faPlus,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import Modal from '../../../components/Modal/Modal.jsx';
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog.jsx';
import FormField from '../../../components/FormField/FormField.jsx';
import { getTourDepartures, createDeparture, updateDeparture, deleteDeparture } from '../../../api/departureApi.js';
import { getErrorMessage } from '../../../api/axiosClient.js';
import { formatDateOnly, formatWeekday, toDateInputValue } from '../../../utils/format.js';
import { DEPARTURE_STATUS, SELLING_STATUSES } from './departureStatus.js';
import './TourDepartureManager.css';

// Cùng giới hạn với departure.service.js ở backend; backend vẫn kiểm tra lại
const MAX_SEATS = 500;
const COLUMN_COUNT = 7;

const VIEWS = [
  { value: 'upcoming', label: 'Sắp tới', empty: 'Chưa có lịch khởi hành sắp tới. Bấm "Thêm lịch" để tạo lịch.' },
  { value: 'past', label: 'Đã qua', empty: 'Chưa có lịch nào đã qua.' },
];

// "Hết chỗ" do hệ thống tự đặt theo số chỗ còn lại nên không có trong ô chọn
const STATUS_OPTIONS = ['mo', 'da_khoi_hanh', 'da_huy'];

const MONTH_NUMBERS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));

// Chọn năm (‹ 2026 ›) rồi một trong 12 tháng, để lịch kéo dài nhiều năm vẫn chỉ có một hàng nút.
// months là các tháng có lịch theo thứ tự backend trả (sắp tới: tăng dần, đã qua: giảm dần);
// sang năm khác thì chọn tháng đầu tiên của năm đó theo đúng thứ tự này.
const MonthPicker = ({ months, activeMonth, onSelect }) => {
  const totals = new Map(months.map(({ month, total }) => [month, total]));
  const years = [...new Set(months.map(({ month }) => month.slice(0, 4)))].sort();
  const activeYear = activeMonth.slice(0, 4);
  const yearIndex = years.indexOf(activeYear);

  const goToYear = (year) => onSelect(months.find(({ month }) => month.startsWith(`${year}-`)).month);

  return (
    <div className="month-picker">
      <div className="month-picker__year" role="group" aria-label="Chọn năm">
        <button
          type="button"
          className="month-picker__arrow"
          onClick={() => goToYear(years[yearIndex - 1])}
          disabled={yearIndex <= 0}
          aria-label="Năm trước"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <span className="month-picker__year-label">{activeYear}</span>
        <button
          type="button"
          className="month-picker__arrow"
          onClick={() => goToYear(years[yearIndex + 1])}
          disabled={yearIndex >= years.length - 1}
          aria-label="Năm sau"
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
      <div className="month-picker__months" role="group" aria-label={`Các tháng năm ${activeYear}`}>
        {MONTH_NUMBERS.map((number) => {
          const month = `${activeYear}-${number}`;
          const total = totals.get(month);
          const isActive = month === activeMonth;
          return (
            <button
              key={month}
              type="button"
              className={`month-picker__month${isActive ? ' month-picker__month--active' : ''}`}
              onClick={() => onSelect(month)}
              disabled={!total}
              aria-pressed={isActive}
              aria-label={total ? `Tháng ${Number(number)}/${activeYear}, ${total} lịch` : `Tháng ${Number(number)}/${activeYear}, không có lịch`}
            >
              T{Number(number)}
              {total && <span className="month-picker__count">{total}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const getTomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toDateInputValue(date);
};

const toForm = (departure) =>
  departure
    ? {
        ngay_khoi_hanh: departure.ngay_khoi_hanh,
        tong_so_cho: String(departure.tong_so_cho),
        trang_thai: departure.trang_thai === 'het_cho' ? 'mo' : departure.trang_thai,
      }
    : { ngay_khoi_hanh: '', tong_so_cho: '', trang_thai: 'mo' };

// Cùng quy tắc với backend: chỉ bắt ngày tương lai khi tạo mới, đổi ngày hoặc mở bán lại
const validate = (form, editing) => {
  const errors = {};
  const today = toDateInputValue(new Date());
  const dateChanged = !editing || form.ngay_khoi_hanh !== editing.ngay_khoi_hanh;
  const reopening = editing && form.trang_thai === 'mo' && !SELLING_STATUSES.includes(editing.trang_thai);

  if (!form.ngay_khoi_hanh) errors.ngay_khoi_hanh = 'Vui lòng chọn ngày khởi hành';
  else if ((dateChanged || reopening) && form.ngay_khoi_hanh <= today) {
    errors.ngay_khoi_hanh = 'Ngày khởi hành phải sau ngày hôm nay';
  } else if (form.trang_thai === 'da_khoi_hanh' && form.ngay_khoi_hanh > today) {
    errors.trang_thai = 'Chưa tới ngày khởi hành nên chưa thể chọn "Đã khởi hành"';
  }

  const seats = Number(form.tong_so_cho);
  const booked = editing?.so_cho_da_dat ?? 0;
  if (!form.tong_so_cho) errors.tong_so_cho = 'Vui lòng nhập tổng số chỗ';
  else if (!Number.isInteger(seats) || seats < 1) errors.tong_so_cho = 'Tổng số chỗ phải là số nguyên từ 1 trở lên';
  else if (seats > MAX_SEATS) errors.tong_so_cho = `Tổng số chỗ tối đa ${MAX_SEATS}`;
  else if (seats < booked) errors.tong_so_cho = `Không được nhỏ hơn số chỗ đã đặt (${booked})`;
  return errors;
};

const TourDepartureManager = ({ tourId }) => {
  // Chế độ xem và tháng nằm trên URL (?view=past&month=2026-10) để tải lại trang vẫn giữ
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') === 'past' ? 'past' : 'upcoming';
  const monthParam = searchParams.get('month') ?? undefined;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const [notice, setNotice] = useState(null);
  const latestRequest = useRef(0);

  // editing = null: hộp thoại đang ở chế độ thêm
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(() => toForm(null));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // confirm = { type: 'cancel' | 'delete', departure }
  const [confirm, setConfirm] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const setFilter = useCallback(
    ({ view: nextView, month }, options) =>
      setSearchParams((current) => {
        if (nextView === 'past') current.set('view', 'past');
        else current.delete('view');
        if (month) current.set('month', month);
        else current.delete('month');
        return current;
      }, options),
    [setSearchParams],
  );

  useEffect(() => {
    const requestId = ++latestRequest.current;
    const load = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const result = await getTourDepartures(tourId, { view, month: monthParam });
        if (requestId !== latestRequest.current) return;
        setData(result);
        // Tháng trên URL không còn lịch (vừa xóa hết, gõ tay sai) thì backend chọn tháng khác; ghi lại cho khớp
        if (monthParam && result.filter.month !== monthParam) {
          setFilter({ view, month: result.filter.month }, { replace: true });
        }
      } catch (error) {
        if (requestId === latestRequest.current) setLoadError(getErrorMessage(error));
      } finally {
        if (requestId === latestRequest.current) setIsLoading(false);
      }
    };
    load();
  }, [tourId, view, monthParam, reloadCount, setFilter]);

  const reload = () => setReloadCount((count) => count + 1);

  const changeFilter = (filter) => {
    setNotice(null);
    setFilter(filter);
  };

  // Sau khi thêm/sửa: chuyển tới tháng của lịch vừa lưu để thấy ngay
  const showMonthOf = (dateString) => {
    const today = toDateInputValue(new Date());
    setFilter({ view: dateString >= today ? 'upcoming' : 'past', month: dateString.slice(0, 7) });
    reload();
  };

  const openForm = (departure = null) => {
    setEditing(departure);
    setForm(toForm(departure));
    setErrors({});
    setFormError('');
    setNotice(null);
    setIsFormOpen(true);
  };

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form, editing);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    const payload = { ngay_khoi_hanh: form.ngay_khoi_hanh, tong_so_cho: Number(form.tong_so_cho) };
    const dateText = formatDateOnly(form.ngay_khoi_hanh);
    setIsSaving(true);
    try {
      if (editing) {
        await updateDeparture(editing.ma_lich_khoi_hanh, { ...payload, trang_thai: form.trang_thai });
        setNotice({ type: 'success', text: `Đã cập nhật lịch ngày ${dateText}.` });
      } else {
        await createDeparture(tourId, payload);
        setNotice({ type: 'success', text: `Đã thêm lịch ngày ${dateText}.` });
      }
      setIsFormOpen(false);
      showMonthOf(form.ngay_khoi_hanh);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const openConfirm = (type, departure) => {
    setNotice(null);
    setConfirm({ type, departure });
  };

  const handleConfirm = async () => {
    const { type, departure } = confirm;
    const dateText = formatDateOnly(departure.ngay_khoi_hanh);
    setIsProcessing(true);
    try {
      if (type === 'delete') {
        await deleteDeparture(departure.ma_lich_khoi_hanh);
        setNotice({ type: 'success', text: `Đã xóa lịch ngày ${dateText}.` });
      } else {
        await updateDeparture(departure.ma_lich_khoi_hanh, {
          ngay_khoi_hanh: departure.ngay_khoi_hanh,
          tong_so_cho: departure.tong_so_cho,
          trang_thai: 'da_huy',
        });
        setNotice({ type: 'success', text: `Đã hủy lịch ngày ${dateText}.` });
      }
      reload();
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setIsProcessing(false);
      setConfirm(null);
    }
  };

  const items = data?.items ?? [];
  const activeMonth = data?.filter.month ?? null;
  const viewInfo = VIEWS.find(({ value }) => value === view);

  const renderRows = () => {
    if (items.length === 0) {
      return (
        <tr>
          <td colSpan={COLUMN_COUNT} className="departure-table__empty">
            {isLoading ? 'Đang tải lịch khởi hành...' : viewInfo.empty}
          </td>
        </tr>
      );
    }
    return items.map((departure) => {
      const status = DEPARTURE_STATUS[departure.trang_thai];
      const dateText = formatDateOnly(departure.ngay_khoi_hanh);
      const selling = SELLING_STATUSES.includes(departure.trang_thai);
      return (
        <tr key={departure.ma_lich_khoi_hanh} className={selling ? undefined : 'departure-table__row--closed'}>
          <td className="departure-table__date">{dateText}</td>
          <td className="departure-table__weekday">{formatWeekday(departure.ngay_khoi_hanh)}</td>
          <td className="departure-table__number">{departure.tong_so_cho}</td>
          <td className="departure-table__number">{departure.so_cho_da_dat}</td>
          <td className="departure-table__number departure-table__remaining">{departure.so_cho_con_lai}</td>
          <td>
            <span className={`status-badge status-badge--${status.badge}`}>{status.label}</span>
          </td>
          <td className="departure-table__actions-cell">
            <div className="departure-table__actions">
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => openForm(departure)}
                aria-label={`Sửa lịch ngày ${dateText}`}
              >
                <FontAwesomeIcon icon={faPen} />
                <span className="departure-table__action-text">Sửa</span>
              </button>
              {selling && (
                <button
                  type="button"
                  className="btn btn--outline btn--sm departure-table__danger"
                  onClick={() => openConfirm('cancel', departure)}
                  aria-label={`Hủy lịch ngày ${dateText}`}
                >
                  <FontAwesomeIcon icon={faBan} />
                  <span className="departure-table__action-text">Hủy lịch</span>
                </button>
              )}
              {departure.so_don === 0 && (
                <button
                  type="button"
                  className="btn btn--outline btn--sm departure-table__danger"
                  onClick={() => openConfirm('delete', departure)}
                  aria-label={`Xóa lịch ngày ${dateText}`}
                >
                  <FontAwesomeIcon icon={faTrashCan} />
                  <span className="departure-table__action-text">Xóa</span>
                </button>
              )}
            </div>
          </td>
        </tr>
      );
    });
  };

  const confirmDate = confirm ? formatDateOnly(confirm.departure.ngay_khoi_hanh) : '';
  const confirmBooked = confirm?.departure.so_cho_da_dat ?? 0;
  const lockDate = Boolean(editing && editing.so_cho_da_dat > 0);

  return (
    <section className="departures" aria-label="Lịch khởi hành">
      <div className="departures__toolbar">
        <div className="departures__views" role="group" aria-label="Chế độ xem">
          {VIEWS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`departures__view${view === value ? ' departures__view--active' : ''}`}
              aria-pressed={view === value}
              onClick={() => changeFilter({ view: value })}
            >
              {label}
              {data && <span className="departures__view-count">{data.counts[value]}</span>}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => openForm()}>
          <FontAwesomeIcon icon={faPlus} />
          Thêm lịch
        </button>
      </div>

      {activeMonth && (
        <MonthPicker
          months={data.months}
          activeMonth={activeMonth}
          onSelect={(month) => changeFilter({ view, month })}
        />
      )}

      {notice && (
        <p className={`alert alert--${notice.type} departures__alert`} role={notice.type === 'error' ? 'alert' : 'status'}>
          <FontAwesomeIcon icon={notice.type === 'error' ? faCircleExclamation : faCircleCheck} />
          {notice.text}
        </p>
      )}

      {loadError ? (
        <p className="alert alert--error departures__alert" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} />
          {loadError}
        </p>
      ) : (
        <div className={`departure-table__wrapper${isLoading && items.length > 0 ? ' departure-table__wrapper--loading' : ''}`}>
          <table className="departure-table">
            <thead>
              <tr>
                <th scope="col">Ngày khởi hành</th>
                <th scope="col">Thứ</th>
                <th scope="col" className="departure-table__number">
                  Tổng chỗ
                </th>
                <th scope="col" className="departure-table__number">
                  Đã đặt
                </th>
                <th scope="col" className="departure-table__number">
                  Còn lại
                </th>
                <th scope="col">Trạng thái</th>
                <th scope="col" className="departure-table__actions-cell">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>{renderRows()}</tbody>
          </table>
        </div>
      )}

      <Modal
        open={isFormOpen}
        title={editing ? `Sửa lịch ngày ${formatDateOnly(editing.ngay_khoi_hanh)}` : 'Thêm lịch khởi hành'}
        size="sm"
        onClose={() => setIsFormOpen(false)}
        closeDisabled={isSaving}
        footer={
          <>
            <button type="button" className="btn btn--outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
              Hủy
            </button>
            <button type="submit" form="departure-form" className="btn btn--primary" disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm lịch'}
            </button>
          </>
        }
      >
        {formError && (
          <p className="alert alert--error departures__alert" role="alert">
            <FontAwesomeIcon icon={faCircleExclamation} />
            {formError}
          </p>
        )}
        <form id="departure-form" onSubmit={handleSubmit} noValidate>
          <FormField
            id="departure-date"
            label="Ngày khởi hành"
            error={errors.ngay_khoi_hanh}
            hint={lockDate ? 'Đã có khách đặt nên không đổi được ngày' : undefined}
          >
            <input
              id="departure-date"
              name="ngay_khoi_hanh"
              type="date"
              className={`input${errors.ngay_khoi_hanh ? ' input--error' : ''}`}
              value={form.ngay_khoi_hanh}
              onChange={handleChange}
              min={editing && !SELLING_STATUSES.includes(editing.trang_thai) ? undefined : getTomorrow()}
              disabled={lockDate}
              aria-invalid={Boolean(errors.ngay_khoi_hanh)}
              aria-describedby="departure-date-message"
              data-autofocus={lockDate ? undefined : true}
            />
          </FormField>
          <FormField
            id="departure-seats"
            label="Tổng số chỗ"
            error={errors.tong_so_cho}
            hint={editing?.so_cho_da_dat > 0 ? `Đã đặt ${editing.so_cho_da_dat} chỗ` : undefined}
          >
            <input
              id="departure-seats"
              name="tong_so_cho"
              type="number"
              inputMode="numeric"
              className={`input${errors.tong_so_cho ? ' input--error' : ''}`}
              value={form.tong_so_cho}
              onChange={handleChange}
              min={Math.max(1, editing?.so_cho_da_dat ?? 0)}
              max={MAX_SEATS}
              placeholder="20"
              aria-invalid={Boolean(errors.tong_so_cho)}
              aria-describedby="departure-seats-message"
              data-autofocus={lockDate ? true : undefined}
            />
          </FormField>
          {editing && (
            <FormField
              id="departure-status"
              label="Trạng thái"
              error={errors.trang_thai}
              hint={editing.trang_thai === 'het_cho' ? 'Đang hết chỗ; tăng tổng số chỗ để mở bán lại' : undefined}
            >
              <select
                id="departure-status"
                name="trang_thai"
                className={`input${errors.trang_thai ? ' input--error' : ''}`}
                value={form.trang_thai}
                onChange={handleChange}
                aria-invalid={Boolean(errors.trang_thai)}
                aria-describedby="departure-status-message"
              >
                {STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {DEPARTURE_STATUS[value].label}
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.type === 'delete' ? 'Xóa lịch khởi hành?' : 'Hủy lịch khởi hành?'}
        message={
          confirm?.type === 'delete'
            ? `Lịch ngày ${confirmDate} sẽ bị xóa vĩnh viễn.`
            : `Lịch ngày ${confirmDate} sẽ chuyển sang "Đã hủy" và ngừng nhận đặt chỗ.${
                confirmBooked > 0 ? ` Lịch đang có ${confirmBooked} chỗ đã đặt, cần liên hệ khách để xử lý các đơn này.` : ''
              }`
        }
        confirmLabel={confirm?.type === 'delete' ? 'Xóa lịch' : 'Hủy lịch'}
        cancelLabel="Đóng"
        danger
        isProcessing={isProcessing}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </section>
  );
};

export default TourDepartureManager;
