import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faCircleExclamation,
  faMinus,
  faPlus,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import FormField from '../../components/FormField/FormField.jsx';
import Modal from '../../components/Modal/Modal.jsx';
import TourImage from '../../components/TourImage/TourImage.jsx';
import { FEW_SEATS } from '../../components/TourCard/TourCard.jsx';
import { useAuth } from '../../context/authContext.js';
import { getTour } from '../../api/publicTourApi.js';
import { createBooking } from '../../api/bookingApi.js';
import { getErrorMessage } from '../../api/axiosClient.js';
import { PAYMENT_METHODS } from '../../config/booking.js';
import siteInfo from '../../config/siteInfo.js';
import { toAssetUrl } from '../../utils/assetUrl.js';
import { PHONE_PATTERN } from '../../utils/validation.js';
import { addDays, formatDateOnly, formatDuration, formatPrice, formatWeekday } from '../../utils/format.js';
import './BookingPage.css';

const MAX_NOTE = 500;
const hotlineHref = `tel:${siteInfo.hotline.replace(/\s/g, '')}`;

const toGuestCount = (value) => (/^\d+$/.test(String(value)) ? Number(value) : Number.NaN);

const validate = (form, departure) => {
  const errors = {};
  if (!departure) errors.departure = 'Vui lòng chọn ngày khởi hành';
  const guests = toGuestCount(form.so_luong_khach);
  if (!(guests >= 1)) errors.so_luong_khach = 'Vui lòng nhập số lượng khách từ 1 trở lên';
  else if (departure && guests > departure.so_cho_con_lai) {
    errors.so_luong_khach = `Ngày này chỉ còn ${departure.so_cho_con_lai} chỗ`;
  }
  if (!form.ho_ten_lien_he.trim()) errors.ho_ten_lien_he = 'Vui lòng nhập họ tên người liên hệ';
  else if (form.ho_ten_lien_he.trim().length > 100) errors.ho_ten_lien_he = 'Họ tên tối đa 100 ký tự';
  if (!form.so_dien_thoai_lien_he.trim()) errors.so_dien_thoai_lien_he = 'Vui lòng nhập số điện thoại';
  else if (!PHONE_PATTERN.test(form.so_dien_thoai_lien_he.trim())) {
    errors.so_dien_thoai_lien_he = 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0';
  }
  if (form.ghi_chu.length > MAX_NOTE) errors.ghi_chu = `Ghi chú tối đa ${MAX_NOTE} ký tự`;
  return errors;
};

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Thứ tự trên form, để con trỏ nhảy tới ô sai nằm cao nhất
const FIELD_ORDER = [
  ['departure', 'input[name="departure"]'],
  ['so_luong_khach', '#booking-guests'],
  ['ho_ten_lien_he', '#booking-name'],
  ['so_dien_thoai_lien_he', '#booking-phone'],
  ['ghi_chu', '#booking-note'],
];

// Cuộn ô ra giữa màn hình trước vì navbar và thanh tổng tiền dính có thể che mất ô nếu chỉ focus
const focusField = (selector) => {
  const field = document.querySelector(selector);
  field?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  field?.focus({ preventScroll: true });
};

const BookingSkeleton = () => (
  <div className="container booking-page" aria-busy="true" aria-label="Đang tải thông tin đặt tour">
    <div className="skeleton booking-page__skeleton-line" />
    <div className="skeleton booking-page__skeleton-title" />
    <div className="booking-page__layout">
      <div className="booking-page__main">
        <div className="skeleton booking-page__skeleton-block" />
        <div className="skeleton booking-page__skeleton-block booking-page__skeleton-block--short" />
      </div>
      <div className="skeleton booking-page__skeleton-summary" />
    </div>
  </div>
);

const BookingPage = () => {
  const { tourId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tour, setTour] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [isNotFound, setIsNotFound] = useState(false);
  const [form, setForm] = useState(() => ({
    so_luong_khach: '1',
    ho_ten_lien_he: user?.ho_ten ?? '',
    so_dien_thoai_lien_he: user?.so_dien_thoai ?? '',
    ghi_chu: '',
    phuong_thuc: PAYMENT_METHODS[0].value,
  }));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  const loadTour = useCallback(async () => {
    setLoadError('');
    try {
      setTour(await getTour(tourId));
    } catch (error) {
      if ([400, 404].includes(error.response?.status)) setIsNotFound(true);
      else setLoadError(getErrorMessage(error));
    }
  }, [tourId]);

  useEffect(() => {
    loadTour();
  }, [loadTour]);

  const selectedId = Number(searchParams.get('lich'));
  const departure = tour?.lich_khoi_hanh.find((item) => item.ma_lich_khoi_hanh === selectedId) ?? null;
  // Lịch trên URL không còn trong danh sách còn chỗ (vừa hết chỗ, link cũ) thì báo để khách chọn ngày khác
  const isStaleDeparture = Boolean(tour && searchParams.get('lich') && !departure);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const selectDeparture = (item) => {
    setSearchParams({ lich: item.ma_lich_khoi_hanh }, { replace: true });
    setErrors((current) => ({ ...current, departure: undefined, so_luong_khach: undefined }));
    const guests = toGuestCount(form.so_luong_khach);
    if (guests > item.so_cho_con_lai) updateField('so_luong_khach', String(item.so_cho_con_lai));
  };

  const changeGuests = (step) => {
    const guests = toGuestCount(form.so_luong_khach) || 0;
    const max = departure?.so_cho_con_lai ?? Infinity;
    updateField('so_luong_khach', String(Math.min(Math.max(guests + step, 1), max)));
  };

  // Bấm "Đặt tour" chỉ mở hộp thoại xem lại; đơn được tạo (và giữ chỗ) khi khách bấm gửi trong hộp thoại
  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate(form, departure);
    setErrors(nextErrors);
    setServerError('');
    const firstError = FIELD_ORDER.find(([name]) => nextErrors[name]);
    if (firstError) focusField(firstError[1]);
    else setIsReviewing(true);
  };

  const submitBooking = async () => {
    setIsSubmitting(true);
    try {
      const booking = await createBooking({
        ma_lich_khoi_hanh: departure.ma_lich_khoi_hanh,
        so_luong_khach: toGuestCount(form.so_luong_khach),
        ho_ten_lien_he: form.ho_ten_lien_he.trim(),
        so_dien_thoai_lien_he: form.so_dien_thoai_lien_he.trim(),
        ghi_chu: form.ghi_chu.trim(),
        phuong_thuc: form.phuong_thuc,
      });
      // replace để bấm Quay lại không về form cũ và lỡ gửi đơn lần nữa
      navigate(`/dat-tour/thanh-cong/${booking.ma_don}`, { replace: true, state: { booking } });
    } catch (error) {
      setServerError(getErrorMessage(error));
      setIsSubmitting(false);
      setIsReviewing(false);
      // Hết chỗ hoặc lịch vừa đổi: tải lại để số chỗ trên trang khớp với máy chủ
      if ([404, 409].includes(error.response?.status)) loadTour();
    }
  };

  if (isNotFound) {
    return (
      <section className="container booking-page booking-page__message">
        <h1 className="booking-page__message-title">Tour này không tồn tại hoặc đã ngừng mở bán</h1>
        <Link to="/tour" className="btn btn--primary">
          Xem các tour khác
        </Link>
      </section>
    );
  }

  if (loadError) {
    return (
      <div className="container booking-page">
        <div className="alert alert--error booking-page__load-error" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} />
          <span>Không tải được thông tin tour. {loadError}</span>
          <button type="button" className="btn btn--outline btn--sm" onClick={loadTour}>
            <FontAwesomeIcon icon={faRotateRight} />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!tour) return <BookingSkeleton />;

  const guests = toGuestCount(form.so_luong_khach);
  const totalText = guests >= 1 ? formatPrice(tour.gia * guests) : '—';
  const cover = tour.anh_tour[0]?.duong_dan_anh;
  const errorAlert = serverError && (
    <p className="alert alert--error booking-summary__alert" role="alert">
      <FontAwesomeIcon icon={faCircleExclamation} />
      {serverError}
    </p>
  );
  const submitButton = (
    <button type="submit" className="btn btn--accent booking-summary__submit" disabled={isSubmitting}>
      Đặt tour
    </button>
  );

  return (
    <div className="container booking-page">
      <nav className="breadcrumb" aria-label="Đường dẫn">
        <Link to="/tour">Tour du lịch</Link>
        <FontAwesomeIcon icon={faChevronRight} />
        <Link to={`/tour/${tour.ma_tour}`}>{tour.ten_tour}</Link>
        <FontAwesomeIcon icon={faChevronRight} />
        <span aria-current="page">Đặt tour</span>
      </nav>
      <h1 className="booking-page__title">Đặt tour</h1>

      {tour.lich_khoi_hanh.length === 0 ? (
        <div className="booking-section">
          <p>Tour hiện không còn lịch khởi hành nào nhận đặt chỗ.</p>
          <p className="booking-section__muted">
            Gọi <a href={hotlineHref}>{siteInfo.hotline}</a> để được tư vấn lịch mới, hoặc{' '}
            <Link to="/tour">xem các tour khác</Link>.
          </p>
        </div>
      ) : (
        <form className="booking-page__layout" onSubmit={handleSubmit} noValidate>
          <div className="booking-page__main">
            <fieldset className="booking-section">
              <legend className="booking-section__title">Ngày khởi hành</legend>
              {isStaleDeparture && (
                <p className="alert alert--error booking-section__alert" role="alert">
                  <FontAwesomeIcon icon={faCircleExclamation} />
                  Ngày bạn chọn trước đó đã hết chỗ hoặc ngừng nhận đặt, vui lòng chọn ngày khác.
                </p>
              )}
              <div className="date-options">
                {tour.lich_khoi_hanh.map((item) => {
                  const isSelected = item.ma_lich_khoi_hanh === departure?.ma_lich_khoi_hanh;
                  return (
                    <label key={item.ma_lich_khoi_hanh} className={`date-option${isSelected ? ' date-option--selected' : ''}`}>
                      <input
                        type="radio"
                        name="departure"
                        className="date-option__radio"
                        checked={isSelected}
                        onChange={() => selectDeparture(item)}
                      />
                      <span className="date-option__date">{formatDateOnly(item.ngay_khoi_hanh)}</span>
                      <span className="date-option__weekday">{formatWeekday(item.ngay_khoi_hanh)}</span>
                      {tour.so_ngay > 1 && (
                        <span className="date-option__return">
                          Về {formatDateOnly(addDays(item.ngay_khoi_hanh, tour.so_ngay - 1))}
                        </span>
                      )}
                      <span className={`date-option__seats${item.so_cho_con_lai <= FEW_SEATS ? ' date-option__seats--few' : ''}`}>
                        Còn {item.so_cho_con_lai} chỗ
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.departure && <p className="form-error">{errors.departure}</p>}
            </fieldset>

            <section className="booking-section">
              <h2 className="booking-section__title">Số lượng khách</h2>
              <FormField
                id="booking-guests"
                label="Số khách"
                error={errors.so_luong_khach}
                hint={departure ? `Ngày ${formatDateOnly(departure.ngay_khoi_hanh)} còn ${departure.so_cho_con_lai} chỗ` : undefined}
              >
                <div className="guest-stepper">
                  <button
                    type="button"
                    className="guest-stepper__button"
                    onClick={() => changeGuests(-1)}
                    disabled={guests <= 1}
                    aria-label="Bớt 1 khách"
                  >
                    <FontAwesomeIcon icon={faMinus} />
                  </button>
                  <input
                    id="booking-guests"
                    inputMode="numeric"
                    className={`input guest-stepper__input${errors.so_luong_khach ? ' input--error' : ''}`}
                    value={form.so_luong_khach}
                    onChange={(event) => updateField('so_luong_khach', event.target.value.replace(/\D/g, ''))}
                    aria-invalid={Boolean(errors.so_luong_khach)}
                    aria-describedby="booking-guests-message"
                  />
                  <button
                    type="button"
                    className="guest-stepper__button"
                    onClick={() => changeGuests(1)}
                    disabled={departure ? guests >= departure.so_cho_con_lai : false}
                    aria-label="Thêm 1 khách"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
              </FormField>
            </section>

            <section className="booking-section">
              <h2 className="booking-section__title">Thông tin liên hệ</h2>
              <p className="booking-section__muted">Nhân viên sẽ gọi số điện thoại này để xác nhận đơn.</p>
              <div className="booking-section__grid">
                <FormField id="booking-name" label="Họ tên" error={errors.ho_ten_lien_he}>
                  <input
                    id="booking-name"
                    autoComplete="name"
                    className={`input${errors.ho_ten_lien_he ? ' input--error' : ''}`}
                    value={form.ho_ten_lien_he}
                    onChange={(event) => updateField('ho_ten_lien_he', event.target.value)}
                    aria-invalid={Boolean(errors.ho_ten_lien_he)}
                    aria-describedby="booking-name-message"
                  />
                </FormField>
                <FormField id="booking-phone" label="Số điện thoại" error={errors.so_dien_thoai_lien_he}>
                  <input
                    id="booking-phone"
                    type="tel"
                    autoComplete="tel"
                    className={`input${errors.so_dien_thoai_lien_he ? ' input--error' : ''}`}
                    value={form.so_dien_thoai_lien_he}
                    onChange={(event) => updateField('so_dien_thoai_lien_he', event.target.value)}
                    aria-invalid={Boolean(errors.so_dien_thoai_lien_he)}
                    aria-describedby="booking-phone-message"
                  />
                </FormField>
              </div>
              <FormField
                id="booking-note"
                label="Ghi chú (không bắt buộc)"
                error={errors.ghi_chu}
                hint={`${form.ghi_chu.length}/${MAX_NOTE} ký tự`}
              >
                <textarea
                  id="booking-note"
                  rows={3}
                  className={`input booking-section__note${errors.ghi_chu ? ' input--error' : ''}`}
                  value={form.ghi_chu}
                  onChange={(event) => updateField('ghi_chu', event.target.value)}
                  aria-invalid={Boolean(errors.ghi_chu)}
                  aria-describedby="booking-note-message"
                />
              </FormField>
            </section>

            <fieldset className="booking-section">
              <legend className="booking-section__title">Phương thức thanh toán</legend>
              <div className="pay-options">
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = form.phuong_thuc === method.value;
                  return (
                    <label key={method.value} className={`pay-option${isSelected ? ' pay-option--selected' : ''}`}>
                      <input
                        type="radio"
                        name="phuong_thuc"
                        className="pay-option__radio"
                        checked={isSelected}
                        onChange={() => updateField('phuong_thuc', method.value)}
                      />
                      <span className="pay-option__icon" aria-hidden="true">
                        <FontAwesomeIcon icon={method.icon} />
                      </span>
                      <span className="pay-option__name">{method.value}</span>
                      <span className="pay-option__note">{method.note}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <aside className="booking-summary" aria-label="Tóm tắt đơn đặt tour">
            <div className="booking-summary__tour">
              <div className="booking-summary__image">
                <TourImage src={toAssetUrl(cover)} alt="" />
              </div>
              <div>
                <p className="booking-summary__name">{tour.ten_tour}</p>
                <p className="booking-summary__meta">
                  {formatDuration(tour.so_ngay, tour.so_dem)} · Từ {tour.ten_diem_khoi_hanh}
                </p>
              </div>
            </div>

            <dl className="booking-summary__rows">
              <div className="booking-summary__row">
                <dt>Ngày đi</dt>
                <dd>{departure ? `${formatWeekday(departure.ngay_khoi_hanh)}, ${formatDateOnly(departure.ngay_khoi_hanh)}` : 'Chưa chọn'}</dd>
              </div>
              {departure && tour.so_ngay > 1 && (
                <div className="booking-summary__row">
                  <dt>Ngày về</dt>
                  <dd>{formatDateOnly(addDays(departure.ngay_khoi_hanh, tour.so_ngay - 1))}</dd>
                </div>
              )}
              <div className="booking-summary__row">
                <dt>Giá mỗi khách</dt>
                <dd>{formatPrice(tour.gia)}</dd>
              </div>
              <div className="booking-summary__row">
                <dt>Số khách</dt>
                <dd>{guests >= 1 ? `× ${guests}` : '—'}</dd>
              </div>
            </dl>

            <div className="booking-summary__total booking-summary__desktop">
              <span>Tổng tạm tính</span>
              <strong>{totalText}</strong>
            </div>

            <p className="booking-summary__policy">
              <strong>Hủy đơn:</strong> bạn tự hủy được khi đơn còn chờ xác nhận. Đơn đã xác nhận muốn hủy, vui lòng gọi{' '}
              <a href={hotlineHref}>{siteInfo.hotline}</a>.
            </p>

            <div className="booking-summary__desktop">
              {errorAlert}
              {submitButton}
            </div>
            <p className="booking-summary__note">
              Chỗ được giữ ngay khi đặt. Đơn ở trạng thái chờ xác nhận cho tới khi nhân viên gọi xác nhận và hướng dẫn
              thanh toán.
            </p>
          </aside>

          {/* Điện thoại: form dài nên tổng tiền và nút đặt tour dính đáy màn hình, cuộn hết form thì nằm cuối tóm tắt */}
          <div className="booking-checkout">
            {errorAlert}
            <div className="booking-checkout__row">
              <p className="booking-checkout__total">
                <span>Tổng tạm tính</span>
                <strong>{totalText}</strong>
              </p>
              {submitButton}
            </div>
          </div>
        </form>
      )}

      <Modal
        open={isReviewing && Boolean(departure)}
        title="Kiểm tra lại đơn đặt tour"
        onClose={() => setIsReviewing(false)}
        closeDisabled={isSubmitting}
        footer={
          <>
            <button type="button" className="btn btn--outline" onClick={() => setIsReviewing(false)} disabled={isSubmitting}>
              Quay lại sửa
            </button>
            <button type="button" className="btn btn--accent" onClick={submitBooking} disabled={isSubmitting} data-autofocus>
              {isSubmitting ? 'Đang gửi đơn...' : 'Gửi đơn đặt tour'}
            </button>
          </>
        }
      >
        {departure && (
          <>
            <dl className="booking-review">
              <div className="booking-review__row">
                <dt>Tour</dt>
                <dd>{tour.ten_tour}</dd>
              </div>
              <div className="booking-review__row">
                <dt>Ngày đi</dt>
                <dd>
                  {formatWeekday(departure.ngay_khoi_hanh)}, {formatDateOnly(departure.ngay_khoi_hanh)}
                  {tour.so_ngay > 1 && ` → ${formatDateOnly(addDays(departure.ngay_khoi_hanh, tour.so_ngay - 1))}`}
                </dd>
              </div>
              <div className="booking-review__row">
                <dt>Số khách</dt>
                <dd>
                  {guests} × {formatPrice(tour.gia)}
                </dd>
              </div>
              <div className="booking-review__row">
                <dt>Người liên hệ</dt>
                <dd>
                  {form.ho_ten_lien_he.trim()} · {form.so_dien_thoai_lien_he.trim()}
                </dd>
              </div>
              <div className="booking-review__row">
                <dt>Thanh toán</dt>
                <dd>{form.phuong_thuc}</dd>
              </div>
              <div className="booking-review__row booking-review__row--total">
                <dt>Tổng tiền</dt>
                <dd>{totalText}</dd>
              </div>
            </dl>
            <p className="booking-review__note">
              Gửi đơn là {guests} chỗ được giữ ngay. Nhân viên sẽ gọi để xác nhận đơn và hướng dẫn thanh toán.
            </p>
          </>
        )}
      </Modal>
    </div>
  );
};

export default BookingPage;
