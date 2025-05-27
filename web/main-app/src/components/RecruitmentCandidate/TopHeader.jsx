import { Link } from "react-router-dom";
import "../../css/TopHeader.css";
import EndavaLogo from "../../assets/images/endava-logo.png";

const TopHeader = () => {
  return (
    <header className="top-header">
      <div className="header-left">
        <Link to="/">
          <img src={EndavaLogo} alt="Endava Logo" className="header-logo" />
        </Link>
      </div>
      <nav className="header-center">
        <a href="#jobs">JOBS</a>
        <a href="#my-applications">MY APPLICATIONS</a>
        <a href="#my-referals">MY REFERRALS</a>
      </nav>
      <div className="header-right">
        <div className="user-avatar">DT</div>
      </div>
    </header>
  );
};

export default TopHeader;
