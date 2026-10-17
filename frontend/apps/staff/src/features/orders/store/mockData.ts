export const MOCK_ORDERS = [
  {
    order_code: "DH005",
    created_at: new Date().toISOString(),
    customer: "Phạm Văn D",
    receiver_name: "Phạm Văn D",
    receiver_phone: "0999888777",
    shipping_address: "10 Nguyễn Công Trứ, Phường 19, Bình Thạnh, TP.HCM",
    district: "Bình Thạnh",
    ward: "Phường 19",
    payment_method: "COD",
    payment_status: "UNPAID",
    status: "PENDING",
    subtotal_amount: 120000,
    shipping_fee: 15000,
    total_amount: 135000,
    note: "Giao thêm chanh ớt",
    items: [
      { product_name: "Bún chả Hà Nội", quantity: 2, product_price: 60000, line_total: 120000 }
    ],
    history: [
      { status: "PENDING", created_at: new Date().toISOString(), note: "Khách đặt hàng" }
    ]
  },
  {
    order_code: "DH004",
    created_at: new Date().toISOString(),
    customer: "Đinh Công E",
    receiver_name: "Đinh Công E",
    receiver_phone: "0911222333",
    shipping_address: "KĐT Xa La, Hà Đông, Hà Nội",
    district: "Hà Đông",
    ward: "Phường Phúc La",
    payment_method: "ZALOPAY",
    payment_status: "PAID",
    status: "PENDING",
    subtotal_amount: 55000,
    shipping_fee: 20000,
    total_amount: 75000,
    note: "",
    items: [
      { product_name: "Bánh mì Hội An", quantity: 1, product_price: 55000, line_total: 55000 }
    ],
    history: [
      { status: "PENDING", created_at: new Date().toISOString(), note: "Khách đặt hàng qua ZaloPay" }
    ]
  },
  {
    order_code: "DH001",
    created_at: new Date().toISOString(),
    customer: "Nguyễn Văn A",
    receiver_name: "Nguyễn Văn A",
    receiver_phone: "0912345678",
    shipping_address: "123 Đường Số 1, Phường 2, Quận 3, TP.HCM",
    district: "Quận 3",
    ward: "Phường 2",
    payment_method: "COD",
    payment_status: "UNPAID",
    status: "PENDING",
    subtotal_amount: 150000,
    shipping_fee: 15000,
    total_amount: 165000,
    note: "Giao giờ hành chính",
    items: [
      { product_name: "Cơm sườn bì chả", quantity: 2, product_price: 50000, line_total: 100000 },
      { product_name: "Trà đá", quantity: 2, product_price: 5000, line_total: 10000 },
      { product_name: "Canh rong biển", quantity: 1, product_price: 40000, line_total: 40000 }
    ],
    history: [
      { status: "PENDING", created_at: new Date().toISOString(), note: "Khách đặt hàng" }
    ]
  },
  {
    order_code: "DH002",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    customer: "Trần Thị B",
    receiver_name: "Trần Thị B",
    receiver_phone: "0987654321",
    shipping_address: "456 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM",
    district: "Quận 1",
    ward: "Phường Bến Thành",
    payment_method: "MOMO",
    payment_status: "PAID",
    status: "CONFIRMED",
    package_code: "GOI-A",
    subtotal_amount: 200000,
    shipping_fee: 0,
    total_amount: 200000,
    note: "",
    items: [
      { product_name: "Phở bò đặc biệt", quantity: 2, product_price: 80000, line_total: 160000 },
      { product_name: "Quẩy", quantity: 4, product_price: 10000, line_total: 40000 }
    ],
    history: [
      { status: "PENDING", created_at: new Date(Date.now() - 3700000).toISOString(), note: "Khách đặt hàng qua Momo" },
      { status: "CONFIRMED", created_at: new Date(Date.now() - 3600000).toISOString(), note: "Nhân viên NV01 xác nhận vào GOI-A" }
    ]
  },
  {
    order_code: "DH003",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    customer: "Lê Văn C",
    receiver_name: "Lê Văn C",
    receiver_phone: "0909123456",
    shipping_address: "789 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
    district: "Quận 1",
    ward: "Phường Bến Nghé",
    payment_method: "VNPAY",
    payment_status: "PAID",
    status: "DELIVERING",
    package_code: "GOI-B",
    subtotal_amount: 80000,
    shipping_fee: 15000,
    total_amount: 95000,
    note: "Không hành",
    items: [
      { product_name: "Bún bò Huế", quantity: 1, product_price: 80000, line_total: 80000 }
    ],
    history: [
      { status: "PENDING", created_at: new Date(Date.now() - 7400000).toISOString(), note: "Khách đặt hàng" },
      { status: "CONFIRMED", created_at: new Date(Date.now() - 7300000).toISOString(), note: "Nhân viên NV01 xác nhận" },
      { status: "DELIVERING", created_at: new Date(Date.now() - 7200000).toISOString(), note: "Shipper đang giao" }
    ]
  }
];

export const MOCK_PACKAGES = [
  { id: 1, code: "GOI-A", status: "PENDING", order_codes: ["DH002"] },
  // staff_id 999 khớp demo login (LoginPage handleDemo)
  { id: 2, code: "GOI-B", status: "DELIVERING", staff_id: 999, order_codes: ["DH003"] }
];

export const MOCK_REVIEWS = [
  {
    id: 1,
    user: "Trần Thị B",
    rating: 5,
    comment: "Phở rất ngon, nước dùng đậm đà.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    product_id: 1,
    product_name: "Phở bò đặc biệt",
    is_hidden: false,
    staff_reply: null,
    replied_by: null
  },
  {
    id: 2,
    user: "Lê Văn C",
    rating: 3,
    comment: "Giao hàng hơi chậm, bún hơi nguội.",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    product_id: 2,
    product_name: "Bún bò Huế",
    is_hidden: false,
    staff_reply: "Cảm ơn bạn đã góp ý. Chúng tôi sẽ cố gắng cải thiện thời gian giao hàng.",
    replied_by: 1
  }
];
