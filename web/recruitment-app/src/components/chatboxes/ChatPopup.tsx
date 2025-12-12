import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PRIVATE_ADMIN_ROUTE } from '../../shared/constants/routes';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/chatboxes/chatPopup.module.scss';
import BotAI from '../../assets/images/ai.avif';
import Chatbox from './ChatBox';

const cx = classNames.bind(styles);

const ChatPopup = () => {
    const chatRef = useRef<HTMLDivElement>(null);
    const [isActive, setIsActive] = useState(false);
    const [openChat, setOpenChat] = useState<boolean>(false);

    // KeyboardEvent catch event when 'ESC' key is pressed
    useEffect(() => {
        // useEffectEvent can be used to avoid re-registering EventListener when component rerenders, but limitation of dev tool detects wrong.
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isActive) {
                setOpenChat(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isActive]);

    // MouseEvent catch event where the lastest clicking is on chatbox
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (chatRef.current?.contains(e.target as Node)) {
                setIsActive(true);
            } else {
                setIsActive(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleOpenChat = () => {
        setOpenChat(true);
        setIsActive(true);
    };

    return openChat ? (
        <div ref={chatRef} className={cx('chat-frame')}>
            <div className={cx('chat-header')}>
                <Link to={PRIVATE_ADMIN_ROUTE.aiAssistant} className={cx('chat-header__name')}>
                    Endava AI
                </Link>
                <button className={cx('chat-header__close-btn')} onClick={() => setOpenChat(false)}>
                    ✕
                </button>
            </div>
            <div className={cx('chat-body')}>
                <Chatbox />
            </div>
        </div>
    ) : (
        <button className={cx('chat-popup-btn')} onClick={handleOpenChat}>
            <img src={BotAI} alt="AI" className={cx('chat-popup-btn__img')} />
        </button>
    );
};

export default ChatPopup;
