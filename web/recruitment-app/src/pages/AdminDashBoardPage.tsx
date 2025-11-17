import { useSelector } from 'react-redux';
import type { RootState } from '../services/redux/store';
import { Col, Row } from '../components/layouts';
import classNames from 'classnames/bind';
import styles from '../assets/styles/admins/adminDashBoardPage.module.scss';
import AdminLayout from '../components/admins/AdminLayout';
import AdminStatisticCard from '../components/admins/AdminStatisticCard';
import AdminCVList from '../components/admins/AdminCVList';
import AdminJDList from '../components/admins/AdminJDList';
import AdminAccountList from '../components/admins/AdminAccountList';
import cvIcon from '../assets/icons/file-text.png';
import userIcon from '../assets/icons/user.png';
import jdIcon from '../assets/icons/briefcase.png';

const cx = classNames.bind(styles);

const AdminDashBoardPage = () => {
    const statistic = useSelector((state: RootState) => state.adminStatistic);

    return (
        <AdminLayout>
            <div className={cx('admin-dashboard')}>
                <h1 className={cx('admin-dashboard__title')}>Welcome, Admin</h1>
                <p className={cx('admin-dashboard__item', 'admin-dashboard__subtitle')}>Monitor all candidate applications and interview tasks here.</p>

                <Row space={10} className={cx('admin-dashboard__item', 'admin-dashboard__stats')}>
                    <Col size={{ lg: 4, xl: 4 }} className={cx('admin-dashboard__stats-card')}>
                        <AdminStatisticCard label="Total CVs" count={statistic.cvCount} icon={cvIcon} />
                    </Col>
                    <Col size={{ lg: 4, xl: 4 }} className={cx('admin-dashboard__stats-card')}>
                        <AdminStatisticCard label="Total Users" count={statistic.accountCount} icon={userIcon} />
                    </Col>
                    <Col size={{ lg: 4, xl: 4 }} className={cx('admin-dashboard__stats-card')}>
                        <AdminStatisticCard label="Job Descriptions" count={statistic.jobCount} icon={jdIcon} />
                    </Col>
                </Row>

                <div className={cx('admin-dashboard__item')}>
                    <AdminCVList />
                </div>

                <div className={cx('admin-dashboard__item')}>
                    <AdminAccountList />
                </div>

                <div className={cx('admin-dashboard__item')}>
                    <AdminJDList />
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashBoardPage;
