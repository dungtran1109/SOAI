import React from 'react';
import styles from '../../../assets/styles/modules/responsive.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

interface RowProps {
    children: React.ReactNode;
    className?: string;
    space?: number;
}

const Row = ({ children, className, space = 0 }: RowProps) => {
    return (
        <div className={cx('row', className)} style={{ '--gap': `${space}px` } as React.CSSProperties}>
            {children}
        </div>
    );
};

export default Row;
