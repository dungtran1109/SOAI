import React, { useState, useEffect, useRef } from 'react';
import { Container } from '../components/layouts';
import { FaArrowUp } from 'react-icons/fa';
import classNames from 'classnames/bind';
import styles from '../assets/styles/chatboxes/chatboxPage.module.scss';
import ChatBubble from '../components/chatboxes/ChatBubble';
import AdminLayout from '../components/admins/AdminLayout';
import type { Message } from '../shared/types/chatboxTypes';

const cx = classNames.bind(styles);

const ChatboxPage = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ASSISTANT', content: 'Good day 👋 How are you doing today?' },
        { role: 'USER', content: "I'm doing well. How about you?" },
        { role: 'ASSISTANT', content: "I'm great, thank you! How can I help you?" },
        { role: 'USER', content: 'Are you AI assistant?' },
        { role: 'ASSISTANT', content: 'Yes, I am an AI assistant.' },
    ]);
    const [typo, setTypo] = useState<string>('');
    const chatRef = useRef<HTMLDivElement>(null);

    const handleTransferMessage = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        console.log(typo);
        setMessages((prevState) => [...prevState, { role: 'USER', content: typo }]);
        setTypo('');
    };

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <AdminLayout disableChatbox={true}>
            <Container className={cx('chatbox')}>
                <div ref={chatRef} className={cx('chatbox__window')}>
                    {messages.map((message, index) => (
                        <ChatBubble key={index} role={message.role} content={message.content} />
                    ))}
                </div>
                <form className={cx('chatbox__user-action')} onSubmit={handleTransferMessage}>
                    <input
                        id="user-typo"
                        value={typo}
                        onChange={(e) => setTypo(e.target.value)}
                        placeholder="Ask anything"
                        className={cx('chatbox__user-action-input')}
                        autoComplete="off"
                        required
                    />
                    <button type="submit" className={cx('chatbox__user-action-submit', { 'chatbox__user-action-submit--disabled': !typo })} disabled={!typo}>
                        <FaArrowUp />
                    </button>
                </form>
            </Container>
        </AdminLayout>
    );
};

export default ChatboxPage;
