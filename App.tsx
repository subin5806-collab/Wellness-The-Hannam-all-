
import React, { useState } from 'react';
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
import { AuthProvider, useAuth } from './AuthContext';
import { LanguageProvider } from './LanguageContext';
import { dbService } from './services/dbService';
import { UserRole } from './types';
import { LogOut, LayoutGrid, Users, Calendar, FileText, Lock, MessageSquare, ShieldAlert, Clock } from 'lucide-react';
import { ADMIN_UI } from './constants/adminLocale';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: UserRole[]; theme?: string }> = ({ children, roles, theme }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold uppercase tracking-[0.3em] text-xs">
      AUTHENTICATING...
    </div>
  );
  
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
  const { user, logout, sessionTimeLeft, resetSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  if (!user) return null;

  const navItems = [
    { label: ADMIN_UI.navigation.dashboard, path: '/admin', icon: LayoutGrid },
    { label: ADMIN_UI.navigation.reservations, path: '/admin/reservations', icon: Calendar },
    { label: ADMIN_UI.navigation.members, path: '/admin/members', icon: Users },
    { label: ADMIN_UI.navigation.contracts, path: '/admin/contracts', icon: FileText },
    { label: ADMIN_UI.navigation.inquiries, path: '/admin/inquiries', icon: MessageSquare },
  ];

  const activePath = navItems.find(item => 
    location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))
  )?.path || '/admin';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-hannam-bg">
      {/* Session Warning Overlay */}
      {sessionTimeLeft <= 60 && (
        <div className="fixed inset-0 bg-hannam-text/60 backdrop-blur-md z-[999] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] p-12 max-w-md w-full text-center shadow-hannam-deep animate-smooth-fade">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShieldAlert className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-xl font-serif font-bold text-hannam-green mb-2 uppercase">세션 만료 예정</h2>
            <p className="text-sm text-hannam-muted mb-8 leading-relaxed">
              보안을 위해 60초 후 세션이 종료됩니다.<br/>계속 작업을 진행하시겠습니까?
            </p>
            <div className="flex gap-4">
              <button onClick={() => logout()} className="flex-1 py-4 bg-hannam-bg text-hannam-muted rounded-2xl text-[10px] font-bold uppercase tracking-widest">로그아웃</button>
              <button onClick={() => resetSession()} className="flex-1 py-4 btn-hannam-primary text-[10px] font-bold uppercase tracking-widest shadow-lg">세션 연장 ({sessionTimeLeft}초)</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-xl px-10 py-5 flex justify-between items-center border-b border-hannam-border z-[100] sticky top-0">
        <div className="flex items-center gap-16">
          <div className="flex flex-col">
            <h1 className="text-xs font-serif font-bold tracking-[0.2em] text-hannam-green uppercase">WELLNESS, THE HANNAM</h1>
          </div>
          <nav className="flex gap-1.5">
            {navItems.map(item => (
              <button 
                key={item.path} 
                onClick={() => navigate(item.path)} 
                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  activePath === item.path ? 'bg-hannam-green text-white shadow-hannam-soft' : 'text-hannam-muted hover:text-hannam-text'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 border-r border-hannam-border pr-6">
            <div className="flex flex-col text-right">
              <p className="text-[11px] font-bold text-hannam-text leading-none">{user.name}</p>
              <div className="flex items-center justify-end gap-1.5 mt-1.5">
                <Clock className={`w-3 h-3 ${sessionTimeLeft < 300 ? 'text-red-500' : 'text-hannam-gold'}`} />
                <span className={`text-[9px] font-bold num-data ${sessionTimeLeft < 300 ? 'text-red-500' : 'text-hannam-muted'}`}>{formatTime(sessionTimeLeft)}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => { if(confirm('로그아웃 하시겠습니까?')) logout(); }} 
            className="text-hannam-muted hover:text-red-500 transition-colors p-2"
          >
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
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try { 
      await login('admin', adminEmail, adminPassword); 
    } catch (err: any) { 
      alert(err.message); 
      setIsAuthenticating(false);
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try { 
      await login('member', memberId, memberPassword); 
    } catch (err: any) { 
      alert(err.message); 
      setIsAuthenticating(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try {
      if (!signupData.name || !signupData.phone || !signupData.email || !signupData.password) {
        throw new Error('모든 정보를 입력해 주세요.');
      }
      await dbService.registerMember(signupData);
      alert('가입 완료! 등록하신 핸드폰 번호로 로그인하세요.');
      setMode('member');
      setMemberId(signupData.phone);
    } catch (e: any) { 
      alert(e.message); 
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-hannam-bg flex items-center justify-center p-6 animate-smooth-fade">
      <div className="w-full max-w-md bg-white p-12 rounded-[40px] shadow-hannam-soft text-center relative border border-[#F1EFEA]">
        <div className="py-12">
          <h1 className="text-2xl font-serif font-bold text-hannam-green mb-2 tracking-[0.2em] uppercase">THE HANNAM</h1>
          <p className="text-[10px] font-bold text-hannam-muted uppercase tracking-[0.4em]">통합 관리 시스템</p>
        </div>
        
        {mode === 'select' && (
          <div className="space-y-4">
            <button onClick={() => setMode('member')} className="w-full py-6 bg-hannam-green text-white rounded-[24px] font-bold text-[11px] uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all">
              회원 포털 로그인
            </button>
            <button onClick={() => setMode('signup')} className="w-full py-6 bg-white border border-hannam-border text-hannam-muted rounded-[24px] font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-hannam-bg transition-all">
              신규 회원 등록
            </button>
            <div className="pt-10">
               <button onClick={() => setMode('admin')} className="text-hannam-muted text-[10px] font-bold uppercase tracking-[0.3em] hover:text-hannam-green transition-colors">
                 관리자 로그인
               </button>
            </div>
          </div>
        )}

        {(mode === 'admin' || mode === 'member' || mode === 'signup') && (
           <form onSubmit={mode === 'admin' ? handleAdminSubmit : (mode === 'member' ? handleMemberSubmit : handleSignupSubmit)} className="space-y-5 text-left animate-smooth-fade">
              {mode === 'signup' && (
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                       <input type="text" placeholder="성함" required value={signupData.name} onChange={e => setSignupData({...signupData, name: e.target.value})} className="w-full px-5 py-4 bg-[#F9F8F6] rounded-2xl font-medium text-xs outline-none border border-transparent focus:border-hannam-gold transition-all" />
                       <select value={signupData.gender} onChange={e => setSignupData({...signupData, gender: e.target.value as any})} className="w-full px-5 py-4 bg-[#F9F8F6] rounded-2xl font-medium text-xs outline-none"><option>여성</option><option>남성</option></select>
                    </div>
                    <input type="text" placeholder="연락처 (ID)" required value={signupData.phone} onChange={e => setSignupData({...signupData, phone: e.target.value})} className="w-full px-5 py-4 bg-[#F9F8F6] rounded-2xl font-medium text-xs outline-none border border-transparent focus:border-hannam-gold transition-all" />
                    <input type="email" placeholder="이메일 주소" required value={signupData.email} onChange={e => setSignupData({...signupData, email: e.target.value})} className="w-full px-5 py-4 bg-[#F9F8F6] rounded-2xl font-medium text-xs outline-none border border-transparent focus:border-hannam-gold transition-all" />
                 </div>
              )}
              
              {mode !== 'signup' && (mode === 'admin' ? (
                <input type="email" placeholder="이메일" required value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full px-5 py-4 bg-[#F9F8F6] rounded-2xl font-medium text-xs outline-none border border-transparent focus:border-hannam-gold transition-all" />
              ) : (
                <input type="text" placeholder="연락처 (ID)" required value={memberId} onChange={e => setMemberId(e.target.value)} className="w-full px-5 py-4 bg-[#F9F8F6] rounded-2xl font-medium text-xs outline-none border border-transparent focus:border-hannam-gold transition-all" />
              ))}

              <input type="password" placeholder="비밀번호" required value={mode === 'admin' ? adminPassword : (mode === 'member' ? memberPassword : signupData.password)} onChange={e => mode === 'admin' ? setAdminPassword(e.target.value) : (mode === 'member' ? setMemberPassword(e.target.value) : setSignupData({...signupData, password: e.target.value}))} className="w-full px-5 py-4 bg-[#F9F8F6] rounded-2xl font-medium text-xs outline-none border border-transparent focus:border-hannam-gold transition-all" />

              <button type="submit" disabled={isAuthenticating} className="w-full py-6 bg-hannam-green text-white rounded-[24px] font-bold text-[11px] uppercase tracking-[0.2em] mt-4 shadow-lg hover:bg-black transition-all disabled:opacity-30">
                 {isAuthenticating ? '인증 중...' : (mode === 'signup' ? '가입 완료' : '로그인')}
              </button>
              <button type="button" onClick={() => setMode('select')} className="w-full text-[9px] font-bold text-hannam-muted uppercase tracking-widest text-center mt-4">뒤로가기</button>
           </form>
        )}
      </div>
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
            <Route path="/admin" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]} theme="bg-hannam-bg"><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/reservations" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><AdminReservations /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/members" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><AdminMembers /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/contracts" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><ContractDashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/contract/new" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><ContractCreator /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/inquiries" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><AdminInquiries /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/member/:id" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><MemberDetail /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/register" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><MemberRegistration /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/care-session/:resId" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><AdminCareSession /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/care-result/:id" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]}><AdminLayout><AdminCareResult /></AdminLayout></ProtectedRoute>} />
            <Route path="/member" element={<ProtectedRoute roles={[UserRole.MEMBER]}><MemberPortal /></ProtectedRoute>} />
            <Route path="/contract/:id" element={<ProtectedRoute><ContractViewer /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </HashRouter>
  );
};
export default App;
