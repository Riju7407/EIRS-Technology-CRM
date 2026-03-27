import React from 'react';
import { useLocation } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/clients': 'Client Management',
  '/followups': 'Follow-Up Scheduling',
  '/interactions': 'Interaction Logs',
  '/prospects': 'Prospects Management',
  '/employees': 'Employees Management',
  '/distribution': 'Distribution Management',
  '/campaigns': 'Campaigns Management',
};

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const title = pageTitles[location.pathname] || 'EIRS CRM';

  return (
    <header className="navbar">
      <div>
        <div className="navbar-title">{title}</div>
      </div>
      <div className="navbar-right">
        <button className="btn btn-secondary btn-icon">
          <FiBell size={18} />
        </button>
        <div className="user-badge">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <span>{user?.name}</span>
          <span
            style={{
              backgroundColor: user?.role === 'admin' ? 'var(--primary)' : 'var(--success)',
              color: '#fff',
              padding: '2px 7px',
              borderRadius: 10,
              fontSize: 10,
              textTransform: 'capitalize',
            }}
          >
            {user?.role}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
