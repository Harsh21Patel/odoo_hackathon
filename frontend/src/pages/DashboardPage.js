import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatDateTime, moveTypeIcon, moveTypeColor } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state"><div className="spinner"></div> Loading dashboard…</div>;
  if (!data) return <div className="empty-state"><p>Could not load dashboard.</p></div>;

  const { kpis, recentMoves, lowStockItems, receiptStats, deliveryStats } = data;

  const statusChartData = ['Draft','Waiting','Ready','Done','Cancelled'].map(s => ({
    name: s,
    receipts: receiptStats.find(r => r._id === s)?.count || 0,
    deliveries: deliveryStats.find(r => r._id === s)?.count || 0,
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Real-time overview of your inventory operations</p>
        </div>
        <div style={{display:'flex', gap:8}}>
          <Link to="/receipts" className="btn btn-secondary btn-sm">+ New Receipt</Link>
          <Link to="/deliveries" className="btn btn-primary btn-sm">+ New Delivery</Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid-5" style={{marginBottom:24}}>
        <div className="kpi-card">
          <span className="kpi-label">Total Products</span>
          <span className="kpi-value">{kpis.totalProducts}</span>
          <span className="kpi-sub">Active SKUs</span>
        </div>
        <div className="kpi-card" style={{borderColor: kpis.lowStockProducts > 0 ? 'var(--warning)' : undefined}}>
          <span className="kpi-label">Low Stock</span>
          <span className="kpi-value" style={{color: kpis.lowStockProducts > 0 ? 'var(--warning)' : undefined}}>{kpis.lowStockProducts}</span>
          <span className="kpi-sub">Below reorder level</span>
        </div>
        <div className="kpi-card" style={{borderColor: kpis.outOfStockProducts > 0 ? 'var(--danger)' : undefined}}>
          <span className="kpi-label">Out of Stock</span>
          <span className="kpi-value" style={{color: kpis.outOfStockProducts > 0 ? 'var(--danger)' : undefined}}>{kpis.outOfStockProducts}</span>
          <span className="kpi-sub">Zero qty items</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Pending Receipts</span>
          <span className="kpi-value">{kpis.pendingReceipts}</span>
          <span className="kpi-sub">Awaiting validation</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Pending Deliveries</span>
          <span className="kpi-value">{kpis.pendingDeliveries}</span>
          <span className="kpi-sub">Awaiting dispatch</span>
        </div>
      </div>

      <div className="grid-2" style={{marginBottom:24}}>
        {/* Operations Chart */}
        <div className="card">
          <div className="card-title">Operations by Status</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusChartData} barSize={14} barGap={4}>
              <XAxis dataKey="name" tick={{fontSize:12, fill:'var(--text-muted)'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize:11, fill:'var(--text-muted)'}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{borderRadius:8, border:'1px solid var(--border)', fontSize:13}} />
              <Bar dataKey="receipts" name="Receipts" fill="var(--info)" radius={[4,4,0,0]} />
              <Bar dataKey="deliveries" name="Deliveries" fill="var(--accent)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-title" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            Low Stock Alerts
            <Link to="/products?lowStock=true" className="btn btn-secondary btn-sm">View all</Link>
          </div>
          {lowStockItems.length === 0 ? (
            <div style={{textAlign:'center', padding:'30px 0', color:'var(--success)'}}>
              <div style={{fontSize:28}}>✓</div>
              <p style={{fontSize:13, marginTop:6}}>All products are well-stocked!</p>
            </div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              {lowStockItems.map(p => (
                <div key={p._id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'var(--bg)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)'}}>
                  <div>
                    <div style={{fontWeight:500, fontSize:13.5}}>{p.name}</div>
                    <div style={{fontSize:12, color:'var(--text-muted)'}}>{p.sku}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontWeight:600, fontSize:14, color: p.totalStock === 0 ? 'var(--danger)' : 'var(--warning)'}}>
                      {p.totalStock} {p.uom}
                    </div>
                    <div style={{fontSize:11, color:'var(--text-muted)'}}>Min: {p.reorderLevel}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Moves */}
      <div className="card">
        <div className="card-title" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          Recent Stock Movements
          <Link to="/moves" className="btn btn-secondary btn-sm">View all →</Link>
        </div>
        {recentMoves.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">⇄</div><p>No stock movements yet.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th><th>Product</th><th>From</th><th>To</th><th>Qty</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentMoves.map(m => (
                  <tr key={m._id}>
                    <td>
                      <span className={`chip chip-${moveTypeColor(m.moveType)}`}>
                        {moveTypeIcon(m.moveType)} {m.moveType}
                      </span>
                    </td>
                    <td>
                      <div style={{fontWeight:500}}>{m.product?.name}</div>
                      <div style={{fontSize:12, color:'var(--text-muted)'}}>{m.product?.sku}</div>
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
                    <td style={{fontWeight:600}}>{m.quantity} {m.uom}</td>
                    <td style={{color:'var(--text-muted)', fontSize:12.5}}>{formatDateTime(m.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}