
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { authService } from '../../services/authService';
import { 
  Calendar, Clock, AlertCircle, TrendingDown, ChevronRight, 
  Shield, X, ArrowUpRight, LayoutGrid, Megaphone, 
  Download, Database, FileDown, ShieldCheck, Lock, CheckCircle2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_UI } from '../../constants/adminLocale';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  
  const [secTab, setSecTab] = useState<'password' | 'backup'>('password');
  const [pwStep, setPwStep] = useState<1 | 2 | 3>(1);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    const [s, r] = await Promise.all([
      dbService.getDashboardStats(),
      dbService.getReservations()
    ]);
    setStats(s);
    setReservations(r.filter(res => res.status === 'booked'));
  };

  const handleRequestOTP = async () => {
    if (!currentUser?.email) return;
    setIsProcessing(true);
    await dbService.requestAdminOTP(currentUser.email);
    setPwStep(2);
    setIsProcessing(false);
  };

  const handleVerifyOTP = async () => {
    if (otpCode === '000000' || otpCode.length === 6) {
      setPwStep(3);
    } else {
      alert('올바른 인증 코드를 입력하세요.');
    }
  };

  const handleExecuteBackup = async () => {
    if (!currentUser) return;
    setIsProcessing(true);
    try {
      await dbService.backupAllData({ name: currentUser.name, email: currentUser.email });
      alert('시스템 전체 백업 파일이 생성되었습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteCSVExport = async () => {
    if (!currentUser) return;
    setIsProcessing(true);
    try {
      await dbService.exportMembersToCSV(currentUser.name);
      alert('회원 명부 리포트 추출이 완료되었습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) return alert('비밀번호가 일치하지 않습니다.');
    await dbService.updateAdminPassword(currentUser!.email, newPassword);
    alert('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
    authService.logout();
    navigate('/login');
  };

  if (!stats) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold uppercase tracking-widest">{ADMIN_UI.common.loading}</div>;

  return (
    <div className="min-h-screen bg-hannam-bg px-10 py-12 font-sans animate-smooth-fade">
      <div className="max-w-7xl mx-auto flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-serif font-bold text-hannam-green tracking-tight leading-tight">{ADMIN_UI.dashboard.title}</h1>
          <p className="text-[10px] font-black text-hannam-gold uppercase tracking-[0.4em] mt-2">Executive Overview Console</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => navigate('/admin/members')} className="flex items-center gap-2.5 px-6 py-3.5 bg-hannam-green text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-black shadow-sm">
             <LayoutGrid className="w-3.5 h-3.5" /> Client Registry
           </button>
           <button onClick={() => { setIsSecurityModalOpen(true); setPwStep(1); }} className="flex items-center gap-2.5 px-6 py-3.5 bg-white border border-hannam-border rounded-xl text-[10px] font-bold text-hannam-muted hover:text-hannam-green transition-all shadow-sm">
             <Shield className="w-3.5 h-3.5" /> Security & Backup
           </button>
        </div>
      </div>

      {/* 대시보드 카드 섹션 */}
      <div className="max-w-7xl mx-auto grid grid-cols-4 gap-8 mb-16">
        {[
          { label: '오늘의 예약', value: stats.todayReservations, icon: Calendar, color: 'text-hannam-green', path: '/admin/reservations' },
          { label: '서명 대기', value: stats.pendingSignatures, icon: Clock, color: 'text-hannam-gold', path: '/admin/members' },
          { label: '미처리 문의', value: stats.unprocessedInquiries, icon: AlertCircle, color: 'text-red-400', path: '/admin/inquiries' },
          { label: '잔액 부족 회원', value: stats.lowBalanceCount, icon: TrendingDown, color: 'text-gray-500', path: '/admin/members' },
        ].map((item, i) => (
          <div key={i} onClick={() => navigate(item.path)} className="bg-white border border-hannam-border p-8 rounded-2xl cursor-pointer hover:border-hannam-gold transition-all shadow-sm flex flex-col justify-between h-44 group">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-black text-hannam-muted uppercase tracking-[0.2em]">{item.label}</span>
              <div className={`p-2.5 rounded-lg bg-hannam-bg ${item.color} group-hover:scale-110 transition-transform`}>
                 <item.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-end justify-between">
               <h3 className={`text-5xl font-bold num-data ${item.color} leading-none tracking-tighter`}>{item.value}</h3>
               <ArrowUpRight className="w-5 h-5 text-hannam-border group-hover:text-hannam-gold transition-colors" />
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
        <div className="col-span-8 bg-white border border-hannam-border rounded-2xl overflow-hidden shadow-sm">
           <div className="flex justify-between items-center px-10 py-8 border-b border-hannam-border bg-hannam-bg/20">
              <h3 className="text-sm font-bold text-hannam-text uppercase tracking-widest">Appointments Archive</h3>
              <button onClick={() => navigate('/admin/reservations')} className="text-[10px] font-black text-hannam-gold uppercase tracking-widest flex items-center gap-1.5 hover:text-hannam-green transition-colors">
                View Schedule <ChevronRight className="w-3.5 h-3.5"/>
              </button>
           </div>
           <div className="divide-y divide-hannam-border">
              {reservations.slice(0, 8).map(res => (
                <div key={res.id} onClick={() => navigate(`/admin/care-session/${res.id}`)} className="px-10 py-6 hover:bg-hannam-bg/30 transition-all cursor-pointer flex justify-between items-center group">
                   <div className="flex items-center gap-12">
                      <span className="text-[12px] font-black text-hannam-gold num-data w-12 tracking-tighter">{res.dateTime.split('T')[1].substring(0,5)}</span>
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-hannam-bg flex items-center justify-center text-[11px] font-serif font-black text-hannam-green border border-hannam-border">
                          {res.memberName[0]}
                        </div>
                        <p className="text-[15px] font-bold text-hannam-text">{res.memberName} 님</p>
                      </div>
                   </div>
                   <p className="text-[11px] text-hannam-muted font-bold uppercase tracking-widest">{res.serviceType}</p>
                   <div className="flex items-center gap-10">
                      <span className="text-[10px] font-black text-hannam-green px-3.5 py-1.5 bg-hannam-bg border border-hannam-border rounded-md uppercase tracking-tight">{res.therapistName}</span>
                      <ChevronRight className="w-4 h-4 text-hannam-border opacity-0 group-hover:opacity-100 transition-all" />
                   </div>
                </div>
              ))}
              {reservations.length === 0 && <div className="text-center py-32">
                <Calendar className="w-12 h-12 text-hannam-border mx-auto mb-6 opacity-30" />
                <p className="text-hannam-muted text-[12px] font-bold uppercase tracking-[0.3em]">No appointments scheduled</p>
              </div>}
           </div>
        </div>

        <div className="col-span-4 space-y-8">
           <div className="bg-[#1A362E] p-10 rounded-2xl text-white shadow-xl flex flex-col justify-between h-[300px]">
              <div>
                <Megaphone className="w-10 h-10 text-hannam-gold mb-6 opacity-40" />
                <h3 className="text-2xl font-serif font-bold mb-4 tracking-tight">System Notice Center</h3>
                <p className="text-xs text-white/50 leading-relaxed font-medium">회원들에게 실시간으로 공지를 전달하고<br/>센터 소식을 관리하세요.</p>
              </div>
              <button onClick={() => navigate('/admin/notices')} className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">Manage Announcements</button>
           </div>
        </div>
      </div>

      {/* 보안 및 백업 통합 모달 */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[48px] p-12 shadow-2xl border border-hannam-border animate-smooth-fade">
              <div className="flex justify-between items-center mb-10">
                 <div className="flex bg-hannam-bg p-1 rounded-2xl border border-hannam-border">
                    <button onClick={() => {setSecTab('password'); setPwStep(1); setOtpCode('');}} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${secTab === 'password' ? 'bg-white shadow-sm text-hannam-green' : 'text-hannam-muted'}`}>Security</button>
                    <button onClick={() => {setSecTab('backup'); setPwStep(1); setOtpCode('');}} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${secTab === 'backup' ? 'bg-white shadow-sm text-hannam-green' : 'text-hannam-muted'}`}>Data Ops</button>
                 </div>
                 <button onClick={() => setIsSecurityModalOpen(false)} className="p-2 text-hannam-muted hover:text-black transition-colors"><X className="w-6 h-6" /></button>
              </div>

              {secTab === 'password' ? (
                <div className="space-y-6">
                  {pwStep === 1 && (
                    <div className="space-y-8 text-center py-4">
                       <div className="w-16 h-16 bg-hannam-bg rounded-full flex items-center justify-center mx-auto text-hannam-green border border-hannam-border">
                          <Lock className="w-6 h-6" />
                       </div>
                       <p className="text-[12px] text-hannam-muted leading-relaxed font-medium italic">관리자 계정의 보안 정보를 수정하기 위해<br/>이메일 인증 절차가 필요합니다.</p>
                       <button onClick={handleRequestOTP} className="w-full py-5 bg-hannam-green text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg transition-all hover:bg-black">Request Authentication</button>
                    </div>
                  )}
                  {pwStep === 2 && (
                    <div className="space-y-8 text-center">
                       <input type="text" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full p-5 bg-hannam-bg border border-hannam-border rounded-2xl font-bold text-center text-4xl tracking-[0.4em] outline-none text-hannam-green" placeholder="000000" />
                       <button onClick={handleVerifyOTP} className="w-full py-5 bg-hannam-green text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">Verify Code</button>
                    </div>
                  )}
                  {pwStep === 3 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                       <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-5 bg-hannam-bg border border-hannam-border rounded-2xl font-bold text-sm outline-none focus:border-hannam-gold" placeholder="New Password" />
                       <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-5 bg-hannam-bg border border-hannam-border rounded-2xl font-bold text-sm outline-none focus:border-hannam-gold" placeholder="Confirm Password" />
                       <button onClick={handleChangePassword} className="w-full py-5 bg-hannam-green text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg transition-all">Apply Security Update</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-10 animate-smooth-fade">
                   {pwStep < 3 ? (
                      <div className="space-y-8 py-4 text-center">
                         <div className="w-16 h-16 bg-hannam-bg rounded-full flex items-center justify-center mx-auto text-hannam-green border border-hannam-border">
                            <Database className="w-6 h-6" />
                         </div>
                         <p className="text-[12px] text-hannam-muted leading-relaxed font-medium">중요 데이터 추출 및 백업 권한을 획득하기 위해<br/><span className="text-hannam-gold font-bold">2단계 보안 인증</span>을 진행해 주세요.</p>
                         {pwStep === 1 ? (
                            <button onClick={handleRequestOTP} className="w-full py-5 bg-hannam-green text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg">Authenticate for Data Ops</button>
                         ) : (
                            <div className="space-y-6">
                               <input type="text" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full p-5 bg-hannam-bg border border-hannam-border rounded-2xl font-bold text-center text-4xl tracking-[0.4em] outline-none" placeholder="000000" />
                               <button onClick={handleVerifyOTP} className="w-full py-5 bg-hannam-green text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">Verify Code</button>
                            </div>
                         )}
                      </div>
                   ) : (
                     <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-4 bg-green-50/50 p-4 rounded-2xl border border-green-100 mb-4">
                           <CheckCircle2 className="w-5 h-5 text-green-500" />
                           <p className="text-[11px] font-bold text-green-700 uppercase tracking-tight">Security Access Granted</p>
                        </div>
                        
                        {/* 전체 데이터 백업 카드 */}
                        <div 
                          onClick={handleExecuteBackup}
                          className="bg-hannam-bg border border-hannam-border p-8 rounded-[32px] cursor-pointer hover:border-hannam-green transition-all group flex flex-col gap-6"
                        >
                           <div className="flex justify-between items-start">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-hannam-green border border-hannam-border group-hover:bg-hannam-green group-hover:text-white transition-colors">
                                 <Database className="w-6 h-6" />
                              </div>
                              <span className="text-[9px] font-black text-hannam-gold uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-hannam-gold/20">System Wide</span>
                           </div>
                           <div>
                              <p className="text-[14px] font-black text-hannam-text mb-1">Full System Snapshot</p>
                              <p className="text-[11px] text-hannam-muted font-medium leading-relaxed">모든 회원, 계약, 예약, 로그 데이터를<br/>포함한 JSON 아카이브를 생성합니다.</p>
                           </div>
                           <button className="text-[10px] font-black text-hannam-green uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                              Execute Backup <ChevronRight className="w-3.5 h-3.5" />
                           </button>
                        </div>

                        {/* 명부 CSV 추출 카드 */}
                        <div 
                          onClick={handleExecuteCSVExport}
                          className="bg-hannam-bg border border-hannam-border p-8 rounded-[32px] cursor-pointer hover:border-hannam-gold transition-all group flex flex-col gap-6"
                        >
                           <div className="flex justify-between items-start">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-hannam-gold border border-hannam-border group-hover:bg-hannam-gold group-hover:text-white transition-colors">
                                 <FileDown className="w-6 h-6" />
                              </div>
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-gray-100">Report</span>
                           </div>
                           <div>
                              <p className="text-[14px] font-black text-hannam-text mb-1">Executive Registry Export</p>
                              <p className="text-[11px] text-hannam-muted font-medium leading-relaxed">회원 명부 및 현재 잔액 현황을<br/>엑셀 호환 CSV 형식으로 추출합니다.</p>
                           </div>
                           <button className="text-[10px] font-black text-hannam-gold uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                              Download CSV <ChevronRight className="w-3.5 h-3.5" />
                           </button>
                        </div>

                        <p className="text-[9px] text-hannam-muted text-center pt-4 italic">모든 데이터 작업은 관리자 감사 로그(Audit Log)에 영구 기록됩니다.</p>
                     </div>
                   )}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
