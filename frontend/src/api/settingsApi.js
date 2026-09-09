const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export async function fetchPriceCap(token) {
  const res = await fetch(`${API_URL}/settings/price-cap`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function updatePriceCap(token, maxListingPrice) {
  const res = await fetch(`${API_URL}/settings/price-cap`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ maxListingPrice }),
  });
  return handleResponse(res);
}
