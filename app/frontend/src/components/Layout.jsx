import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Layout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">Textile Cone Inspector</div>
        <div className="nav-links">
          <Link to="/inspection">Inspection</Link>
          <Link to="/audit">Reports</Link>
          {user?.role === 'admin' && <Link to="/references">References</Link>}
        </div>
        <div className="nav-user">
          <span>{user?.username} ({user?.role})</span>
          <button onClick={logout}>Logout</button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
