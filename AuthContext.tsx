
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from './types';
import { authService } from './services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (type: 'admin' | 'member', id: string, pw: string) => Promise<void>;
  logout: () => void;
  sessionTimeLeft: number; // 남은 세션 시간(초)
  resetSession: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_TIMEOUT = 30 * 60; // 30분
const WARNING_THRESHOLD = 60;   // 1분 전 경고

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(SESSION_TIMEOUT);
  const navigate = useNavigate();
  // Using ReturnType<typeof setInterval> to avoid issues with missing NodeJS namespace in browser contexts.
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 세션 리셋 함수
  const resetSession = () => {
    if (user && [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF].includes(user.role)) {
      setSessionTimeLeft(SESSION_TIMEOUT);
    }
  };

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

  // 관리자 세션 타이머 로직
  useEffect(() => {
    if (!user || ![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF].includes(user.role)) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSessionTimeLeft((prev) => {
        if (prev <= 1) {
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 활동 감지 이벤트 등록
    const handleActivity = () => resetSession();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [user]);

  const login = async (type: 'admin' | 'member', id: string, pw: string) => {
    let loggedUser: User;
    if (type === 'admin') {
      loggedUser = await authService.adminLogin(id, pw);
    } else {
      loggedUser = await authService.memberLogin(id, pw);
    }
    setUser(loggedUser);
    resetSession();
    navigate(type === 'admin' ? '/admin' : '/member', { replace: true });
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    if (timerRef.current) clearInterval(timerRef.current);
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, sessionTimeLeft, resetSession }}>
      {children}
    </AuthContext.Provider>
  );
};
