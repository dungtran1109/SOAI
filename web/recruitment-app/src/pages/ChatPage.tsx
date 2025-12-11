import { Container } from '../components/layouts';
import classNames from 'classnames/bind';
import styles from '../assets/styles/chatBoxes/chatPage.module.scss';
import AdminLayout from '../components/admins/AdminLayout';
import ChatBox from '../components/chatBoxes/ChatBox';

const cx = classNames.bind(styles);

const ChatPage = () => {
    return (
        <AdminLayout disableChatbox={true}>
            <Container className={cx('chat-frame')}>
                <ChatBox />
            </Container>
        </AdminLayout>
    );
};

export default ChatPage;
