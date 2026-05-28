import axios from 'axios';

const TOKEN_KEY = 'RoomHub_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      tokenStorage.clear();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Đã có lỗi xảy ra, vui lòng thử lại.';
    error.displayMessage = message;
    return Promise.reject(error);
  }
);

export default api;

// Unwraps axios response, auto-stripping ApiResponse<T> wrapper when present
const unwrap = (promise) =>
  promise.then((r) => {
    const body = r.data;
    if (
      body !== null &&
      typeof body === 'object' &&
      !Array.isArray(body) &&
      'success' in body &&
      'data' in body
    ) {
      return body.data;
    }
    return body;
  });

// ──────────────────────────────────────────────────────
// Service modules
// ──────────────────────────────────────────────────────

export const authApi = {
  register: (payload) => unwrap(api.post('/auth/register', payload)),
  login: (payload) => unwrap(api.post('/auth/login', payload)),
  logout: () => unwrap(api.post('/auth/logout')),
  forgotPassword: (email) => unwrap(api.post('/auth/forgot-password', { email })),
  resetPassword: (payload) => unwrap(api.post('/auth/reset-password', payload)),
  changePassword: (payload) => unwrap(api.post('/auth/change-password', payload)),
};

export const userApi = {
  getMe: () => unwrap(api.get('/users/me')),
  updateMe: (payload) => unwrap(api.put('/users/me', payload)),
  uploadAvatar: (file) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return unwrap(api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },
  searchRenters: (q) => unwrap(api.get('/users/search', { params: { q } })),
  lookupRenterByEmail: (email) => unwrap(api.get('/users/lookup-renter', { params: { email } })),
};

export const roomApi = {
  getAll: () => unwrap(api.get('/rooms')),
  getById: (id) => unwrap(api.get(`/rooms/${id}`)),
  create: (payload) => unwrap(api.post('/rooms', payload)),
  update: (id, payload) => unwrap(api.put(`/rooms/${id}`, payload)),
  delete: (id) => unwrap(api.delete(`/rooms/${id}`)),
  updateRentalStatus: (id, status) =>
    unwrap(api.patch(`/rooms/${id}/rental-status`, { status })),
  uploadImage: (id, file) => {
    const fd = new FormData();
    fd.append('image', file);
    return unwrap(
      api.post(`/rooms/${id}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },
  deleteImage: (roomId, imageId) =>
    unwrap(api.delete(`/rooms/${roomId}/images/${imageId}`)),
  setThumbnail: (roomId, imageId) =>
    unwrap(api.patch(`/rooms/${roomId}/images/${imageId}/thumbnail`)),
};

export const postApi = {
  // Returns normalized { items, totalCount, totalPages } from Spring Page
  search: (params) => {
    // Map frontend param names to backend PostSearchRequest field names
    const { limit, size, min_price, max_price, room_type, page, ...rest } = params || {};
    const mapped = {
      ...rest,
      page: page != null ? Math.max(0, page - 1) : 0,
      size: size ?? limit ?? 10,
      ...(min_price != null && { minPrice: min_price }),
      ...(max_price != null && { maxPrice: max_price }),
      ...(room_type != null && { roomType: room_type }),
    };
    return unwrap(api.get('/posts', { params: mapped })).then((page) => ({
      items: page?.content ?? [],
      totalCount: page?.totalElements ?? 0,
      totalPages: page?.totalPages ?? 1,
    }));
  },
  getById: (id) => unwrap(api.get(`/posts/${id}`)),
  getMyPosts: (params) => unwrap(api.get('/me/posts', { params })),
  create: (payload) => unwrap(api.post('/me/posts', payload)),
  delete: (id) => unwrap(api.delete(`/me/posts/${id}`)),
  extend: (id, payload) => unwrap(api.post(`/me/posts/${id}/extend`, payload)),
  getStats: (id) => unwrap(api.get(`/me/posts/${id}/statistics`)),
  adminGetAll: (params) => unwrap(api.get('/admin/posts', { params })),
  adminUpdateStatus: (id, payload) =>
    unwrap(api.patch(`/admin/posts/${id}/status`, payload)),
};

export const chatApi = {
  getConversations: (params) => unwrap(api.get('/conversations', { params })),
  createConversation: (payload) => unwrap(api.post('/conversations', payload)),
  getConversationDetail: (id) => unwrap(api.get(`/conversations/${id}`)),
  getMessages: (conversationId, params) =>
    unwrap(api.get(`/conversations/${conversationId}/messages`, { params })),
  sendMessage: (conversationId, payload) =>
    unwrap(api.post(`/conversations/${conversationId}/messages`, payload)),
  markRead: (conversationId) =>
    unwrap(api.put(`/conversations/${conversationId}/read`)),
  deleteIfEmpty: (conversationId) =>
    unwrap(api.delete(`/conversations/${conversationId}`)),
};

export const favoriteApi = {
  add: (postId) => unwrap(api.post(`/posts/${postId}/favorites`)),
  remove: (postId) => unwrap(api.delete(`/posts/${postId}/favorites`)),
  getAll: (params) => unwrap(api.get('/users/me/favorites', { params })),
};

export const reviewApi = {
  // roomId goes in URL; body = { contractId, rating, comment }
  getByRoom: (roomId, params) =>
    unwrap(api.get(`/rooms/${roomId}/reviews`, { params })),
  createRoomReview: ({ roomId, ...body }) =>
    unwrap(api.post(`/rooms/${roomId}/reviews`, body)),
  // contractId goes in URL; body = { rating, comment }
  createRenterReview: ({ contractId, ...body }) =>
    unwrap(api.post(`/contracts/${contractId}/renter-review`, body)),
  getRenterReviews: (userId, params) =>
    unwrap(api.get(`/users/${userId}/renter-reviews`, { params })),
  getMyWrittenReviews: (params) => unwrap(api.get('/users/me/reviews', { params })),
  getMyRenterReviews: (params) => unwrap(api.get('/users/me/renter-reviews', { params })),
  getFeed: (params) => unwrap(api.get('/reviews', { params })),
  updateReview: (reviewId, payload) =>
    unwrap(api.patch(`/reviews/${reviewId}`, payload)),
  adminGetAll: (params) => unwrap(api.get('/admin/reviews', { params })),
  adminUpdateStatus: (id, payload) =>
    unwrap(api.patch(`/admin/reviews/${id}/status`, payload)),
};

export const reportApi = {
  // postId goes in URL; body = { reason }
  create: ({ postId, ...body }) =>
    unwrap(api.post(`/posts/${postId}/reports`, body)),
  getMyReports: (params) => unwrap(api.get('/users/me/reports', { params })),
  adminGetAll: (params) => unwrap(api.get('/admin/reports', { params })),
  adminGetById: (id) => unwrap(api.get(`/admin/reports/${id}`)),
  adminUpdateStatus: (id, payload) =>
    unwrap(api.patch(`/admin/reports/${id}/status`, payload)),
};

export const notificationApi = {
  // Cursor-paginated list. Returns { items, nextCursor }.
  list: (params) => unwrap(api.get('/notifications', { params })),
  getUnreadCount: () => unwrap(api.get('/notifications/unread-count')),
  markRead: (id) => unwrap(api.patch(`/notifications/${id}/read`)),
  markAllRead: () => unwrap(api.patch('/notifications/read-all')),
  delete: (id) => unwrap(api.delete(`/notifications/${id}`)),
};

export const adminApi = {
  getUsers: (params) => unwrap(api.get('/admin/users', { params })),
  updateUserStatus: (id, payload) =>
    unwrap(api.patch(`/admin/users/${id}/status`, payload)),
  getStatistics: () => unwrap(api.get('/admin/statistics')),
};

export const contractApi = {
  // roomId goes in URL; body = CreateContractRequest
  create: ({ roomId, ...body }) =>
    unwrap(api.post(`/rooms/${roomId}/contracts`, body)),
  getByRoom: (roomId, params) =>
    unwrap(api.get(`/rooms/${roomId}/contracts`, { params })),
  getMyContracts: (params) => unwrap(api.get('/me/contracts', { params })),
  getCurrentRent: () => unwrap(api.get('/me/current-rent')),
  end: (id) => unwrap(api.patch(`/contracts/${id}/end`)),
  sign: (id) => unwrap(api.patch(`/contracts/${id}/sign`)),
};

export const billApi = {
  getByContract: (contractId, params) =>
    unwrap(api.get(`/contracts/${contractId}/bills`, { params })),
  getById: (id) => unwrap(api.get(`/bills/${id}`)),
  create: ({ contractId, ...body }) =>
    unwrap(api.post(`/contracts/${contractId}/bills`, body)),
  markPaid: (id) => unwrap(api.patch(`/bills/${id}/paid`)),
};

export const vehicleApi = {
  getByRoom: (roomId) => unwrap(api.get(`/rooms/${roomId}/vehicles`)),
  create: ({ roomId, ...body }) =>
    unwrap(api.post(`/rooms/${roomId}/vehicles`, body)),
  delete: (id) => unwrap(api.delete(`/vehicles/${id}`)),
};

export const ocrApi = {
  meter: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return unwrap(
      api.post('/ocr/meter', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    );
  },
  licensePlate: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return unwrap(
      api.post('/ocr/license-plate', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    );
  },
};

export const paymentApi = {
  getMyPayments: (params) => unwrap(api.get('/me/payments', { params })),
  retry: (id) => unwrap(api.post(`/me/payments/${id}/retry`)),
};

export const publicApi = {
  getStatistics: () => unwrap(api.get('/public/statistics')),
};
