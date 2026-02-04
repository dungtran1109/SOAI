import React, { useEffect, useRef, useState } from 'react';
import { CHAT_WS_ENDPOINT } from '../shared/constants/baseUrls';
import { FaArrowUp } from 'react-icons/fa';
import ChatBubble from './ChatBubble';
import useChatSocket from '../services/hook/useChatSocket';

export default function ChatBox() {
  const [msg, setMsg] = useState('');
  const { messages, status, send } = useChatSocket(CHAT_WS_ENDPOINT);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('[ChatBox] Messages count:', messages.length, 'Status:', status);
  }, [messages, status]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    send(msg);
    setMsg('');
  };

  const disabled = !msg || status === 'Waiting';

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateRows: '1fr auto', 
      height: 'calc(100vh - 180px)', 
      border: '1px solid #e5e7eb', 
      borderRadius: 12,
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div ref={scrollRef} style={{ overflowY: 'auto', padding: 20 }}>
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} content={m.content} />
        ))}
        {status === 'Waiting' && <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 14 }}>Waiting...</div>}
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, padding: 16, borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="+ Ask anything"
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            borderRadius: 10, 
            border: '1px solid #d1d5db',
            fontSize: 14,
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          autoComplete="off"
          required
        />
        <button 
          type="submit" 
          disabled={disabled} 
          style={{ 
            padding: '12px 20px', 
            borderRadius: 10, 
            border: 'none', 
            background: disabled ? '#e5e7eb' : '#3b82f6',
            color: disabled ? '#9ca3af' : '#fff',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontWeight: 500
          }}
        >
          <FaArrowUp size={16} />
        </button>
      </form>
    </div>
  );
}
