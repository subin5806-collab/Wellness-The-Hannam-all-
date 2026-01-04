
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from './types';
import { authService } from './services/authService';
import { dbService } from './services/dbService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (type: 'admin' | 'member', id: string, pw: string) => Promise<void>;
  register: (data: { name: string, phone: string, email: string, password: string }) => Promise<void>;
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

  const register = async (data: any) => {
    // 1. 회원 등록 수행
    const newMember = await dbService.registerMember({
      ...data,
      gender: '여성', // 기본값
      deposit: 0,    // 신규 가입 시 잔액 0
      remaining: 0,
      tier: 'SILVER'
    });

    // 2. 가입 직후 자동 로그인 처리
    const loggedUser: User = {
      id: newMember.id,
      name: newMember.name,
      email: newMember.email,
      role: UserRole.MEMBER,
    };
    
    setUser(loggedUser);
    localStorage.setItem('currentUser', JSON.stringify(loggedUser));
    authService.setCurrentUser(loggedUser);
    
    // 3. 회원 포털로 이동
    navigate('/member', { replace: true });
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
