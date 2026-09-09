import { useState } from 'react';

const LISTING_TYPES = [
  { value: 'rent', label: 'For rent' },
  { value: 'sale', label: 'For sale' },
];

export function EquipmentForm({ initialValues, onSubmit, submitLabel, onCancel }) {
  const [form, setForm] = useState({
    title: initialValues?.title || '',
    description: initialValues?.description || '',
    category: initialValues?.category || '',
    price: initialValues?.price ?? '',
    listingType: initialValues?.listingType || 'rent',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleFileChange(e) {
    setPhotoFile(e.target.files?.[0] || null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ ...form, photoFile });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="field">
        <span>Title</span>
        <input type="text" name="title" value={form.title} onChange={handleChange} required />
      </label>
      <label className="field">
        <span>Description</span>
        <textarea name="description" value={form.description} onChange={handleChange} rows={4} required />
      </label>
      <label className="field">
        <span>Category (optional)</span>
        <input type="text" name="category" value={form.category} onChange={handleChange} placeholder="e.g. Power tools" />
      </label>
      <label className="field">
        <span>Price ($)</span>
        <input type="number" name="price" min="0" step="0.01" value={form.price} onChange={handleChange} required />
      </label>
      <fieldset className="field">
        <legend>Listing type</legend>
        {LISTING_TYPES.map((opt) => (
          <label key={opt.value} className="radio-option">
            <input
              type="radio"
              name="listingType"
              value={opt.value}
              checked={form.listingType === opt.value}
              onChange={handleChange}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </fieldset>
      <label className="field">
        <span>Photo {initialValues ? '(leave blank to keep the current one)' : '(optional)'}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="btn-row">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
