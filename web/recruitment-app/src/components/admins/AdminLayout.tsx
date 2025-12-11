import React from 'react';
import { toast } from 'react-toastify';
import { FiLogOut } from 'react-icons/fi';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../../services/api/authApi';
import { PRIVATE_ADMIN_ROUTE, PUBLIC_ROUTE } from '../../shared/constants/routes';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/admins/adminLayout.module.scss';
import SmartRecruitmentLogo from '../../assets/images/smart-recruitment-admin-logo.png';
import ChatPopup from '../chatBoxes/ChatPopup';

const cx = classNames.bind(styles);

const navMenu = [
    { label: 'Dashboard', path: PRIVATE_ADMIN_ROUTE.dashboard },
    { label: 'CV Management', path: PRIVATE_ADMIN_ROUTE.cv },
    { label: 'Job Descriptions', path: PRIVATE_ADMIN_ROUTE.job },
    { label: 'Upcoming Interviews', path: PRIVATE_ADMIN_ROUTE.interview },
    { label: 'Account Management', path: PRIVATE_ADMIN_ROUTE.account },
    { label: `AI Assistant`, path: PRIVATE_ADMIN_ROUTE.aiAssistant },
];

interface AdminLayoutProps {
    children: React.ReactNode;
    disableChatbox?: boolean;
}

const AdminLayout = ({ children, disableChatbox = false }: AdminLayoutProps) => {
    const navigate = useNavigate();

    const handleLogout = (): void => {
        const response = logout();
        if (response.ok) {
            navigate(PUBLIC_ROUTE.signin);
            toast.success(`Goodbye 👋, See you later.`, {
                position: 'top-center',
                hideProgressBar: true,
            });
        } else {
            toast.error(response.message, {
                position: 'top-center',
                hideProgressBar: true,
            });
        }
    };

    return (
        <>
            <div className={cx('admin-layout')}>
                <nav className={cx('sidebar')}>
                    <h2 className={cx('sidebar__header')}>Smart Recruitment</h2>

                    <section className={cx('sidebar__nav')}>
                        {navMenu.map((nav) => (
                            <NavLink
                                key={nav.label}
                                to={`${nav.path}`}
                                end={nav.label === 'Dashboard'}
                                className={({ isActive }) => {
                                    return cx('sidebar__nav-link', { 'sidebar__nav-link--active': isActive });
                                }}
                            >
                                {nav.label}
                            </NavLink>
                        ))}
                    </section>

                    <div className={cx('sidebar__footer')}>
                        <img src={SmartRecruitmentLogo} alt="Admin Avatar" className={cx('sidebar__footer-avatar')} />
                        <div className={cx('sidebar__footer-account')}>
                            <p className={cx('sidebar__footer-account-name')}>Admin</p>
                            <p className={cx('sidebar__footer-account-email')}>smart.recruit.ai@gmail.com</p>
                        </div>
                        <button className={cx('sidebar__logout-btn')} onClick={handleLogout} title="Logout">
                            <FiLogOut size={18} />
                        </button>
                    </div>
                </nav>

                <div className={cx('admin-layout__content')}>{children}</div>
            </div>
            {!disableChatbox && <ChatPopup />}
        </>
    );
};

export default AdminLayout;
