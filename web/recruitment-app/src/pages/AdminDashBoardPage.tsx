import { useSelector } from 'react-redux';
import { Col, Row, StatsCard } from '../components/layouts';
import type { RootState } from '../services/redux/store';
import classNames from 'classnames/bind';
import styles from '../assets/styles/admins/adminDashBoardPage.module.scss';
import userIcon from '../assets/icons/user.png';
import cvIcon from '../assets/icons/file-text.png';
import jdIcon from '../assets/icons/briefcase.png';
import AdminLayout from '../components/admins/AdminLayout';
import AdminCVList from '../components/admins/AdminCVList';
import AdminJDList from '../components/admins/AdminJDList';
import AdminAccountList from '../components/admins/AdminAccountList';
import AdminInterviewList from '../components/admins/AdminInterviewList';

const cx = classNames.bind(styles);

const AdminDashBoardPage = () => {
    const statistics = useSelector((state: RootState) => state.adminStatistics);

    return (
        <AdminLayout>
            <div className={cx('admin-dashboard')}>
                <h1 className={cx('admin-dashboard__item', 'admin-dashboard__item--title')}>Welcome, Admin</h1>
                <p className={cx('admin-dashboard__item', 'admin-dashboard__item--subtitle')}>Monitor all candidate applications and interview tasks here.</p>

                <Row space={10} className={cx('admin-dashboard__item')}>
                    <Col size={{ lg: 4, xl: 4 }}>
                        <StatsCard label="Total CVs" count={statistics.cvCount} icon={cvIcon} />
                    </Col>
                    <Col size={{ lg: 4, xl: 4 }}>
                        <StatsCard label="Total Users" count={statistics.accountCount} icon={userIcon} />
                    </Col>
                    <Col size={{ lg: 4, xl: 4 }}>
                        <StatsCard label="Job Descriptions" count={statistics.jobCount} icon={jdIcon} />
                    </Col>
                </Row>

                <div className={cx('admin-dashboard__item')}>
                    <Row space={10}>
                        <Col size={{ xl: 6 }}>
                            <AdminCVList />
                        </Col>
                        <Col size={{ xl: 6 }}>
                            <AdminJDList />
                        </Col>
                    </Row>
                </div>

                <div className={cx('admin-dashboard__item')}>
                    <AdminInterviewList />
                </div>

                <div className={cx('admin-dashboard__item')}>
                    <AdminAccountList />
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashBoardPage;
