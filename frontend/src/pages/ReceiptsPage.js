import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatDate, statusColor } from '../utils/helpers';
import toast from 'react-hot-toast';
import useModalOpen from '../hooks/useModalOpen';

const STATUSES = ['Draft','Waiting','Ready','Done','Cancelled'];
const STATUS_COLORS = { Draft:'#6B6860', Waiting:'#D97706', Ready:'#0891B2', Done:'#16A34A', Cancelled:'#DC2626' };
const STATUS_BG    = { Draft:'#F0EEE9', Waiting:'#FFFBEB', Ready:'#ECFEFF', Done:'#F0FDF4', Cancelled:'#FEF2F2' };

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
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
    supplier:'', contact:'', warehouse:'', location:'',
    scheduledDate:'', notes:'',
    lines:[{ product:'', expectedQty:1, uom:'pcs' }]
  });

  // ── Get locations for selected warehouse ──────────────────────────────────
  const selectedWarehouse = warehouses.find(w => w._id === form.warehouse);
  const warehouseLocations = selectedWarehouse?.locations || [];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const [rRes, wRes, pRes] = await Promise.all([
        api.get('/receipts', { params }),
        api.get('/warehouses'),
        api.get('/products'),
      ]);
      setReceipts(rRes.data.receipts);
      setWarehouses(wRes.data.warehouses);
      setProducts(pRes.data.products);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  // Reset location when warehouse changes
  const handleWarehouseChange = (warehouseId) => {
    setForm(p => ({ ...p, warehouse: warehouseId, location: '' }));
  };

  const addLine = () => setForm(p => ({ ...p, lines: [...p.lines, { product:'', expectedQty:1, uom:'pcs' }] }));
  const removeLine = (i) => setForm(p => ({ ...p, lines: p.lines.filter((_,idx) => idx !== i) }));
  const updateLine = (i, k, v) => setForm(p => { const lines=[...p.lines]; lines[i]={...lines[i],[k]:v}; return {...p,lines}; });

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/receipts', form);
      toast.success('Receipt created');
      setShowModal(false);
      setForm({ supplier:'', contact:'', warehouse:'', location:'', scheduledDate:'', notes:'', lines:[{ product:'', expectedQty:1, uom:'pcs' }] });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const kanbanGroups = STATUSES.map(s => ({
    status: s,
    items: receipts.filter(r => r.status === s),
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Receipts</h1>
          <p className="page-subtitle">Incoming stock from suppliers · {receipts.length} records</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Receipt</button>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrap" style={{flex:1, minWidth:220}}>
          <span className="search-icon">⌕</span>
          <input className="form-input" placeholder="Search by reference or supplier…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input form-select" style={{width:150}} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{display:'flex', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', overflow:'hidden'}}>
          <button onClick={() => setViewMode('list')} style={{padding:'7px 12px', background: viewMode==='list' ? 'var(--text-primary)' : 'var(--surface)', color: viewMode==='list' ? 'white' : 'var(--text-secondary)', border:'none', cursor:'pointer', fontSize:14, transition:'all 0.15s'}} title="List view">☰</button>
          <button onClick={() => setViewMode('kanban')} style={{padding:'7px 12px', background: viewMode==='kanban' ? 'var(--text-primary)' : 'var(--surface)', color: viewMode==='kanban' ? 'white' : 'var(--text-secondary)', border:'none', cursor:'pointer', fontSize:14, transition:'all 0.15s', borderLeft:'1px solid var(--border)'}} title="Kanban view">⊞</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner"></div></div>
      ) : receipts.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">↓</div><p>No receipts found.</p></div>
      ) : viewMode === 'list' ? (
        <div className="card" style={{padding:0}}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference</th><th>From</th><th>To</th><th>Contact</th><th>Scheduled Date</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {receipts.map(r => (
                  <tr key={r._id}>
                    <td><span style={{fontFamily:'monospace', fontWeight:700, fontSize:13, color:'var(--accent)'}}>{r.reference}</span></td>
                    <td style={{color:'var(--text-secondary)', fontSize:13}}>
                      <div style={{fontWeight:450}}>{r.supplier}</div>
                      <div style={{fontSize:11.5, color:'var(--text-muted)'}}>Vendor</div>
                    </td>
                    <td style={{color:'var(--text-secondary)', fontSize:13}}>
                      <div>{r.warehouse?.name}{r.location && <span style={{color:'var(--text-muted)'}}> / {r.location}</span>}</div>
                      <div style={{fontSize:11.5, color:'var(--text-muted)'}}>WH/Stock</div>
                    </td>
                    <td style={{fontSize:13, color:'var(--text-secondary)'}}>{r.contact || '—'}</td>
                    <td style={{color:'var(--text-muted)', fontSize:13}}>{formatDate(r.scheduledDate)}</td>
                    <td><span className={`status-badge ${statusColor(r.status)}`}>{r.status}</span></td>
                    <td><Link className="btn btn-secondary btn-sm" to={`/receipts/${r._id}`}>View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, alignItems:'start'}}>
          {kanbanGroups.map(group => (
            <div key={group.status}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, padding:'6px 10px', background: STATUS_BG[group.status], borderRadius:'var(--radius-sm)', border:`1px solid ${STATUS_COLORS[group.status]}22`}}>
                <span style={{fontSize:12, fontWeight:700, color: STATUS_COLORS[group.status], textTransform:'uppercase', letterSpacing:'0.5px'}}>{group.status}</span>
                <span style={{fontSize:12, fontWeight:600, color: STATUS_COLORS[group.status], background:'white', borderRadius:99, padding:'1px 7px', border:`1px solid ${STATUS_COLORS[group.status]}44`}}>{group.items.length}</span>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:10}}>
                {group.items.length === 0 ? (
                  <div style={{textAlign:'center', padding:'20px 10px', color:'var(--text-muted)', fontSize:12, border:'1px dashed var(--border)', borderRadius:'var(--radius-sm)'}}>Empty</div>
                ) : group.items.map(r => (
                  <Link key={r._id} to={`/receipts/${r._id}`} style={{textDecoration:'none'}}>
                    <div style={{background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'13px 14px', transition:'all 0.15s', cursor:'pointer'}}
                      onMouseEnter={e => e.currentTarget.style.boxShadow='var(--shadow)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow='none'}
                    >
                      <div style={{fontFamily:'monospace', fontSize:12, fontWeight:700, color:'var(--accent)', marginBottom:6}}>{r.reference}</div>
                      <div style={{fontWeight:500, fontSize:13.5, color:'var(--text-primary)', marginBottom:3}}>{r.supplier}</div>
                      {r.contact && <div style={{fontSize:12, color:'var(--text-muted)', marginBottom:4}}>{r.contact}</div>}
                      <div style={{fontSize:12, color:'var(--text-secondary)', marginBottom:8}}>{r.warehouse?.name}{r.location && ` / ${r.location}`}</div>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <span style={{fontSize:11.5, color:'var(--text-muted)'}}>{formatDate(r.scheduledDate)}</span>
                        <span style={{fontSize:11.5, color:'var(--text-muted)'}}>{r.lines?.length} item{r.lines?.length !== 1 ? 's':''}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── New Receipt Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">New Receipt</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Supplier / Vendor *</label>
                  <input className="form-input" value={form.supplier} onChange={e => setForm(p=>({...p,supplier:e.target.value}))} required placeholder="e.g. Tata Steel Ltd." />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input className="form-input" value={form.contact} onChange={e => setForm(p=>({...p,contact:e.target.value}))} placeholder="e.g. Rahul Sharma" />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Destination Warehouse *</label>
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
                    Destination Location
                    {warehouseLocations.length === 0 && form.warehouse && (
                      <span style={{fontSize:11, color:'var(--text-muted)', fontWeight:400, marginLeft:6}}>(no locations defined)</span>
                    )}
                  </label>
                  {/* ── Dropdown if warehouse has locations, else free text ── */}
                  {warehouseLocations.length > 0 ? (
                    <select
                      className="form-input form-select"
                      value={form.location}
                      onChange={e => setForm(p=>({...p, location: e.target.value}))}
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
                      onChange={e => setForm(p=>({...p,location:e.target.value}))}
                      placeholder={form.warehouse ? 'Type location name' : 'Select warehouse first'}
                      disabled={!form.warehouse}
                    />
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Scheduled Date</label>
                <input className="form-input" type="date" value={form.scheduledDate} onChange={e => setForm(p=>({...p,scheduledDate:e.target.value}))} />
              </div>

              <div style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <label className="form-label" style={{margin:0}}>Products *</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>+ Add Line</button>
                </div>
                {form.lines.map((line, i) => (
                  <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 90px 70px 28px', gap:8, marginBottom:8, alignItems:'end'}}>
                    <div>
                      {i === 0 && <label className="form-label">Product</label>}
                      <select className="form-input form-select" value={line.product} onChange={e => updateLine(i,'product',e.target.value)} required>
                        <option value="">Select product</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                      </select>
                    </div>
                    <div>
                      {i === 0 && <label className="form-label">Expected Qty</label>}
                      <input className="form-input" type="number" min="1" value={line.expectedQty} onChange={e => updateLine(i,'expectedQty',e.target.value)} required />
                    </div>
                    <div>
                      {i === 0 && <label className="form-label">UoM</label>}
                      <input className="form-input" value={line.uom} onChange={e => updateLine(i,'uom',e.target.value)} placeholder="pcs" />
                    </div>
                    <div style={{paddingBottom:1}}>
                      {form.lines.length > 1 && (
                        <button type="button" className="btn btn-secondary btn-sm" style={{color:'var(--danger)', padding:'6px 8px'}} onClick={() => removeLine(i)}>✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Receipt'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}