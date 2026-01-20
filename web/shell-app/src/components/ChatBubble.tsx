import React from 'react';
import { CHAT_ROLE } from '../shared/types/chatTypes';

export default function ChatBubble({ role, content }: { role: CHAT_ROLE; content: string }) {
  const isUser = role === CHAT_ROLE.USER;
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', margin: '12px 0' }}>
      <div
        style={{
          maxWidth: '75%',
          padding: '12px 16px',
          borderRadius: 16,
          background: isUser ? '#3b82f6' : '#f3f4f6',
          color: isUser ? '#fff' : '#1f2937',
          whiteSpace: 'pre-wrap',
          fontSize: 14,
          lineHeight: 1.6,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
      >
        {content}
      </div>
    </div>
  );
}
