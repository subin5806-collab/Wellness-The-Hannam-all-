
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

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: UserRole[]; theme?: string }> = ({ children, roles, theme }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold uppercase tracking-[0.3em] text-xs animate-pulse">WELLNESS ARCHIVE...</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const defaultPath = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF].includes(user.role) ? '/admin' : '/member';
    return <Navigate to={defaultPath} replace />;
  }

  return <div className={`min-h-screen transition-all duration-700 ${theme || 'bg-hannam-bg'}`}>{children}</div>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold uppercase tracking-[0.3em] text-xs animate-pulse">WELLNESS ARCHIVE...</div>;
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
    <div className="flex flex-col h-screen bg-transparent">
      <header className="bg-white/80 backdrop-blur-md px-10 py-4 flex justify-between items-center border-b border-hannam-border z-[100] shadow-sm sticky top-0">
        <div className="flex items-center gap-16">
          <div className="flex flex-col">
            <h1 className="text-xs font-serif font-bold tracking-[0.3em] text-hannam-green uppercase">WELLNESS, THE HANNAM</h1>
            <span className="text-[9px] font-bold text-hannam-gold uppercase tracking-[0.2em] mt-0.5">Admin Registry</span>
          </div>
          <nav className="flex gap-4">
            {navItems.map(item => (
              <button 
                key={item.path} 
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activePath === item.path ? 'bg-hannam-green text-white shadow-lg' : 'text-gray-400 hover:text-black'
                }`}
              >
                <item.icon className={`w-3.5 h-3.5 ${activePath === item.path ? 'text-hannam-gold' : 'opacity-40'}`} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right border-r border-hannam-border pr-6">
            <p className="text-[11px] font-bold text-hannam-text leading-none">{user.name}</p>
            <p className="text-[8px] font-bold text-hannam-gold uppercase tracking-widest mt-1">{user.role}</p>
          </div>
          <button onClick={() => { if(confirm('로그아웃 하시겠습니까?')) logout(); }} className="text-gray-400 hover:text-red-500 transition-colors p-2">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto no-scrollbar">{children}</main>
    </div>
  );
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
    try {
      await dbService.registerMember(signupData);
      alert('가입 완료! 등록하신 핸드폰 번호로 로그인하세요.');
      setMode('member');
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-sans bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="w-full max-w-md bg-white p-12 rounded-[50px] shadow-2xl border border-gray-100 text-center relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 w-full h-2 bg-hannam-green" />
        <div className="py-10">
          <h1 className="text-2xl font-serif font-bold text-hannam-green mb-2 tracking-[0.2em] uppercase">THE HANNAM</h1>
          <p className="text-[10px] font-black text-hannam-gold uppercase tracking-[0.4em] mb-4">Wellness Registry Console</p>
        </div>
        
        {mode === 'select' && (
          <div className="space-y-4">
            <button onClick={() => setMode('member')} className="w-full py-6 bg-hannam-green text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:shadow-xl transition-all">
              Private Access Portal <ChevronRight className="w-4 h-4 text-hannam-gold" />
            </button>
            <button onClick={() => setMode('signup')} className="w-full py-6 bg-white border border-gray-100 text-gray-400 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-gray-50 transition-all">
              Membership Registration
            </button>
            <div className="pt-8 mt-8 border-t border-gray-50">
               <button onClick={() => setMode('admin')} className="text-gray-300 text-[10px] font-black uppercase tracking-[0.3em] hover:text-hannam-green transition-colors flex items-center justify-center gap-2 mx-auto">
                 <Lock className="w-3 h-3" /> System Administrator
               </button>
            </div>
          </div>
        )}

        {(mode === 'admin' || mode === 'member' || mode === 'signup') && (
           <form onSubmit={mode === 'admin' ? handleAdminSubmit : (mode === 'member' ? handleMemberSubmit : handleSignupSubmit)} className="space-y-5 text-left animate-fade-in">
              {mode === 'signup' && (
                 <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="성함" required value={signupData.name} onChange={e => setSignupData({...signupData, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl font-bold text-xs outline-none" />
                    <select value={signupData.gender} onChange={e => setSignupData({...signupData, gender: e.target.value as any})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl font-bold text-xs outline-none"><option>여성</option><option>남성</option></select>
                 </div>
              )}
              <input 
                type={mode === 'admin' ? 'email' : 'text'} 
                placeholder={mode === 'admin' ? '이메일' : '연락처 (ID)'} 
                required 
                value={mode === 'admin' ? adminEmail : (mode === 'member' ? memberId : signupData.phone)} 
                onChange={e => mode === 'admin' ? setAdminEmail(e.target.value) : (mode === 'member' ? setMemberId(e.target.value) : setSignupData({...signupData, phone: e.target.value}))} 
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl font-bold text-xs outline-none num-clean" 
              />
              <input 
                type="password" 
                placeholder="비밀번호" 
                required 
                value={mode === 'admin' ? adminPassword : (mode === 'member' ? memberPassword : signupData.password)} 
                onChange={e => mode === 'admin' ? setAdminPassword(e.target.value) : (mode === 'member' ? setMemberPassword(e.target.value) : setSignupData({...signupData, password: e.target.value}))} 
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl font-bold text-xs outline-none" 
              />
              <button type="submit" className="w-full py-6 bg-hannam-green text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] mt-4 shadow-xl">
                 Authenticate & Enter
              </button>
              <button type="button" onClick={() => setMode('select')} className="w-full text-[9px] font-black text-gray-300 uppercase tracking-widest text-center mt-4">Go Back</button>
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

  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) setUser(storedUser);
    setIsLoading(false);
  }, []);

  const login = async (type: 'admin' | 'member', id: string, pw: string) => {
    let loggedUser: User;
    if (type === 'admin') loggedUser = await authService.adminLogin(id, pw);
    else loggedUser = await authService.memberLogin(id, pw);
    setUser(loggedUser);
    const defaultPath = type === 'admin' ? '/admin' : '/member';
    navigate(defaultPath, { replace: true });
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
          <Route path="/login" element={<PublicRoute><LoginScreen /></PublicRoute>} />
          
          <Route path="/admin" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]} theme="bg-[#F4F9F6]">
              <AdminLayout><AdminDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reservations" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]} theme="bg-[#F4F7FB]">
              <AdminLayout><AdminReservations /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/members" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]} theme="bg-[#F9F9F9]">
              <AdminLayout><AdminMembers /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/contracts" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]} theme="bg-[#FBF9F6]">
              <AdminLayout><ContractDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/contract/new" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]} theme="bg-[#FBF9F6]">
              <AdminLayout><ContractCreator /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/inquiries" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]} theme="bg-[#FFFCF7]">
              <AdminLayout><AdminInquiries /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/member/:id" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]} theme="bg-[#F9F9F9]">
              <AdminLayout><MemberDetail /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/register" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]} theme="bg-[#F9F9F9]">
              <AdminLayout><MemberRegistration /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/care-session/:resId" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]} theme="bg-[#F4F9F6]">
              <AdminLayout><AdminCareSession /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/care-result/:id" element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]} theme="bg-[#F4F9F6]">
              <AdminLayout><AdminCareResult /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/member" element={
            <ProtectedRoute roles={[UserRole.MEMBER]} theme="bg-[#FDFDFD]">
              <MemberPortal />
            </ProtectedRoute>
          } />
          
          <Route path="/contract/:id" element={
            <ProtectedRoute theme="bg-[#FDFDFD]">
              <ContractViewer />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
