import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const LOC_TYPES = ['rack','shelf','floor','zone','other'];
const EMPTY_FORM = { name:'', shortCode:'', address:'', locations:[] };

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [addLocModal, setAddLocModal] = useState(null);
  const [locForm, setLocForm] = useState({ name:'', shortCode:'', locationType:'zone' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/warehouses');
      setWarehouses(data.warehouses);
    } catch { toast.error('Failed to load warehouses'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (w) => {
    setEditing(w);
    setForm({ name: w.name, shortCode: w.shortCode, address: w.address || '', locations: w.locations || [] });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) {
        await api.put(`/warehouses/${editing._id}`, { name: form.name, address: form.address });
        toast.success('Warehouse updated');
      } else {
        await api.post('/warehouses', form);
        toast.success('Warehouse created');
      }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this warehouse?')) return;
    try { await api.delete(`/warehouses/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post(`/warehouses/${addLocModal}/locations`, locForm);
      toast.success('Location added');
      setAddLocModal(null);
      setLocForm({ name:'', shortCode:'', locationType:'zone' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Warehouses</h1>
          <p className="page-subtitle">{warehouses.length} warehouse{warehouses.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Warehouse</button>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner"></div></div>
      ) : warehouses.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">⬜</div><p>No warehouses yet. Add your first one.</p></div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          {warehouses.map(w => (
            <div key={w._id} className="card" style={{padding:0}}>
              {/* Warehouse Header */}
              <div style={{padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer'}} onClick={() => setExpandedId(expandedId === w._id ? null : w._id)}>
                <div style={{display:'flex', alignItems:'center', gap:14}}>
                  <div style={{width:40, height:40, background:'var(--accent-light)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:700, fontSize:13, color:'var(--accent)'}}>
                    {w.shortCode}
                  </div>
                  <div>
                    <div style={{fontWeight:600, fontSize:15}}>{w.name}</div>
                    <div style={{fontSize:12.5, color:'var(--text-muted)', marginTop:1}}>{w.address || 'No address'}</div>
                  </div>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <span className="chip">{w.locations?.length || 0} location{w.locations?.length !== 1 ? 's' : ''}</span>
                  <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); openEdit(w); }}>Edit</button>
                  <button className="btn btn-secondary btn-sm" style={{color:'var(--danger)'}} onClick={e => { e.stopPropagation(); handleDelete(w._id); }}>Delete</button>
                  <span style={{color:'var(--text-muted)', fontSize:14, marginLeft:4}}>{expandedId === w._id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Locations */}
              {expandedId === w._id && (
                <div style={{borderTop:'1px solid var(--border)', padding:'16px 20px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                    <span style={{fontSize:12.5, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Locations</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => setAddLocModal(w._id)}>+ Add Location</button>
                  </div>
                  {!w.locations || w.locations.length === 0 ? (
                    <p style={{fontSize:13, color:'var(--text-muted)', textAlign:'center', padding:'16px 0'}}>No locations defined. Add one to track stock by location.</p>
                  ) : (
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10}}>
                      {w.locations.map(loc => (
                        <div key={loc._id} style={{padding:'12px 14px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)'}}>
                          <div style={{fontWeight:500, fontSize:13.5}}>{loc.name}</div>
                          <div style={{display:'flex', gap:6, marginTop:5, alignItems:'center'}}>
                            <span className="chip" style={{fontSize:11}}>{loc.shortCode}</span>
                            <span style={{fontSize:11, color:'var(--text-muted)', textTransform:'capitalize'}}>{loc.locationType}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Warehouse Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Warehouse' : 'New Warehouse'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Warehouse Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} required placeholder="e.g. Main Warehouse" />
              </div>
              {!editing && (
                <div className="form-group">
                  <label className="form-label">Short Code *</label>
                  <input className="form-input" value={form.shortCode} onChange={e => setForm(p=>({...p,shortCode:e.target.value.toUpperCase()}))} required placeholder="e.g. MAIN" maxLength={6} />
                  <span style={{fontSize:11.5, color:'var(--text-muted)', marginTop:4, display:'block'}}>2-6 uppercase letters. Cannot be changed later.</span>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-input" rows={2} value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} placeholder="Full warehouse address" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Warehouse'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {addLocModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAddLocModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Add Location</span>
              <button className="modal-close" onClick={() => setAddLocModal(null)}>✕</button>
            </div>
            <form onSubmit={handleAddLocation}>
              <div className="form-group">
                <label className="form-label">Location Name *</label>
                <input className="form-input" value={locForm.name} onChange={e => setLocForm(p=>({...p,name:e.target.value}))} required placeholder="e.g. Rack A, Shelf 2" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Short Code *</label>
                  <input className="form-input" value={locForm.shortCode} onChange={e => setLocForm(p=>({...p,shortCode:e.target.value.toUpperCase()}))} required placeholder="e.g. RACK-A" />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input form-select" value={locForm.locationType} onChange={e => setLocForm(p=>({...p,locationType:e.target.value}))}>
                    {LOC_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAddLocModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding…' : 'Add Location'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
