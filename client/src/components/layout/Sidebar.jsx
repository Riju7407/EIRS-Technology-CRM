import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiHome, FiUsers, FiCalendar, FiMessageSquare,
  FiBarChart2, FiSettings,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: FiHome },
  { to: '/clients', label: 'Clients', icon: FiUsers },
  { to: '/followups', label: 'Follow-Ups', icon: FiCalendar },
  { to: '/interactions', label: 'Interactions', icon: FiMessageSquare },
];

const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>EIRS CRM</h2>
        <p>Customer Relationship Management</p>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main Menu</div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 13 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', marginTop: 4 }}
          onClick={logout}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
