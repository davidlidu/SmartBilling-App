import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LogIn, Lock, User, KeyRound } from 'lucide-react';

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
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError("Credenciales incorrectas.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-purple-900 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-400/5 rounded-full" />

      <div className="w-full max-w-md p-8 space-y-8 glass rounded-2xl shadow-glass-lg animate-scaleIn relative z-10 mx-4">
        <div className="text-center">
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-glow-lg animate-float">
            <Lock className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-extrabold text-secondary-900">Bienvenido</h1>
          <p className="text-secondary-500 mt-2 font-medium">Ingrese sus credenciales para acceder</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 mt-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="text-sm font-semibold text-secondary-700 block mb-1.5">
                Usuario / Correo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 pl-10 border border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all bg-white/80"
                  placeholder="admin"
                  autoComplete="username"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-semibold text-secondary-700 block mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pl-10 border border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all bg-white/80"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-danger-50 text-danger border border-danger/20 text-sm p-3 rounded-xl text-center animate-fadeIn font-medium">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 text-white bg-gradient-to-r from-primary to-primary-700 rounded-xl hover:from-primary-600 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-glow"
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
        <div className="text-center text-xs text-secondary-400 mt-6 font-medium">
          &copy; {new Date().getFullYear()} Lidutech Security System
        </div>
      </div>
    </div>
  );
};

export default LoginPage;