import { useState, useEffect } from 'react';
import { api } from '../api';

const STATUS_LABEL = {
  pending: 'Awaiting review',
  approved: 'Approved',
  rejected: 'Changes requested'
};

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB per image — keeps documents small since
// images are stored as base64 data URLs directly on the listing (no file storage
// service is wired up yet; fine for a demo/course project, not for production scale).

function FieldStatusBadge({ status }) {
  return <span className={`field-badge field-badge-${status}`}>{STATUS_LABEL[status]}</span>;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// One listing, shown as an editable field per row. Works for both a brand
// new (unsaved) listing and an existing one being edited after admin feedback.
function ListingEditor({ listing, categories, onSaved }) {
  const [form, setForm] = useState({
    name: listing?.name.value || '',
    description: listing?.description.value || '',
    price: listing?.price.value ?? '',
    category: listing?.category.value?._id || listing?.category.value || '',
    images: listing?.images.value || []
  });
  const [imageError, setImageError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow picking the same file again later
    setImageError('');

    if (form.images.length + files.length > MAX_IMAGES) {
      setImageError(`You can attach at most ${MAX_IMAGES} images per listing.`);
      return;
    }
    const tooLarge = files.find((f) => f.size > MAX_FILE_SIZE);
    if (tooLarge) {
      setImageError(`"${tooLarge.name}" is over 2MB — please use a smaller image.`);
      return;
    }

    try {
      const dataUrls = await Promise.all(files.map(readFileAsDataUrl));
      setForm((f) => ({ ...f, images: [...f.images, ...dataUrls] }));
    } catch {
      setImageError('Could not read one of those files — please try again.');
    }
  };

  const removeImage = (index) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        images: form.images
      };

      if (listing) {
        // Only send fields that actually changed, so untouched approved
        // fields aren't reset to pending unnecessarily.
        const changed = {};
        if (payload.name !== listing.name.value) changed.name = payload.name;
        if (payload.description !== listing.description.value) changed.description = payload.description;
        if (payload.price !== listing.price.value) changed.price = payload.price;
        const currentCategoryId = listing.category.value?._id || listing.category.value;
        if (payload.category !== currentCategoryId) changed.category = payload.category;
        if (JSON.stringify(payload.images) !== JSON.stringify(listing.images.value)) changed.images = payload.images;

        if (Object.keys(changed).length === 0) {
          setSubmitting(false);
          return;
        }
        const updated = await api.updateListing(listing._id, changed);
        onSaved(updated);
      } else {
        const created = await api.createListing(payload);
        onSaved(created);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key) => listing?.[key];

  return (
    <form className="listing-editor" onSubmit={handleSubmit}>
      <div className="listing-field">
        <label htmlFor="name">Item name {field('name') && <FieldStatusBadge status={field('name').status} />}</label>
        <input id="name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
        {field('name')?.status === 'rejected' && <p className="field-comment">{field('name').comment}</p>}
      </div>

      <div className="listing-field">
        <label htmlFor="description">
          Description {field('description') && <FieldStatusBadge status={field('description').status} />}
        </label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          required
        />
        {field('description')?.status === 'rejected' && <p className="field-comment">{field('description').comment}</p>}
      </div>

      <div className="listing-field">
        <label htmlFor="category">
          Category {field('category') && <FieldStatusBadge status={field('category').status} />}
        </label>
        <select id="category" value={form.category} onChange={(e) => handleChange('category', e.target.value)} required>
          <option value="">Select a category…</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name} (cap ${c.maxPrice})</option>
          ))}
        </select>
        {field('category')?.status === 'rejected' && <p className="field-comment">{field('category').comment}</p>}
      </div>

      <div className="listing-field">
        <label htmlFor="price">Price ($) {field('price') && <FieldStatusBadge status={field('price').status} />}</label>
        <input
          id="price"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(e) => handleChange('price', e.target.value)}
          required
        />
        {field('price')?.status === 'rejected' && <p className="field-comment">{field('price').comment}</p>}
      </div>

      <div className="listing-field">
        <label htmlFor="images">
          Photos {field('images') && <FieldStatusBadge status={field('images').status} />}
        </label>

        {form.images.length > 0 && (
          <div className="image-preview-row">
            {form.images.map((src, i) => (
              <div className="image-preview-thumb" key={i}>
                <img src={src} alt={`Listing photo ${i + 1}`} />
                <button type="button" onClick={() => removeImage(i)} aria-label="Remove image">×</button>
              </div>
            ))}
          </div>
        )}

        {form.images.length < MAX_IMAGES && (
          <input id="images" type="file" accept="image/*" multiple onChange={handleFilesSelected} />
        )}
        <p className="field-hint">Up to {MAX_IMAGES} photos, 2MB each.</p>

        {imageError && <p className="field-comment">{imageError}</p>}
        {field('images')?.status === 'rejected' && <p className="field-comment">{field('images').comment}</p>}
      </div>

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : listing ? 'Save changes' : 'Submit listing'}
      </button>
    </form>
  );
}

function SellerListings() {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [creating, setCreating] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadAll = () => {
    Promise.all([api.getMyListings(), api.getCategories()])
      .then(([l, c]) => {
        setListings(l);
        setCategories(c);
      })
      .catch((err) => setLoadError(err.message));
  };

  useEffect(() => { loadAll(); }, []);

  const handleSaved = () => {
    setCreating(false);
    loadAll();
  };

  return (
    <div className="dashboard-placeholder">
      <h1>My Listings</h1>
      {loadError && <p className="auth-error">{loadError}</p>}

      {!creating && (
        <button onClick={() => setCreating(true)} style={{ marginBottom: 24 }}>
          + New listing
        </button>
      )}

      {creating && (
        <div className="auth-card" style={{ maxWidth: 480, marginBottom: 32 }}>
          <h2>New listing</h2>
          <ListingEditor categories={categories} onSaved={handleSaved} />
        </div>
      )}

      {listings.map((listing) => (
        <div className="auth-card" key={listing._id} style={{ maxWidth: 480, marginBottom: 24 }}>
          <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {listing.name.value}
            <span className={`overall-badge overall-badge-${listing.overallStatus}`}>
              {listing.overallStatus === 'needs_changes' ? 'Changes requested' : listing.overallStatus}
            </span>
          </h2>
          <ListingEditor listing={listing} categories={categories} onSaved={handleSaved} />
        </div>
      ))}
    </div>
  );
}

export default SellerListings;
