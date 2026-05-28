// Lightweight Vietnam location dataset for room/post forms.
//
// Structure: cities → districts → wards (wards optional). When wards are
// missing for a district, callers should fall back to a free-text input.
// Names are stored exactly as they should appear in the address fields.

export const VIETNAM_LOCATIONS = [
  {
    name: 'Hà Nội',
    districts: [
      {
        name: 'Cầu Giấy',
        wards: ['Dịch Vọng', 'Dịch Vọng Hậu', 'Mai Dịch', 'Nghĩa Đô', 'Nghĩa Tân', 'Quan Hoa', 'Trung Hoà', 'Yên Hoà'],
      },
      {
        name: 'Đống Đa',
        wards: ['Cát Linh', 'Hàng Bột', 'Khâm Thiên', 'Khương Thượng', 'Kim Liên', 'Láng Hạ', 'Láng Thượng', 'Nam Đồng', 'Ngã Tư Sở', 'Ô Chợ Dừa', 'Phương Liên', 'Phương Mai', 'Quang Trung', 'Quốc Tử Giám', 'Thịnh Quang', 'Thổ Quan', 'Trung Liệt', 'Trung Phụng', 'Trung Tự', 'Văn Chương', 'Văn Miếu'],
      },
      {
        name: 'Hai Bà Trưng',
        wards: ['Bách Khoa', 'Bạch Đằng', 'Bạch Mai', 'Cầu Dền', 'Đống Mác', 'Đồng Nhân', 'Đồng Tâm', 'Lê Đại Hành', 'Minh Khai', 'Nguyễn Du', 'Phố Huế', 'Quỳnh Lôi', 'Quỳnh Mai', 'Thanh Lương', 'Thanh Nhàn', 'Trương Định', 'Vĩnh Tuy'],
      },
      {
        name: 'Ba Đình',
        wards: ['Cống Vị', 'Điện Biên', 'Đội Cấn', 'Giảng Võ', 'Kim Mã', 'Liễu Giai', 'Ngọc Hà', 'Ngọc Khánh', 'Nguyễn Trung Trực', 'Phúc Xá', 'Quán Thánh', 'Thành Công', 'Trúc Bạch', 'Vĩnh Phúc'],
      },
      {
        name: 'Hoàn Kiếm',
        wards: ['Chương Dương', 'Cửa Đông', 'Cửa Nam', 'Đồng Xuân', 'Hàng Bạc', 'Hàng Bài', 'Hàng Bồ', 'Hàng Bông', 'Hàng Buồm', 'Hàng Đào', 'Hàng Gai', 'Hàng Mã', 'Hàng Trống', 'Lý Thái Tổ', 'Phan Chu Trinh', 'Phúc Tân', 'Trần Hưng Đạo', 'Tràng Tiền'],
      },
      {
        name: 'Thanh Xuân',
        wards: ['Hạ Đình', 'Khương Đình', 'Khương Mai', 'Khương Trung', 'Kim Giang', 'Nhân Chính', 'Phương Liệt', 'Thanh Xuân Bắc', 'Thanh Xuân Nam', 'Thanh Xuân Trung', 'Thượng Đình'],
      },
      {
        name: 'Nam Từ Liêm',
        wards: ['Cầu Diễn', 'Đại Mỗ', 'Mễ Trì', 'Mỹ Đình 1', 'Mỹ Đình 2', 'Phú Đô', 'Phương Canh', 'Tây Mỗ', 'Trung Văn', 'Xuân Phương'],
      },
      {
        name: 'Bắc Từ Liêm',
        wards: ['Cổ Nhuế 1', 'Cổ Nhuế 2', 'Đông Ngạc', 'Đức Thắng', 'Liên Mạc', 'Minh Khai', 'Phú Diễn', 'Phúc Diễn', 'Tây Tựu', 'Thượng Cát', 'Thụy Phương', 'Xuân Đỉnh', 'Xuân Tảo'],
      },
      {
        name: 'Hà Đông',
        wards: ['Biên Giang', 'Đồng Mai', 'Dương Nội', 'Hà Cầu', 'Kiến Hưng', 'La Khê', 'Mộ Lao', 'Nguyễn Trãi', 'Phú La', 'Phú Lãm', 'Phú Lương', 'Phúc La', 'Quang Trung', 'Vạn Phúc', 'Văn Quán', 'Yên Nghĩa', 'Yết Kiêu'],
      },
      {
        name: 'Long Biên',
        wards: ['Bồ Đề', 'Cự Khối', 'Đức Giang', 'Gia Thuỵ', 'Giang Biên', 'Long Biên', 'Ngọc Lâm', 'Ngọc Thuỵ', 'Phúc Đồng', 'Phúc Lợi', 'Sài Đồng', 'Thạch Bàn', 'Thượng Thanh', 'Việt Hưng'],
      },
    ],
  },
  {
    name: 'TP. Hồ Chí Minh',
    districts: [
      { name: 'Quận 1',     wards: ['Bến Nghé', 'Bến Thành', 'Cầu Kho', 'Cầu Ông Lãnh', 'Cô Giang', 'Đa Kao', 'Nguyễn Cư Trinh', 'Nguyễn Thái Bình', 'Phạm Ngũ Lão', 'Tân Định'] },
      { name: 'Quận 3',     wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Võ Thị Sáu'] },
      { name: 'Quận 5',     wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14'] },
      { name: 'Quận 7',     wards: ['Bình Thuận', 'Phú Mỹ', 'Phú Thuận', 'Tân Hưng', 'Tân Kiểng', 'Tân Phong', 'Tân Phú', 'Tân Quy', 'Tân Thuận Đông', 'Tân Thuận Tây'] },
      { name: 'Quận 10',    wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'] },
      { name: 'Bình Thạnh', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 17', 'Phường 19', 'Phường 21', 'Phường 22', 'Phường 24', 'Phường 25', 'Phường 26', 'Phường 27', 'Phường 28'] },
      { name: 'Phú Nhuận',  wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 13', 'Phường 15', 'Phường 17'] },
      { name: 'Tân Bình',   wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'] },
      { name: 'Gò Vấp',     wards: ['Phường 1', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17'] },
      { name: 'Thủ Đức',    wards: ['An Khánh', 'An Lợi Đông', 'An Phú', 'Bình Chiểu', 'Bình Thọ', 'Cát Lái', 'Hiệp Bình Chánh', 'Hiệp Bình Phước', 'Hiệp Phú', 'Linh Chiểu', 'Linh Đông', 'Linh Tây', 'Linh Trung', 'Linh Xuân', 'Long Bình', 'Long Phước', 'Long Thạnh Mỹ', 'Long Trường', 'Phú Hữu', 'Phước Bình', 'Phước Long A', 'Phước Long B', 'Tam Bình', 'Tam Phú', 'Tăng Nhơn Phú A', 'Tăng Nhơn Phú B', 'Tân Phú', 'Thảo Điền', 'Thạnh Mỹ Lợi', 'Thủ Thiêm', 'Trường Thạnh', 'Trường Thọ'] },
    ],
  },
  {
    name: 'Đà Nẵng',
    districts: [
      { name: 'Hải Châu',     wards: ['Bình Hiên', 'Bình Thuận', 'Hải Châu 1', 'Hải Châu 2', 'Hoà Cường Bắc', 'Hoà Cường Nam', 'Hoà Thuận Đông', 'Hoà Thuận Tây', 'Nam Dương', 'Phước Ninh', 'Thạch Thang', 'Thanh Bình', 'Thuận Phước'] },
      { name: 'Thanh Khê',    wards: ['An Khê', 'Chính Gián', 'Hoà Khê', 'Tam Thuận', 'Tân Chính', 'Thạc Gián', 'Thanh Khê Đông', 'Thanh Khê Tây', 'Vĩnh Trung', 'Xuân Hà'] },
      { name: 'Sơn Trà',      wards: ['An Hải Bắc', 'An Hải Đông', 'An Hải Tây', 'Mân Thái', 'Nại Hiên Đông', 'Phước Mỹ', 'Thọ Quang'] },
      { name: 'Ngũ Hành Sơn', wards: ['Hoà Hải', 'Hoà Quý', 'Khuê Mỹ', 'Mỹ An'] },
      { name: 'Liên Chiểu',   wards: ['Hoà Hiệp Bắc', 'Hoà Hiệp Nam', 'Hoà Khánh Bắc', 'Hoà Khánh Nam', 'Hoà Minh'] },
      { name: 'Cẩm Lệ',       wards: ['Hoà An', 'Hoà Phát', 'Hoà Thọ Đông', 'Hoà Thọ Tây', 'Hoà Xuân', 'Khuê Trung'] },
    ],
  },
  {
    name: 'Huế',
    districts: [
      { name: 'Phú Nhuận', wards: [] },
      { name: 'Vĩnh Ninh', wards: [] },
      { name: 'Phú Hội',   wards: [] },
      { name: 'Thuận Hoà', wards: [] },
    ],
  },
  {
    name: 'Cần Thơ',
    districts: [
      { name: 'Ninh Kiều',  wards: ['An Bình', 'An Cư', 'An Hoà', 'An Khánh', 'An Lạc', 'An Nghiệp', 'An Phú', 'Cái Khế', 'Hưng Lợi', 'Tân An', 'Thới Bình', 'Xuân Khánh'] },
      { name: 'Bình Thuỷ',  wards: ['An Thới', 'Bình Thuỷ', 'Bùi Hữu Nghĩa', 'Long Hoà', 'Long Tuyền', 'Thới An Đông', 'Trà An', 'Trà Nóc'] },
      { name: 'Cái Răng',   wards: ['Ba Láng', 'Hưng Phú', 'Hưng Thạnh', 'Lê Bình', 'Phú Thứ', 'Tân Phú', 'Thường Thạnh'] },
    ],
  },
];

export function getCityNames() {
  return VIETNAM_LOCATIONS.map((c) => c.name);
}

export function getDistrictsOf(cityName) {
  const city = VIETNAM_LOCATIONS.find((c) => c.name === cityName);
  return city ? city.districts.map((d) => d.name) : [];
}

export function getWardsOf(cityName, districtName) {
  const city = VIETNAM_LOCATIONS.find((c) => c.name === cityName);
  if (!city) return [];
  const district = city.districts.find((d) => d.name === districtName);
  return district?.wards ?? [];
}
