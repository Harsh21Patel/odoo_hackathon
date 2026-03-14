import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const navItems = [
  { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/products', icon: '◫', label: 'Products' },
  { to: '/receipts', icon: '↓', label: 'Receipts' },
  { to: '/deliveries', icon: '↑', label: 'Deliveries' },
  { to: '/moves', icon: '⇄', label: 'Move History' },
  { to: '/warehouses', icon: '⬜', label: 'Warehouses' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo-mark">CI</span>
          {!collapsed && <span className="logo-name">CoreInventory</span>}
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar">
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            {!collapsed && (
              <div className="user-meta">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{user?.role}</span>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">⎋</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-wrapper fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
