
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from './types';
import { authService } from './services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (type: 'admin' | 'member', id: string, pw: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          authService.setCurrentUser(parsedUser);
        }
      } catch (e) {
        localStorage.removeItem('currentUser');
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (type: 'admin' | 'member', id: string, pw: string) => {
    let loggedUser: User;
    if (type === 'admin') {
      loggedUser = await authService.adminLogin(id, pw);
    } else {
      loggedUser = await authService.memberLogin(id, pw);
    }
    setUser(loggedUser);
    navigate(type === 'admin' ? '/admin' : '/member', { replace: true });
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
