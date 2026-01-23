import { colors } from '../../../styles/theme';
import './Logo.css';

export const Logo = () => {
  return (
    <div className="logo">
      <img src="/logo.webp" alt="VAIA Logo" className="logo-image" />
      <div className="logo-text">
        <span className="logo-vaia" style={{ color: colors.vaia }}>VAIA</span>
        <span className="logo-core" style={{ color: colors.core }}>Core</span>
      </div>
    </div>
  );
};
