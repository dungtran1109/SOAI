import React from 'react';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/admins/adminLayout.module.scss';
import AdminSidebar from './AdminSidebar';

const cx = classNames.bind(styles);

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
    return (
        <div className={cx('admin-layout')}>
            <AdminSidebar className={cx('admin-layout__sidebar')} />
            <div className={cx('admin-layout__content')}>{children}</div>
        </div>
    );
};

export default AdminLayout;
