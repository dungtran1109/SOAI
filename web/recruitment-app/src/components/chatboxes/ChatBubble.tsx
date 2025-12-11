import type { Message } from '../../shared/types/chatboxTypes';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/chatboxes/chatBubble.module.scss';
import BotAvatar1 from '../../assets/images/ai.png';
import BotAvatar2 from '../../assets/images/ai.avif';

const cx = classNames.bind(styles);

const ChatBubble = ({ role, content }: Message) => {
    return (
        <div className={cx('chat-row', `role-${role.toLowerCase()}`)}>
            {role !== 'USER' && <img src={BotAvatar2} className={cx('avatar')} />}

            <div className={cx('chat-bubble')}>{content}</div>

            {role === 'USER' && <img src={BotAvatar1} className={cx('avatar')} />}
        </div>
    );
};

export default ChatBubble;
