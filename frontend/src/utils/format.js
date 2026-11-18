const numberFormatter = new Intl.NumberFormat('vi-VN');

export const formatNumber = (value) => numberFormatter.format(value);

export const formatPrice = (value) => `${numberFormatter.format(value)} đ`;

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const formatDate = (value) => dateFormatter.format(new Date(value));

export const formatDuration = (soNgay, soDem) => (soDem > 0 ? `${soNgay} ngày ${soDem} đêm` : `${soNgay} ngày`);
