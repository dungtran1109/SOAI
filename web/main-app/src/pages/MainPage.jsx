import { Link, useNavigate } from "react-router-dom";
import { logout } from "../api/authApi";

const MainPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  }
  return (
    <div className="page-container">
      <h1>Welcome to SOAI</h1>
      <p>Choose a page to explore:</p>
      <nav>
        <ul>
          <li><Link to="/chatbot">Chatbot</Link></li>
          <li><Link to="/camera">Camera Page</Link></li>
          <button onClick={handleLogout}>Log out</button>
        </ul>
      </nav>
    </div>
  );
};

export default MainPage;
