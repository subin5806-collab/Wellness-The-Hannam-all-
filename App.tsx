
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
import { dbService } from './services/dbService';
import { UserRole, User, MemberTier, CareStatus } from './types';
import { Bell, Shield } from 'lucide-react';

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
    <div className="flex flex-col h-screen bg-[#FBF9F6]">
      <header className="bg-white px-10 py-5 flex justify-between items-center border-b border-gray-100 z-[100]">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-3">
             <h1 className="text-xl font-serif font-bold tracking-tight text-gray-900">Wellness, The Hannam</h1>
             <span className="text-[10px] font-black text-[#C9B08F] uppercase tracking-widest mt-1">Admin</span>
          </div>
          <nav className="flex gap-2">
            {navItems.map(item => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                  activePath === item.path ? 'bg-[#FBF9F6] text-black shadow-inner' : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-gray-300 hover:text-black transition-colors relative">
             <Bell className="w-5 h-5" />
             <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
          </button>
          <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white text-[10px] font-black uppercase cursor-pointer hover:scale-105 transition-transform" onClick={onLogout}>
             {user.name[0]}
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto no-scrollbar">{children}</main>
    </div>
  );
};

const LoginScreen: React.FC<{ onLogin: (role: UserRole) => void }> = ({ onLogin }) => (
  <div className="min-h-screen bg-[#FBF9F6] flex items-center justify-center p-8 font-sans">
    <div className="w-full max-w-lg bg-white p-16 rounded-[48px] shadow-2xl border border-gray-50 animate-fade-in text-center">
      <div className="w-20 h-20 bg-[#3A453F] rounded-[24px] mx-auto flex items-center justify-center mb-10 shadow-2xl shadow-black/10">
        <Shield className="w-10 h-10 text-[#C9B08F]" />
      </div>
      <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2 tracking-tight">Wellness, The Hannam</h1>
      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-12">Private Wellness Concierge</p>
      
      <div className="space-y-6">
        <button 
          onClick={() => onLogin(UserRole.SUPER_ADMIN)}
          className="w-full py-6 bg-[#1a1a1a] text-white rounded-[20px] font-black text-lg hover:bg-black transition-all shadow-xl active:scale-95"
        >
          관리자 로그인 (Admin Portal)
        </button>
        <button 
          onClick={() => onLogin(UserRole.MEMBER)}
          className="w-full py-6 bg-white border border-gray-200 text-gray-900 rounded-[20px] font-black text-lg hover:bg-gray-50 transition-all shadow-sm active:scale-95"
        >
          회원 포털 (Member Portal)
        </button>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(authService.getCurrentUser());
    setIsLoading(false);
  }, []);

  const handleLogin = async (role: UserRole) => {
    const email = role === UserRole.MEMBER ? 'hong@example.com' : 'admin@thehannam.com';
    const fixedId = role === UserRole.MEMBER ? 'user_001' : undefined;
    const loggedUser = await authService.login(email, role, fixedId);
    
    if (role === UserRole.MEMBER) {
      // 회원 포털 접속 시 무한 로딩 방지를 위한 초기 데이터 세팅
      const members = JSON.parse(localStorage.getItem('firestore_members') || '[]');
      if (!members.find((m: any) => m.id === 'user_001')) {
        members.push({
          id: 'user_001',
          name: '홍길동',
          phone: '010-1111-2222',
          email: 'hong@example.com',
          gender: '남성',
          role: UserRole.MEMBER,
          tier: MemberTier.ROYAL,
          deposit: 15000000,
          used: 12563333,
          remaining: 1436667,
          coreGoal: 'Physical Recovery',
          aiRecommended: 'Evening Meditation',
          joinedAt: '2025-01-01',
          address: '서울시 용산구 한남더힐'
        });
        localStorage.setItem('firestore_members', JSON.stringify(members));
      }

      // 샘플 예약 데이터 세팅 (대시보드 공백 방지)
      const reservations = JSON.parse(localStorage.getItem('firestore_reservations') || '[]');
      if (reservations.length === 0) {
        reservations.push({
          id: 'res_001',
          memberId: 'user_001',
          memberName: '홍길동',
          therapistId: 'staff_1',
          therapistName: '사라 테라피스트',
          dateTime: '2025-12-18T14:00:00',
          serviceType: '프리미엄 바디 테라피',
          status: 'booked'
        });
        localStorage.setItem('firestore_reservations', JSON.stringify(reservations));
      }
    }
    
    setUser(loggedUser);
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
          <Route path="*" element={<LoginScreen onLogin={handleLogin} />} />
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
