import "../../css/TopHeader.css";
import EndavaLogo from "../../assets/images/endava-logo.png";

const TopHeader = () => {
  return (
    <header className="top-header">
      <div className="header-left">
        <img src={EndavaLogo} alt="Endava Logo" className="header-logo" />
      </div>
      <nav className="header-center">
        <a href="#">JOBS</a>
        <a href="#">MY APPLICATIONS</a>
        <a href="#">MY REFERRALS</a>
      </nav>
      <div className="header-right">
        <div className="user-avatar">DT</div>
      </div>
    </header>
  );
};

export default TopHeader;
