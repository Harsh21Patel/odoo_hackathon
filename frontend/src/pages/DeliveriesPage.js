import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatDate, statusColor } from '../utils/helpers';
import toast from 'react-hot-toast';
import useModalOpen from '../hooks/useModalOpen';

const STATUSES = ['Draft','Waiting','Ready','Done','Cancelled'];
const STATUS_COLORS = { Draft:'#6B6860', Waiting:'#D97706', Ready:'#0891B2', Done:'#16A34A', Cancelled:'#DC2626' };
const STATUS_BG    = { Draft:'#F0EEE9', Waiting:'#FFFBEB', Ready:'#ECFEFF', Done:'#F0FDF4', Cancelled:'#FEF2F2' };
const OP_TYPES = ['Outgoing', 'Drop Shipping', 'Returns'];

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  useModalOpen(showModal);

  const [form, setForm] = useState({
    customer: '', contact: '', deliveryAddress: '', operationType: 'Outgoing',
    warehouse: '', location: '', scheduledDate: '', notes: '',
    lines: [{ product: '', demandQty: 1, uom: 'pcs' }]
  });

  // ── Get locations for selected warehouse ──────────────────────────────────
  const selectedWarehouse = warehouses.find(w => w._id === form.warehouse);
  const warehouseLocations = selectedWarehouse?.locations || [];

  const handleWarehouseChange = (warehouseId) => {
    setForm(p => ({ ...p, warehouse: warehouseId, location: '' }));
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const [dRes, wRes, pRes] = await Promise.all([
        api.get('/deliveries', { params }),
        api.get('/warehouses'),
        api.get('/products'),
      ]);
      setDeliveries(dRes.data.deliveries);
      setWarehouses(wRes.data.warehouses);
      setProducts(pRes.data.products);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const addLine = () => setForm(p => ({ ...p, lines: [...p.lines, { product: '', demandQty: 1, uom: 'pcs' }] }));
  const removeLine = (i) => setForm(p => ({ ...p, lines: p.lines.filter((_, idx) => idx !== i) }));
  const updateLine = (i, k, v) => setForm(p => { const lines = [...p.lines]; lines[i] = { ...lines[i], [k]: v }; return { ...p, lines }; });

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/deliveries', form);
      toast.success('Delivery order created');
      setShowModal(false);
      setForm({ customer: '', contact: '', deliveryAddress: '', operationType: 'Outgoing', warehouse: '', location: '', scheduledDate: '', notes: '', lines: [{ product: '', demandQty: 1, uom: 'pcs' }] });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const kanbanGroups = STATUSES.map(s => ({ status: s, items: deliveries.filter(d => d.status === s) }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Delivery</h1>
          <p className="page-subtitle">Outgoing stock to customers · {deliveries.length} records</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New</button>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrap" style={{ flex: 1, minWidth: 220 }}>
          <span className="search-icon">⌕</span>
          <input className="form-input" placeholder="Search by reference or contact…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input form-select" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <button onClick={() => setViewMode('list')} title="List view"
            style={{ padding: '7px 12px', background: viewMode === 'list' ? 'var(--text-primary)' : 'var(--surface)', color: viewMode === 'list' ? 'white' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontSize: 14 }}>☰</button>
          <button onClick={() => setViewMode('kanban')} title="Kanban view"
            style={{ padding: '7px 12px', background: viewMode === 'kanban' ? 'var(--text-primary)' : 'var(--surface)', color: viewMode === 'kanban' ? 'white' : 'var(--text-secondary)', border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer', fontSize: 14 }}>⊞</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner"></div></div>
      ) : deliveries.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">↑</div><p>No delivery orders found.</p></div>
      ) : viewMode === 'list' ? (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference</th><th>From</th><th>To</th><th>Contact</th><th>Scheduled Date</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d._id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>{d.reference}</span></td>
                    <td style={{ fontSize: 13 }}>
                      <div style={{ fontWeight: 450 }}>{d.warehouse?.name}{d.location && <span style={{ color: 'var(--text-muted)' }}> / {d.location}</span>}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>WH/Stock</div>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      <div style={{ fontWeight: 450 }}>{d.customer}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Customer</div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{d.contact || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDate(d.scheduledDate)}</td>
                    <td><span className={`status-badge ${statusColor(d.status)}`}>{d.status}</span></td>
                    <td><Link className="btn btn-secondary btn-sm" to={`/deliveries/${d._id}`}>View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, alignItems: 'start' }}>
          {kanbanGroups.map(group => (
            <div key={group.status}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '6px 10px', background: STATUS_BG[group.status], borderRadius: 'var(--radius-sm)', border: `1px solid ${STATUS_COLORS[group.status]}22` }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLORS[group.status], textTransform: 'uppercase', letterSpacing: '0.5px' }}>{group.status}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLORS[group.status], background: 'white', borderRadius: 99, padding: '1px 7px', border: `1px solid ${STATUS_COLORS[group.status]}44` }}>{group.items.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {group.items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: 12, border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>Empty</div>
                ) : group.items.map(d => (
                  <Link key={d._id} to={`/deliveries/${d._id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '13px 14px', transition: 'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                      <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>{d.reference}</div>
                      <div style={{ fontWeight: 500, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 3 }}>{d.customer}</div>
                      {d.contact && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{d.contact}</div>}
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{d.warehouse?.name}{d.location && ` / ${d.location}`}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{formatDate(d.scheduledDate)}</span>
                        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{d.lines?.length} item{d.lines?.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── New Delivery Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">New Delivery Order</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Customer *</label>
                  <input className="form-input" value={form.customer} onChange={e => setForm(p => ({ ...p, customer: e.target.value }))} required placeholder="Customer name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input className="form-input" value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} placeholder="e.g. Rahul Sharma" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Address</label>
                <input className="form-input" value={form.deliveryAddress} onChange={e => setForm(p => ({ ...p, deliveryAddress: e.target.value }))} placeholder="Full delivery address" />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Dispatch From (Warehouse) *</label>
                  <select
                    className="form-input form-select"
                    value={form.warehouse}
                    onChange={e => handleWarehouseChange(e.target.value)}
                    required
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Source Location
                    {warehouseLocations.length === 0 && form.warehouse && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>(no locations defined)</span>
                    )}
                  </label>
                  {/* ── Dropdown if warehouse has locations, else free text ── */}
                  {warehouseLocations.length > 0 ? (
                    <select
                      className="form-input form-select"
                      value={form.location}
                      onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    >
                      <option value="">Select location</option>
                      {warehouseLocations.map(loc => (
                        <option key={loc._id} value={loc.name}>
                          {loc.name} ({loc.shortCode})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="form-input"
                      value={form.location}
                      onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                      placeholder={form.warehouse ? 'Type location name' : 'Select warehouse first'}
                      disabled={!form.warehouse}
                    />
                  )}
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Scheduled Date</label>
                  <input className="form-input" type="date" value={form.scheduledDate} onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Operation Type</label>
                  <select className="form-input form-select" value={form.operationType} onChange={e => setForm(p => ({ ...p, operationType: e.target.value }))}>
                    {OP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label className="form-label" style={{ margin: 0 }}>Products *</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>+ Add Line</button>
                </div>
                {form.lines.map((line, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px 28px', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                    <div>
                      {i === 0 && <label className="form-label">Product</label>}
                      <select className="form-input form-select" value={line.product} onChange={e => updateLine(i, 'product', e.target.value)} required>
                        <option value="">Select product</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku}) — Stock: {p.totalStock}</option>)}
                      </select>
                    </div>
                    <div>
                      {i === 0 && <label className="form-label">Demand Qty</label>}
                      <input className="form-input" type="number" min="1" value={line.demandQty} onChange={e => updateLine(i, 'demandQty', e.target.value)} required />
                    </div>
                    <div>
                      {i === 0 && <label className="form-label">UoM</label>}
                      <input className="form-input" value={line.uom} onChange={e => updateLine(i, 'uom', e.target.value)} />
                    </div>
                    <div style={{ paddingBottom: 1 }}>
                      {form.lines.length > 1 && (
                        <button type="button" className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)', padding: '6px 8px' }} onClick={() => removeLine(i)}>✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Delivery'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}