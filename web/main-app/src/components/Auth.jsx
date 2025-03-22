import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signin, signup } from '../api/authApi';
import Cookies from 'js-cookie';
import '../css/Auth.css';

const Auth = ({ isSignIn = true }) => {
    const hasCheckedCookie = useRef(false);
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (hasCheckedCookie.current) return;
        const profile = Cookies.get('profile');

        if (profile) {
            try {
                const parsed = JSON.parse(profile);
                const isValidToken = parsed.token && parsed.expiresAt &&
                    new Date(parsed.expiresAt).getTime() > Date.now();
                
                if (isValidToken && (location.pathname === '/signin' || location.pathname === '/signup')) {
                    navigate('/', { replace: true });
                }
            } catch (err) {
                console.error('Invalid cookie format: ', err);
            }
        }
    }, [navigate, location.pathname]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = isSignIn
                ? await signin({ userName, password })
                : await signup({ userName, password });

            // Save to cookie (not HttpOnly, frontend-readable)
            Cookies.set('profile', JSON.stringify(response), {
                expires: rememberMe ? 7 : 1, // days
                secure: true,
                sameSite: 'Strict',
            });

            navigate('/');
        } catch (err) {
            console.error(err);
            setError(isSignIn ? 'Invalid username or password.' : 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-container">
                <div className="auth-box">
                    <div className="auth-header">
                        <h1>{isSignIn ? 'Welcome back 👋' : 'Create your account'}</h1>
                        <p>{isSignIn ? 'Sign in to your account to continue' : 'Sign up to get started'}</p>
                    </div>

                    <div className="auth-card">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="userName">User Name</label>
                                <input
                                    id="userName"
                                    name="userName"
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="Enter your User Name"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <span
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </span>
                                </div>
                            </div>

                            {isSignIn && (
                                <div className="form-check">
                                    <input
                                        id="rememberMe"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <label htmlFor="rememberMe">Remember me</label>
                                </div>
                            )}

                            {error && <p className="error-message">{error}</p>}

                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? <span className="loading-spinner"></span> : isSignIn ? 'Sign in' : 'Sign up'}
                            </button>
                        </form>
                    </div>

                    <div className="auth-footer">
                        {isSignIn ? (
                            <>
                                Don&apos;t have an account? <Link to="/signup">Sign up</Link>
                            </>
                        ) : (
                            <>
                                Already have an account? <Link to="/signin">Sign in</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;