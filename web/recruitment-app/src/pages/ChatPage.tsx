import { Container } from '../components/layouts';
import classNames from 'classnames/bind';
import styles from '../assets/styles/chats/chatPage.module.scss';
import ChatBox from '../components/chats/ChatBox';

const cx = classNames.bind(styles);

const ChatPage = () => {
    return (
        <Container className={cx('chat-frame')}>
            <ChatBox />
        </Container>
    );
};

export default ChatPage;
