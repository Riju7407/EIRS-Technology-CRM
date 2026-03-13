import React from 'react';

const Spinner = ({ text = 'Loading...' }) => (
  <div className="spinner-wrapper">
    <div style={{ textAlign: 'center' }}>
      <div className="spinner" />
      {text && <p style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: 13 }}>{text}</p>}
    </div>
  </div>
);

export default Spinner;
