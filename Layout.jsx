import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/',            icon: '⚡', label: 'Command Center',   section: 'Overview',    dot: true },
  { to: '/vehicles',    icon: '🚛', label: 'Vehicle Registry', section: 'Operations' },
  { to: '/trips',       icon: '📦', label: 'Trip Dispatcher',  section: null },
  { to: '/maintenance', icon: '🔧', label: 'Maintenance Logs', section: null },
  { to: '/expenses',    icon: '⛽', label: 'Expense & Fuel',   section: 'Finance' },
  { to: '/drivers',     icon: '👤', label: 'Driver Profiles',  section: 'People' },
  { to: '/analytics',   icon: '📊', label: 'Analytics',        section: 'Insights' },
];

const PAGE_TITLES = {
  '/':            'Command Center',
  '/vehicles':    'Vehicle Registry',
  '/trips':       'Trip Dispatcher',
  '/maintenance': 'Maintenance & Service',
  '/expenses':    'Expense & Fuel',
  '/drivers':     'Driver Profiles',
  '/analytics':   'Analytics & Reports',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      setClock(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase() || 'U';
  const title = PAGE_TITLES[location.pathname] || 'FleetFlow';

  let sections = [];
  NAV.forEach(item => {
    if (item.section) sections.push({ type: 'section', label: item.section });
    sections.push({ type: 'item', ...item });
  });

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:99,backdropFilter:'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="s-logo">Fleet<span>Flow</span></div>
        <div className="s-user">
          <div className="s-avatar">{initials}</div>
          <div>
            <div className="s-uname">{user?.name || 'User'}</div>
            <div className="s-urole">{user?.role}</div>
          </div>
        </div>

        <div className="s-nav">
          {sections.map((s, i) =>
            s.type === 'section' ? (
              <div key={i} className="s-section">{s.label}</div>
            ) : (
              <NavLink
                key={s.to}
                to={s.to}
                end={s.to === '/'}
                className={({ isActive }) => `s-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className="s-icon">{s.icon}</div>
                {s.label}
                {s.dot && <div className="s-dot" />}
              </NavLink>
            )
          )}
        </div>

        <div className="s-footer">
          <button className="s-logout" onClick={logout}>🚪 Sign Out</button>
        </div>
      </nav>

      {/* Main */}
      <div className="main-content">
        <div className="topbar">
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <button className="hamburger" onClick={() => setSidebarOpen(s => !s)}>☰</button>
            <div className="tb-title">{title}</div>
          </div>
          <div className="tb-right">
            <div className="tb-pill">{user?.role}</div>
            <div className="tb-clock">{clock}</div>
          </div>
        </div>

        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
