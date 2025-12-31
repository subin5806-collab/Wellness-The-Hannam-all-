
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { authService } from '../../services/authService';
import { Calendar, Clock, AlertCircle, TrendingDown, ChevronRight, Edit3, Plus, X, Shield, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ContractTemplate } from '../../types';
import { ADMIN_UI } from '../../constants/adminLocale';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  
  const [pwStep, setPwStep] = useState<1 | 2 | 3>(1);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    const [s, r, t] = await Promise.all([
      dbService.getDashboardStats(),
      dbService.getReservations(),
      dbService.getTemplates()
    ]);
    setStats(s);
    setReservations(r.filter(res => res.status === 'booked'));
    setTemplates(t);
  };

  const handleEditTemplate = (tmpl: ContractTemplate) => {
    setEditingTemplate(tmpl);
    setNewTemplateTitle(tmpl.title);
    setIsSettingModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateTitle) return;
    if (editingTemplate) {
      await dbService.updateTemplate(editingTemplate.id, { title: newTemplateTitle });
    } else {
      await dbService.saveTemplate({ title: newTemplateTitle, type: 'MEMBERSHIP', pdfName: 'manual_entry.pdf', contentBody: 'System Generated' });
    }
    setIsSettingModalOpen(false);
    loadDashboardData();
  };

  const handleRequestOTP = async () => {
    if (!currentUser?.email) return;
    setIsProcessing(true);
    try {
      await dbService.requestAdminOTP(currentUser.email);
      alert('인증 코드가 이메일로 발송되었습니다.');
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
      await dbService.verifyAdminOTP(currentUser.email, otpCode);
      setPwStep(3);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser?.email || !newPassword) return;
    if (newPassword !== confirmPassword) return alert('비밀번호가 일치하지 않습니다.');
    if (newPassword.length < 6) return alert('비밀번호는 6자 이상이어야 합니다.');
    
    setIsProcessing(true);
    try {
      await dbService.updateAdminPassword(currentUser.email, newPassword);
      alert('비밀번호가 성공적으로 변경되었습니다. 보안을 위해 다시 로그인해 주세요.');
      authService.logout();
      navigate('/login');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!stats) return <div className="min-h-screen flex items-center justify-center bg-hannam-bg font-serif text-hannam-gold tracking-luxury uppercase">{ADMIN_UI.common.loading}</div>;

  const statItems = [
    { label: ADMIN_UI.dashboard.stats.bookingToday, value: stats.todayReservations || 0, unit: '건', icon: Calendar, path: '/admin/reservations' },
    { label: ADMIN_UI.dashboard.stats.awaitingSign, value: stats.pendingSignatures || 0, unit: '건', icon: Clock, path: '/admin/members' },
    { label: ADMIN_UI.dashboard.stats.unprocessedInquiry, value: stats.unprocessedInquiries || 0, unit: '건', icon: AlertCircle, color: 'text-red-500', path: '/admin/inquiries' },
    { label: ADMIN_UI.dashboard.stats.lowBalance, value: stats.lowBalanceCount || 0, unit: '명', icon: TrendingDown, color: 'text-hannam-gold', path: '/admin/members' },
  ];

  return (
    <div className="min-h-screen bg-hannam-bg px-10 py-12 animate-smooth-fade">
      <div className="max-w-7xl mx-auto flex justify-between items-end mb-16">
        <div>
          <h1 className="text-4xl font-serif font-bold text-hannam-green tracking-tight">{ADMIN_UI.dashboard.title}</h1>
          <p className="text-[10px] font-bold text-hannam-muted uppercase tracking-widest mt-2">{ADMIN_UI.dashboard.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-hannam-border rounded-2xl text-[10px] font-bold uppercase tracking-widest text-hannam-muted hover:text-hannam-green transition-all shadow-hannam-soft"
          >
            <Shield className="w-3.5 h-3.5" /> 보안 설정
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-4 gap-6 mb-12">
        {statItems.map((item, i) => (
          <div key={i} onClick={() => navigate(item.path)} className="card-premium p-10 h-48 cursor-pointer flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-hannam-muted uppercase tracking-widest">{item.label}</span>
              <item.icon className="w-4 h-4 text-hannam-gold opacity-40" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className={`text-4xl num-data ${item.color || 'text-hannam-green'}`}>{item.value}</h3>
                <span className="text-[10px] font-bold text-hannam-muted uppercase">{item.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
        <div className="col-span-8 card-premium p-10">
           <div className="flex justify-between items-center mb-12 border-b border-[#F5F3EF] pb-6">
              <h3 className="text-lg font-serif font-bold text-hannam-green">{ADMIN_UI.dashboard.schedule.title}</h3>
              <button onClick={() => navigate('/admin/reservations')} className="text-[10px] font-bold text-hannam-gold uppercase tracking-widest flex items-center gap-1 hover:text-hannam-green transition-colors">{ADMIN_UI.dashboard.schedule.viewAll} <ChevronRight className="w-3.5 h-3.5"/></button>
           </div>
           <div className="space-y-1">
              {reservations.slice(0, 5).map(res => (
                <div key={res.id} onClick={() => navigate(`/admin/care-session/${res.id}`)} className="p-6 hover:bg-hannam-bg rounded-2xl transition-all cursor-pointer flex justify-between items-center group">
                   <div className="w-20 border-r border-hannam-border">
                      <span className="text-sm num-data font-semibold text-hannam-gold">{res.dateTime?.split('T')[1]?.substring(0, 5)}</span>
                   </div>
                   <div className="flex-1 px-10">
                      <p className="text-sm font-bold text-hannam-text">{res.memberName}</p>
                      <p className="text-[10px] text-hannam-muted font-bold uppercase mt-0.5">{res.serviceType}</p>
                   </div>
                   <ChevronRight className="w-4 h-4 text-hannam-border group-hover:text-hannam-gold transition-colors" />
                </div>
              ))}
              {reservations.length === 0 && <p className="text-center py-20 text-hannam-muted text-xs italic">{ADMIN_UI.dashboard.schedule.noData}</p>}
           </div>
        </div>

        <div className="col-span-4 space-y-6">
           <div className="bg-hannam-green p-10 rounded-[32px] text-white shadow-hannam-deep">
              <h3 className="text-[10px] font-bold text-hannam-gold uppercase tracking-widest mb-10">{ADMIN_UI.dashboard.portfolio.title}</h3>
              <div className="space-y-5">
                {templates.map(tmpl => (
                  <div key={tmpl.id} className="flex justify-between items-center border-b border-white/5 pb-5">
                    <span className="text-xs font-medium text-white/90">{tmpl.title}</span>
                    <button onClick={() => handleEditTemplate(tmpl)} className="text-hannam-gold hover:text-white transition-colors"><Edit3 className="w-3.5 h-3.5"/></button>
                  </div>
                ))}
                <button onClick={() => { setEditingTemplate(null); setNewTemplateTitle(''); setIsSettingModalOpen(true); }} className="w-full py-4 mt-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-3.5 h-3.5"/> {ADMIN_UI.dashboard.portfolio.newPlan}
                </button>
              </div>
           </div>
        </div>
      </div>

      {/* Plan Settings Modal */}
      {isSettingModalOpen && (
        <div className="fixed inset-0 bg-[#1A362E]/20 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleSaveTemplate} className="bg-white w-full max-w-md rounded-[40px] p-12 shadow-hannam-deep animate-smooth-fade border border-[#F1EFEA]">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-xl font-serif font-bold text-hannam-green uppercase tracking-wide">{editingTemplate ? ADMIN_UI.common.edit : ADMIN_UI.dashboard.portfolio.newPlan}</h2>
                 <button type="button" onClick={() => setIsSettingModalOpen(false)}><X className="w-6 h-6 text-hannam-muted" /></button>
              </div>
              <div className="space-y-8">
                <div>
                   <label className="text-[10px] font-bold text-hannam-muted uppercase tracking-widest ml-1 mb-2 block">프로그램 명칭</label>
                   <input type="text" value={newTemplateTitle} onChange={e => setNewTemplateTitle(e.target.value)} placeholder="상품명을 입력하세요" className="w-full p-5 bg-hannam-bg rounded-2xl font-bold text-sm outline-none border border-transparent focus:border-hannam-gold" required />
                </div>
                <button type="submit" className="w-full py-5 btn-hannam-primary text-[11px] font-bold uppercase tracking-widest shadow-lg">{ADMIN_UI.common.save}</button>
              </div>
           </form>
        </div>
      )}

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-[#1A362E]/20 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[40px] p-12 shadow-hannam-deep animate-smooth-fade border border-[#F1EFEA]">
              <div className="flex justify-between items-center mb-8">
                 <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-hannam-gold" />
                    <h2 className="text-xl font-serif font-bold text-hannam-green uppercase tracking-wide">보안 설정</h2>
                 </div>
                 <button type="button" onClick={() => setIsPasswordModalOpen(false)}><X className="w-6 h-6 text-hannam-muted" /></button>
              </div>

              {pwStep === 1 && (
                <div className="space-y-8 text-center py-6">
                   <div className="space-y-2">
                      <p className="text-sm font-bold text-hannam-text">본인 확인 단계</p>
                      <p className="text-[11px] text-hannam-muted leading-relaxed">아래 이메일로 6자리 인증 코드가 전송됩니다.<br/><span className="font-bold text-hannam-gold">{currentUser?.email}</span></p>
                   </div>
                   <button onClick={handleRequestOTP} disabled={isProcessing} className="w-full py-5 btn-hannam-primary text-[11px] font-bold uppercase tracking-widest shadow-lg">
                      {isProcessing ? '발송 중...' : '인증 코드 요청'}
                   </button>
                </div>
              )}

              {pwStep === 2 && (
                <div className="space-y-8 text-center py-6">
                   <div className="space-y-2">
                      <p className="text-sm font-bold">인증 코드 입력</p>
                      <p className="text-[11px] text-hannam-muted">수신하신 코드를 입력해 주세요.</p>
                   </div>
                   <input 
                     type="text" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="000000" 
                     className="w-full p-6 bg-hannam-bg rounded-2xl font-bold text-center text-3xl tracking-[0.4em] outline-none border border-transparent focus:border-hannam-gold" 
                   />
                   <div className="flex gap-3">
                      <button onClick={() => setPwStep(1)} className="flex-1 py-4 bg-hannam-bg text-hannam-muted rounded-2xl text-[10px] font-bold uppercase">이전</button>
                      <button onClick={handleVerifyOTP} disabled={otpCode.length !== 6 || isProcessing} className="flex-[2] py-4 btn-hannam-primary text-[10px] font-bold uppercase disabled:opacity-30">코드 확인</button>
                   </div>
                </div>
              )}

              {pwStep === 3 && (
                <div className="space-y-6 py-6">
                   <div className="space-y-4">
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-5 bg-hannam-bg rounded-2xl font-bold text-xs outline-none" placeholder="새 비밀번호 입력" />
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-5 bg-hannam-bg rounded-2xl font-bold text-xs outline-none" placeholder="새 비밀번호 확인" />
                   </div>
                   <button onClick={handleChangePassword} disabled={isProcessing || !newPassword} className="w-full py-5 btn-hannam-primary text-[11px] font-bold uppercase shadow-lg">비밀번호 변경 완료</button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
