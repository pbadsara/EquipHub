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

  createOrder: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) })
};
