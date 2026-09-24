import { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';
import { TagIcon, PlusIcon } from '../components/icons';

function CategoryManager() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => api.getCategories().then(setCategories).catch((err) => setError(err.message)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createCategory({ name, maxPrice: Number(maxPrice) });
      showToast(`"${name}" category added`);
      setName('');
      setMaxPrice('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCapChange = async (category, newCap) => {
    try {
      await api.updateCategory(category._id, { maxPrice: Number(newCap) });
      showToast(`Updated "${category.name}" price cap`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (category) => {
    try {
      await api.deleteCategory(category._id);
      showToast(`"${category.name}" category removed`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard-placeholder">
      <PageHeader
        icon={<TagIcon />}
        title="Categories & Price Caps"
        subtitle="Each category has its own flat maximum price — no site-wide cap. Change a cap any time."
      />

      {error && <p className="auth-error">{error}</p>}

      {!loading && categories.length === 0 ? (
        <EmptyState
          icon={<TagIcon />}
          message="No categories yet."
          hint="Add one below to let sellers start listing under it."
        />
      ) : (
        <table className="category-table">
          <thead>
            <tr><th>Category</th><th>Max price ($)</th><th></th></tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} columns={3} />)}
            {!loading && categories.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    defaultValue={c.maxPrice}
                    onBlur={(e) => {
                      if (Number(e.target.value) !== c.maxPrice) handleCapChange(c, e.target.value);
                    }}
                  />
                </td>
                <td>
                  <button className="link-button" onClick={() => handleDelete(c)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form onSubmit={handleCreate} className="category-form">
        <input placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input
          type="number"
          min="0"
          placeholder="Max price ($)"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          required
        />
        <button type="submit" className="button-with-icon"><PlusIcon /> Add category</button>
      </form>
    </div>
  );
}

export default CategoryManager;
