import React, { useEffect, useReducer, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FiEye, FiEyeOff, FiMail, FiUser } from 'react-icons/fi';
import { signin, signup } from '../services/api/authApi';
import { COOKIE_TOKEN_NAME } from '../shared/constants/browserStorages';
import { authFormReducer, initAuthFormValue } from '../services/reducer/formReducer/authForm';
import type { SigninData, SignupData, TokenDecoded } from '../shared/types/authTypes';
import classNames from 'classnames/bind';
import styles from '../assets/styles/auths/authPage.module.scss';
import Cookies from 'js-cookie';

const cx = classNames.bind(styles);

interface CookieJSONParsed {
    token: string;
    expiresAt: string;
    tokenType: string;
}

interface AuthProps {
    isSignin: boolean;
}

const AuthPage = ({ isSignin = false }: AuthProps) => {
    const [formValue, dispatch] = useReducer(authFormReducer, initAuthFormValue);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        const cookie = Cookies.get(COOKIE_TOKEN_NAME);
        if (cookie) {
            try {
                const parsed: CookieJSONParsed = JSON.parse(decodeURIComponent(cookie));
                const token = parsed.token;
                if (token) {
                    const decoded: TokenDecoded = jwtDecode(token);

                    if (decoded.exp * 1000 > Date.now()) {
                        navigate(decoded.role === 'ADMIN' ? '/admin/dashboard' : '/', { replace: true });
                    } else {
                        Cookies.remove(COOKIE_TOKEN_NAME);
                    }
                }
            } catch {
                Cookies.remove(COOKIE_TOKEN_NAME);
            }
        }
        setLoading(false);
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        const signInPayload: SigninData = {
            userName: formValue.userName,
            password: formValue.password,
        };

        const signUpPayload: SignupData = {
            ...signInPayload,
            email: formValue.email,
            role: formValue.role,
        };

        dispatch({ type: 'ERROR', payload: '' });

        if (!isSignin && formValue.password !== formValue.confirmPassword) {
            dispatch({ type: 'ERROR', payload: 'Your confirmed password unmatched.' });
        } else {
            setLoading(true);
            try {
                if (isSignin) {
                    const response = await signin(signInPayload);

                    Cookies.set(COOKIE_TOKEN_NAME, JSON.stringify(response), {
                        expires: formValue.rememberMe ? 7 : 1,
                        secure: true,
                        sameSite: 'Strict',
                    });

                    const decoded = jwtDecode<TokenDecoded>(response.token);
                    navigate(decoded.role === 'ADMIN' ? '/admin/dashboard' : '/', { replace: true });
                } else {
                    await signup(signUpPayload);
                    dispatch({ type: 'RESET' });
                    navigate('/signin');
                }
            } catch {
                dispatch({
                    type: 'ERROR',
                    payload: isSignin ? 'Login failed, username or password is incorrect.' : 'Signup failed, please check again.',
                });
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className={cx('auth-wrapper')}>
            <div className={cx('auth')}>
                <div className={cx('auth__header')}>
                    <h2>
                        Welcome back <span className="wave-icon">👋</span>
                    </h2>
                    <p className={cx('auth__header-subtitle')}>{isSignin ? 'Sign in to continue' : 'Sign up to get started'}</p>
                </div>

                <form onSubmit={handleSubmit} className={cx('auth__body')}>
                    {!isSignin && (
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

                    {!isSignin && (
                        <div className={cx('form-group')}>
                            <label htmlFor="confirmPassword" className={cx('form-group__label')}>
                                Confirm password
                            </label>
                            <div className={cx('form-group__wrapper')}>
                                <input
                                    id="confirmPassword"
                                    type={formValue.showConfirmPassword ? 'text' : 'password'}
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

                    {!isSignin && (
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

                    {isSignin && (
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
                        {loading ? 'Processing...' : isSignin ? 'Sign in' : 'Sign up'}
                    </button>
                </form>

                <div className={cx('auth__footer')}>
                    {isSignin ? (
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
