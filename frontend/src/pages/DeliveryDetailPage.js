import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { formatDate, formatDateTime } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PIPELINE = ['Draft', 'Waiting', 'Ready', 'Done'];
const PIPELINE_LABELS = { Draft: 'Draft', Waiting: 'Waiting', Ready: 'Ready', Done: 'Delivered' };

function StatusPipeline({ current }) {
  const idx = PIPELINE.indexOf(current);
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {PIPELINE.map((s, i) => {
        const isActive = i === idx;
        const isDone   = i < idx;
        return (
          <div key={s} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 18px',
            background: isActive ? 'var(--text-primary)' : isDone ? 'var(--success-light)' : 'var(--surface-2)',
            color: isActive ? 'white' : isDone ? 'var(--success)' : 'var(--text-muted)',
            fontWeight: isActive ? 600 : 450, fontSize: 13,
            borderRadius: i === 0 ? '99px 0 0 99px' : i === PIPELINE.length - 1 ? '0 99px 99px 0' : 0,
            border: '1px solid',
            borderColor: isActive ? 'var(--text-primary)' : isDone ? 'var(--success)' : 'var(--border)',
            borderRight: i < PIPELINE.length - 1 ? 'none' : undefined,
            transition: 'all 0.2s',
          }}>
            {isDone && <span style={{ fontSize: 11 }}>✓</span>}
            {PIPELINE_LABELS[s]}
          </div>
        );
      })}
    </div>
  );
}

export default function DeliveryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';  // ← RBAC check

  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [doneQtys, setDoneQtys] = useState({});

  const load = async () => {
    try {
      const { data } = await api.get(`/deliveries/${id}`);
      setDelivery(data.delivery);
      const qtys = {};
      data.delivery.lines.forEach((l, i) => { qtys[i] = l.doneQty || l.demandQty; });
      setDoneQtys(qtys);
    } catch {
      toast.error('Could not load delivery');
      navigate('/deliveries');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleMarkWaiting = async () => {
    setActing(true);
    try {
      await api.put(`/deliveries/${id}`, { status: 'Waiting' });
      toast.success('Marked as Waiting');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setActing(false); }
  };

  const handleMarkReady = async () => {
    setActing(true);
    try {
      await api.put(`/deliveries/${id}`, { status: 'Ready' });
      toast.success('Marked as Ready');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setActing(false); }
  };

  const handleValidate = async () => {
    const outOfStock = delivery.lines.filter((l, i) =>
      (l.product?.totalStock ?? 0) < Number(doneQtys[i] ?? l.demandQty)
    );
    if (outOfStock.length > 0) {
      const names = outOfStock.map(l => l.product?.name).join(', ');
      if (!window.confirm(`Warning: ${names} may have insufficient stock. Validate anyway?`)) return;
    } else {
      if (!window.confirm('Validate this delivery? Stock will be decreased.')) return;
    }
    setActing(true);
    try {
      const updatedLines = delivery.lines.map((l, i) => ({
        ...l, doneQty: Number(doneQtys[i] ?? l.demandQty)
      }));
      await api.put(`/deliveries/${id}`, { lines: updatedLines });
      await api.post(`/deliveries/${id}/validate`);
      toast.success('Delivery validated! Stock updated.');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Validation failed'); }
    finally { setActing(false); }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this delivery?')) return;
    try {
      await api.delete(`/deliveries/${id}`);
      toast.success('Cancelled');
      navigate('/deliveries');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('delivery-print-area');
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>${delivery.reference}</title>
      <style>
        body { font-family: sans-serif; padding: 40px; color: #1A1916; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { text-align: left; font-size: 11px; text-transform: uppercase; color: #9B9890; padding: 8px 12px; border-bottom: 2px solid #E4E1D9; }
        td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #E4E1D9; }
        .footer { margin-top: 40px; font-size: 12px; color: #9B9890; border-top: 1px solid #E4E1D9; padding-top: 12px; }
      </style></head><body>
      <h1>Delivery Order</h1>
      ${printContent.innerHTML}
      <div class="footer">Printed on ${new Date().toLocaleString('en-IN')} · CoreInventory</div>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;
  if (!delivery) return null;

  const isDone      = delivery.status === 'Done';
  const isReady     = delivery.status === 'Ready';
  const isWaiting   = delivery.status === 'Waiting';
  const isDraft     = delivery.status === 'Draft';
  const isCancelled = delivery.status === 'Cancelled';

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Link to="/deliveries" className="btn btn-secondary btn-sm">← Back to Deliveries</Link>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>Delivery</h1>
              {isCancelled && <span className="status-badge status-cancelled">Cancelled</span>}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>{delivery.reference}</div>
          </div>
          {!isCancelled && <StatusPipeline current={delivery.status} />}
        </div>

        {/* Action buttons — admin only for validate & cancel */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {isAdmin && !isCancelled && (
            <>
              {isDraft && (
                <button className="btn btn-primary" onClick={handleMarkWaiting} disabled={acting}>
                  {acting ? 'Processing…' : '✓ Validate'}
                </button>
              )}
              {isWaiting && (
                <button className="btn btn-primary" onClick={handleMarkReady} disabled={acting}>
                  {acting ? 'Processing…' : '✓ Validate'}
                </button>
              )}
              {isReady && (
                <button className="btn btn-success" onClick={handleValidate} disabled={acting}>
                  {acting ? 'Validating…' : '✓ Validate'}
                </button>
              )}
              {!isDone && (
                <button className="btn btn-secondary" style={{ color: 'var(--danger)' }} onClick={handleCancel}>
                  ✕ Cancel
                </button>
              )}
            </>
          )}
          {isDone && (
            <button className="btn btn-secondary" onClick={handlePrint}>🖨 Print</button>
          )}
          {/* Read-only notice for non-admins */}
          {!isAdmin && !isCancelled && !isDone && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              🔒 Only admins can validate or cancel deliveries
            </span>
          )}
        </div>
      </div>

      <div id="delivery-print-area">
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Delivery Address</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{delivery.customer}</div>
              {delivery.deliveryAddress && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{delivery.deliveryAddress}</div>}
              {delivery.contact && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{delivery.contact}</div>}
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Schedule Date</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{formatDate(delivery.scheduledDate)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Responsible</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{delivery.createdBy?.name || user?.name}</div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Operation Type</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{delivery.operationType || 'Outgoing'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Source</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>
                {delivery.warehouse?.name}
                {delivery.location && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> / {delivery.location}</span>}
              </div>
            </div>
            {isDone && (
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Validated By</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--success)' }}>✓ {delivery.validatedBy?.name} · {formatDateTime(delivery.validatedAt)}</div>
              </div>
            )}
          </div>
          {delivery.notes && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{delivery.notes}</div>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Products</span>
            {!isDone && !isCancelled && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Red rows</span> = insufficient stock
              </span>
            )}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th><th>SKU</th><th>UoM</th><th>Demand Qty</th>
                  <th>{isDone ? 'Delivered Qty' : 'Done Qty'}</th>
                  {!isDone && !isCancelled && <th>Available Stock</th>}
                </tr>
              </thead>
              <tbody>
                {delivery.lines.map((line, i) => {
                  const available = line.product?.totalStock ?? 0;
                  const needed = Number(doneQtys[i] ?? line.demandQty);
                  const isShort = !isDone && !isCancelled && available < needed;
                  return (
                    <tr key={i} style={{ background: isShort ? '#FEF2F2' : undefined }}>
                      <td>
                        <div style={{ fontWeight: 500, color: isShort ? 'var(--danger)' : undefined }}>{line.product?.name}</div>
                        {isShort && <div style={{ fontSize: 11.5, color: 'var(--danger)', marginTop: 2 }}>⚠ Insufficient stock</div>}
                      </td>
                      <td><span className="chip" style={{ background: isShort ? '#FEE2E2' : undefined }}>{line.product?.sku}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{line.uom}</td>
                      <td style={{ fontWeight: 600 }}>{line.demandQty}</td>
                      <td>
                        {isDone || isCancelled ? (
                          <span style={{ fontWeight: 600, color: 'var(--success)' }}>{line.doneQty}</span>
                        ) : isAdmin ? (
                          // Admins can edit qty
                          <input
                            className="form-input"
                            type="number" min="0"
                            style={{ width: 90, borderColor: isShort ? 'var(--danger)' : undefined }}
                            value={doneQtys[i] ?? line.demandQty}
                            onChange={e => setDoneQtys(prev => ({ ...prev, [i]: e.target.value }))}
                          />
                        ) : (
                          // Non-admins see read-only qty
                          <span style={{ fontWeight: 600 }}>{doneQtys[i] ?? line.demandQty}</span>
                        )}
                      </td>
                      {!isDone && !isCancelled && (
                        <td>
                          <span style={{ fontWeight: 600, color: isShort ? 'var(--danger)' : 'var(--success)' }}>
                            {available} {line.uom}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {!isDone && !isCancelled && (
                  <tr>
                    <td colSpan={6} style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                      + Add New Product — create new delivery to add more lines
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}