const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.details = data.details;
    throw error;
  }
  return data;
}

// Equipment.photoUrl is stored as a relative path like "/uploads/xyz.png" —
// this turns it into a full URL the browser can load an <img> from.
export function resolvePhotoUrl(photoUrl) {
  if (!photoUrl) return null;
  return `${API_ORIGIN}${photoUrl}`;
}

function buildFormData(fields) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    formData.append(key, value);
  });
  return formData;
}

export async function fetchMyListings(token) {
  const res = await fetch(`${API_URL}/equipment/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function createListing(token, { title, description, category, price, listingType, photoFile }) {
  const formData = buildFormData({ title, description, category, price, listingType });
  if (photoFile) formData.append('photo', photoFile);

  const res = await fetch(`${API_URL}/equipment`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return handleResponse(res);
}

export async function updateListing(token, id, { title, description, category, price, listingType, photoFile }) {
  const formData = buildFormData({ title, description, category, price, listingType });
  if (photoFile) formData.append('photo', photoFile);

  const res = await fetch(`${API_URL}/equipment/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return handleResponse(res);
}

export async function deleteListing(token, id) {
  const res = await fetch(`${API_URL}/equipment/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

// ---- Admin review queue (Phase A2) ----

export async function fetchPendingListings(token) {
  const res = await fetch(`${API_URL}/equipment/pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function approveListing(token, id) {
  const res = await fetch(`${API_URL}/equipment/${id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function rejectListing(token, id, reason) {
  const res = await fetch(`${API_URL}/equipment/${id}/reject`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return handleResponse(res);
}

// ---- Public catalogue (Phase A2) ----

export async function fetchCatalogue(params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
  ).toString();
  const res = await fetch(`${API_URL}/equipment${query ? `?${query}` : ''}`);
  return handleResponse(res);
}

export async function fetchListingById(id) {
  const res = await fetch(`${API_URL}/equipment/${id}`);
  return handleResponse(res);
}
