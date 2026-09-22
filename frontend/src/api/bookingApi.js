const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

// ---- Bookings ----

// Existing bookings for one piece of equipment — used to grey out
// unavailable dates on the availability calendar.
export async function fetchEquipmentBookings(equipmentId) {
  const res = await fetch(`${API_URL}/bookings/equipment/${equipmentId}`);
  return handleResponse(res);
}

// type: 'rent' (needs startDate/endDate) or 'purchase' (dates omitted)
export async function createBooking(token, { equipmentId, type, startDate, endDate }) {
  const res = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ equipmentId, type, startDate, endDate }),
  });
  return handleResponse(res);
}

export async function fetchMyBookings(token) {
  const res = await fetch(`${API_URL}/bookings/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function cancelBooking(token, id) {
  const res = await fetch(`${API_URL}/bookings/${id}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

// ---- Donations ----

export async function createDonation(token, { amount, message }) {
  const res = await fetch(`${API_URL}/donations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount, message }),
  });
  return handleResponse(res);
}

export async function fetchMyDonations(token) {
  const res = await fetch(`${API_URL}/donations/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}