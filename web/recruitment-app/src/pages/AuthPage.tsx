import classNames from 'classnames/bind';
import styles from '../assets/styles/auths/authPage.module.scss';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import React, { useReducer, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiMail, FiUser } from 'react-icons/fi';
import { signin, signup } from '../shared/api/authApi';
import type { SignInData, SignUpData, Role, DecodedToken } from '../shared/interfaces/authInterface';

const cx = classNames.bind(styles);

interface AuthProps {
    isSignIn: boolean;
}

interface FormValues extends SignUpData {
    confirmPassword: string;
    rememberMe: boolean;
    showPassword: boolean;
    showConfirmPassword: boolean;
    error: string;
}

type ActionReducer =
    | { type: 'RESET' }
    | { type: 'ROLE'; payload: Role }
    | { type: 'USER_NAME' | 'PASSWORD' | 'CONFIRM_PASSWORD' | 'EMAIL' | 'ERROR'; payload: string }
    | { type: 'REMEMBER_ME' | 'SHOW_PASSWORD' | 'SHOW_CONFIRM_PASSWORD'; payload: boolean };

const initFormValue: FormValues = {
    userName: '',
    password: '',
    confirmPassword: '',
    email: '',
    role: 'USER',
    rememberMe: false,
    showPassword: false,
    showConfirmPassword: false,
    error: '',
};

const reducer = (state: FormValues, action: ActionReducer): FormValues => {
    switch (action.type) {
        case 'USER_NAME':
            return {
                ...state,
                userName: action.payload,
            };
        case 'PASSWORD':
            return {
                ...state,
                password: action.payload,
            };
        case 'CONFIRM_PASSWORD':
            return {
                ...state,
                confirmPassword: action.payload,
            };
        case 'EMAIL':
            return {
                ...state,
                email: action.payload,
            };
        case 'ROLE':
            return {
                ...state,
                role: action.payload,
            };
        case 'REMEMBER_ME':
            return {
                ...state,
                rememberMe: action.payload,
            };
        case 'SHOW_PASSWORD':
            return {
                ...state,
                showPassword: action.payload,
            };
        case 'SHOW_CONFIRM_PASSWORD':
            return {
                ...state,
                showConfirmPassword: action.payload,
            };
        case 'ERROR':
            return {
                ...state,
                error: action.payload,
            };
        case 'RESET':
            return initFormValue;
        default:
            return state;
    }
};

const AuthPage = ({ isSignIn = false }: AuthProps) => {
    const [formValue, dispatch] = useReducer(reducer, initFormValue);
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        const signInPayload: SignInData = {
            userName: formValue.userName,
            password: formValue.password,
        };

        const signUpPayload: SignUpData = {
            ...signInPayload,
            email: formValue.email,
            role: formValue.role,
        };

        if (!isSignIn && formValue.password !== formValue.confirmPassword) {
            dispatch({ type: 'ERROR', payload: 'Your confirmed password unmatched.' });
            return;
        }

        dispatch({ type: 'ERROR', payload: '' });
        setLoading(true);

        try {
            const response = isSignIn ? await signin(signInPayload) : await signup(signUpPayload);

            Cookies.set('profile', JSON.stringify(response), {
                expires: formValue.rememberMe ? 7 : 1,
                secure: true,
                sameSite: 'Strict',
            });

            const decoded = jwtDecode<DecodedToken>(response.token);
            const userRole = decoded.role ?? 'USER';

            if (userRole === 'ADMIN') {
                navigate('/admin/dashboard', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        } catch {
            dispatch({ type: 'ERROR', payload: isSignIn ? 'Invalid username or password.' : 'Signup failed. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('auth')}>
                <div className={cx('auth__header')}>
                    <h2>
                        Welcome back <span className="wave-icon">👋</span>
                    </h2>
                    <p className={cx('auth__header-subtitle')}>{isSignIn ? 'Sign in to continue' : 'Sign up to get started'}</p>
                </div>

                <form onSubmit={handleSubmit} className={cx('auth__body')}>
                    {!isSignIn && (
                        <div className={cx('form-group')}>
                            <label htmlFor="email" className={cx('form-group__label')}>
                                Email
                            </label>
                            <div className={cx('form-group__wrapper')}>
                                <FiMail className={cx('form-group__wrapper-icon')} />
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="off"
                                    value={formValue.email}
                                    onChange={(e) => dispatch({ type: 'EMAIL', payload: e.target.value })}
                                    placeholder="Enter email"
                                    required
                                    className={cx('form-group__wrapper-entry', 'form-group__wrapper-entry--padding')}
                                />
                            </div>
                        </div>
                    )}

                    <div className={cx('form-group')}>
                        <label htmlFor="username" className={cx('form-group__label')}>
                            Username
                        </label>
                        <div className={cx('form-group__wrapper')}>
                            <FiUser className={cx('form-group__wrapper-icon')} />
                            <input
                                id="username"
                                type="text"
                                autoComplete="off"
                                value={formValue.userName}
                                onChange={(e) => dispatch({ type: 'USER_NAME', payload: e.target.value })}
                                placeholder="Enter username"
                                required
                                className={cx('form-group__wrapper-entry', 'form-group__wrapper-entry--padding')}
                            />
                        </div>
                    </div>

                    <div className={cx('form-group')}>
                        <label htmlFor="password" className={cx('form-group__label')}>
                            Password
                        </label>
                        <div className={cx('form-group__wrapper')}>
                            <input
                                id="password"
                                type={formValue.showPassword ? 'text' : 'password'}
                                autoComplete="off"
                                value={formValue.password}
                                onChange={(e) => dispatch({ type: 'PASSWORD', payload: e.target.value })}
                                placeholder="Enter password"
                                required
                                minLength={6}
                                className={cx('form-group__wrapper-entry')}
                            />
                            {!!formValue.password &&
                                (formValue.showPassword ? (
                                    <FiEyeOff className={cx('form-group__wrapper-icon')} onClick={() => dispatch({ type: 'SHOW_PASSWORD', payload: false })} />
                                ) : (
                                    <FiEye className={cx('form-group__wrapper-icon')} onClick={() => dispatch({ type: 'SHOW_PASSWORD', payload: true })} />
                                ))}
                        </div>
                    </div>

                    {!isSignIn && (
                        <div className={cx('form-group')}>
                            <label htmlFor="confirmPassword" className={cx('form-group__label')}>
                                Confirm password
                            </label>
                            <div className={cx('form-group__wrapper')}>
                                <input
                                    id="confirmPassword"
                                    type={formValue.showPassword ? 'text' : 'password'}
                                    autoComplete="off"
                                    value={formValue.confirmPassword}
                                    onChange={(e) => dispatch({ type: 'CONFIRM_PASSWORD', payload: e.target.value })}
                                    placeholder="Confirm your password"
                                    required
                                    minLength={6}
                                    className={cx('form-group__wrapper-entry')}
                                />
                                {!!formValue.confirmPassword &&
                                    (formValue.showConfirmPassword ? (
                                        <FiEyeOff
                                            className={cx('form-group__wrapper-icon')}
                                            onClick={() => dispatch({ type: 'SHOW_CONFIRM_PASSWORD', payload: false })}
                                        />
                                    ) : (
                                        <FiEye
                                            className={cx('form-group__wrapper-icon')}
                                            onClick={() => dispatch({ type: 'SHOW_CONFIRM_PASSWORD', payload: true })}
                                        />
                                    ))}
                            </div>
                        </div>
                    )}

                    {!isSignIn && (
                        <div className={cx('form-group')}>
                            <label htmlFor="role" className={cx('form-group__label')}>
                                Select role
                            </label>
                            <div className={cx('form-group__wrapper')}>
                                <select
                                    id="role"
                                    value={formValue.role}
                                    onChange={(e) => dispatch({ type: 'ROLE', payload: e.target.value as typeof formValue.role })}
                                    className={cx('form-group__wrapper-entry')}
                                >
                                    <option value="USER" className={cx('form-group__wrapper-entry-option')}>
                                        User
                                    </option>
                                    <option value="ADMIN" className={cx('form-group__wrapper-entry-otpion')}>
                                        Admin
                                    </option>
                                </select>
                            </div>
                        </div>
                    )}

                    {isSignIn && (
                        <div className={cx('form-check')}>
                            <input
                                id="rememberMe"
                                type="checkbox"
                                checked={formValue.rememberMe}
                                onChange={(e) => dispatch({ type: 'REMEMBER_ME', payload: e.target.checked })}
                            />
                            <label htmlFor="rememberMe">Remember me</label>
                        </div>
                    )}

                    {formValue.error && <p className={cx('form-error-message')}>{formValue.error}</p>}

                    <button type="submit" className={cx('form-submit')} disabled={loading}>
                        {loading ? 'Processing...' : isSignIn ? 'Sign in' : 'Sign up'}
                    </button>
                </form>

                <div className={cx('auth__footer')}>
                    {isSignIn ? (
                        <p>
                            Don't have an account?{' '}
                            <Link to="/signup" onClick={() => dispatch({ type: 'RESET' })} className={cx('auth__footer-link')}>
                                Sign up
                            </Link>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{' '}
                            <Link to="/signin" onClick={() => dispatch({ type: 'RESET' })} className={cx('auth__footer-link')}>
                                Sign in
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
