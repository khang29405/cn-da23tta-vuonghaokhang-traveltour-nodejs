// Đây là THÔNG TIN MẪU (không phải của tổ chức có thật), sửa tại đây là toàn bộ website cập nhật theo
const siteInfo = {
  name: 'TravelTour',
  companyName: 'Công ty Du lịch TravelTour',
  slogan: 'Chọn ngày đi, giữ chỗ trước, chuyện còn lại để chúng tôi lo.',
  address: 'Đường Hoàng Hoa Thám, Phường Trà Vinh, Tỉnh Vĩnh Long',
  // Viết tách nhóm cho dễ đọc; link gọi điện tự bỏ khoảng trắng
  hotline: '0974 714 067',
  email: 'khangtv29405@gmail.com',
  workingHours: '8:00 – 20:00, Thứ 2 – Thứ 7',
  // Thanh toán chỉ ghi nhận trạng thái, không qua cổng trực tuyến
  // type quyết định icon ở Footer: cash (tiền mặt), bank (chuyển khoản)
  paymentMethods: [
    { type: 'cash', label: 'Tiền mặt tại văn phòng' },
    { type: 'bank', label: 'Chuyển khoản ngân hàng' },
  ],
  // Đang trỏ tới trang chủ mạng xã hội; có trang riêng thì thay link (Zalo: https://zalo.me/<số điện thoại>)
  socials: {
    facebook: 'https://facebook.com/',
    zalo: 'https://zalo.me/',
    tiktok: 'https://tiktok.com/',
  },
};

export default siteInfo;
