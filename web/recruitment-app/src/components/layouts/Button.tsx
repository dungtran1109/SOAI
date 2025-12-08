import { FaPen, FaRegQuestionCircle } from 'react-icons/fa';
import { FiDownload, FiMoreVertical, FiTrash2 } from 'react-icons/fi';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/layouts/button.module.scss';

const cx = classNames.bind(styles);

interface ButtonProps {
    type: 'edit' | 'delete' | 'download' | 'question' | 'menu';
    onClick: () => void;
    title?: string;
    disabled?: boolean;
}

const TYPE = {
    edit: <FaPen size={15} />,
    delete: <FiTrash2 size={18} />,
    download: <FiDownload size={18} />,
    question: <FaRegQuestionCircle size={18} />,
    menu: <FiMoreVertical size={18} />,
};

const Button = ({ type, onClick, title, disabled = false }: ButtonProps) => {
    const icon = TYPE[type];

    return (
        <button className={cx('btn', `btn-${type}`, { 'btn-disabled': disabled })} onClick={onClick} title={title} disabled={disabled}>
            {icon}
        </button>
    );
};

export default Button;
