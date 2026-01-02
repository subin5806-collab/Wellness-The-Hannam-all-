
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { authService } from '../../services/authService';
import { Calendar, Clock, AlertCircle, TrendingDown, ChevronRight, Edit3, Plus, X, Shield } from 'lucide-react';
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
      alert('비밀번호가 성공적으로 변경되었습니다. 다시 로그인해 주세요.');
      authService.logout();
      navigate('/login');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!stats) return <div className="min-h-screen flex items-center justify-center bg-hannam-bg font-serif text-hannam-green tracking-widest uppercase">{ADMIN_UI.common.loading}</div>;

  const statItems = [
    { label: ADMIN_UI.dashboard.stats.bookingToday, value: stats.todayReservations || 0, unit: '건', icon: Calendar, path: '/admin/reservations', color: 'text-gray-900' },
    { label: ADMIN_UI.dashboard.stats.awaitingSign, value: stats.pendingSignatures || 0, unit: '건', icon: Clock, path: '/admin/members', color: 'text-hannam-gold' },
    { label: ADMIN_UI.dashboard.stats.unprocessedInquiry, value: stats.unprocessedInquiries || 0, unit: '건', icon: AlertCircle, color: 'text-red-600', path: '/admin/inquiries' },
    { label: ADMIN_UI.dashboard.stats.lowBalance, value: stats.lowBalanceCount || 0, unit: '명', icon: TrendingDown, color: 'text-amber-600', path: '/admin/members' },
  ];

  return (
    <div className="min-h-screen bg-[#F6F6F6] px-8 py-10 font-sans animate-smooth-fade">
      {/* 상단 타이틀 섹션 */}
      <div className="max-w-7xl mx-auto flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{ADMIN_UI.dashboard.title}</h1>
          <p className="text-[11px] font-medium text-gray-400 mt-1 uppercase tracking-wider">{ADMIN_UI.dashboard.subtitle}</p>
        </div>
        <button 
          onClick={() => setIsPasswordModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-md text-[11px] font-bold text-gray-500 hover:text-hannam-green transition-all shadow-sm"
        >
          <Shield className="w-3.5 h-3.5" /> 보안 설정
        </button>
      </div>

      {/* KPI 카드 섹션 - 숫자 중심, 장식 배제 */}
      <div className="max-w-7xl mx-auto grid grid-cols-4 gap-5 mb-8">
        {statItems.map((item, i) => (
          <div key={i} onClick={() => navigate(item.path)} className="bg-white border border-gray-200 p-6 rounded-md cursor-pointer hover:border-gray-300 transition-all shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{item.label}</span>
              <item.icon className={`w-3.5 h-3.5 ${item.color} opacity-20`} />
            </div>
            <div className="flex items-baseline gap-1">
              <h3 className={`text-3xl font-bold ${item.color} leading-none`}>{item.value}</h3>
              <span className="text-[11px] font-bold text-gray-400 uppercase">{item.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* 오늘의 예약 일정 - 간결한 리스트 형태 */}
        <div className="col-span-8 bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
           <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">{ADMIN_UI.dashboard.schedule.title}</h3>
              <button onClick={() => navigate('/admin/reservations')} className="text-[10px] font-bold text-hannam-gold uppercase tracking-widest flex items-center gap-1 hover:text-hannam-green transition-colors">
                {ADMIN_UI.dashboard.schedule.viewAll} <ChevronRight className="w-3 h-3"/>
              </button>
           </div>
           <div className="divide-y divide-gray-50">
              {reservations.slice(0, 6).map(res => (
                <div key={res.id} onClick={() => navigate(`/admin/care-session/${res.id}`)} className="px-6 py-4 hover:bg-gray-50 transition-all cursor-pointer flex justify-between items-center group">
                   <div className="w-16">
                      <span className="text-xs font-bold text-gray-400 num-data">{res.dateTime?.split('T')[1]?.substring(0, 5)}</span>
                   </div>
                   <div className="flex-1 px-4">
                      <p className="text-xs font-bold text-gray-900">{res.memberName}</p>
                   </div>
                   <div className="flex-1 text-right px-4">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{res.serviceType}</p>
                   </div>
                   <div className="w-8 text-right">
                      <ChevronRight className="w-3.5 h-3.5 text-gray-200 group-hover:text-gray-400 transition-colors" />
                   </div>
                </div>
              ))}
              {reservations.length === 0 && <p className="text-center py-16 text-gray-300 text-xs italic">{ADMIN_UI.dashboard.schedule.noData}</p>}
           </div>
        </div>

        {/* 멤버십 프로그램 - 우측 패널 */}
        <div className="col-span-4 space-y-5">
           <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm p-6">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-3">{ADMIN_UI.dashboard.portfolio.title}</h3>
              <div className="space-y-4">
                {templates.map(tmpl => (
                  <div key={tmpl.id} className="flex justify-between items-center pb-3 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-bold text-gray-700">{tmpl.title}</span>
                    <button onClick={() => handleEditTemplate(tmpl)} className="text-gray-300 hover:text-hannam-gold transition-colors"><Edit3 className="w-3.5 h-3.5"/></button>
                  </div>
                ))}
                <button onClick={() => { setEditingTemplate(null); setNewTemplateTitle(''); setIsSettingModalOpen(true); }} className="w-full py-3 mt-2 bg-gray-50 border border-gray-200 rounded-md text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-3 h-3"/> {ADMIN_UI.dashboard.portfolio.newPlan}
                </button>
              </div>
           </div>
        </div>
      </div>

      {/* 설정 모달 - 직각형 구조 */}
      {isSettingModalOpen && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleSaveTemplate} className="bg-white w-full max-w-sm rounded-md p-8 shadow-2xl animate-smooth-fade border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{editingTemplate ? ADMIN_UI.common.edit : ADMIN_UI.dashboard.portfolio.newPlan}</h2>
                 <button type="button" onClick={() => setIsSettingModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">프로그램 명칭</label>
                   <input type="text" value={newTemplateTitle} onChange={e => setNewTemplateTitle(e.target.value)} placeholder="상품명을 입력하세요" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md font-bold text-xs outline-none focus:border-hannam-gold" required />
                </div>
                <button type="submit" className="w-full py-3.5 bg-gray-900 text-white rounded-md text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-md">{ADMIN_UI.common.save}</button>
              </div>
           </form>
        </div>
      )}

      {/* 보안 설정 모달 */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-md p-8 shadow-2xl animate-smooth-fade border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-hannam-gold" />
                    <h2 className="text-sm font-bold text-gray-900 uppercase">보안 설정</h2>
                 </div>
                 <button type="button" onClick={() => setIsPasswordModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              {pwStep === 1 && (
                <div className="space-y-6 text-center py-4">
                   <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-900">본인 확인</p>
                      <p className="text-[10px] text-gray-400 leading-relaxed">이메일로 인증 코드가 발송됩니다.<br/><span className="font-bold text-hannam-gold">{currentUser?.email}</span></p>
                   </div>
                   <button onClick={handleRequestOTP} disabled={isProcessing} className="w-full py-3.5 bg-gray-900 text-white rounded-md text-[11px] font-bold uppercase tracking-widest shadow-md">
                      {isProcessing ? '발송 중...' : '인증 코드 요청'}
                   </button>
                </div>
              )}

              {pwStep === 2 && (
                <div className="space-y-6 text-center py-4">
                   <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-900">인증 코드 입력</p>
                   </div>
                   <input 
                     type="text" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="000000" 
                     className="w-full p-4 bg-gray-50 border border-gray-200 rounded-md font-bold text-center text-2xl tracking-[0.4em] outline-none focus:border-hannam-gold" 
                   />
                   <div className="flex gap-2">
                      <button onClick={() => setPwStep(1)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-md text-[10px] font-bold uppercase">이전</button>
                      <button onClick={handleVerifyOTP} disabled={otpCode.length !== 6 || isProcessing} className="flex-[2] py-3 bg-gray-900 text-white rounded-md text-[10px] font-bold uppercase disabled:opacity-30">코드 확인</button>
                   </div>
                </div>
              )}

              {pwStep === 3 && (
                <div className="space-y-4 py-4">
                   <div className="space-y-3">
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md font-bold text-xs outline-none" placeholder="새 비밀번호 입력" />
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md font-bold text-xs outline-none" placeholder="새 비밀번호 확인" />
                   </div>
                   <button onClick={handleChangePassword} disabled={isProcessing || !newPassword} className="w-full py-3.5 bg-gray-900 text-white rounded-md text-[11px] font-bold uppercase shadow-md">비밀번호 변경 완료</button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
