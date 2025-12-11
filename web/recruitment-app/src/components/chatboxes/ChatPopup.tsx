import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/chatboxes/chatPopup.module.scss';
import BotAI from '../../assets/images/ai.avif';
import type { Message } from '../../shared/types/chatboxTypes';
import ChatBubble from './ChatBubble';
import { FaArrowUp } from 'react-icons/fa';

const cx = classNames.bind(styles);

const ChatPopup = () => {
    const [openChat, setOpenChat] = useState<boolean>(true);

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
        <>
            {openChat ? (
                <div className={cx('chat-frame')}>
                    <div className={cx('chat-header')}>
                        <span>AI Assistant</span>
                        <button className={cx('chat-header__close-btn')} onClick={() => setOpenChat(false)}>
                            ✕
                        </button>
                    </div>
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
            ) : (
                <button className={cx('chat-popup-btn')} onClick={() => setOpenChat(true)}>
                    <img src={BotAI} alt="AI" className={cx('chat-popup-btn__img')} />
                </button>
            )}
        </>
    );
};

export default ChatPopup;
