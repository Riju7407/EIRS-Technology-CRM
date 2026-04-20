import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FiBell, FiDroplet } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/clients': 'Client Management',
  '/customer-details': 'Complete Customer Details',
  '/purchase-history': 'Purchase History Tracking',
  '/bill-quotation': 'Bill Quotation',
  '/followups': 'Follow-Up Scheduling',
  '/interactions': 'Interaction Logs',
  '/service-management': 'Service Management',
  '/employees': 'Employees Management',
  '/distribution': 'Distribution Management',
  '/campaigns': 'Campaigns Management',
  '/website-users': 'Website Users',
  '/website-orders': 'Website Orders',
  '/website-bookings': 'Website Service Bookings',
  '/website-contacts': 'Website Contact Enquiries',
};

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const title = pageTitles[location.pathname] || 'EIRS CRM';
  const [themeIntensity, setThemeIntensity] = useState('vivid');

  useEffect(() => {
    const savedTheme = localStorage.getItem('eirs-theme-intensity') || 'vivid';
    setThemeIntensity(savedTheme);
    document.documentElement.setAttribute('data-theme-intensity', savedTheme);
  }, []);

  const toggleThemeIntensity = () => {
    const nextTheme = themeIntensity === 'vivid' ? 'soft' : 'vivid';
    setThemeIntensity(nextTheme);
    localStorage.setItem('eirs-theme-intensity', nextTheme);
    document.documentElement.setAttribute('data-theme-intensity', nextTheme);
  };

  return (
    <header className="navbar">
      <div>
        <div className="navbar-title">{title}</div>
      </div>
      <div className="navbar-right">
        <button className="btn btn-secondary" onClick={toggleThemeIntensity} title="Toggle theme intensity">
          <FiDroplet size={14} />
          {themeIntensity === 'vivid' ? 'Vivid' : 'Soft'}
        </button>
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
