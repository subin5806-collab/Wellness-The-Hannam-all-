
import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminReservations } from './pages/admin/AdminReservations';
import { AdminMembers } from './pages/admin/AdminMembers';
import { AdminInquiries } from './pages/admin/AdminInquiries';
import { AdminCareSession } from './pages/admin/AdminCareSession';
import { AdminCareResult } from './pages/admin/AdminCareResult';
import { AdminTherapists } from './pages/admin/AdminTherapists';
import { MemberDetail } from './pages/admin/MemberDetail';
import { MemberRegistration } from './pages/admin/MemberRegistration';
import { ContractDashboard } from './pages/admin/ContractDashboard';
import { ContractCreator } from './pages/admin/ContractCreator';
import { MemberPortal } from './pages/member/MemberPortal';
import { ContractViewer } from './pages/contract/ContractViewer';
import { authService } from './services/authService';
import { dbService } from './services/dbService';
import { UserRole, User } from './types';
import { LogOut, LayoutGrid, Users, Calendar, FileText, Lock, MessageSquare, ChevronRight } from 'lucide-react';

// 1. 인증 컨텍스트 생성: 앱 어디서든 유저 정보와 로그아웃 기능을 일관되게 접근
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

// 2. ProtectedRoute: 권한이 없거나 비로그인 시 리다이렉트 처리
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: UserRole[] }> = ({ children, roles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold uppercase tracking-[0.3em] text-xs animate-pulse">Authenticating Hannam Access...</div>;

  if (!user) {
    // 로그인 페이지로 이동하되, 원래 가려던 주소를 state로 넘겨 로그인 후 돌아오게 함
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const defaultPath = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF].includes(user.role) ? '/admin' : '/member';
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
};

// 3. PublicRoute: 로그인한 사용자가 로그인 페이지에 접근하는 것을 방지
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) {
    const defaultPath = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF].includes(user.role) ? '/admin' : '/member';
    return <Navigate to={defaultPath} replace />;
  }
  return <>{children}</>;
};

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutGrid },
    { label: 'Reservations', path: '/admin/reservations', icon: Calendar },
    { label: 'Members', path: '/admin/members', icon: Users },
    { label: 'Contracts', path: '/admin/contracts', icon: FileText },
    { label: 'Inquiries', path: '/admin/inquiries', icon: MessageSquare },
  ];

  const activePath = navItems.find(item => location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path)))?.path || '/admin';

  return (
    <div className="flex flex-col h-screen bg-hannam-bg">
      <header className="bg-white px-10 py-4 flex justify-between items-center border-b border-hannam-border z-[100] shadow-sm">
        <div className="flex items-center gap-16">
          <div className="flex flex-col">
            <h1 className="text-xs font-serif font-bold tracking-[0.3em] text-hannam-text uppercase">WELLNESS, THE HANNAM</h1>
            <span className="text-[9px] font-bold text-hannam-gold uppercase tracking-[0.2em] mt-0.5">ADMIN INTELLIGENCE</span>
          </div>
          <nav className="flex gap-4">
            {navItems.map(item => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  activePath === item.path ? 'bg-hannam-green text-white shadow-md' : 'text-hannam-subtext hover:text-hannam-text'
                }`}
              >
                <item.icon className={`w-3.5 h-3.5 ${activePath === item.path ? 'text-hannam-gold' : 'opacity-40'}`} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right border-r border-hannam-border pr-6">
            <p className="text-[11px] font-bold text-hannam-text leading-none">{user.name}</p>
            <p className="text-[8px] font-bold text-hannam-gold uppercase tracking-widest mt-1">{user.role}</p>
          </div>
          <button onClick={() => { if(confirm('로그아웃 하시겠습니까?')) logout(); }} className="text-hannam-subtext hover:text-red-500 transition-colors p-2">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto no-scrollbar">{children}</main>
    </div>
  );
};

// Link 컴포넌트 커스텀 (Layout 내부용)
const Link: React.FC<{ to: string; className?: string; children: React.ReactNode }> = ({ to, className, children }) => {
  const navigate = useNavigate();
  return <button onClick={() => navigate(to)} className={className}>{children}</button>;
};

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState<'select' | 'member' | 'signup' | 'admin'>('select');
  const [memberId, setMemberId] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [signupData, setSignupData] = useState({ name: '', phone: '', email: '', gender: '여성', password: '' });

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await login('admin', adminEmail, adminPassword); } catch (err: any) { alert(err.message); }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await login('member', memberId, memberPassword); } catch (err: any) { alert(err.message); }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupData.name || !signupData.phone || !signupData.email || !signupData.password) return alert('모든 항목을 입력하세요.');
    try {
      await dbService.registerMember(signupData);
      alert('가입 완료! 등록하신 핸드폰 번호로 로그인하세요.');
      setMode('member');
      setMemberId(signupData.phone);
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white p-12 rounded-[40px] shadow-2xl border border-gray-100 text-center relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-hannam-green" />
        <div className="py-10">
          <h1 className="text-2xl font-serif font-bold text-hannam-green mb-2 tracking-[0.1em] uppercase">THE HANNAM</h1>
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.5em] mb-4">Registry Service Console</p>
        </div>
        
        {mode === 'select' && (
          <div className="space-y-4">
            <button onClick={() => setMode('member')} className="w-full py-5 bg-hannam-green text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:opacity-95 transition-all shadow-lg">
              Member Portal Access <ChevronRight className="w-4 h-4 text-hannam-gold" />
            </button>
            <button onClick={() => setMode('signup')} className="w-full py-5 bg-white border border-gray-100 text-gray-400 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-gray-50 transition-all">
              Membership Signup
            </button>
            <div className="pt-8 mt-8 border-t border-gray-50">
               <button onClick={() => setMode('admin')} className="text-gray-300 text-[10px] font-bold uppercase tracking-[0.3em] hover:text-hannam-green transition-colors flex items-center justify-center gap-2 mx-auto">
                 <Lock className="w-3 h-3" /> Staff Administration
               </button>
            </div>
          </div>
        )}

        {mode === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-6 animate-fade-in text-left">
            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
               <p className="text-xs font-bold text-gray-500 mb-2 text-center">관리자 전용 보안 접속 구역입니다.</p>
               <input type="email" placeholder="관리자 이메일" required value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full px-5 py-4 bg-white rounded-xl font-bold text-xs border border-transparent focus:border-hannam-gold outline-none" />
               <input type="password" placeholder="비밀번호" required value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full px-5 py-4 bg-white rounded-xl font-bold text-xs border border-transparent focus:border-hannam-gold outline-none" />
               <button type="submit" className="w-full py-5 bg-gray-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-xl">Admin 인증 및 입장</button>
            </div>
            <button type="button" onClick={() => setMode('select')} className="w-full text-[9px] font-bold text-gray-300 uppercase tracking-widest text-center">Back to Previous Step</button>
          </form>
        )}

        {(mode === 'member' || mode === 'signup') && (
           <form onSubmit={mode === 'member' ? handleMemberSubmit : handleSignupSubmit} className="space-y-5 text-left animate-fade-in">
              {mode === 'signup' && (
                 <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="성함" required value={signupData.name} onChange={e => setSignupData({...signupData, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-xl font-bold text-xs border border-transparent focus:border-hannam-gold outline-none" />
                    <select value={signupData.gender} onChange={e => setSignupData({...signupData, gender: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-xl font-bold text-xs border border-transparent focus:border-hannam-gold outline-none"><option>여성</option><option>남성</option></select>
                 </div>
              )}
              <input type="text" placeholder="연락처 (핸드폰 번호)" required value={mode === 'member' ? memberId : signupData.phone} onChange={e => mode === 'member' ? setMemberId(e.target.value) : setSignupData({...signupData, phone: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-xl font-bold text-xs border border-transparent focus:border-hannam-gold outline-none num-clean" />
              {mode === 'signup' && <input type="email" placeholder="이메일" required value={signupData.email} onChange={e => setSignupData({...signupData, email: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-xl font-bold text-xs border border-transparent focus:border-hannam-gold outline-none" />}
              <input type="password" placeholder="비밀번호" required value={mode === 'member' ? memberPassword : signupData.password} onChange={e => mode === 'member' ? setMemberPassword(e.target.value) : setSignupData({...signupData, password: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-xl font-bold text-xs border border-transparent focus:border-hannam-gold outline-none" />
              <button type="submit" className="w-full py-5 bg-hannam-green text-white rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] mt-4 shadow-xl">
                 {mode === 'member' ? 'Authenticate & Enter' : 'Complete Registration'}
              </button>
              <button type="button" onClick={() => setMode('select')} className="w-full text-[9px] font-bold text-gray-300 uppercase tracking-widest text-center mt-4">Back to Previous Step</button>
           </form>
        )}
      </div>
    </div>
  );
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = authService.getCurrentUser();
      if (storedUser) setUser(storedUser);
      setIsLoading(false);
    };
    // 가상의 네트워크 딜레이를 주어 초기 상태 확인이 끝날 때까지 렌더링을 막음 (무한 로딩 방지)
    const timer = setTimeout(checkAuth, 300);
    return () => clearTimeout(timer);
  }, []);

  const login = async (type: 'admin' | 'member', id: string, pw: string) => {
    let loggedUser: User;
    if (type === 'admin') loggedUser = await authService.adminLogin(id, pw);
    else loggedUser = await authService.memberLogin(id, pw);
    
    setUser(loggedUser);
    
    // 로그인 직전 가려던 페이지가 있으면 거기로, 없으면 권한별 메인으로 이동
    const from = (location.state as any)?.from?.pathname || (type === 'admin' ? '/admin' : '/member');
    navigate(from, { replace: true });
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

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><LoginScreen /></PublicRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}>
              <AdminLayout><AdminDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reservations" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}>
              <AdminLayout><AdminReservations /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/members" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}>
              <AdminLayout><AdminMembers /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/therapists" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}>
              <AdminLayout><AdminTherapists /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/member/:id" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}>
              <AdminLayout><MemberDetail /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/register" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}>
              <AdminLayout><MemberRegistration /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/contracts" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}>
              <AdminLayout><ContractDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/contract/new" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}>
              <AdminLayout><ContractCreator /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/care-session/:resId" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}>
              <AdminLayout><AdminCareSession /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/care-result/:id" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}>
              <AdminLayout><AdminCareResult /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/inquiries" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}>
              <AdminLayout><AdminInquiries /></AdminLayout>
            </ProtectedRoute>
          } />

          {/* Member Routes */}
          <Route path="/member" element={
            <ProtectedRoute roles={[UserRole.MEMBER]}>
              <MemberPortal />
            </ProtectedRoute>
          } />
          <Route path="/contract/:id" element={
            <ProtectedRoute>
              <ContractViewer />
            </ProtectedRoute>
          } />

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
