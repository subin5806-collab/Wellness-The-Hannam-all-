
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { authService } from '../../services/authService';
import { 
  Calendar, Clock, AlertCircle, TrendingDown, ChevronRight, 
  Shield, X, ArrowUpRight, LayoutGrid, Megaphone, 
  Download, Database, FileDown, ShieldCheck, Lock, CheckCircle2, Sparkles
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
    try {
      await dbService.requestAdminOTP(currentUser.email);
      setPwStep(2);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!currentUser?.email || !otpCode) return;
    setIsProcessing(true);
    try {
      // 해시 검증 및 만료/시도 횟수 체크가 dbService 내부에서 수행됨
      const success = await dbService.verifyAdminOTP(currentUser.email, otpCode);
      if (success) {
        setPwStep(3);
      } else {
        alert('인증 코드가 틀렸거나 만료되었습니다.');
      }
    } finally {
      setIsProcessing(false);
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
    if (!currentUser) return;
    
    setIsProcessing(true);
    try {
      await dbService.updateAdminPassword(currentUser.email, newPassword);
      alert('비밀번호가 안전하게 변경되었습니다. 다시 로그인해주세요.');
      authService.logout();
      navigate('/login');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!stats) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold uppercase tracking-widest">{ADMIN_UI.common.loading}</div>;

  return (
    <div className="min-h-screen bg-hannam-bg px-8 py-10 font-sans animate-smooth-fade">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* 상단 헤더 섹션 */}
        <div className="flex justify-between items-end border-b border-hannam-border pb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-hannam-green tracking-tight uppercase">{ADMIN_UI.dashboard.title}</h1>
            <p className="text-[10px] font-black text-hannam-gold uppercase tracking-[0.4em] mt-2">Executive Overview Console</p>
          </div>
          <div className="flex gap-3">
             <button onClick={() => navigate('/admin/members')} className="flex items-center gap-2.5 px-6 py-3.5 bg-hannam-green text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all hover:bg-black shadow-hannam-deep">
               회원 관리
             </button>
             <button onClick={() => { setIsSecurityModalOpen(true); setPwStep(1); }} className="flex items-center gap-2.5 px-6 py-3.5 bg-white border border-hannam-border rounded-xl text-[11px] font-bold text-hannam-muted hover:text-hannam-green transition-all shadow-hannam-soft">
               <Shield className="w-3.5 h-3.5" /> 보안 설정
             </button>
          </div>
        </div>

        {/* 핵심 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: '오늘의 예약', value: stats.todayReservations, icon: Calendar, color: 'text-hannam-green', bg: 'bg-white', path: '/admin/reservations' },
            { label: '서명 대기', value: stats.pendingSignatures, icon: Clock, color: 'text-hannam-gold', bg: 'bg-white', path: '/admin/members' },
            { label: '미처리 문의', value: stats.unprocessedInquiries, icon: AlertCircle, color: 'text-red-400', bg: 'bg-white', path: '/admin/inquiries' },
            { label: '잔액 부족 회원', value: stats.lowBalanceCount, icon: TrendingDown, color: 'text-gray-400', bg: 'bg-white', path: '/admin/members' },
          ].map((item, i) => (
            <div 
              key={i} 
              onClick={() => navigate(item.path)}
              className={`${item.bg} border border-hannam-border p-8 rounded-[40px] shadow-hannam-soft cursor-pointer hover:border-hannam-gold transition-all group flex flex-col justify-between h-48`}
            >
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black text-hannam-muted uppercase tracking-widest">{item.label}</p>
                <item.icon className={`w-5 h-5 ${item.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
              </div>
              <div className="flex items-end justify-between">
                <h3 className={`text-4xl font-serif font-bold ${item.color} num-data`}>{item.value}</h3>
                <ArrowUpRight className="w-5 h-5 text-hannam-border group-hover:text-hannam-gold group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* 주요 일정 리스트 */}
          <div className="col-span-12 lg:col-span-8 bg-white border border-hannam-border rounded-[48px] shadow-hannam-soft overflow-hidden">
             <div className="px-10 py-8 border-b border-hannam-border flex justify-between items-center bg-hannam-bg/20">
                <h3 className="text-sm font-black text-hannam-text uppercase tracking-widest">Appointments Archive</h3>
                <button onClick={() => navigate('/admin/reservations')} className="text-[10px] font-black text-hannam-gold uppercase tracking-widest flex items-center gap-1.5 hover:text-hannam-green transition-colors">
                  Full Schedule <ChevronRight className="w-4 h-4"/>
                </button>
             </div>
             <div className="divide-y divide-hannam-border max-h-[500px] overflow-y-auto no-scrollbar">
                {reservations.slice(0, 10).map(res => (
                  <div key={res.id} onClick={() => navigate(`/admin/care-session/${res.id}`)} className="px-10 py-6 hover:bg-hannam-bg/40 transition-all cursor-pointer flex justify-between items-center group">
                     <div className="flex items-center gap-10">
                        <span className="text-[12px] font-black text-hannam-gold num-data w-12">{res.dateTime.split('T')[1].substring(0,5)}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-hannam-bg border border-hannam-border flex items-center justify-center text-[12px] font-serif font-black text-hannam-green">
                            {res.memberName[0]}
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-hannam-text group-hover:text-hannam-green transition-colors">{res.memberName} 님</p>
                            <p className="text-[10px] text-hannam-muted font-bold uppercase tracking-tighter">{res.serviceType}</p>
                          </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-8">
                        <span className="text-[10px] font-black text-hannam-gold px-3 py-1 bg-white border border-hannam-border rounded-lg uppercase tracking-widest">{res.therapistName}</span>
                        <ChevronRight className="w-4 h-4 text-hannam-border opacity-0 group-hover:opacity-100 transition-all" />
                     </div>
                  </div>
                ))}
                {reservations.length === 0 && (
                  <div className="py-40 text-center space-y-4">
                     <Calendar className="w-12 h-12 text-hannam-border mx-auto opacity-30" />
                     <p className="text-[11px] font-black text-hannam-muted uppercase tracking-[0.3em]">No appointments scheduled</p>
                  </div>
                )}
             </div>
          </div>

          {/* 시스템 제어 섹션 */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
             <div className="bg-[#1A362E] p-10 rounded-[48px] text-white shadow-hannam-deep relative overflow-hidden h-[320px] flex flex-col justify-between">
                <div className="relative z-10">
                   <Megaphone className="w-10 h-10 text-hannam-gold/40 mb-6" />
                   <h3 className="text-2xl font-serif font-bold tracking-tight mb-4">Notice Console</h3>
                   <p className="text-[11px] text-white/50 leading-relaxed font-medium uppercase tracking-widest">Broadcast center announcements<br/>and private insights to members.</p>
                </div>
                <button onClick={() => navigate('/admin/notices')} className="relative z-10 w-full py-4.5 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/10">Manage Notifications</button>
                <Sparkles className="absolute -right-10 -bottom-10 w-48 h-48 text-white opacity-[0.03] pointer-events-none" />
             </div>

             <div className="bg-white border border-hannam-border p-10 rounded-[48px] shadow-hannam-soft flex flex-col justify-between h-[280px]">
                <div className="flex items-center gap-4">
                   <ShieldCheck className="w-6 h-6 text-hannam-gold" />
                   <h4 className="text-[12px] font-black text-hannam-text uppercase tracking-widest">System Integrity</h4>
                </div>
                <p className="text-[11px] text-hannam-muted leading-relaxed font-medium">관리자 보안 인증 및 데이터 백업을<br/>정기적으로 실행하여 시스템 안정성을 유지하십시오.</p>
                <button 
                  onClick={() => { setIsSecurityModalOpen(true); setPwStep(1); }}
                  className="w-full py-4.5 bg-hannam-bg text-hannam-muted rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-hannam-green transition-colors"
                >
                   Security Settings
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* 보안 인증 모달 */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 bg-hannam-text/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[48px] p-12 shadow-hannam-deep border border-hannam-border animate-smooth-fade">
              <div className="flex justify-between items-center mb-10">
                 <div className="flex bg-hannam-bg p-1 rounded-2xl border border-hannam-border">
                    <button onClick={() => {setSecTab('password'); setPwStep(1); setOtpCode('');}} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${secTab === 'password' ? 'bg-white shadow-sm text-hannam-green' : 'text-hannam-muted'}`}>인증 관리</button>
                    <button onClick={() => {setSecTab('backup'); setPwStep(1); setOtpCode('');}} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${secTab === 'backup' ? 'bg-white shadow-sm text-hannam-green' : 'text-hannam-muted'}`}>데이터 관리</button>
                 </div>
                 <button onClick={() => setIsSecurityModalOpen(false)} className="p-2 text-hannam-muted hover:text-black transition-colors"><X className="w-6 h-6" /></button>
              </div>

              {secTab === 'password' ? (
                <div className="space-y-6">
                  {pwStep === 1 && (
                    <div className="space-y-8 text-center py-4">
                       <Lock className="w-12 h-12 text-hannam-gold mx-auto opacity-40" />
                       <p className="text-[12px] text-hannam-muted leading-relaxed font-medium italic">관리자 계정의 보안 정보를 수정하기 위해<br/>2단계 보안 인증 절차가 필요합니다.</p>
                       <button onClick={handleRequestOTP} disabled={isProcessing} className="w-full py-5 bg-hannam-green text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl transition-all hover:bg-black">인증 번호 요청 (OTP)</button>
                    </div>
                  )}
                  {pwStep === 2 && (
                    <div className="space-y-8 text-center">
                       <input type="text" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full p-6 bg-hannam-bg border border-hannam-border rounded-2xl font-bold text-center text-4xl tracking-[0.4em] outline-none text-hannam-green" placeholder="000000" />
                       <button onClick={handleVerifyOTP} disabled={isProcessing || otpCode.length < 6} className="w-full py-5 bg-hannam-green text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">인증 완료</button>
                    </div>
                  )}
                  {pwStep === 3 && (
                    <div className="space-y-4">
                       <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-5 bg-hannam-bg border border-hannam-border rounded-2xl font-bold text-sm outline-none focus:border-hannam-gold" placeholder="신규 비밀번호" />
                       <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-5 bg-hannam-bg border border-hannam-border rounded-2xl font-bold text-sm outline-none focus:border-hannam-gold" placeholder="비밀번호 확인" />
                       <button onClick={handleChangePassword} disabled={isProcessing} className="w-full py-5 bg-hannam-green text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl transition-all">보안 자격 증명 갱신</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8 animate-smooth-fade">
                   {pwStep < 3 ? (
                      <div className="space-y-8 py-4 text-center">
                         <Database className="w-12 h-12 text-hannam-gold mx-auto opacity-40" />
                         <p className="text-[12px] text-hannam-muted leading-relaxed font-medium">데이터 추출 및 백업 권한 획득을 위해<br/><span className="text-hannam-gold font-bold">보안 인증</span>을 진행해 주세요.</p>
                         {pwStep === 1 ? (
                            <button onClick={handleRequestOTP} disabled={isProcessing} className="w-full py-5 bg-hannam-green text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl">인증 절차 시작</button>
                         ) : (
                            <div className="space-y-6">
                               <input type="text" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full p-6 bg-hannam-bg border border-hannam-border rounded-2xl font-bold text-center text-4xl tracking-[0.4em] outline-none" placeholder="000000" />
                               <button onClick={handleVerifyOTP} disabled={isProcessing || otpCode.length < 6} className="w-full py-5 bg-hannam-green text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">코드 확인</button>
                            </div>
                         )}
                      </div>
                   ) : (
                     <div className="space-y-6">
                        <div 
                          onClick={handleExecuteBackup}
                          className="bg-hannam-bg border border-hannam-border p-8 rounded-[32px] cursor-pointer hover:border-hannam-green transition-all group flex flex-col gap-6"
                        >
                           <div className="flex justify-between items-start">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-hannam-green border border-hannam-border group-hover:bg-hannam-green group-hover:text-white transition-colors">
                                 <Database className="w-6 h-6" />
                              </div>
                              <span className="text-[9px] font-black text-hannam-gold uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-hannam-gold/20">Full Snapshot</span>
                           </div>
                           <div>
                              <p className="text-[14px] font-black text-hannam-text mb-1">시스템 전체 데이터 백업</p>
                              <p className="text-[11px] text-hannam-muted font-medium">모든 회원, 계약, 예약 데이터를 포함한<br/>통합 아카이브를 생성합니다.</p>
                           </div>
                        </div>

                        <div 
                          onClick={handleExecuteCSVExport}
                          className="bg-hannam-bg border border-hannam-border p-8 rounded-[32px] cursor-pointer hover:border-hannam-gold transition-all group flex flex-col gap-6"
                        >
                           <div className="flex justify-between items-start">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-hannam-gold border border-hannam-border group-hover:bg-hannam-gold group-hover:text-white transition-colors">
                                 <FileDown className="w-6 h-6" />
                              </div>
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-gray-100">Registry Report</span>
                           </div>
                           <div>
                              <p className="text-[14px] font-black text-hannam-text mb-1">회원 명부 추출 (CSV)</p>
                              <p className="text-[11px] text-hannam-muted font-medium">회원 명부 및 현재 잔액 현황을<br/>CSV 형식으로 추출합니다.</p>
                           </div>
                        </div>
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
