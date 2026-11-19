import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation, faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import FormField from '../../../components/FormField/FormField.jsx';

export const dayFieldError = (errors, day, field) => errors[`${day.key}.${field}`];

const ItineraryEditor = ({ days, maxDays, errors, listError, onChangeDay, onAddDay, onRemoveDay }) => {
  const canAdd = maxDays > 0 && days.length < maxDays;

  return (
    <>
      {listError && (
        <p className="alert alert--error tour-form__section-alert" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} />
          {listError}
        </p>
      )}

      <ol className="itinerary">
        {days.map((day, index) => {
          const titleId = `day-${day.key}-title`;
          const contentId = `day-${day.key}-content`;
          const titleError = dayFieldError(errors, day, 'tieu_de');
          const contentError = dayFieldError(errors, day, 'noi_dung_hoat_dong');
          return (
            <li key={day.key} className="itinerary__day">
              <div className="itinerary__day-header">
                <span className="itinerary__day-number">Ngày {index + 1}</span>
                <button
                  type="button"
                  className="btn btn--outline btn--sm itinerary__remove"
                  onClick={() => onRemoveDay(day.key)}
                  disabled={days.length === 1}
                  title={days.length === 1 ? 'Lịch trình phải có ít nhất 1 ngày' : undefined}
                  aria-label={`Xóa ngày ${index + 1}`}
                >
                  <FontAwesomeIcon icon={faTrashCan} />
                  <span className="itinerary__remove-text">Xóa ngày</span>
                </button>
              </div>

              <FormField id={titleId} label="Tiêu đề" error={titleError}>
                <input
                  id={titleId}
                  type="text"
                  className={`input${titleError ? ' input--error' : ''}`}
                  value={day.tieu_de}
                  onChange={(event) => onChangeDay(day.key, 'tieu_de', event.target.value)}
                  placeholder={index === 0 ? 'TP.HCM - Đà Lạt' : undefined}
                  maxLength={200}
                  autoComplete="off"
                  aria-invalid={Boolean(titleError)}
                  aria-describedby={`${titleId}-message`}
                />
              </FormField>

              <FormField id={contentId} label="Hoạt động trong ngày (không bắt buộc)" error={contentError}>
                <textarea
                  id={contentId}
                  className={`input tour-form__textarea${contentError ? ' input--error' : ''}`}
                  value={day.noi_dung_hoat_dong}
                  onChange={(event) => onChangeDay(day.key, 'noi_dung_hoat_dong', event.target.value)}
                  rows={3}
                  aria-invalid={Boolean(contentError)}
                  aria-describedby={`${contentId}-message`}
                />
              </FormField>
            </li>
          );
        })}
      </ol>

      <div className="itinerary__footer">
        <button type="button" className="btn btn--outline btn--sm" onClick={onAddDay} disabled={!canAdd}>
          <FontAwesomeIcon icon={faPlus} />
          Thêm ngày
        </button>
        <span className="itinerary__count">
          {maxDays > 0 ? `${days.length}/${maxDays} ngày` : 'Chọn số ngày của tour để thêm ngày'}
        </span>
      </div>
    </>
  );
};

export default ItineraryEditor;
