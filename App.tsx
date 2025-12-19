
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
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
import { dbService, validateEmail } from './services/dbService';
import { UserRole, User } from './types';
// Fixed: Added missing ChevronRight from lucide-react imports
import { LogOut, LayoutGrid, Users, Calendar, FileText, Settings, Shield, ChevronRight } from 'lucide-react';

const AdminLayout: React.FC<{ user: User; onLogout: () => void; children: React.ReactNode }> = ({ user, onLogout, children }) => {
  const location = useLocation();
  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutGrid },
    { label: 'Reservations', path: '/admin/reservations', icon: Calendar },
    { label: 'Members', path: '/admin/members', icon: Users },
    { label: 'Staffs', path: '/admin/therapists', icon: Settings },
    { label: 'Contracts', path: '/admin/contracts', icon: FileText },
  ];

  const activePath = navItems.find(item => location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path)))?.path || '/admin';

  return (
    <div className="flex flex-col h-screen bg-hannam-bg">
      <header className="bg-white px-10 py-4 flex justify-between items-center border-b border-hannam-border z-[100] shadow-sm">
        <div className="flex items-center gap-16">
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 bg-hannam-green rounded-full flex items-center justify-center text-white text-[8px] font-bold">Logo</div>
             <div className="flex flex-col">
               <h1 className="text-xs font-serif font-bold tracking-[0.3em] text-hannam-text uppercase">WELLNESS, THE HANNAM</h1>
               <span className="text-[9px] font-bold text-hannam-gold uppercase tracking-[0.2em] mt-0.5">ADMIN INTELLIGENCE</span>
             </div>
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
          <button onClick={onLogout} className="text-hannam-subtext hover:text-red-500 transition-colors p-2">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto no-scrollbar">{children}</main>
    </div>
  );
};

const LoginScreen: React.FC<{ 
  onAdminLogin: (role: UserRole) => void; 
  onMemberLogin: (id: string, pw: string) => void;
  onMemberSignup: (data: any) => Promise<void>;
}> = ({ onAdminLogin, onMemberLogin, onMemberSignup }) => {
  const [mode, setMode] = useState<'select' | 'member' | 'signup'>('select');
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [signupData, setSignupData] = useState({ name: '', phone: '', email: '', gender: '여성', password: '' });

  const handleLoginSubmit = (e: React.FormEvent) => { e.preventDefault(); onMemberLogin(memberId, password); };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupData.name || !signupData.phone || !signupData.email || !signupData.password) return alert('모든 항목을 입력하세요.');
    if (!validateEmail(signupData.email)) return alert('유효한 이메일을 입력하세요.');
    try {
      await onMemberSignup(signupData);
      alert('가입 완료! 핸드폰 번호로 로그인하세요.');
      setMode('member');
      setMemberId(signupData.phone);
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="min-h-screen bg-hannam-gray-bg flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white p-12 rounded-[32px] shadow-2xl border border-hannam-border text-center relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-hannam-green" />
        <div className="w-16 h-16 bg-hannam-green rounded-2xl mx-auto flex items-center justify-center mb-8 shadow-xl">
          <Shield className="w-8 h-8 text-hannam-gold" />
        </div>
        <h1 className="text-2xl font-serif font-medium text-hannam-text mb-2 tracking-[0.1em] uppercase">WELLNESS, THE HANNAM</h1>
        <p className="text-[9px] font-bold text-hannam-subtext uppercase tracking-[0.5em] mb-12">INTELLIGENCE REGISTRY SERVICE</p>
        
        {mode === 'select' && (
          <div className="space-y-4">
            <button onClick={() => setMode('member')} className="w-full py-5 bg-hannam-green text-white rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:opacity-95 transition-all shadow-lg">
              Member Portal Access <ChevronRight className="w-4 h-4 text-hannam-gold" />
            </button>
            <button onClick={() => setMode('signup')} className="w-full py-5 bg-white border border-hannam-border text-hannam-text rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-hannam-gray-bg transition-all">
              Private Membership Join
            </button>
            <div className="pt-8 mt-8 border-t border-hannam-border">
               <button onClick={() => onAdminLogin(UserRole.SUPER_ADMIN)} className="text-hannam-subtext text-[10px] font-bold uppercase tracking-[0.3em] hover:text-hannam-green transition-colors">Administrator Access</button>
            </div>
          </div>
        )}

        {(mode === 'member' || mode === 'signup') && (
           <form onSubmit={mode === 'member' ? handleLoginSubmit : handleSignupSubmit} className="space-y-5 text-left animate-fade-in">
              {mode === 'signup' && (
                 <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="성함" required value={signupData.name} onChange={e => setSignupData({...signupData, name: e.target.value})} className="w-full px-5 py-4 bg-hannam-gray-bg rounded-xl font-bold text-xs border border-transparent focus:border-hannam-gold outline-none" />
                    <select value={signupData.gender} onChange={e => setSignupData({...signupData, gender: e.target.value})} className="w-full px-5 py-4 bg-hannam-gray-bg rounded-xl font-bold text-xs border border-transparent focus:border-hannam-gold outline-none"><option>여성</option><option>남성</option></select>
                 </div>
              )}
              <input type="text" placeholder="연락처 (ID)" required value={mode === 'member' ? memberId : signupData.phone} onChange={e => mode === 'member' ? setMemberId(e.target.value) : setSignupData({...signupData, phone: e.target.value})} className="w-full px-5 py-4 bg-hannam-gray-bg rounded-xl font-bold text-xs border border-transparent focus:border-hannam-gold outline-none" />
              {mode === 'signup' && <input type="email" placeholder="이메일" required value={signupData.email} onChange={e => setSignupData({...signupData, email: e.target.value})} className="w-full px-5 py-4 bg-hannam-gray-bg rounded-xl font-bold text-xs border border-transparent focus:border-hannam-gold outline-none" />}
              <input type="password" placeholder="비밀번호" required value={mode === 'member' ? password : signupData.password} onChange={e => mode === 'member' ? setPassword(e.target.value) : setSignupData({...signupData, password: e.target.value})} className="w-full px-5 py-4 bg-hannam-gray-bg rounded-xl font-bold text-xs border border-transparent focus:border-hannam-gold outline-none" />
              <button type="submit" className="w-full py-5 bg-hannam-green text-white rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] mt-4 shadow-xl">
                 {mode === 'member' ? 'Authenticate & Enter' : 'Complete Private Join'}
              </button>
              <button type="button" onClick={() => setMode('select')} className="w-full text-[9px] font-bold text-hannam-subtext uppercase tracking-widest text-center mt-4">Back to Previous Step</button>
           </form>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { setUser(authService.getCurrentUser()); setIsLoading(false); }, []);

  const handleAdminLogin = async (role: UserRole) => { const loggedUser = await authService.adminLogin('admin@thehannam.com', role); setUser(loggedUser); };
  const handleMemberLogin = async (id: string, pw: string) => { try { const loggedUser = await authService.memberLogin(id, pw); setUser(loggedUser); } catch (e: any) { alert(e.message); } };
  const handleMemberSignup = async (data: any) => { await dbService.registerMember(data); };
  const handleLogout = () => { authService.logout(); setUser(null); };

  if (isLoading) return null;

  return (
    <HashRouter>
      {!user ? (
        <Routes><Route path="*" element={<LoginScreen onAdminLogin={handleAdminLogin} onMemberLogin={handleMemberLogin} onMemberSignup={handleMemberSignup} />} /></Routes>
      ) : (
        <>
          {[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF].includes(user.role) ? (
            <AdminLayout user={user} onLogout={handleLogout}>
              <Routes>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/reservations" element={<AdminReservations />} />
                <Route path="/admin/members" element={<AdminMembers />} />
                <Route path="/admin/therapists" element={<AdminTherapists />} />
                <Route path="/admin/member/:id" element={<MemberDetail />} />
                <Route path="/admin/register" element={<MemberRegistration />} />
                <Route path="/admin/contracts" element={<ContractDashboard />} />
                <Route path="/admin/contract/new" element={<ContractCreator />} />
                <Route path="/admin/care-session/:resId" element={<AdminCareSession />} />
                <Route path="/admin/care-result/:id" element={<AdminCareResult />} />
                <Route path="*" element={<Navigate to="/admin" />} />
              </Routes>
            </AdminLayout>
          ) : (
            <Routes>
              <Route path="/member" element={<MemberPortal />} />
              <Route path="/contract/:id" element={<ContractViewer />} />
              <Route path="*" element={<Navigate to="/member" />} />
            </Routes>
          )}
        </>
      )}
    </HashRouter>
  );
};

export default App;
