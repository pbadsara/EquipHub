import { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import { SkeletonForm, SkeletonTile, SkeletonStatRow } from '../components/Skeleton';
import { ListIcon, PlusIcon, ImageIcon, UploadIcon } from '../components/icons';

const STATUS_LABEL = {
  pending: 'Awaiting review',
  approved: 'Approved',
  rejected: 'Changes requested'
};

const LISTING_TILE_STATUS_LABEL = {
  active: 'Active',
  sold: 'Sold',
  rented: 'Rented'
};

// A listing's at-a-glance tile status: sold takes priority (it's gone from
// the catalogue either way); a rental with at least one booking is flagged
// "Rented" so the seller can see it's earned something; everything else
// still live and unbooked is just "Active".
function listingTileStatus(listing, bookedListingIds) {
  if (listing.sold) return 'sold';
  if (listing.listingType.value === 'rent' && bookedListingIds.has(listing._id)) return 'rented';
  return 'active';
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB per image, checked before it's ever uploaded

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
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: listing?.name.value || '',
    description: listing?.description.value || '',
    price: listing?.price.value ?? '',
    category: listing?.category.value?._id || listing?.category.value || '',
    images: listing?.images.value || [],
    listingType: listing?.listingType.value || ''
  });
  const [imageError, setImageError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const processFiles = async (files) => {
    setImageError('');
    if (files.length === 0) return;

    if (form.images.length + files.length > MAX_IMAGES) {
      setImageError(`You can attach at most ${MAX_IMAGES} images per listing.`);
      return;
    }
    const tooLarge = files.find((f) => f.size > MAX_FILE_SIZE);
    if (tooLarge) {
      setImageError(`"${tooLarge.name}" is over 2MB — please use a smaller image.`);
      return;
    }

    setUploadingImages(true);
    try {
      // Read locally into a data URL first, then hand that to Cloudinary —
      // the listing only ever ends up storing the hosted https URL it gets
      // back, not the image bytes themselves.
      const dataUrls = await Promise.all(files.map(readFileAsDataUrl));
      const uploaded = await Promise.all(dataUrls.map((dataUrl) => api.uploadImage(dataUrl)));
      setForm((f) => ({ ...f, images: [...f.images, ...uploaded.map((u) => u.url)] }));
    } catch (err) {
      setImageError(err.message || 'Could not upload one of those files — please try again.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow picking the same file again later
    processFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (uploadingImages) return;
    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith('image/'));
    processFiles(files);
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
        images: form.images,
        listingType: form.listingType
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
        if (payload.listingType !== listing.listingType.value) changed.listingType = payload.listingType;

        if (Object.keys(changed).length === 0) {
          setSubmitting(false);
          return;
        }
        const updated = await api.updateListing(listing._id, changed);
        onSaved(updated);
        showToast('Changes saved');
      } else {
        const created = await api.createListing(payload);
        onSaved(created);
        showToast('Listing submitted for review');
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
        <label htmlFor="listingType">
          For sale or rent? {field('listingType') && <FieldStatusBadge status={field('listingType').status} />}
        </label>
        <select
          id="listingType"
          value={form.listingType}
          onChange={(e) => handleChange('listingType', e.target.value)}
          required
        >
          <option value="">Select one…</option>
          <option value="sale">For sale</option>
          <option value="rent">For rent</option>
        </select>
        {field('listingType')?.status === 'rejected' && <p className="field-comment">{field('listingType').comment}</p>}
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
        <label htmlFor="price">
          {form.listingType === 'rent' ? 'Price per day ($)' : 'Price ($)'}
          {' '}
          {field('price') && <FieldStatusBadge status={field('price').status} />}
        </label>
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
          <label
            className={`dropzone ${isDragging ? 'dropzone-active' : ''} ${uploadingImages ? 'dropzone-uploading' : ''}`}
            onDragOver={(e) => { if (!uploadingImages) { e.preventDefault(); setIsDragging(true); } }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <UploadIcon />
            {uploadingImages ? (
              <span>Uploading…</span>
            ) : (
              <span>Drag photos here, or <strong>click to browse</strong></span>
            )}
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesSelected}
              disabled={uploadingImages}
              hidden
            />
          </label>
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

// A single listing card — the name/status header plus its editor. Shared
// between the "My Listings" tab (still-in-progress listings) and the
// "Listing History" tab (already approved and live), since both just
// render the same listing shape.
function ListingCard({ listing, categories, onSaved }) {
  return (
    <div className="auth-card" style={{ maxWidth: 480, marginBottom: 24 }}>
      <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {listing.name.value}
        <span>
          {listing.sold && <span className="overall-badge overall-badge-sold">Sold</span>}
          {' '}
          <span className={`overall-badge overall-badge-${listing.overallStatus}`}>
            {listing.overallStatus === 'needs_changes' ? 'Changes requested' : listing.overallStatus}
          </span>
        </span>
      </h2>
      {listing.sold && <p className="field-hint">Sold — no longer visible in the public catalogue.</p>}
      <ListingEditor listing={listing} categories={categories} onSaved={onSaved} />
    </div>
  );
}

// A small clickable summary card for the Listing History tab — just the
// photo, name and a status tag. Clicking it pops the full ListingCard open
// in a modal instead of taking up space inline, since a live listing is
// mostly there for reference, not day-to-day editing.
function ListingTile({ listing, status, onClick }) {
  return (
    <button type="button" className="listing-tile" onClick={onClick}>
      <div className="listing-tile-image">
        {listing.images.value.length > 0 ? (
          <img src={listing.images.value[0]} alt={listing.name.value} />
        ) : (
          <ImageIcon />
        )}
      </div>
      <p className="listing-tile-name">{listing.name.value}</p>
      <span className={`overall-badge overall-badge-${status}`}>{LISTING_TILE_STATUS_LABEL[status]}</span>
    </button>
  );
}

function SellerListings() {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bookedListingIds, setBookedListingIds] = useState(new Set());
  const [creating, setCreating] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState('active'); // 'active' | 'history'
  const [expandedListing, setExpandedListing] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = () => {
    Promise.all([api.getMyListings(), api.getCategories(), api.getSellerActivityHistory()])
      .then(([l, c, orders]) => {
        setListings(l);
        setCategories(c);
        setBookedListingIds(new Set(orders.map((o) => o.itemId)));
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const handleSaved = (updated) => {
    setCreating(false);
    setExpandedListing((current) => (current ? updated : current));
    loadAll();
  };

  // Once a listing is fully approved and live, it moves out of the
  // day-to-day "My Listings" work queue and into "Listing History" — the
  // seller can still open and edit it there, it's just no longer mixed in
  // with drafts and listings still waiting on admin feedback.
  const activeListings = listings.filter((l) => l.overallStatus !== 'approved');
  const historyListings = listings.filter((l) => l.overallStatus === 'approved');
  const historyStatuses = historyListings.map((l) => listingTileStatus(l, bookedListingIds));
  const liveCount = historyStatuses.filter((s) => s === 'active').length;
  const soldCount = historyStatuses.filter((s) => s === 'sold').length;
  const rentedCount = historyStatuses.filter((s) => s === 'rented').length;

  return (
    <div className="dashboard-placeholder">
      <PageHeader
        icon={<ListIcon />}
        title="My Listings"
        subtitle="Manage drafts, track admin feedback, and see what's live."
      />

      {loading ? (
        <SkeletonStatRow count={4} />
      ) : (
        <div className="stat-row">
          <StatCard label="Needs attention" value={activeListings.length} />
          <StatCard label="Live" value={liveCount} tone="active" />
          <StatCard label="Sold" value={soldCount} tone="sold" />
          <StatCard label="Rented" value={rentedCount} tone="rented" />
        </div>
      )}

      {loadError && <p className="auth-error">{loadError}</p>}

      <div className="tab-bar">
        <button
          className={`tab-button ${tab === 'active' ? 'tab-button-active' : ''}`}
          onClick={() => setTab('active')}
        >
          My Listings
        </button>
        <button
          className={`tab-button ${tab === 'history' ? 'tab-button-active' : ''}`}
          onClick={() => setTab('history')}
        >
          Listing History
        </button>
      </div>

      {tab === 'active' && (
        <>
          {!creating && (
            <button className="button-with-icon" onClick={() => setCreating(true)} style={{ marginBottom: 24 }}>
              <PlusIcon /> New listing
            </button>
          )}

          {creating && (
            <div className="auth-card" style={{ maxWidth: 480, marginBottom: 32 }}>
              <h2>New listing</h2>
              <ListingEditor categories={categories} onSaved={handleSaved} />
            </div>
          )}

          {loading && <SkeletonForm />}

          {!loading && activeListings.length === 0 && !creating && (
            <EmptyState
              icon={<ListIcon />}
              message="Nothing needs your attention right now."
              hint="New listings and admin feedback will show up here."
            />
          )}

          {!loading && activeListings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} categories={categories} onSaved={handleSaved} />
          ))}
        </>
      )}

      {tab === 'history' && (
        <>
          {loading && (
            <div className="listing-tile-grid">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonTile key={i} />)}
            </div>
          )}

          {!loading && historyListings.length === 0 && (
            <EmptyState
              icon={<ListIcon />}
              message="No approved listings yet."
              hint="Listings show up here once every field is approved."
            />
          )}

          <div className="listing-tile-grid">
            {!loading && historyListings.map((listing) => (
              <ListingTile
                key={listing._id}
                listing={listing}
                status={listingTileStatus(listing, bookedListingIds)}
                onClick={() => setExpandedListing(listing)}
              />
            ))}
          </div>
        </>
      )}

      {expandedListing && (
        <div className="modal-overlay" onClick={() => setExpandedListing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setExpandedListing(null)} aria-label="Close">×</button>
            <ListingCard listing={expandedListing} categories={categories} onSaved={handleSaved} />
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerListings;
