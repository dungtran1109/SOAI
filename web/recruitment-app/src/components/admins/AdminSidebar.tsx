import classNames from 'classnames/bind';
import styles from '../../assets/styles/modules/adminSidebar.module.scss';
import SmartRecruitmentLogo from '../../assets/images/smart-recruitment-admin-logo.png';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import { logout } from '../../services/api/authApi';

const cx = classNames.bind(styles);

const menu = [
    { label: 'Home', path: '/admin/dashboard' },
    { label: 'All Users', path: '/admin/dashboard/users' },
    { label: 'All CVs', path: '/admin/dashboard/cv-candidate' },
    { label: 'All Interviews', path: '/admin/dashboard/interviews' },
    { label: 'All Job Descriptions', path: '/admin/dashboard/jds' },
];

interface AdminSidebarProps {
    className?: string;
}

const AdminSidebar = ({ className }: AdminSidebarProps) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/signin');
    };

    return (
        <div className={cx('sidebar', className)}>
            <h2 className={cx('sidebar__header')}>Smart Recruitment</h2>

            <section className={cx('sidebar__nav')}>
                {menu.map((item) => (
                    <NavLink
                        key={item.label}
                        to={`${item.path}`}
                        end={item.label === 'Home'}
                        className={({ isActive }) => {
                            console.log(isActive);
                            return cx('sidebar__nav-link', { 'sidebar__nav-link--active': isActive });
                        }}
                    >
                        {item.label}
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
        </div>
    );
};

export default AdminSidebar;
