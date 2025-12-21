import React, { useEffect, useRef, useState } from 'react';
import { FaArrowUp } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import type { RootState } from '../../services/redux/store';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/chats/chatBox.module.scss';
import ChatBubble from './ChatBubble';
import useChatSocket from '../../services/hook/useChatSocket';

const cx = classNames.bind(styles);

const ChatBox = () => {
    const [msg, setMsg] = useState<string>('');
    const wsSendMsg = useChatSocket('ws://localhost:8005/api/v1/agent-controller/conversations/realtime');
    const chatSession = useSelector((state: RootState) => state.chatSession);
    const scrollDownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollDownRef.current) {
            scrollDownRef.current.scrollTop = scrollDownRef.current.scrollHeight;
        }
    }, [chatSession.msg]);

    const handleMessage = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        wsSendMsg(msg);
        setMsg('');
    };

    return (
        <div className={cx('chat-frame')}>
            <div ref={scrollDownRef} className={cx('chat-body')}>
                {/* TODO: Handle lazy loading instead of rendering all message */}
                {chatSession.msg.map((msg, index) => (
                    <ChatBubble key={index} role={msg.role} content={msg.content} />
                ))}
            </div>
            {chatSession.status === 'Waiting' && (
                <span className={cx('chat-pending')}>
                    Waiting
                    <span className={cx('chat-pending__dots')} />
                </span>
            )}
            <form className={cx('chat-footer')} onSubmit={handleMessage}>
                <input
                    id="user-typo"
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    placeholder="+ Ask anything"
                    className={cx('chat-footer__input')}
                    autoComplete="off"
                    required
                />
                <button
                    type="submit"
                    className={cx('chat-footer__submit-btn', { 'chat-footer__submit-btn--disabled': !msg || chatSession.status === 'Waiting' })}
                    disabled={!msg || chatSession.status === 'Waiting'}
                >
                    <FaArrowUp />
                </button>
            </form>
        </div>
    );
};

export default ChatBox;
