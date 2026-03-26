import { Link } from "react-router-dom";
import WalletButton from "./WalletButton";

export default function Navbar({ wallet }) {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <svg className="logo-svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
        <span className="logo-text">VestingPact</span>
      </Link>
      <div className="navbar-actions">
        <Link to="/create" className="nav-link">
          Crear Pacto
        </Link>
        <WalletButton wallet={wallet} />
      </div>
    </nav>
  );
}
