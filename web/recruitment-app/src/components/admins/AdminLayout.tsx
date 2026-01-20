import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { setUserLogout } from '../../services/redux/authSlices/authSlice';
import { PRIVATE_ADMIN_ROUTE, PUBLIC_ROUTE } from '../../shared/constants/routes';
import { FiBriefcase, FiCalendar, FiFileText, FiGrid, FiLogOut, FiMessageCircle, FiUsers } from 'react-icons/fi';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/admins/adminLayout.module.scss';
import SmartRecruitmentLogo from '../../assets/images/smart-recruitment-admin-logo.png';
import ChatPopup from '../chats/ChatPopup';

const cx = classNames.bind(styles);

const navMenu = [
    { label: 'Dashboard', path: PRIVATE_ADMIN_ROUTE.dashboard, icon: <FiGrid size={16} /> },
    { label: 'Job Posts', path: PRIVATE_ADMIN_ROUTE.job, icon: <FiBriefcase size={16} /> },
    { label: 'Interviews', path: PRIVATE_ADMIN_ROUTE.interview, icon: <FiCalendar size={16} /> },
    { label: 'Candidate CVs', path: PRIVATE_ADMIN_ROUTE.cv, icon: <FiFileText size={16} /> },
    { label: 'Account Management', path: PRIVATE_ADMIN_ROUTE.account, icon: <FiUsers size={16} /> },
    { label: `SOAI Assistant`, path: PRIVATE_ADMIN_ROUTE.soaiAssistant, icon: <FiMessageCircle size={16} /> },
];

const AdminLayout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const [disableAIChat, setDisableAIChat] = useState<boolean>(false);

    useEffect(() => {
        setDisableAIChat(location.pathname === PRIVATE_ADMIN_ROUTE.soaiAssistant);
    }, [location.pathname]);

    const handleUserLogout = (): void => {
        dispatch(setUserLogout());
        navigate(PUBLIC_ROUTE.signin);
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
                                <span className={cx('sidebar__nav-link-icon')}>{nav.icon}</span>
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
                        <button className={cx('sidebar__logout-btn')} onClick={handleUserLogout} title="Logout">
                            <FiLogOut size={18} />
                        </button>
                    </div>
                </nav>

                <div className={cx('admin-layout__content')}>
                    <Outlet />
                </div>
            </div>

            {!disableAIChat && <ChatPopup />}
        </>
    );
};

export default AdminLayout;
