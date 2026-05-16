import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Users, Settings, LogOut, X, BarChart2 } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; onClick?: () => void }> = ({ to, icon, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${isActive
          ? 'bg-white/15 text-white shadow-lg shadow-primary-900/20 backdrop-blur-sm'
          : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
    >
      <span className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${isActive ? 'bg-white/20' : 'bg-transparent group-hover:bg-white/10'
        }`}>
        {icon}
      </span>
      <span className="ml-3 font-medium text-sm">{label}</span>
      {isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      )}
    </Link>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className={`w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 h-full flex flex-col shadow-2xl transition-transform duration-300 ease-out ${isOpen !== undefined ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'
      }`}>
      {/* Brand Header */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3" onClick={handleNavClick}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-glow">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">LIDUTECH</h1>
              <p className="text-[11px] text-slate-400 font-medium tracking-wider uppercase">Facturación Pro</p>
            </div>
          </Link>
          {onClose && (
            <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-grow px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-4 mb-3">Menú Principal</p>
        <NavLink to="/" icon={<Home size={18} />} label="Panel" onClick={handleNavClick} />
        <NavLink to="/invoices" icon={<FileText size={18} />} label="Facturas" onClick={handleNavClick} />
        <NavLink to="/clients" icon={<Users size={18} />} label="Clientes" onClick={handleNavClick} />
        <NavLink to="/reports" icon={<BarChart2 size={18} />} label="Reportes" onClick={handleNavClick} />

        <div className="my-4 border-t border-white/5" />
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-4 mb-3">Sistema</p>
        <NavLink to="/settings" icon={<Settings size={18} />} label="Configuración" onClick={handleNavClick} />
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-slate-400 hover:bg-danger/10 hover:text-danger-light rounded-xl transition-all duration-200 group"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-lg group-hover:bg-danger/10 transition-colors">
            <LogOut size={18} />
          </span>
          <span className="ml-3 font-medium text-sm">Cerrar Sesión</span>
        </button>
        <div className="mt-4 text-center text-[10px] text-slate-600 font-medium">
          © {new Date().getFullYear()} Lidutech · v2.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
