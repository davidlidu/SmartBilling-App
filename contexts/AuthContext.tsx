import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => {},
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

  const login = () => {
    try {
        localStorage.setItem('authToken', 'mock-token');
        setIsAuthenticated(true);
    } catch (e) {
        console.error("Could not access localStorage:", e);
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
