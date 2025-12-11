import React, { useEffect, useRef, useState } from 'react';
import { FaArrowUp } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { pushMessage } from '../../services/redux/chatSlices/chatSlice';
import type { RootState } from '../../services/redux/store';
import ChatBubble from './ChatBubble';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/chatBoxes/chatBox.module.scss';

const cx = classNames.bind(styles);

const ChatBox = () => {
    const [typo, setTypo] = useState<string>('');
    const messages = useSelector((state: RootState) => state.chat);
    const dispatch = useDispatch();

    const chatRef = useRef<HTMLDivElement>(null);

    const handleTransferMessage = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        // TODO: Call API to prompt AI
        dispatch(pushMessage({ role: 'USER', content: typo }));
        setTypo('');
    };

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className={cx('chat-frame')}>
            <div ref={chatRef} className={cx('chat-body')}>
                {messages.map((message, index) => (
                    <ChatBubble key={index} role={message.role} content={message.content} />
                ))}
            </div>
            <form className={cx('chat-footer')} onSubmit={handleTransferMessage}>
                <input
                    id="user-typo"
                    value={typo}
                    onChange={(e) => setTypo(e.target.value)}
                    placeholder="Ask anything"
                    className={cx('chat-footer__input')}
                    autoComplete="off"
                    required
                />
                <button type="submit" className={cx('chat-footer__submit-btn', { 'chat-footer__submit-btn--disabled': !typo })} disabled={!typo}>
                    <FaArrowUp />
                </button>
            </form>
        </div>
    );
};

export default ChatBox;
