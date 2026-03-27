import { Link } from "react-router-dom";
import WalletButton from "./WalletButton";

export default function Navbar({ wallet }) {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <img className="logo-svg" src="/logo.svg" alt="VestingPact" width="24" height="24" />
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
