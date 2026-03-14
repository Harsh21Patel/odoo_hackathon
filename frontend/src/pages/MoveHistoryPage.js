import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { formatDate, formatDateTime, moveTypeColor } from '../utils/helpers';
import toast from 'react-hot-toast';
import useModalOpen from '../hooks/useModalOpen';

const MOVE_TYPES = ['receipt','delivery','transfer','adjustment'];
const STATUSES = ['Draft','Done','Cancelled'];
const STATUS_COLORS = { Draft:'#6B6860', Done:'#16A34A', Cancelled:'#DC2626' };
const STATUS_BG    = { Draft:'#F0EEE9', Done:'#F0FDF4', Cancelled:'#FEF2F2' };

export default function MoveHistoryPage() {
  const [moves, setMoves] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState('list');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [saving, setSaving] = useState(false);
  useModalOpen(showTransferModal || showAdjustModal);

  const [tForm, setTForm] = useState({
    productId:'', fromWarehouseId:'', fromLocation:'',
    toWarehouseId:'', toLocation:'', quantity:1, notes:''
  });
  const [aForm, setAForm] = useState({
    productId:'', warehouseId:'', location:'', countedQty:0, notes:''
  });

  // ── Location helpers ──────────────────────────────────────────────────────
  const fromWarehouse = warehouses.find(w => w._id === tForm.fromWarehouseId);
  const toWarehouse   = warehouses.find(w => w._id === tForm.toWarehouseId);
  const adjWarehouse  = warehouses.find(w => w._id === aForm.warehouseId);

  const fromLocations = fromWarehouse?.locations || [];
  const toLocations   = toWarehouse?.locations   || [];
  const adjLocations  = adjWarehouse?.locations  || [];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.moveType = filterType;
      if (filterWarehouse) params.warehouse = filterWarehouse;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const [mRes, wRes, pRes] = await Promise.all([
        api.get('/moves', { params }),
        api.get('/warehouses'),
        api.get('/products'),
      ]);
      setMoves(mRes.data.moves);
      setTotal(mRes.data.total);
      setWarehouses(wRes.data.warehouses);
      setProducts(pRes.data.products);
    } catch { toast.error('Failed to load move history'); }
    finally { setLoading(false); }
  }, [filterType, filterWarehouse, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const handleTransfer = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await api.post('/moves/transfer', tForm);
      toast.success(data.message);
      setShowTransferModal(false);
      setTForm({ productId:'', fromWarehouseId:'', fromLocation:'', toWarehouseId:'', toLocation:'', quantity:1, notes:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Transfer failed'); }
    finally { setSaving(false); }
  };

  const handleAdjust = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await api.post('/moves/adjust', aForm);
      toast.success(data.message);
      setShowAdjustModal(false);
      setAForm({ productId:'', warehouseId:'', location:'', countedQty:0, notes:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Adjustment failed'); }
    finally { setSaving(false); }
  };

  const rowStyle = (moveType) => {
    if (moveType === 'receipt') return { background: '#F0FDF4' };
    if (moveType === 'delivery') return { background: '#FEF2F2' };
    return {};
  };

  const getContact = (m) => m.vendor || m.customer || '—';
  const statusLabel = (m) => m.status || 'Done';

  const kanbanGroups = MOVE_TYPES.map(t => ({
    type: t,
    items: moves.filter(m => m.moveType === t),
    color: { receipt:'#16A34A', delivery:'#DC2626', transfer:'#0891B2', adjustment:'#D97706' }[t],
    bg:    { receipt:'#F0FDF4', delivery:'#FEF2F2', transfer:'#ECFEFF', adjustment:'#FFFBEB' }[t],
  }));

  // ── Reusable location field ───────────────────────────────────────────────
  const LocationField = ({ label, locations, value, onChange, disabled, placeholder }) => (
    <div className="form-group">
      <label className="form-label">
        {label}
        {locations.length === 0 && value !== undefined && !disabled && (
          <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:400, marginLeft:6 }}>(free text)</span>
        )}
      </label>
      {locations.length > 0 ? (
        <select className="form-input form-select" value={value} onChange={onChange} disabled={disabled}>
          <option value="">Select location</option>
          {locations.map(loc => (
            <option key={loc._id} value={loc.name}>{loc.name} ({loc.shortCode})</option>
          ))}
        </select>
      ) : (
        <input
          className="form-input"
          value={value}
          onChange={onChange}
          placeholder={disabled ? 'Select warehouse first' : placeholder}
          disabled={disabled}
        />
      )}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Move History</h1>
          <p className="page-subtitle">{total} total stock movements</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-secondary" onClick={() => setShowTransferModal(true)}>⇄ Transfer</button>
          <button className="btn btn-secondary" onClick={() => setShowAdjustModal(true)}>⊕ Adjust Stock</button>
        </div>
      </div>

      <div className="filters-bar">
        <select className="form-input form-select" style={{width:150}} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {MOVE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
        </select>
        <select className="form-input form-select" style={{width:180}} value={filterWarehouse} onChange={e => setFilterWarehouse(e.target.value)}>
          <option value="">All Warehouses</option>
          {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>
        <div style={{display:'flex', alignItems:'center', gap:6}}>
          <span style={{fontSize:12, color:'var(--text-muted)'}}>From</span>
          <input className="form-input" type="date" style={{width:140}} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div style={{display:'flex', alignItems:'center', gap:6}}>
          <span style={{fontSize:12, color:'var(--text-muted)'}}>To</span>
          <input className="form-input" type="date" style={{width:140}} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        {(filterType || filterWarehouse || dateFrom || dateTo) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setFilterType(''); setFilterWarehouse(''); setDateFrom(''); setDateTo(''); }}>Clear</button>
        )}
        <div style={{display:'flex', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', overflow:'hidden', marginLeft:'auto'}}>
          <button onClick={() => setViewMode('list')} title="List view"
            style={{padding:'7px 12px', background: viewMode==='list' ? 'var(--text-primary)' : 'var(--surface)', color: viewMode==='list' ? 'white' : 'var(--text-secondary)', border:'none', cursor:'pointer', fontSize:14}}>☰</button>
          <button onClick={() => setViewMode('kanban')} title="Kanban view"
            style={{padding:'7px 12px', background: viewMode==='kanban' ? 'var(--text-primary)' : 'var(--surface)', color: viewMode==='kanban' ? 'white' : 'var(--text-secondary)', border:'none', borderLeft:'1px solid var(--border)', cursor:'pointer', fontSize:14}}>⊞</button>
        </div>
      </div>

      <div style={{display:'flex', gap:16, marginBottom:14}}>
        <div style={{display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'var(--text-secondary)'}}>
          <div style={{width:12, height:12, borderRadius:3, background:'#bbf7d0'}}></div> Inbound (receipt)
        </div>
        <div style={{display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'var(--text-secondary)'}}>
          <div style={{width:12, height:12, borderRadius:3, background:'#fecaca'}}></div> Outbound (delivery)
        </div>
        <div style={{display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'var(--text-secondary)'}}>
          <div style={{width:12, height:12, borderRadius:3, background:'var(--surface-2)', border:'1px solid var(--border)'}}></div> Transfer / Adjustment
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner"></div></div>
      ) : moves.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">⇄</div><p>No moves found.</p></div>
      ) : viewMode === 'list' ? (
        <div className="card" style={{padding:0}}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference</th><th>Date</th><th>Contact</th><th>From</th><th>To</th><th>Quantity</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {moves.map(m => (
                  <tr key={m._id} style={rowStyle(m.moveType)}>
                    <td>
                      <div style={{fontFamily:'monospace', fontSize:12.5, fontWeight:700, color: m.moveType==='receipt' ? 'var(--success)' : m.moveType==='delivery' ? 'var(--danger)' : 'var(--accent)'}}>
                        {m.reference || '—'}
                      </div>
                      <div style={{fontSize:11, color:'var(--text-muted)', marginTop:2, textTransform:'capitalize'}}>{m.moveType}</div>
                    </td>
                    <td style={{fontSize:13, color:'var(--text-secondary)', whiteSpace:'nowrap'}}>{formatDate(m.createdAt)}</td>
                    <td style={{fontSize:13}}>
                      <div style={{fontWeight:450}}>{getContact(m)}</div>
                      <div style={{fontSize:11.5, color:'var(--text-muted)'}}>{m.product?.name}</div>
                    </td>
                    <td style={{color:'var(--text-secondary)', fontSize:13}}>
                      {m.fromWarehouse
                        ? <>{m.fromWarehouse.name}{m.fromLocation && <span style={{color:'var(--text-muted)'}}> / {m.fromLocation}</span>}</>
                        : m.vendor ? <em style={{color:'var(--text-muted)'}}>{m.vendor}</em> : '—'}
                    </td>
                    <td style={{color:'var(--text-secondary)', fontSize:13}}>
                      {m.toWarehouse
                        ? <>{m.toWarehouse.name}{m.toLocation && <span style={{color:'var(--text-muted)'}}> / {m.toLocation}</span>}</>
                        : m.customer ? <em style={{color:'var(--text-muted)'}}>{m.customer}</em> : '—'}
                    </td>
                    <td>
                      <span style={{fontWeight:700, color: m.moveType==='receipt' ? 'var(--success)' : m.moveType==='delivery' ? 'var(--danger)' : 'var(--text-primary)'}}>
                        {m.moveType==='receipt' ? '+' : m.moveType==='delivery' ? '-' : ''}{m.quantity}
                      </span>
                      <span style={{fontSize:12, color:'var(--text-muted)', marginLeft:4}}>{m.uom}</span>
                    </td>
                    <td>
                      <span style={{display:'inline-flex', alignItems:'center', padding:'3px 9px', borderRadius:99, fontSize:11.5, fontWeight:500,
                        background: m.status==='Done' ? '#F0FDF4' : m.status==='Cancelled' ? '#FEF2F2' : '#F0EEE9',
                        color: m.status==='Done' ? 'var(--success)' : m.status==='Cancelled' ? 'var(--danger)' : 'var(--text-muted)'}}>
                        {statusLabel(m)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, alignItems:'start'}}>
          {kanbanGroups.map(group => (
            <div key={group.type}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, padding:'6px 10px', background: group.bg, borderRadius:'var(--radius-sm)', border:`1px solid ${group.color}22`}}>
                <span style={{fontSize:12, fontWeight:700, color: group.color, textTransform:'uppercase', letterSpacing:'0.5px'}}>{group.type}</span>
                <span style={{fontSize:12, fontWeight:600, color: group.color, background:'white', borderRadius:99, padding:'1px 7px', border:`1px solid ${group.color}44`}}>{group.items.length}</span>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                {group.items.length === 0 ? (
                  <div style={{textAlign:'center', padding:'20px 10px', color:'var(--text-muted)', fontSize:12, border:'1px dashed var(--border)', borderRadius:'var(--radius-sm)'}}>Empty</div>
                ) : group.items.map(m => (
                  <div key={m._id} style={{background:'var(--surface)', border:`1px solid ${group.color}33`, borderLeft:`3px solid ${group.color}`, borderRadius:'var(--radius)', padding:'12px 14px'}}>
                    <div style={{fontFamily:'monospace', fontSize:12, fontWeight:700, color: group.color, marginBottom:5}}>{m.reference || '—'}</div>
                    <div style={{fontWeight:500, fontSize:13, marginBottom:3}}>{m.product?.name}</div>
                    <div style={{fontSize:12, color:'var(--text-muted)', marginBottom:6}}>{getContact(m)}</div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{fontSize:12, color:'var(--text-secondary)'}}>{formatDate(m.createdAt)}</span>
                      <span style={{fontWeight:700, fontSize:13, color: group.color}}>
                        {m.moveType==='receipt' ? '+' : m.moveType==='delivery' ? '-' : ''}{m.quantity} {m.uom}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Transfer Modal ── */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowTransferModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Internal Transfer</span>
              <button className="modal-close" onClick={() => setShowTransferModal(false)}>✕</button>
            </div>
            <p style={{fontSize:13, color:'var(--text-secondary)', marginBottom:18}}>Move stock between warehouses or locations. Stock total stays the same.</p>
            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <label className="form-label">Product *</label>
                <select className="form-input form-select" value={tForm.productId} onChange={e => setTForm(p=>({...p,productId:e.target.value}))} required>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.totalStock} {p.uom})</option>)}
                </select>
              </div>

              <div className="grid-2">
                {/* From Warehouse */}
                <div className="form-group">
                  <label className="form-label">From Warehouse *</label>
                  <select className="form-input form-select" value={tForm.fromWarehouseId}
                    onChange={e => setTForm(p=>({...p, fromWarehouseId:e.target.value, fromLocation:''}))} required>
                    <option value="">Select</option>
                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
                {/* To Warehouse */}
                <div className="form-group">
                  <label className="form-label">To Warehouse *</label>
                  <select className="form-input form-select" value={tForm.toWarehouseId}
                    onChange={e => setTForm(p=>({...p, toWarehouseId:e.target.value, toLocation:''}))} required>
                    <option value="">Select</option>
                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                {/* From Location — dropdown if available */}
                <LocationField
                  label="From Location"
                  locations={fromLocations}
                  value={tForm.fromLocation}
                  onChange={e => setTForm(p=>({...p, fromLocation:e.target.value}))}
                  disabled={!tForm.fromWarehouseId}
                  placeholder="e.g. Rack A"
                />
                {/* To Location — dropdown if available */}
                <LocationField
                  label="To Location"
                  locations={toLocations}
                  value={tForm.toLocation}
                  onChange={e => setTForm(p=>({...p, toLocation:e.target.value}))}
                  disabled={!tForm.toWarehouseId}
                  placeholder="e.g. Zone 1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input className="form-input" type="number" min="1" value={tForm.quantity} onChange={e => setTForm(p=>({...p,quantity:e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={tForm.notes} onChange={e => setTForm(p=>({...p,notes:e.target.value}))} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Processing…' : 'Confirm Transfer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Adjust Modal ── */}
      {showAdjustModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdjustModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Stock Adjustment</span>
              <button className="modal-close" onClick={() => setShowAdjustModal(false)}>✕</button>
            </div>
            <p style={{fontSize:13, color:'var(--text-secondary)', marginBottom:18}}>Fix discrepancies between recorded and physical stock counts.</p>
            <form onSubmit={handleAdjust}>
              <div className="form-group">
                <label className="form-label">Product *</label>
                <select className="form-input form-select" value={aForm.productId} onChange={e => setAForm(p=>({...p,productId:e.target.value}))} required>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name} (Current: {p.totalStock} {p.uom})</option>)}
                </select>
              </div>
              <div className="grid-2">
                {/* Warehouse */}
                <div className="form-group">
                  <label className="form-label">Warehouse *</label>
                  <select className="form-input form-select" value={aForm.warehouseId}
                    onChange={e => setAForm(p=>({...p, warehouseId:e.target.value, location:''}))} required>
                    <option value="">Select</option>
                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
                {/* Location — dropdown if available */}
                <LocationField
                  label="Location"
                  locations={adjLocations}
                  value={aForm.location}
                  onChange={e => setAForm(p=>({...p, location:e.target.value}))}
                  disabled={!aForm.warehouseId}
                  placeholder="e.g. Rack A"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Actual Counted Quantity *</label>
                <input className="form-input" type="number" min="0" value={aForm.countedQty} onChange={e => setAForm(p=>({...p,countedQty:e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Reason / Notes</label>
                <textarea className="form-input" rows={2} value={aForm.notes} onChange={e => setAForm(p=>({...p,notes:e.target.value}))} placeholder="e.g. Damaged goods, miscounting…" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adjusting…' : 'Apply Adjustment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}