import React from 'react';
import ChatBox from '../components/ChatBox';

export function Assistant() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8, color: '#1f2937' }}>SOAI Assistant</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Ask me anything about your recruitment process</p>
      <ChatBox />
    </div>
  );
}
