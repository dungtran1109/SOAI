import React from 'react';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/layouts/responsive.module.scss';

const cx = classNames.bind(styles);

type GridSize = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

interface ColProps {
    children: React.ReactNode;
    size?: {
        xs?: GridSize;
        sm?: GridSize;
        md?: GridSize;
        lg?: GridSize;
        xl?: GridSize;
    };
    className?: string;
}

const Col = ({ children, className, size = { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 } }: ColProps) => {
    const sizes: Required<ColProps['size']> = {
        xs: size.xs ?? 12,
        sm: size.sm ?? 12,
        md: size.md ?? 12,
        lg: size.lg ?? 12,
        xl: size.xl ?? 12,
    };
    return <div className={cx(`xl-${sizes.xl}`, `lg-${sizes.lg}`, `md-${sizes.md}`, `sm-${sizes.sm}`, `xs-${sizes.xs}`, className)}>{children}</div>;
};

export default Col;
