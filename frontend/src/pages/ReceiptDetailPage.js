import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { formatDate, formatDateTime } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PIPELINE = ['Draft', 'Ready', 'Done'];

function StatusPipeline({ current }) {
  const idx = PIPELINE.indexOf(current);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {PIPELINE.map((s, i) => {
        const isActive = i === idx;
        const isDone   = i < idx;
        return (
          <React.Fragment key={s}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 18px',
              background: isActive ? 'var(--text-primary)' : isDone ? 'var(--success-light)' : 'var(--surface-2)',
              color:  isActive ? 'white' : isDone ? 'var(--success)' : 'var(--text-muted)',
              fontWeight: isActive ? 600 : 450,
              fontSize: 13,
              borderRadius: i === 0 ? '99px 0 0 99px' : i === PIPELINE.length - 1 ? '0 99px 99px 0' : 0,
              border: '1px solid',
              borderColor: isActive ? 'var(--text-primary)' : isDone ? 'var(--success)' : 'var(--border)',
              borderRight: i < PIPELINE.length - 1 ? 'none' : undefined,
              transition: 'all 0.2s',
            }}>
              {isDone && <span style={{ fontSize: 11 }}>✓</span>}
              {s === 'Draft' ? 'Draft' : s === 'Ready' ? 'Ready to Receive' : 'Received'}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function ReceiptDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';  // ← RBAC check

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [editQtys, setEditQtys] = useState({});

  const load = async () => {
    try {
      const { data } = await api.get(`/receipts/${id}`);
      setReceipt(data.receipt);
      const qtys = {};
      data.receipt.lines.forEach((l, i) => { qtys[i] = l.receivedQty || l.expectedQty; });
      setEditQtys(qtys);
    } catch {
      toast.error('Could not load receipt');
      navigate('/receipts');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleMarkReady = async () => {
    setActing(true);
    try {
      await api.put(`/receipts/${id}`, { status: 'Ready' });
      toast.success('Marked as Ready to Receive');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setActing(false); }
  };

  const handleValidate = async () => {
    if (!window.confirm('Validate this receipt? Stock will be increased.')) return;
    setActing(true);
    try {
      const updatedLines = receipt.lines.map((l, i) => ({
        ...l, receivedQty: Number(editQtys[i] ?? l.expectedQty)
      }));
      await api.put(`/receipts/${id}`, { lines: updatedLines });
      await api.post(`/receipts/${id}/validate`);
      toast.success('Receipt validated! Stock updated.');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Validation failed'); }
    finally { setActing(false); }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this receipt?')) return;
    try {
      await api.delete(`/receipts/${id}`);
      toast.success('Cancelled');
      navigate('/receipts');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-print-area');
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>${receipt.reference}</title>
      <style>
        body { font-family: 'DM Sans', sans-serif; padding: 40px; color: #1A1916; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .meta { color: #6B6860; font-size: 13px; margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .field label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9B9890; display: block; margin-bottom: 3px; }
        .field span { font-size: 14px; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { text-align: left; font-size: 11px; text-transform: uppercase; color: #9B9890; padding: 8px 12px; border-bottom: 2px solid #E4E1D9; }
        td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #E4E1D9; }
        .footer { margin-top: 40px; font-size: 12px; color: #9B9890; border-top: 1px solid #E4E1D9; padding-top: 12px; }
      </style></head><body>
      ${printContent.innerHTML}
      <div class="footer">Printed on ${new Date().toLocaleString('en-IN')} · CoreInventory</div>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;
  if (!receipt) return null;

  const isDone      = receipt.status === 'Done';
  const isReady     = receipt.status === 'Ready';
  const isDraft     = receipt.status === 'Draft';
  const isCancelled = receipt.status === 'Cancelled';

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Link to="/receipts" className="btn btn-secondary btn-sm">← Back to Receipts</Link>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>Receipt</h1>
              {isCancelled && <span className="status-badge status-cancelled">Cancelled</span>}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>{receipt.reference}</div>
          </div>
          {!isCancelled && <StatusPipeline current={receipt.status} />}
        </div>

        {/* Action buttons — admin only for validate & cancel */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {isAdmin && !isCancelled && (
            <>
              {isDraft && (
                <button className="btn btn-primary" onClick={handleMarkReady} disabled={acting}>
                  {acting ? 'Processing…' : '✓ Mark as Ready'}
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
          {/* Show read-only notice to non-admins */}
          {!isAdmin && !isCancelled && !isDone && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              🔒 Only admins can validate or cancel receipts
            </span>
          )}
        </div>
      </div>

      <div id="receipt-print-area">
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Receive From</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{receipt.supplier}</div>
              {receipt.contact && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{receipt.contact}</div>}
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Schedule Date</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{formatDate(receipt.scheduledDate)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Destination</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>
                {receipt.warehouse?.name}
                {receipt.location && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> / {receipt.location}</span>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Responsible</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{receipt.createdBy?.name || user?.name}</div>
            </div>
            {isDone && (
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Validated By</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--success)' }}>✓ {receipt.validatedBy?.name} · {formatDateTime(receipt.validatedAt)}</div>
              </div>
            )}
          </div>
          {receipt.notes && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{receipt.notes}</div>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Products</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th><th>SKU</th><th>UoM</th><th>Expected Qty</th>
                  <th>{isDone ? 'Received Qty' : 'Done Qty'}</th>
                  {!isDone && !isCancelled && <th>Current Stock</th>}
                </tr>
              </thead>
              <tbody>
                {receipt.lines.map((line, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{line.product?.name}</td>
                    <td><span className="chip">{line.product?.sku}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{line.uom}</td>
                    <td style={{ fontWeight: 600 }}>{line.expectedQty}</td>
                    <td>
                      {isDone || isCancelled ? (
                        <span style={{ fontWeight: 600, color: 'var(--success)' }}>{line.receivedQty}</span>
                      ) : isAdmin ? (
                        // Admins can edit qty
                        <input
                          className="form-input"
                          type="number" min="0"
                          style={{ width: 90 }}
                          value={editQtys[i] ?? line.expectedQty}
                          onChange={e => setEditQtys(prev => ({ ...prev, [i]: e.target.value }))}
                        />
                      ) : (
                        // Non-admins see read-only qty
                        <span style={{ fontWeight: 600 }}>{editQtys[i] ?? line.expectedQty}</span>
                      )}
                    </td>
                    {!isDone && !isCancelled && (
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{line.product?.totalStock} {line.uom}</td>
                    )}
                  </tr>
                ))}
                {!isDone && !isCancelled && (
                  <tr>
                    <td colSpan={6} style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic', padding: '10px 14px' }}>
                      + New Product — edit via list to add more lines
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