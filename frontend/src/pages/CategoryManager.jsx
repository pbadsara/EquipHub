import { useState, useEffect } from 'react';
import { api } from '../api';

function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [error, setError] = useState('');

  const load = () => api.getCategories().then(setCategories).catch((err) => setError(err.message));

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createCategory({ name, maxPrice: Number(maxPrice) });
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
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (category) => {
    try {
      await api.deleteCategory(category._id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard-placeholder">
      <h1>Categories &amp; Price Caps</h1>
      <p>Each category has its own flat maximum price — no site-wide cap. Change a cap any time.</p>

      {error && <p className="auth-error">{error}</p>}

      <table className="category-table">
        <thead>
          <tr><th>Category</th><th>Max price ($)</th><th></th></tr>
        </thead>
        <tbody>
          {categories.map((c) => (
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
        <button type="submit">Add category</button>
      </form>
    </div>
  );
}

export default CategoryManager;
