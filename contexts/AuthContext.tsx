import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { loginRequest } from "../services/authService"; 
import axios from 'axios';
const API_URL = "https://api.facturador.lidutech.net/api";


interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}


export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: async (email: string, password: string) => {},
  logout: () => {},
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for token on initial load
    try {
        // Sesión vigente si hay un JWT sin vencer (antes solo se aceptaba 'mock-token' y había que entrar cada vez).
        const token = localStorage.getItem('authToken');
        const payload = token && token.split('.').length === 3 ? JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : null;
        if (payload?.exp && payload.exp * 1000 > Date.now()) {
          setIsAuthenticated(true);
        } else if (token) {
          localStorage.removeItem('authToken');
        }
    } catch (e) {
        console.error("Could not access localStorage:", e);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await axios.post(`https://api.facturador.lidutech.net/api/auth/login`, {
        username,
        password
      });
  
      localStorage.setItem("authToken", res.data.token);
      setIsAuthenticated(true);
    } catch (error) {
      throw new Error("Credenciales incorrectas");
    }
  };
  

  const logout = () => {
    try {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
    } catch (e) {
        console.error("Could not access localStorage:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
