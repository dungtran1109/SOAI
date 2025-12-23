import { CHAT_ROLE, type SingleMgs } from '../../shared/types/chatTypes';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/chats/chatBubble.module.scss';
import UserAvatar from '../../assets/images/user.jpg';
import BotAvatar from '../../assets/images/ai.avif';
import ReactMarkdown from 'react-markdown';
import React from 'react';

const cx = classNames.bind(styles);

const ChatBubble = React.memo(({ role, content }: SingleMgs) => {
    // TODO: Showing AI messages per chunk as chatGPT
    return (
        <div className={cx('chat-row', `perform-on-role-${role.toLowerCase()}`)}>
            {role !== CHAT_ROLE.USER && <img src={BotAvatar} className={cx('chat-row__avatar')} />}

            <div className={cx('chat-row__bubble', `chat-row__bubble--${role.toLowerCase()}`)}>
                {role === CHAT_ROLE.AI ? <ReactMarkdown>{content}</ReactMarkdown> : <p>{content}</p>}
            </div>

            {role === CHAT_ROLE.USER && <img src={UserAvatar} className={cx('chat-row__avatar')} />}
        </div>
    );
});

export default ChatBubble;
