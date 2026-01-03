
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
import { ContractCreator } from './pages/admin/ContractCreator';
import { MemberPortal } from './pages/member/MemberPortal';
import { ContractViewer } from './pages/contract/ContractViewer';
import { AuthProvider, useAuth } from './AuthContext';
import { LanguageProvider } from './LanguageContext';
import { UserRole } from './types';
import { LogOut, LayoutGrid, Users, Calendar, FileText, MessageSquare, Megaphone } from 'lucide-react';
import { ADMIN_UI } from './constants/adminLocale';

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState<'admin' | 'member'>('member');

  return (
    <div className="min-h-screen flex items-center justify-center bg-hannam-bg p-4">
      <div className="bg-white p-10 rounded-[32px] shadow-hannam-deep border border-hannam-border w-full max-w-md space-y-6">
        <h2 className="text-xl font-serif font-bold text-hannam-green text-center uppercase tracking-widest">The Hannam Login</h2>
        <div className="flex bg-hannam-bg p-1 rounded-xl">
          <button onClick={() => setType('member')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${type === 'member' ? 'bg-white shadow-sm text-hannam-green' : 'text-hannam-muted'}`}>MEMBER</button>
          <button onClick={() => setType('admin')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${type === 'admin' ? 'bg-white shadow-sm text-hannam-green' : 'text-hannam-muted'}`}>ADMIN</button>
        </div>
        <input type="text" placeholder={type === 'admin' ? "Email" : "Phone Number"} value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-hannam-bg border border-hannam-border rounded-xl text-sm" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-hannam-bg border border-hannam-border rounded-xl text-sm" />
        <button onClick={() => login(type, email, password)} className="w-full py-4 bg-hannam-green text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-black transition-all">Sign In</button>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: UserRole[]; theme?: string }> = ({ children, roles, theme }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold uppercase tracking-[0.3em] text-xs">인증 진행 중...</div>;
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
    { label: "공지 관리", path: '/admin/notices', icon: Megaphone },
  ];

  const activePath = navItems.find(item => 
    location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))
  )?.path || '/admin';

  return (
    <div className="flex flex-col h-screen bg-hannam-bg overflow-hidden font-sans">
      <header className="bg-white border-b border-hannam-border px-10 py-0 flex justify-between items-center z-[100] h-20 shadow-sm">
        <div className="flex items-center h-full gap-16">
          <div className="flex flex-col cursor-pointer" onClick={() => navigate('/admin')}>
            <h1 className="text-sm font-serif font-bold tracking-[0.15em] text-hannam-green uppercase whitespace-nowrap">Wellness, The Hannam</h1>
          </div>
          <nav className="flex h-full gap-1">
            {navItems.map(item => (
              <button key={item.path} onClick={() => navigate(item.path)} className={`relative flex items-center gap-2.5 px-6 h-full text-[12px] font-bold transition-all ${activePath === item.path ? 'text-hannam-green' : 'text-hannam-muted hover:text-hannam-text'}`}>
                <item.icon className={`w-4 h-4 ${activePath === item.path ? 'opacity-100' : 'opacity-40'}`} />
                {item.label}
                {activePath === item.path && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-hannam-green" />}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-8">
          <button onClick={() => confirm('로그아웃 하시겠습니까?') && logout()} className="text-hannam-muted hover:text-red-500 transition-colors flex items-center gap-2 text-[11px] font-bold">
            <LogOut className="w-4 h-4" /> 로그아웃
          </button>
        </div>
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
