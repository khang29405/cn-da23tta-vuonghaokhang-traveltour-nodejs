// statusMap: bảng { giá trị: { label, badge } } như BOOKING_STATUS, PAYMENT_STATUS
const StatusBadge = ({ statusMap, value }) => {
  const status = statusMap[value];
  if (!status) return null;
  return <span className={`status-badge status-badge--${status.badge}`}>{status.label}</span>;
};

export default StatusBadge;
