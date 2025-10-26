import classNames from 'classnames/bind';
import styles from '../assets/styles/modules/adminDashBoardPage.module.scss';
import { Col, Row } from '../components/responsive';
import AdminStatCard from '../components/admins/AdminStatCard';

import cvIcon from '../assets/icons/file-text.png';
import userIcon from '../assets/icons/user.png';
import jdIcon from '../assets/icons/briefcase.png';

const cx = classNames.bind(styles);

const AdminDashBoardPage = () => {
    return (
        <div className={cx('admin-dashboard')}>
            <h1 className={cx('admin-dashboard__title')}>Welcome, Admin</h1>
            <p className={cx('admin-dashboard__item', 'admin-dashboard__subtitle')}>Monitor all candidate applications and interview tasks here.</p>

            <Row space={10} className={cx('admin-dashboard__item', 'admin-dashboard__stats')}>
                <Col size={{ lg: 4, xl: 4 }} className={cx('admin-dashboard__stats-card')}>
                    <AdminStatCard label="Total CVs" count={1} icon={cvIcon} />
                </Col>
                <Col size={{ lg: 4, xl: 4 }} className={cx('admin-dashboard__stats-card')}>
                    <AdminStatCard label="Total Users" count={2} icon={userIcon} />
                </Col>
                <Col size={{ lg: 4, xl: 4 }} className={cx('admin-dashboard__stats-card')}>
                    <AdminStatCard label="Job Descriptions" count={3} icon={jdIcon} />
                </Col>
            </Row>

            <Row className={cx('admin-dashboard__item', 'admin-dashboard__candidate-cv')}>hello</Row>
        </div>
    );
};

export default AdminDashBoardPage;
