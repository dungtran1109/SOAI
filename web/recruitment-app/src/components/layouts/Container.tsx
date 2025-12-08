import React from 'react';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/layouts/responsive.module.scss';

const cx = classNames.bind(styles);

interface ContainerProps {
    children: React.ReactNode;
    className?: string;
}

const Container = ({ children, className }: ContainerProps) => {
    return <div className={cx('container', className)}>{children}</div>;
};

export default Container;
