import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PRIVATE_ADMIN_ROUTE } from '../../shared/constants/routes';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/chatboxes/chatPopup.module.scss';
import BotAI from '../../assets/images/ai.avif';
import Chatbox from './ChatBox';

const cx = classNames.bind(styles);

const ChatPopup = () => {
    const [openChat, setOpenChat] = useState<boolean>(false);

    return openChat ? (
        <div className={cx('chat-frame')}>
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
        <button className={cx('chat-popup-btn')} onClick={() => setOpenChat(true)}>
            <img src={BotAI} alt="AI" className={cx('chat-popup-btn__img')} />
        </button>
    );
};

export default ChatPopup;
