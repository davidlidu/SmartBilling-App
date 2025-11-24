import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd call an API. Here, we'll just simulate success.
    if (username && password) {
      login();
      navigate('/');
    } else {
      setError('Por favor, ingrese usuario y contraseña.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">LIDUTECH</h1>
            <p className="text-gray-500">Generador de Facturas Pro</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="text-sm font-bold text-gray-600 block">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="user@example.com"
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password"  className="text-sm font-bold text-gray-600 block">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="********"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div>
            <button type="submit" className="w-full flex justify-center items-center py-3 px-4 text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-colors">
              <LogIn className="mr-2" size={20} />
              Iniciar Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
