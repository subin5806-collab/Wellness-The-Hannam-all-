
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminReservations } from './pages/admin/AdminReservations';
import { AdminMembers } from './pages/admin/AdminMembers';
import { AdminInquiries } from './pages/admin/AdminInquiries';
import { AdminCareSession } from './pages/admin/AdminCareSession';
import { AdminCareResult } from './pages/admin/AdminCareResult';
import { MemberDetail } from './pages/admin/MemberDetail';
import { MemberRegistration } from './pages/admin/MemberRegistration';
import { ContractDashboard } from './pages/admin/ContractDashboard';
import { ContractCreator } from './pages/admin/ContractCreator';
import { MemberPortal } from './pages/member/MemberPortal';
import { ContractViewer } from './pages/contract/ContractViewer';
import { authService } from './services/authService';
import { dbService, validateEmail } from './services/dbService';
import { UserRole, User, MemberTier } from './types';
import { Bell, Shield, User as UserIcon, Lock, ChevronRight, Mail, Phone, UserPlus } from 'lucide-react';

const AdminLayout: React.FC<{ user: User; onLogout: () => void; children: React.ReactNode }> = ({ user, onLogout, children }) => {
  const location = useLocation();
  const navItems = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Reservations', path: '/admin/reservations' },
    { label: 'Members', path: '/admin/members' },
    { label: 'Inquiries', path: '/admin/inquiries' },
    { label: 'Contracts', path: '/admin/contracts' },
  ];

  const activePath = navItems.find(item => location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path)))?.path || '/admin';

  return (
    <div className="flex flex-col h-screen bg-[#FDFDFD]">
      <header className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-100 z-[100] shadow-sm">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
             <h1 className="text-sm font-serif font-bold tracking-[0.2em] text-gray-900 uppercase">The Hannam Wellness</h1>
             <span className="text-[8px] font-black text-[#C9B08F] uppercase tracking-[0.3em] bg-gray-50 px-2 py-0.5 rounded">Intelligence</span>
          </div>
          <nav className="flex gap-1">
            {navItems.map(item => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activePath === item.path ? 'bg-[#F9F9F9] text-black' : 'text-gray-300 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <button className="text-gray-200 hover:text-black transition-colors relative">
             <Bell className="w-4 h-4" />
             <div className="absolute top-[-2px] right-[-2px] w-1 h-1 bg-red-500 rounded-full" />
          </button>
          <div className="w-7 h-7 bg-[#1A1A1A] rounded-full flex items-center justify-center text-white text-[8px] font-black uppercase cursor-pointer hover:scale-105 transition-transform" onClick={onLogout}>
             {user.name[0]}
          </div>
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
  
  const [signupData, setSignupData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: '여성',
    password: ''
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onMemberLogin(memberId, password);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupData.name || !signupData.phone || !signupData.email || !signupData.password) {
      return alert('모든 항목을 입력해주세요.');
    }
    if (!validateEmail(signupData.email)) {
      return alert('유효한 이메일 주소를 입력해주세요.');
    }
    try {
      await onMemberSignup(signupData);
      alert('회원가입이 완료되었습니다. 핸드폰 번호로 로그인해주세요.');
      setMode('member');
      setMemberId(signupData.phone);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white p-10 rounded-[40px] shadow-2xl border border-gray-50 animate-fade-in text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-hannam-green" />
        <div className="w-14 h-14 bg-[#1A1A1A] rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl">
          <Shield className="w-6 h-6 text-[#C9B08F]" />
        </div>
        <h1 className="text-xl font-serif font-bold text-gray-900 mb-1 tracking-[0.1em] uppercase">The Hannam Wellness</h1>
        <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em] mb-10">Private Intelligence Service</p>
        
        {mode === 'select' && (
          <div className="space-y-3">
            <button onClick={() => setMode('member')} className="w-full py-4 bg-[#1A1A1A] text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95">
              Member Access <ChevronRight className="w-3 h-3" />
            </button>
            <button onClick={() => setMode('signup')} className="w-full py-4 bg-white border border-gray-100 text-gray-900 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-95">
              Join Membership <UserPlus className="w-3 h-3" />
            </button>
            <button onClick={() => onAdminLogin(UserRole.SUPER_ADMIN)} className="w-full py-4 text-gray-300 text-[10px] font-black uppercase tracking-[0.2em] hover:text-black transition-all mt-4">
              Admin System
            </button>
          </div>
        )}

        {mode === 'member' && (
          <form onSubmit={handleLoginSubmit} className="space-y-5 text-left animate-fade-in">
            <div className="space-y-1.5">
               <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number (ID)</label>
               <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                  <input type="text" required value={memberId} onChange={e => setMemberId(e.target.value)} placeholder="010-0000-0000" className="w-full pl-11 pr-4 py-3.5 bg-[#F9F9F9] rounded-xl font-bold text-[11px] outline-none border border-transparent focus:border-black transition-all num-clean" />
               </div>
            </div>
            <div className="space-y-1.5">
               <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Security Key</label>
               <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-11 pr-4 py-3.5 bg-[#F9F9F9] rounded-xl font-bold text-[11px] outline-none border border-transparent focus:border-black transition-all" />
               </div>
            </div>
            <button type="submit" className="w-full py-4 bg-[#1A1A1A] text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg active:scale-95 mt-4">
              Authenticate & Enter
            </button>
            <button type="button" onClick={() => setMode('select')} className="w-full text-[8px] font-black text-gray-300 uppercase tracking-widest text-center mt-2 hover:text-black">Back to Selection</button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4 text-left animate-fade-in">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Name</label>
                   <input type="text" required value={signupData.name} onChange={e => setSignupData({...signupData, name: e.target.value})} className="w-full px-4 py-3 bg-[#F9F9F9] rounded-xl font-bold text-[11px] outline-none border border-transparent focus:border-black" />
                </div>
                <div className="space-y-1">
                   <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Gender</label>
                   <select value={signupData.gender} onChange={e => setSignupData({...signupData, gender: e.target.value})} className="w-full px-4 py-3 bg-[#F9F9F9] rounded-xl font-bold text-[11px] outline-none border border-transparent focus:border-black appearance-none">
                      <option>여성</option>
                      <option>남성</option>
                   </select>
                </div>
             </div>
             <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                   <input type="text" required value={signupData.phone} onChange={e => setSignupData({...signupData, phone: e.target.value})} placeholder="010-0000-0000" className="w-full pl-10 pr-4 py-3 bg-[#F9F9F9] rounded-xl font-bold text-[11px] outline-none border border-transparent focus:border-black num-clean" />
                </div>
             </div>
             <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                   <input type="email" required value={signupData.email} onChange={e => setSignupData({...signupData, email: e.target.value})} placeholder="member@hannam.com" className="w-full pl-10 pr-4 py-3 bg-[#F9F9F9] rounded-xl font-bold text-[11px] outline-none border border-transparent focus:border-black" />
                </div>
             </div>
             <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Set Password</label>
                <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                   <input type="password" required value={signupData.password} onChange={e => setSignupData({...signupData, password: e.target.value})} placeholder="Min 4 chars" className="w-full pl-10 pr-4 py-3 bg-[#F9F9F9] rounded-xl font-bold text-[11px] outline-none border border-transparent focus:border-black" />
                </div>
             </div>
             <button type="submit" className="w-full py-4 bg-hannam-green text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg active:scale-95 mt-4">
               Complete Sign Up
             </button>
             <button type="button" onClick={() => setMode('select')} className="w-full text-[8px] font-black text-gray-300 uppercase tracking-widest text-center mt-2 hover:text-black">Cancel</button>
          </form>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(authService.getCurrentUser());
    setIsLoading(false);
  }, []);

  const handleAdminLogin = async (role: UserRole) => {
    const loggedUser = await authService.adminLogin('admin@thehannam.com', role);
    setUser(loggedUser);
  };

  const handleMemberLogin = async (id: string, pw: string) => {
    try {
      const loggedUser = await authService.memberLogin(id, pw);
      setUser(loggedUser);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleMemberSignup = async (data: any) => {
    await dbService.registerMember(data);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (isLoading) return null;

  return (
    <HashRouter>
      {!user ? (
        <Routes>
          <Route path="*" element={<LoginScreen onAdminLogin={handleAdminLogin} onMemberLogin={handleMemberLogin} onMemberSignup={handleMemberSignup} />} />
        </Routes>
      ) : (
        <>
          {[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF].includes(user.role) ? (
            <AdminLayout user={user} onLogout={handleLogout}>
              <Routes>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/reservations" element={<AdminReservations />} />
                <Route path="/admin/members" element={<AdminMembers />} />
                <Route path="/admin/inquiries" element={<AdminInquiries />} />
                <Route path="/admin/member/:id" element={<MemberDetail />} />
                <Route path="/admin/register" element={<MemberRegistration />} />
                <Route path="/admin/contracts" element={<ContractDashboard />} />
                <Route path="/admin/contract/new" element={<ContractCreator />} />
                <Route path="/admin/care-session/:resId" element={<AdminCareSession />} />
                <Route path="/admin/care-result/:id" element={<AdminCareResult />} />
                <Route path="/contract/:id" element={<ContractViewer />} />
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
