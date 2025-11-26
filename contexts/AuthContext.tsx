import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { loginRequest } from "../services/authService"; 

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
        const token = localStorage.getItem('authToken');
        if (token === 'mock-token') {
          setIsAuthenticated(true);
        }
    } catch (e) {
        console.error("Could not access localStorage:", e);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await loginRequest(email, password);
  
      if (!data.token) {
        throw new Error("No token returned");
      }
  
      localStorage.setItem("authToken", data.token);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Login failed", err);
      setIsAuthenticated(false);
      throw err;
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
