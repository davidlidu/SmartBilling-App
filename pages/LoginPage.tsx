import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LogIn, Lock } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    if (!username || !password) {
      setError("Credenciales inválidas. Por favor verifique.");
      setLoading(false);
      return;
    }
  
    try {
      await login(username, password); // ← AHORA FUNCIONA
      navigate("/");
    } catch (err) {
      setError("Credenciales incorrectas.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-primary" size={32} />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">Bienvenido</h1>
            <p className="text-gray-500 mt-2">Ingrese sus credenciales para acceder</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6 mt-8">
          <div className="space-y-4">
              <div>
                <label htmlFor="username" className="text-sm font-semibold text-gray-700 block mb-1">
                  Usuario / Correo
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="admin"
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <label htmlFor="password"  className="text-sm font-semibold text-gray-700 block mb-1">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200 text-center animate-pulse">
                {error}
            </div>
          )}

          <div>
            <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-all disabled:opacity-70 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl"
            >
              {loading ? (
                  <span>Autenticando...</span>
              ) : (
                  <>
                    <LogIn className="mr-2" size={20} />
                    Iniciar Sesión
                  </>
              )}
            </button>
          </div>
        </form>
        <div className="text-center text-xs text-gray-400 mt-6">
            &copy; {new Date().getFullYear()} Lidutech Security System
        </div>
      </div>
    </div>
  );
};

export default LoginPage;