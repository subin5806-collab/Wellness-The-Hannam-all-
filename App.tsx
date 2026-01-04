
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminReservations } from './pages/admin/AdminReservations';
import { AdminMembers } from './pages/admin/AdminMembers';
import { AdminInquiries } from './pages/admin/AdminInquiries';
import { AdminCareSession } from './pages/admin/AdminCareSession';
import { AdminCareResult } from './pages/admin/AdminCareResult';
import { AdminNotices } from './pages/admin/AdminNotices';
import { MemberDetail } from './pages/admin/MemberDetail';
import { MemberRegistration } from './pages/admin/MemberRegistration';
import { ContractDashboard } from './pages/admin/ContractDashboard';
import { MemberPortal } from './pages/member/MemberPortal';
import { ContractViewer } from './pages/contract/ContractViewer';
import { AuthProvider, useAuth } from './AuthContext';
import { LanguageProvider } from './LanguageContext';
import { UserRole } from './types';
import { LogOut, LayoutGrid, Users, Calendar, FileText, MessageSquare, Megaphone, Lock, Mail, User as UserIcon, ArrowLeft, ShieldCheck } from 'lucide-react';
import { ADMIN_UI } from './constants/adminLocale';

const LoginScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [view, setView] = useState<'entry' | 'member-login' | 'register' | 'admin-login'>('entry');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form States
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [regData, setRegData] = useState({ name: '', phone: '', email: '', password: '' });

  const handleMemberLogin = async () => {
    if (!id || !password) return alert('정보를 모두 입력해 주세요.');
    setIsLoading(true);
    try {
      await login('member', id, password);
    } catch (e: any) {
      alert(e.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!id || !password) return alert('관리자 아이디와 비밀번호를 입력해 주세요.');
    setIsLoading(true);
    try {
      await login('admin', id, password);
    } catch (e: any) {
      alert(e.message || '관리자 인증에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberRegister = async () => {
    if (!regData.name || !regData.phone || !regData.email || !regData.password) {
      return alert('모든 항목을 입력해 주세요.');
    }
    setIsLoading(true);
    try {
      await register(regData);
    } catch (e: any) {
      alert(e.message || '가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const EntryView = () => (
    <div className="space-y-8 animate-smooth-fade w-full max-w-[320px] mx-auto">
      <div className="space-y-3.5">
        <button 
          onClick={() => { setView('member-login'); setId(''); setPassword(''); }}
          className="w-full py-5.5 bg-[#1A362E] text-white rounded-[40px] font-bold text-[14px] shadow-[0_15px_30px_rgba(26,54,46,0.12)] hover:bg-black transition-all active:scale-[0.98] tracking-widest uppercase"
        >
          회원 로그인
        </button>
        <button 
          onClick={() => setView('register')}
          className="w-full py-5.5 bg-white border border-[#EAE7E2] text-[#1A362E] rounded-[40px] font-bold text-[14px] hover:bg-gray-50 transition-all active:scale-[0.98] tracking-widest uppercase"
        >
          신규 회원 가입
        </button>
      </div>

      <div className="text-center pt-2">
        <button 
          onClick={() => { setView('admin-login'); setId(''); setPassword(''); }}
          className="text-[10px] font-bold text-[#A0A0A0] hover:text-[#1A362E] transition-colors tracking-widest uppercase opacity-60 hover:opacity-100"
        >
          관리자 전용
        </button>
      </div>
    </div>
  );

  const MemberLoginView = () => (
    <div className="space-y-6 animate-smooth-fade w-full max-w-[320px] mx-auto">
      <div className="space-y-3">
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A0A0A0] group-focus-within:text-[#1A362E] transition-colors">
            <UserIcon className="w-4.5 h-4.5" />
          </div>
          <input 
            type="text" 
            placeholder="휴대폰 번호" 
            value={id} 
            onChange={e => setId(e.target.value)} 
            className="w-full pl-14 pr-5 py-4 bg-[#F9F9F9] border-none rounded-[24px] text-[13px] font-semibold outline-none ring-1 ring-transparent focus:ring-[#1A362E]/10 focus:bg-white transition-all tracking-tight" 
          />
        </div>
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A0A0A0] group-focus-within:text-[#1A362E] transition-colors">
            <Lock className="w-4.5 h-4.5" />
          </div>
          <input 
            type="password" 
            placeholder="비밀번호" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleMemberLogin()}
            className="w-full pl-14 pr-5 py-4 bg-[#F9F9F9] border-none rounded-[24px] text-[13px] font-semibold outline-none ring-1 ring-transparent focus:ring-[#1A362E]/10 focus:bg-white transition-all tracking-tight" 
          />
        </div>
      </div>
      <div className="space-y-3">
        <button 
          onClick={handleMemberLogin} 
          disabled={isLoading}
          className="w-full py-5 bg-[#1A362E] text-white rounded-[24px] font-bold text-[14px] shadow-lg hover:bg-black transition-all disabled:opacity-50 tracking-widest"
        >
          {isLoading ? '인증 중...' : '로그인'}
        </button>
        <button onClick={() => setView('entry')} className="w-full py-1.5 text-[10px] font-bold text-[#A0A0A0] flex items-center justify-center gap-1.5 hover:text-[#1A362E] transition-colors uppercase tracking-widest">
          <ArrowLeft className="w-3 h-3" /> 이전으로
        </button>
      </div>
    </div>
  );

  const RegisterView = () => (
    <div className="space-y-5 animate-smooth-fade w-full max-w-[320px] mx-auto">
      <div className="space-y-2.5">
        <input 
          type="text" 
          placeholder="성함" 
          value={regData.name} 
          onChange={e => setRegData({...regData, name: e.target.value})}
          className="w-full px-5 py-3.5 bg-[#F9F9F9] border-none rounded-[20px] text-[13px] font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-[#1A362E]/10 transition-all" 
        />
        <input 
          type="text" 
          placeholder="휴대폰 번호 (- 제외)" 
          value={regData.phone} 
          onChange={e => setRegData({...regData, phone: e.target.value})}
          className="w-full px-5 py-3.5 bg-[#F9F9F9] border-none rounded-[20px] text-[13px] font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-[#1A362E]/10 transition-all" 
        />
        <input 
          type="email" 
          placeholder="이메일 주소" 
          value={regData.email} 
          onChange={e => setRegData({...regData, email: e.target.value})}
          className="w-full px-5 py-3.5 bg-[#F9F9F9] border-none rounded-[20px] text-[13px] font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-[#1A362E]/10 transition-all" 
        />
        <input 
          type="password" 
          placeholder="비밀번호" 
          value={regData.password} 
          onChange={e => setRegData({...regData, password: e.target.value})}
          className="w-full px-5 py-3.5 bg-[#F9F9F9] border-none rounded-[20px] text-[13px] font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-[#1A362E]/10 transition-all" 
        />
      </div>
      <div className="space-y-3 pt-2">
        <button 
          onClick={handleMemberRegister} 
          disabled={isLoading}
          className="w-full py-5 bg-[#1A362E] text-white rounded-[24px] font-bold text-[14px] shadow-lg hover:bg-black transition-all disabled:opacity-50 tracking-widest"
        >
          {isLoading ? '가입 중...' : '가입 완료'}
        </button>
        <button onClick={() => setView('entry')} className="w-full py-1.5 text-[10px] font-bold text-[#A0A0A0] flex items-center justify-center gap-1.5 hover:text-[#1A362E] transition-colors uppercase tracking-widest">
          <ArrowLeft className="w-3 h-3" /> 취소하고 돌아가기
        </button>
      </div>
    </div>
  );

  const AdminLoginView = () => (
    <div className="space-y-6 animate-smooth-fade w-full max-w-[320px] mx-auto">
      <div className="space-y-3">
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A0A0A0] group-focus-within:text-[#1A362E] transition-colors">
            <Mail className="w-4.5 h-4.5" />
          </div>
          <input 
            type="text" 
            placeholder="관리자 ID" 
            value={id} 
            onChange={e => setId(e.target.value)} 
            className="w-full pl-14 pr-5 py-4 bg-[#F9F9F9] border-none rounded-[24px] text-[13px] font-semibold outline-none ring-1 ring-transparent focus:ring-[#1A362E]/10 focus:bg-white transition-all tracking-widest uppercase" 
          />
        </div>
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A0A0A0] group-focus-within:text-[#1A362E] transition-colors">
            <Lock className="w-4.5 h-4.5" />
          </div>
          <input 
            type="password" 
            placeholder="비밀번호" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
            className="w-full pl-14 pr-5 py-4 bg-[#F9F9F9] border-none rounded-[24px] text-[13px] font-semibold outline-none ring-1 ring-transparent focus:ring-[#1A362E]/10 focus:bg-white transition-all tracking-widest uppercase" 
          />
        </div>
      </div>
      <div className="space-y-3">
        <button 
          onClick={handleAdminLogin} 
          disabled={isLoading}
          className="w-full py-5 bg-[#1A362E] text-white rounded-[24px] font-bold text-[14px] shadow-lg hover:bg-black transition-all disabled:opacity-50 tracking-widest"
        >
          {isLoading ? '인증 중...' : '관리자 로그인'}
        </button>
        <button onClick={() => setView('entry')} className="w-full py-1.5 text-[10px] font-bold text-[#A0A0A0] flex items-center justify-center gap-1.5 hover:text-[#1A362E] transition-colors uppercase tracking-widest">
          <ArrowLeft className="w-3 h-3" /> 일반 화면으로
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F7F5] p-6 font-sans">
      <div className="w-full max-w-[420px] bg-white rounded-[48px] shadow-[0_25px_70px_rgba(0,0,0,0.025)] p-12 md:p-14 space-y-12 animate-smooth-fade border border-white">
        <div className="text-center space-y-4">
          <h1 className="text-[24px] font-serif font-medium text-[#1A362E] tracking-[0.15em] uppercase leading-none whitespace-nowrap overflow-hidden">
            Wellness, The Hannam
          </h1>
          <div className="flex justify-center items-center gap-3">
            <div className="h-[1px] w-6 bg-[#EAE7E2]" />
            <p className="text-[11px] font-bold text-[#A0A0A0] tracking-[0.3em] uppercase whitespace-nowrap">
              {view === 'register' ? 'Registration' : 'Integrated System'}
            </p>
            <div className="h-[1px] w-6 bg-[#EAE7E2]" />
          </div>
        </div>

        {view === 'entry' && <EntryView />}
        {view === 'member-login' && <MemberLoginView />}
        {view === 'register' && <RegisterView />}
        {view === 'admin-login' && <AdminLoginView />}
      </div>
      <div className="mt-10 opacity-10 flex items-center gap-2 select-none">
        <ShieldCheck className="w-3 h-3" />
        <span className="text-[8px] font-black tracking-[0.2em] uppercase">Private Security Infrastructure</span>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: UserRole[]; theme?: string }> = ({ children, roles, theme }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold uppercase tracking-[0.3em] text-xs">Authenticating...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) {
    const defaultPath = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF].includes(user.role) ? '/admin' : '/member';
    return <Navigate to={defaultPath} replace />;
  }
  return <div className={`min-h-screen ${theme || 'bg-hannam-bg'}`}>{children}</div>;
};

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
    { label: ADMIN_UI.navigation.dashboard, path: '/admin', icon: LayoutGrid },
    { label: ADMIN_UI.navigation.reservations, path: '/admin/reservations', icon: Calendar },
    { label: ADMIN_UI.navigation.members, path: '/admin/members', icon: Users },
    { label: ADMIN_UI.navigation.contracts, path: '/admin/contracts', icon: FileText },
    { label: ADMIN_UI.navigation.inquiries, path: '/admin/inquiries', icon: MessageSquare },
    { label: ADMIN_UI.navigation.notice, path: '/admin/notices', icon: Megaphone },
  ];

  const activePath = navItems.find(item => 
    location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))
  )?.path || '/admin';

  return (
    <div className="flex flex-col h-screen bg-hannam-bg overflow-hidden font-sans">
      <header className="bg-white border-b border-hannam-border px-10 h-20 flex justify-between items-center z-[100] shadow-sm">
        <div className="flex items-center h-full gap-16">
          <h1 onClick={() => navigate('/admin')} className="text-sm font-serif font-bold tracking-[0.15em] text-hannam-green uppercase cursor-pointer">Wellness, The Hannam</h1>
          <nav className="flex h-full gap-1">
            {navItems.map(item => (
              <button key={item.path} onClick={() => navigate(item.path)} className={`relative flex items-center gap-2.5 px-6 h-full text-[12px] font-bold transition-all ${activePath === item.path ? 'text-hannam-green' : 'text-hannam-muted hover:text-hannam-text'}`}>
                <item.icon className={`w-4 h-4 ${activePath === item.path ? 'opacity-100' : 'opacity-40'}`} boat-id="lucide-icon" />
                {item.label}
                {activePath === item.path && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-hannam-green" />}
              </button>
            ))}
          </nav>
        </div>
        <button onClick={() => confirm('관리자 콘솔에서 로그아웃 하시겠습니까?') && logout()} className="text-hannam-muted hover:text-red-500 transition-colors flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest">
          <LogOut className="w-4 h-4" /> 로그아웃
        </button>
      </header>
      <main className="flex-1 overflow-y-auto no-scrollbar">{children}</main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginScreen /></PublicRoute>} />
            <Route path="/admin" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/reservations" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><AdminReservations /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/members" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><AdminMembers /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/contracts" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><ContractDashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/notices" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]}><AdminLayout><AdminNotices /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/inquiries" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><AdminInquiries /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/member/:id" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><MemberDetail /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/register" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><MemberRegistration /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/care-session/:resId" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><AdminCareSession /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/care-result/:id" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><AdminCareResult /></AdminLayout></ProtectedRoute>} />
            <Route path="/member" element={<ProtectedRoute roles={[UserRole.MEMBER]}><MemberPortal /></ProtectedRoute>} />
            <Route path="/contract/:id" element={<ProtectedRoute><ContractViewer /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </HashRouter>
  );
};
export default App;
