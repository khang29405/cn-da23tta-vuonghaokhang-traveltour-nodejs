import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCalendarDays,
  faCircleCheck,
  faCircleExclamation,
  faImages,
} from '@fortawesome/free-solid-svg-icons';
import FormField from '../../../components/FormField/FormField.jsx';
import ItineraryEditor from './ItineraryEditor.jsx';
import TourImageManager from './TourImageManager.jsx';
import * as categoryApi from '../../../api/categoryApi.js';
import { getAdminTour, createTour, updateTour } from '../../../api/tourApi.js';
import { getErrorMessage } from '../../../api/axiosClient.js';
import { useFlashNotice } from '../../../hooks/useFlashNotice.js';
import { formatDate, formatNumber } from '../../../utils/format.js';
import { ADMIN_PATH } from '../../../config/roles.js';
import './TourFormPage.css';

const TOUR_PATH = `${ADMIN_PATH}/tour`;

// Cùng giới hạn với tour.service.js ở backend; backend vẫn kiểm tra lại
const MAX_DAYS = 30;
const MAX_NAME_LENGTH = 200;
const MAX_LONG_TEXT = 4000;
const MAX_PRICE_DIGITS = 12;
const DAY_OPTIONS = Array.from({ length: MAX_DAYS }, (_, index) => index + 1);

const CATEGORY_FIELDS = [
  { name: 'ma_loai_tour', label: 'Loại tour', listKey: 'tourTypes', nameField: 'ten_loai_tour' },
  { name: 'ma_diem_den', label: 'Điểm đến', listKey: 'destinations', nameField: 'ten_diem_den' },
  { name: 'ma_diem_khoi_hanh', label: 'Điểm khởi hành', listKey: 'departurePoints', nameField: 'ten_diem_khoi_hanh' },
  { name: 'ma_phuong_tien', label: 'Phương tiện', listKey: 'transports', nameField: 'ten_phuong_tien' },
];

const EMPTY_FORM = {
  ten_tour: '',
  ma_loai_tour: '',
  ma_diem_den: '',
  ma_diem_khoi_hanh: '',
  ma_phuong_tien: '',
  so_ngay: '',
  so_dem: '',
  gia: '',
  trang_thai_hien_thi: true,
  mo_ta_tong_quan: '',
};

// key chỉ dùng cho React để giữ đúng ô nhập khi xóa một ngày ở giữa; không gửi lên API
let nextDayKey = 0;
const createDay = (day = {}) => ({
  key: ++nextDayKey,
  tieu_de: day.tieu_de ?? '',
  noi_dung_hoat_dong: day.noi_dung_hoat_dong ?? '',
});

const isBlankDay = (day) => !day.tieu_de.trim() && !day.noi_dung_hoat_dong.trim();

const toForm = (tour) => ({
  ten_tour: tour.ten_tour,
  ma_loai_tour: String(tour.ma_loai_tour),
  ma_diem_den: String(tour.ma_diem_den),
  ma_diem_khoi_hanh: String(tour.ma_diem_khoi_hanh),
  ma_phuong_tien: String(tour.ma_phuong_tien),
  so_ngay: String(tour.so_ngay),
  so_dem: String(tour.so_dem),
  gia: String(tour.gia),
  trang_thai_hien_thi: tour.trang_thai_hien_thi,
  mo_ta_tong_quan: tour.mo_ta_tong_quan ?? '',
});

const validate = (form, days) => {
  const errors = {};
  const name = form.ten_tour.trim();
  if (!name) errors.ten_tour = 'Vui lòng nhập tên tour';
  else if (name.length > MAX_NAME_LENGTH) errors.ten_tour = `Tên tour tối đa ${MAX_NAME_LENGTH} ký tự`;

  CATEGORY_FIELDS.forEach(({ name: field, label }) => {
    if (!form[field]) errors[field] = `Vui lòng chọn ${label.toLowerCase()}`;
  });
  if (!form.so_ngay) errors.so_ngay = 'Vui lòng chọn số ngày';
  if (form.so_ngay && form.so_dem === '') errors.so_dem = 'Vui lòng chọn số đêm';
  if (!form.gia || Number(form.gia) <= 0) errors.gia = 'Vui lòng nhập giá tour lớn hơn 0';
  if (form.mo_ta_tong_quan.trim().length > MAX_LONG_TEXT) {
    errors.mo_ta_tong_quan = `Mô tả tổng quan tối đa ${MAX_LONG_TEXT} ký tự`;
  }

  const soNgay = Number(form.so_ngay);
  if (soNgay && days.length > soNgay) {
    errors.lich_trinh = `Lịch trình đang có ${days.length} ngày, nhiều hơn số ngày của tour (${soNgay}). Hãy xóa bớt ngày.`;
  }
  days.forEach((day, index) => {
    const title = day.tieu_de.trim();
    if (!title) errors[`${day.key}.tieu_de`] = `Vui lòng nhập tiêu đề ngày ${index + 1}`;
    else if (title.length > MAX_NAME_LENGTH) errors[`${day.key}.tieu_de`] = `Tiêu đề tối đa ${MAX_NAME_LENGTH} ký tự`;
    if (day.noi_dung_hoat_dong.trim().length > MAX_LONG_TEXT) {
      errors[`${day.key}.noi_dung_hoat_dong`] = `Nội dung tối đa ${MAX_LONG_TEXT} ký tự`;
    }
  });
  return errors;
};

const toPayload = (form, days) => ({
  ten_tour: form.ten_tour.trim(),
  mo_ta_tong_quan: form.mo_ta_tong_quan.trim(),
  so_ngay: Number(form.so_ngay),
  so_dem: Number(form.so_dem),
  gia: Number(form.gia),
  trang_thai_hien_thi: form.trang_thai_hien_thi,
  ma_loai_tour: Number(form.ma_loai_tour),
  ma_diem_den: Number(form.ma_diem_den),
  ma_diem_khoi_hanh: Number(form.ma_diem_khoi_hanh),
  ma_phuong_tien: Number(form.ma_phuong_tien),
  lich_trinh: days.map((day) => ({
    tieu_de: day.tieu_de.trim(),
    noi_dung_hoat_dong: day.noi_dung_hoat_dong.trim(),
  })),
});

const TourForm = ({ tourId }) => {
  const isEdit = Boolean(tourId);
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [categories, setCategories] = useState(null);
  const [tour, setTour] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  const [form, setForm] = useState(EMPTY_FORM);
  const [days, setDays] = useState(() => [createDay()]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useFlashNotice();
  const [isSaving, setIsSaving] = useState(false);
  const [focusDayKey, setFocusDayKey] = useState(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const [tourTypes, destinations, departurePoints, transports, detail] = await Promise.all([
          categoryApi.getTourTypes(),
          categoryApi.getDestinations(),
          categoryApi.getDeparturePoints(),
          categoryApi.getTransports(),
          isEdit ? getAdminTour(tourId) : null,
        ]);
        if (ignore) return;
        setCategories({ tourTypes, destinations, departurePoints, transports });
        if (detail) {
          setTour(detail);
          setForm(toForm(detail));
          setDays(detail.lich_trinh.length > 0 ? detail.lich_trinh.map(createDay) : [createDay()]);
        }
      } catch (error) {
        if (!ignore) setLoadError(getErrorMessage(error));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [isEdit, tourId, reloadCount]);

  useEffect(() => {
    if (focusDayKey === null) return;
    document.getElementById(`day-${focusDayKey}-title`)?.focus();
    setFocusDayKey(null);
  }, [focusDayKey]);

  const clearErrors = (...names) =>
    setErrors((current) => {
      const next = { ...current };
      names.forEach((name) => delete next[name]);
      return next;
    });

  const handleChange = ({ target }) => {
    const { name, type, checked } = target;
    let { value } = target;
    // Ô giá hiển thị có dấu chấm ngăn cách (3.290.000) nhưng state chỉ giữ chữ số
    if (name === 'gia') value = value.replace(/\D/g, '').replace(/^0+/, '').slice(0, MAX_PRICE_DIGITS);
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    clearErrors(name);
  };

  // Số đêm chỉ có thể là N - 1 hoặc N (giống backend): đổi số ngày thì giữ số đêm nếu còn hợp lệ, không thì chọn N - 1
  const handleDaysChange = ({ target: { value } }) => {
    const soNgay = Number(value);
    setForm((current) => {
      const soDem = Number(current.so_dem);
      const stillValid = current.so_dem !== '' && (soDem === soNgay || soDem === soNgay - 1);
      let nextSoDem = '';
      if (value) nextSoDem = stillValid ? current.so_dem : String(soNgay - 1);
      return { ...current, so_ngay: value, so_dem: nextSoDem };
    });
    // Lịch trình chưa nhập gì thì tạo sẵn đủ số ngày để đỡ bấm "Thêm ngày"
    if (soNgay) {
      setDays((current) =>
        current.every(isBlankDay) ? Array.from({ length: soNgay }, (_, index) => current[index] ?? createDay()) : current,
      );
    }
    clearErrors('so_ngay', 'so_dem', 'lich_trinh');
  };

  const handleChangeDay = (key, field, value) => {
    setDays((current) => current.map((day) => (day.key === key ? { ...day, [field]: value } : day)));
    clearErrors(`${key}.${field}`);
  };

  const handleAddDay = () => {
    const day = createDay();
    setDays((current) => [...current, day]);
    setFocusDayKey(day.key);
  };

  const handleRemoveDay = (key) => {
    setDays((current) => (current.length > 1 ? current.filter((day) => day.key !== key) : current));
    clearErrors('lich_trinh', `${key}.tieu_de`, `${key}.noi_dung_hoat_dong`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice(null);
    setFormError('');
    const nextErrors = validate(form, days);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      requestAnimationFrame(() => {
        const firstInvalid = formRef.current?.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        else formRef.current?.querySelector('.tour-form__section-alert')?.scrollIntoView({ block: 'center' });
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = toPayload(form, days);
      if (isEdit) {
        const updated = await updateTour(tourId, payload);
        setTour(updated);
        setForm(toForm(updated));
        setDays(updated.lich_trinh.map(createDay));
        setNotice({ type: 'success', text: `Đã lưu thay đổi của tour "${updated.ten_tour}".` });
      } else {
        const created = await createTour(payload);
        navigate(`${TOUR_PATH}/${created.ma_tour}`, {
          replace: true,
          state: { notice: { type: 'success', text: `Đã thêm tour "${created.ten_tour}".` } },
        });
      }
      window.scrollTo({ top: 0 });
    } catch (error) {
      setFormError(getErrorMessage(error));
      window.scrollTo({ top: 0 });
    } finally {
      setIsSaving(false);
    }
  };

  const pageTitle = isEdit ? 'Sửa tour' : 'Thêm tour';
  const cancelLabel = isEdit ? 'Quay lại' : 'Hủy';
  let submitLabel = isEdit ? 'Lưu thay đổi' : 'Thêm tour';
  if (isSaving) submitLabel = 'Đang lưu...';
  const backLink = (
    <Link to={TOUR_PATH} className="tour-form__back">
      <FontAwesomeIcon icon={faArrowLeft} />
      Danh sách tour
    </Link>
  );

  if (isLoading) {
    return (
      <>
        {backLink}
        <h1 className="dashboard-page__title">{pageTitle}</h1>
        <p className="tour-form__loading">Đang tải dữ liệu...</p>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        {backLink}
        <h1 className="dashboard-page__title">{pageTitle}</h1>
        <div className="alert alert--error tour-form__load-error" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} />
          <span>{loadError}</span>
        </div>
        <button type="button" className="btn btn--outline btn--sm" onClick={() => setReloadCount((count) => count + 1)}>
          Thử lại
        </button>
      </>
    );
  }

  const missingCategories = CATEGORY_FIELDS.filter(({ listKey }) => categories[listKey].length === 0);
  const soNgay = Number(form.so_ngay);
  const nightOptions = soNgay ? [soNgay - 1, soNgay] : [];

  const fieldProps = (name, extraClass = '') => ({
    id: `tour-${name}`,
    name,
    className: `input${extraClass}${errors[name] ? ' input--error' : ''}`,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': `tour-${name}-message`,
  });

  return (
    <div className="tour-form">
      {backLink}
      <h1 className="dashboard-page__title tour-form__title">
        {pageTitle}
        {isEdit && <span className="tour-form__subtitle">#{tour.ma_tour}</span>}
      </h1>

      {notice && (
        <p className={`alert alert--${notice.type} tour-form__notice`} role="status">
          <FontAwesomeIcon icon={faCircleCheck} />
          {notice.text}
        </p>
      )}
      {formError && (
        <p className="alert alert--error tour-form__notice" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} />
          {formError}
        </p>
      )}
      {missingCategories.length > 0 && (
        <p className="alert alert--error tour-form__notice" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} />
          <span>
            Chưa có {missingCategories.map(({ label }) => label.toLowerCase()).join(', ')} nào để chọn. Hãy thêm ở trang{' '}
            <Link to={`${ADMIN_PATH}/danh-muc`}>Loại tour</Link> trước.
          </span>
        </p>
      )}

      <div className="tour-form__layout">
        <form id="tour-form" ref={formRef} onSubmit={handleSubmit} noValidate className="tour-form__main">
          <section className="tour-form__section" aria-labelledby="tour-section-info">
            <h2 id="tour-section-info" className="tour-form__section-title">
              Thông tin chung
            </h2>
            <div className="tour-form__grid">
              <div className="tour-form__cell tour-form__cell--full">
                <FormField id="tour-ten_tour" label="Tên tour" error={errors.ten_tour}>
                  <input
                    {...fieldProps('ten_tour')}
                    type="text"
                    value={form.ten_tour}
                    onChange={handleChange}
                    placeholder="Đà Lạt 3 ngày 2 đêm"
                    maxLength={MAX_NAME_LENGTH}
                    autoComplete="off"
                  />
                </FormField>
              </div>

              {CATEGORY_FIELDS.map(({ name, label, listKey, nameField }) => (
                <div key={name} className="tour-form__cell tour-form__cell--half">
                  <FormField id={`tour-${name}`} label={label} error={errors[name]}>
                    <select {...fieldProps(name)} value={form[name]} onChange={handleChange}>
                      <option value="">Chọn {label.toLowerCase()}</option>
                      {categories[listKey].map((item) => (
                        <option key={item[name]} value={item[name]}>
                          {item[nameField]}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              ))}

              <div className="tour-form__cell tour-form__cell--quarter">
                <FormField id="tour-so_ngay" label="Số ngày" error={errors.so_ngay}>
                  <select {...fieldProps('so_ngay')} value={form.so_ngay} onChange={handleDaysChange}>
                    <option value="">Chọn</option>
                    {DAY_OPTIONS.map((day) => (
                      <option key={day} value={day}>
                        {day} ngày
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="tour-form__cell tour-form__cell--quarter">
                <FormField id="tour-so_dem" label="Số đêm" error={errors.so_dem}>
                  <select {...fieldProps('so_dem')} value={form.so_dem} onChange={handleChange} disabled={!soNgay}>
                    {!soNgay && <option value="">Chọn số ngày trước</option>}
                    {nightOptions.map((night) => (
                      <option key={night} value={night}>
                        {night} đêm
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="tour-form__cell tour-form__cell--half">
                <FormField id="tour-gia" label="Giá mỗi khách" error={errors.gia}>
                  <div className="tour-form__price">
                    <input
                      {...fieldProps('gia', ' tour-form__price-input')}
                      type="text"
                      inputMode="numeric"
                      value={form.gia ? formatNumber(Number(form.gia)) : ''}
                      onChange={handleChange}
                      placeholder="3.290.000"
                      autoComplete="off"
                    />
                    <span className="tour-form__price-unit">đ</span>
                  </div>
                </FormField>
              </div>

              <div className="tour-form__cell tour-form__cell--full">
                <FormField
                  id="tour-mo_ta_tong_quan"
                  label="Mô tả tổng quan (không bắt buộc)"
                  error={errors.mo_ta_tong_quan}
                  hint={`${form.mo_ta_tong_quan.length}/${MAX_LONG_TEXT} ký tự`}
                >
                  <textarea
                    {...fieldProps('mo_ta_tong_quan', ' tour-form__textarea')}
                    value={form.mo_ta_tong_quan}
                    onChange={handleChange}
                    rows={4}
                  />
                </FormField>
              </div>

              <div className="tour-form__cell tour-form__cell--full">
                <label className="tour-form__check">
                  <input
                    type="checkbox"
                    name="trang_thai_hien_thi"
                    checked={form.trang_thai_hien_thi}
                    onChange={handleChange}
                  />
                  <span>
                    Hiển thị trên website
                    <small className="tour-form__check-hint">
                      Bỏ chọn để ẩn tour khỏi trang khách hàng; tour đã có lịch khởi hành thì nên ẩn thay vì xóa.
                    </small>
                  </span>
                </label>
              </div>
            </div>
          </section>

          <section className="tour-form__section" aria-labelledby="tour-section-itinerary">
            <h2 id="tour-section-itinerary" className="tour-form__section-title">
              Lịch trình theo ngày
            </h2>
            <ItineraryEditor
              days={days}
              maxDays={soNgay}
              errors={errors}
              listError={errors.lich_trinh}
              onChangeDay={handleChangeDay}
              onAddDay={handleAddDay}
              onRemoveDay={handleRemoveDay}
            />
          </section>
        </form>

        <aside className="tour-form__side">
          <section className="tour-form__section tour-form__save" aria-label={isEdit ? 'Lưu thay đổi' : 'Lưu tour'}>
            <p className="tour-form__summary">
              {isEdit ? (
                <>
                  <span className={`status-badge status-badge--${tour.trang_thai_hien_thi ? 'visible' : 'hidden'}`}>
                    {tour.trang_thai_hien_thi ? 'Đang hiển thị' : 'Đang ẩn'}
                  </span>
                  <span>Tạo ngày {formatDate(tour.ngay_tao)}</span>
                </>
              ) : (
                <span>Tour mới, chưa lưu</span>
              )}
            </p>
            <div className="tour-form__save-buttons">
              <Link to={TOUR_PATH} className="btn btn--outline btn--sm">
                {cancelLabel}
              </Link>
              <button type="submit" form="tour-form" className="btn btn--primary btn--sm" disabled={isSaving}>
                {submitLabel}
              </button>
            </div>
          </section>

          {/* Ảnh gắn với mã tour nên chỉ quản lý được sau khi tour đã lưu */}
          {isEdit ? (
            <TourImageManager key={tour.ma_tour} tourId={tour.ma_tour} initialImages={tour.anh_tour} />
          ) : (
            <section
              className="tour-form__section tour-form__section--placeholder"
              aria-labelledby="tour-section-images"
            >
              <h2 id="tour-section-images" className="tour-form__section-title">
                <FontAwesomeIcon icon={faImages} />
                Ảnh tour
              </h2>
              <p className="tour-form__placeholder-text">Lưu tour trước, sau đó thêm ảnh tại đây.</p>
            </section>
          )}

          {/* Bước 13 thay khu này bằng phần quản lý lịch khởi hành */}
          <section
            className="tour-form__section tour-form__section--placeholder"
            aria-labelledby="tour-section-departures"
          >
            <h2 id="tour-section-departures" className="tour-form__section-title">
              <FontAwesomeIcon icon={faCalendarDays} />
              Lịch khởi hành
            </h2>
            <p className="tour-form__placeholder-text">
              {isEdit
                ? 'Chức năng quản lý lịch khởi hành đang được hoàn thiện.'
                : 'Lưu tour trước, sau đó thêm lịch khởi hành tại đây.'}
            </p>
          </section>
        </aside>
      </div>

      {/* Màn hình hẹp: cột phải xuống dưới cùng nên nút lưu chuyển thành thanh dính cuối màn hình */}
      <div className="tour-form__actions">
        <Link to={TOUR_PATH} className="btn btn--outline">
          {cancelLabel}
        </Link>
        <button type="submit" form="tour-form" className="btn btn--primary" disabled={isSaving}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
};

// key theo mã tour: chuyển từ trang thêm sang trang sửa (sau khi thêm) thì form được tạo mới hoàn toàn
const TourFormPage = () => {
  const { tourId } = useParams();
  return <TourForm key={tourId ?? 'new'} tourId={tourId} />;
};

export default TourFormPage;
