import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { FiMessageCircle, FiBriefcase } from 'react-icons/fi';

import { Assistant } from './pages/Assistant';

function Sidebar() {
  const location = useLocation();
  const isAssistant = location.pathname === '/';

  const menuItems = [
    { label: 'Assistant', path: '/', icon: <FiMessageCircle size={20} />, isExternal: false },
    { label: 'Recruitment', path: '/recruitment', icon: <FiBriefcase size={20} />, isExternal: true },
  ];

  return (
    <aside style={{
      width: 240,
      height: '100vh',
      background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ padding: '0 20px', marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '0.5px' }}>SOAI</h1>
        <p style={{ fontSize: 12, opacity: 0.8, margin: '4px 0 0 0' }}>AI Assistant Platform</p>
      </div>
      
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
        {menuItems.map((item) => {
          const isActive = item.isExternal ? false : isAssistant;
          const baseStyle = {
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            borderRadius: 8,
            textDecoration: 'none',
            color: '#fff',
            background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
            transition: 'all 0.2s ease',
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer',
          };

          const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
            if (!isActive) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }
          };

          const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
            if (!isActive) {
              e.currentTarget.style.background = 'transparent';
            }
          };

          if (item.isExternal) {
            return (
              <a
                key={item.label}
                href={item.path}
                style={baseStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.path}
              style={baseStyle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function AppShell() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f9fafb' }}>
          <Routes>
            <Route path="/" element={<Assistant />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(<AppShell />);
