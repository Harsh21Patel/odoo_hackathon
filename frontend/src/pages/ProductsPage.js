import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import useModalOpen from '../hooks/useModalOpen';

const UOM_OPTIONS = ['pcs','kg','ltr','mtr','box','set','pkt'];
const EMPTY_FORM = { name:'', sku:'', category:'', uom:'pcs', description:'', unitCost:'', reorderLevel:10, initialStock:'', warehouseId:'' };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  useModalOpen(showModal);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCat) params.category = filterCat;
      if (lowStock) params.lowStock = true;
      const [pRes, wRes, cRes] = await Promise.all([
        api.get('/products', { params }),
        api.get('/warehouses'),
        api.get('/products/meta/categories'),
      ]);
      setProducts(pRes.data.products);
      setWarehouses(wRes.data.warehouses);
      setCategories(cRes.data.categories);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, filterCat, lowStock]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name:p.name, sku:p.sku, category:p.category, uom:p.uom, description:p.description||'', unitCost:p.unitCost||'', reorderLevel:p.reorderLevel, initialStock:'', warehouseId:'' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) {
        await api.put(`/products/${editing._id}`, form);
        toast.success('Product updated');
      } else {
        await api.post('/products', form);
        toast.success('Product created');
      }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const f = (k, v) => setForm(prev => ({...prev, [k]: v}));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{products.length} active SKUs in inventory</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrap">
          <span className="search-icon">⌕</span>
          <input className="form-input" placeholder="Search by name or SKU…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input form-select" style={{width:160}} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className={`btn ${lowStock ? 'btn-danger' : 'btn-secondary'} btn-sm`} onClick={() => setLowStock(!lowStock)}>
          {lowStock ? '⚠ Low Stock' : 'Low Stock'}
        </button>
      </div>

      <div className="card" style={{padding:0}}>
        {loading ? <div className="loading-state"><div className="spinner"></div></div> :
         products.length === 0 ? <div className="empty-state"><div className="empty-icon">◫</div><p>No products found.</p></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>UoM</th><th>Total Stock</th><th>Reorder Level</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {products.map(p => {
                  const status = p.totalStock === 0 ? 'out' : p.totalStock <= p.reorderLevel ? 'low' : 'ok';
                  return (
                    <tr key={p._id}>
                      <td><div style={{fontWeight:500}}>{p.name}</div></td>
                      <td><span className="chip">{p.sku}</span></td>
                      <td style={{color:'var(--text-secondary)', fontSize:13}}>{p.category}</td>
                      <td style={{color:'var(--text-muted)', fontSize:13}}>{p.uom}</td>
                      <td style={{fontWeight:600}}>{p.totalStock}</td>
                      <td style={{color:'var(--text-muted)', fontSize:13}}>{p.reorderLevel}</td>
                      <td>
                        {status === 'out' && <span className="chip chip-danger">Out of Stock</span>}
                        {status === 'low' && <span className="chip chip-warning">Low Stock</span>}
                        {status === 'ok' && <span className="chip chip-success">In Stock</span>}
                      </td>
                      <td>
                        <div style={{display:'flex', gap:6}}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                          <button className="btn btn-secondary btn-sm" style={{color:'var(--danger)'}} onClick={() => handleDelete(p._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Product' : 'New Product'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input className="form-input" value={form.name} onChange={e => f('name', e.target.value)} required placeholder="e.g. Steel Rods" />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU / Code *</label>
                  <input className="form-input" value={form.sku} onChange={e => f('sku', e.target.value)} required placeholder="e.g. STL-001" disabled={!!editing} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <input className="form-input" value={form.category} onChange={e => f('category', e.target.value)} required placeholder="e.g. Raw Material" list="cat-list" />
                  <datalist id="cat-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit of Measure</label>
                  <select className="form-input form-select" value={form.uom} onChange={e => f('uom', e.target.value)}>
                    {UOM_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Unit Cost (₹)</label>
                  <input className="form-input" type="number" min="0" value={form.unitCost} onChange={e => f('unitCost', e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Reorder Level</label>
                  <input className="form-input" type="number" min="0" value={form.reorderLevel} onChange={e => f('reorderLevel', e.target.value)} />
                </div>
              </div>
              {!editing && (
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Initial Stock</label>
                    <input className="form-input" type="number" min="0" value={form.initialStock} onChange={e => f('initialStock', e.target.value)} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Warehouse</label>
                    <select className="form-input form-select" value={form.warehouseId} onChange={e => f('warehouseId', e.target.value)}>
                      <option value="">Select warehouse</option>
                      {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={form.description} onChange={e => f('description', e.target.value)} placeholder="Optional notes…" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}