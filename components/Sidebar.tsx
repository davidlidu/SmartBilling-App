import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Users, Settings, LogOut } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';


const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-3 text-gray-700 hover:bg-primary-light hover:text-white rounded-md transition-colors duration-150 ${
        isActive ? 'bg-primary text-white shadow-lg' : 'hover:bg-gray-200'
      }`}
    >
      {icon}
      <span className="ml-3">{label}</span>
    </Link>
  );
};

const Sidebar: React.FC = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col p-4 space-y-2">
      <div className="text-center py-4 mb-4 border-b">
        <Link to="/" className="text-2xl font-bold text-primary">LIDUTECH</Link>
        <p className="text-xs text-gray-500">Gestión de Facturas</p>
      </div>
      <nav className="flex-grow">
        <NavLink to="/" icon={<Home size={20} />} label="Panel" />
        <NavLink to="/invoices" icon={<FileText size={20} />} label="Facturas" />
        <NavLink to="/clients" icon={<Users size={20} />} label="Clientes" />
        <NavLink to="/settings" icon={<Settings size={20} />} label="Configuración" />
      </nav>
      <div className="py-2 border-t">
         <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-red-100 hover:text-red-700 rounded-md transition-colors duration-150"
          >
            <LogOut size={20} />
            <span className="ml-3">Cerrar Sesión</span>
          </button>
        <div className="pt-4 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Lidutech
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
