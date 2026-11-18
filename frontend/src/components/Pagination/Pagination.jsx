import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import './Pagination.css';

// Luôn hiện trang đầu, trang cuối và 1 trang hai bên trang hiện tại; khoảng trống giữa chúng hiện dấu "…"
const buildPageItems = (page, totalPages) => {
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b);

  return pages.flatMap((item, index) => (index > 0 && item - pages[index - 1] > 1 ? [`gap-${item}`, item] : [item]));
};

const Pagination = ({ pagination, itemLabel, onPageChange, disabled = false }) => {
  const { page, limit, total, totalPages } = pagination;
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav className="pagination" aria-label="Phân trang">
      <p className="pagination__summary">
        {totalPages > 1
          ? `Đang xem ${from}–${to} trong tổng số ${total} ${itemLabel}`
          : `Tổng số ${total} ${itemLabel}`}
      </p>

      {totalPages > 1 && (
        <div className="pagination__pages">
          <button
            type="button"
            className="pagination__button"
            onClick={() => onPageChange(page - 1)}
            disabled={disabled || page === 1}
            aria-label="Trang trước"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
            <span className="pagination__label">Trước</span>
          </button>

          {buildPageItems(page, totalPages).map((item) =>
            typeof item === 'string' ? (
              <span key={item} className="pagination__gap" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={`pagination__button${item === page ? ' pagination__button--active' : ''}`}
                onClick={() => onPageChange(item)}
                disabled={disabled}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Trang ${item}`}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            className="pagination__button"
            onClick={() => onPageChange(page + 1)}
            disabled={disabled || page === totalPages}
            aria-label="Trang sau"
          >
            <span className="pagination__label">Sau</span>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}
    </nav>
  );
};

export default Pagination;
