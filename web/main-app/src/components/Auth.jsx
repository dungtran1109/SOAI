import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signin, signup } from '../api/authApi';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { FiEye, FiEyeOff, FiUser } from 'react-icons/fi';
import '../css/Auth.css';

const Auth = ({ isSignIn = true }) => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const cookie = Cookies.get('profile');
    if (cookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookie));
        const token = parsed?.token;
        if (token) {
          const decoded = jwtDecode(token);
          const userRole = decoded?.role || 'USER';

          if (decoded.exp * 1000 > Date.now()) {
            // Đã đăng nhập
            if (userRole === 'ADMIN' && location.pathname !== '/admin/dashboard') {
              navigate('/admin/dashboard', { replace: true });
            } else if (userRole === 'USER' && location.pathname !== '/') {
              navigate('/', { replace: true });
            }
          } else {
            Cookies.remove('profile');
          }
        }
      } catch {
        Cookies.remove('profile');
      }
    }
  }, [location.pathname, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = isSignIn ? { userName, password } : { userName, password, role };
      const response = isSignIn ? await signin(payload) : await signup(payload);

      // Lưu token vào cookie
      Cookies.set('profile', JSON.stringify(response), {
        expires: rememberMe ? 7 : 1,
        secure: true,
        sameSite: 'Strict',
      });

      // Decode và điều hướng theo role
      const decoded = jwtDecode(response.token);
      const userRole = decoded?.role || 'USER';

      if (userRole === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
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
            <h1 className="auth-heading">
              Welcome back <span className="wave-icon">✋</span>
            </h1>
            <p>{isSignIn ? 'Sign in to continue' : 'Sign up to get started'}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="userName">Username</label>
              <div className="input-icon-wrapper">
                <FiUser className="input-icon" />
                <input
                  id="userName"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-icon-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
                <span onClick={() => setShowPassword(!showPassword)} className="toggle-icon right">
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>
            </div>

            {!isSignIn && (
              <div className="form-group">
                <label htmlFor="role">Select Role</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            )}

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
              {loading ? 'Processing...' : isSignIn ? 'Sign in' : 'Sign up'}
            </button>
          </form>

          <div className="auth-footer">
            {isSignIn ? (
              <p>
                Don&apos;t have an account? <Link to="/signup">Sign up</Link>
              </p>
            ) : (
              <p>
                Already have an account? <Link to="/signin">Sign in</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
