import * as categoryApi from '../../../api/categoryApi.js';

// maxLength khớp độ dài cột trong schema.sql và kiểm tra ở category.service.js; backend vẫn kiểm tra lại.
// Điểm đến, điểm khởi hành không có remove: API chỉ cho thêm/sửa vì tour sẽ tham chiếu tới chúng.
export const categoryConfigs = [
  {
    slug: 'loai-tour',
    label: 'Loại tour',
    itemLabel: 'loại tour',
    idField: 'ma_loai_tour',
    nameField: 'ten_loai_tour',
    fields: [
      { name: 'ten_loai_tour', label: 'Tên loại tour', required: true, maxLength: 100, placeholder: 'Biển đảo' },
      {
        name: 'mo_ta_ngan',
        label: 'Mô tả ngắn',
        maxLength: 500,
        multiline: true,
        placeholder: 'Tắm biển, lặn ngắm san hô, tham quan đảo',
      },
    ],
    list: categoryApi.getTourTypes,
    create: categoryApi.createTourType,
    update: categoryApi.updateTourType,
    remove: categoryApi.deleteTourType,
  },
  {
    slug: 'diem-den',
    label: 'Điểm đến',
    itemLabel: 'điểm đến',
    idField: 'ma_diem_den',
    nameField: 'ten_diem_den',
    fields: [
      { name: 'ten_diem_den', label: 'Tên điểm đến', required: true, maxLength: 100, placeholder: 'Phú Quốc' },
      { name: 'tinh_thanh', label: 'Tỉnh/thành', required: true, maxLength: 100, placeholder: 'An Giang' },
      { name: 'mo_ta_ngan', label: 'Mô tả ngắn', maxLength: 500, multiline: true },
    ],
    list: categoryApi.getDestinations,
    create: categoryApi.createDestination,
    update: categoryApi.updateDestination,
  },
  {
    slug: 'diem-khoi-hanh',
    label: 'Điểm khởi hành',
    itemLabel: 'điểm khởi hành',
    idField: 'ma_diem_khoi_hanh',
    nameField: 'ten_diem_khoi_hanh',
    fields: [
      {
        name: 'ten_diem_khoi_hanh',
        label: 'Tên điểm khởi hành',
        required: true,
        maxLength: 100,
        placeholder: 'TP. Hồ Chí Minh',
      },
      { name: 'tinh_thanh', label: 'Tỉnh/thành', required: true, maxLength: 100, placeholder: 'TP. Hồ Chí Minh' },
    ],
    list: categoryApi.getDeparturePoints,
    create: categoryApi.createDeparturePoint,
    update: categoryApi.updateDeparturePoint,
  },
];
