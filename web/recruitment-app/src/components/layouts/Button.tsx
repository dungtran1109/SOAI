import { FaPen } from 'react-icons/fa';
import { FiDownload, FiTrash2 } from 'react-icons/fi';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/layouts/button.module.scss';

const cx = classNames.bind(styles);

interface ButtonProps {
    type: 'edit' | 'delete' | 'download';
    onClick: () => void;
}

const TYPE = {
    edit: <FaPen size={15} />,
    delete: <FiTrash2 size={18} />,
    download: <FiDownload size={18} />,
};

const Button = ({ type, onClick }: ButtonProps) => {
    const icon = TYPE[type];

    return (
        <button className={cx('btn', `btn-${type}`)} onClick={onClick}>
            {icon}
        </button>
    );
};

export default Button;
