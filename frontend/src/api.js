const API_URL = 'http://localhost:5050/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('equiphub_token');
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  getCategories: () => request('/categories'),
  createCategory: (body) => request('/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id, body) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  createListing: (body) => request('/listings', { method: 'POST', body: JSON.stringify(body) }),
  updateListing: (id, body) => request(`/listings/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  reviewListing: (id, decisions) => request(`/listings/${id}/review`, { method: 'PUT', body: JSON.stringify(decisions) }),
  getMyListings: () => request('/listings/mine'),
  getReviewQueue: () => request('/listings/review-queue'),
  getApprovedListings: () => request('/listings'),

  getBookedDates: (itemType, itemId) => request(`/orders/booked-dates/${itemType}/${itemId}`),
  getSellerActivityHistory: () => request('/orders/mine-as-seller'),
  getAdminActivityHistory: () => request('/orders/all'),
  getMyOrders: () => request('/orders/mine-as-buyer'),

  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, password) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),

  uploadImage: (dataUrl) => request('/uploads/image', { method: 'POST', body: JSON.stringify({ image: dataUrl }) }),

  createCheckoutSession: (body) => request('/payments/create-checkout-session', { method: 'POST', body: JSON.stringify(body) }),
  confirmPayment: (sessionId) => request('/payments/confirm', { method: 'POST', body: JSON.stringify({ sessionId }) }),

  createReview: (body) => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),
  getMyReviews: () => request('/reviews/mine')
};
