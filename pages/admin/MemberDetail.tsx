
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../../services/dbService';
import { authService } from '../../services/authService';
import { Member, CareRecord, Reservation, Contract, NotificationType } from '../../types';
import { 
  ArrowLeft, Mail, Phone, ShieldCheck, 
  Download, ChevronRight, Bell, X,
  FileText, Calendar, Wallet, Sparkles, CheckCircle2, User, LayoutGrid
} from 'lucide-react';

export const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  
  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<CareRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activeTab, setActiveTab] = useState<'ledger' | 'contracts' | 'care' | 'notes'>('ledger');
  const [isNotiModalOpen, setIsNotiModalOpen] = useState(false);
  const [notiType, setNotiType] = useState(NotificationType.GENERAL);
  const [notiMsg, setNotiMsg] = useState('');

  useEffect(() => { loadAllMemberData(); }, [id]);

  const loadAllMemberData = async () => {
    if (!id) return;
    const [m, h, r, c] = await Promise.all([
      dbService.getMemberById(id),
      dbService.getMemberCareHistory(id),
      dbService.getReservations(id),
      dbService.getAllContracts()
    ]);
    if (m) setMember(m);
    setHistory(h);
    setReservations(r);
    setContracts(c.filter(con => con.memberId === id || con.memberPhone === m?.phone));
  };

  const handleExport = async (type: 'membership' | 'financial' | 'notes' | 'reservations') => {
    if (!member || !currentUser) return;
    try {
      switch(type) {
        case 'membership': await dbService.exportMembershipInfo(member, currentUser.name); break;
        case 'financial': await dbService.exportFinancialHistory(member, currentUser.name); break;
        case 'notes': await dbService.exportWellnessNotes(member, currentUser.name); break;
        case 'reservations': await dbService.exportReservationHistory(member, currentUser.name); break;
      }
    } catch (e) { alert('다운로드 오류'); }
  };

  const handleSendNoti = async () => {
    if (!member || !notiMsg) return;
    await dbService.sendNotification({
      memberId: member.id, type: notiType,
      title: notiType === NotificationType.SIGN_REQUEST ? '서명 확인 요청' : '안내 메시지',
      message: notiMsg
    });
    alert('알림 전송 완료');
    setIsNotiModalOpen(false);
    setNotiMsg('');
  };

  if (!member) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold uppercase tracking-widest">Loading...</div>;

  return (
    <div className="min-h-screen bg-hannam-bg font-sans pb-24 animate-smooth-fade">
      <header className="bg-white border-b border-hannam-border px-10 py-6 sticky top-0 z-[100] shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <button onClick={() => navigate('/admin/members')} className="p-2.5 hover:bg-hannam-bg rounded-xl transition-all text-hannam-muted"><ArrowLeft className="w-5 h-5" /></button>
            <div className="flex flex-col">
              <h2 className="text-xl font-serif font-bold text-hannam-green tracking-tight uppercase">{member.name} <span className="text-hannam-gold ml-2 font-black text-xs opacity-50">#{member.id}</span></h2>
              <div className="flex gap-4 mt-1">
                <span className="text-[10px] font-black text-hannam-muted uppercase tracking-widest">{member.phone}</span>
                <span className="text-[10px] font-black text-hannam-muted uppercase tracking-widest">{member.email}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => setIsNotiModalOpen(true)} className="flex items-center gap-2.5 px-6 py-3.5 bg-hannam-gold text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-hannam-deep">
                <Bell className="w-3.5 h-3.5" /> 알림 메시지 발송
             </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-10 py-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-6 bg-hannam-green p-12 rounded-[48px] text-white shadow-hannam-deep relative overflow-hidden flex flex-col justify-between h-[340px]">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Client Financial Status</p>
              <h3 className="text-5xl font-serif font-medium tracking-tight mb-12"><span className="text-2xl mr-2 text-hannam-gold">₩</span><span className="num-data">{member.remaining.toLocaleString()}</span></h3>
              <div className="grid grid-cols-2 gap-10 pt-10 border-t border-white/10">
                <div><p className="text-[9px] font-black text-white/30 uppercase mb-1.5">Total Deposits</p><p className="text-[15px] font-black num-data">₩ {(member.deposit + member.used).toLocaleString()}</p></div>
                <div className="text-right"><p className="text-[9px] font-black text-white/30 uppercase mb-1.5">Accumulated Usage</p><p className="text-[15px] font-black text-hannam-gold num-data">₩ {member.used.toLocaleString()}</p></div>
              </div>
            </div>
            <ShieldCheck className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-[0.03] pointer-events-none" />
          </div>

          <div className="md:col-span-6 bg-white p-12 rounded-[48px] border border-hannam-border shadow-hannam-soft flex flex-col h-[340px]">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                   <Sparkles className="w-5 h-5 text-hannam-gold" />
                   <h4 className="text-[11px] font-black text-hannam-text uppercase tracking-widest">데이터 아카이브 추출</h4>
                </div>
             </div>
             <div className="flex-1 space-y-6">
                <div className="bg-hannam-bg/50 p-8 rounded-[32px] border border-hannam-border italic relative">
                   <p className="text-[13px] font-medium text-hannam-muted leading-relaxed">"{member.adminNote || '이 회원에 대해 기록된 관리자 메모가 없습니다.'}"</p>
                   <p className="text-[9px] font-black text-hannam-gold uppercase tracking-widest mt-4">Last Consultation Note</p>
                </div>
             </div>
             <div className="flex gap-3 mt-6">
                <button onClick={() => handleExport('membership')} className="flex-1 py-3 bg-white border border-hannam-border rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-hannam-gold transition-all flex items-center justify-center gap-2">
                   <Download className="w-3 h-3" /> 멤버십 정보
                </button>
                <button onClick={() => handleExport('financial')} className="flex-1 py-3 bg-white border border-hannam-border rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-hannam-gold transition-all flex items-center justify-center gap-2">
                   <Download className="w-3 h-3" /> 재무 내역 CSV
                </button>
                <button onClick={() => handleExport('notes')} className="flex-1 py-3 bg-white border border-hannam-border rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-hannam-gold transition-all flex items-center justify-center gap-2">
                   <Download className="w-3 h-3" /> 케어 노트
                </button>
                <button onClick={() => handleExport('reservations')} className="flex-1 py-3 bg-white border border-hannam-border rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-hannam-gold transition-all flex items-center justify-center gap-2">
                   <Download className="w-3 h-3" /> 전체 이력
                </button>
             </div>
          </div>
        </div>
        {/* 상세 탭 영역 유지 */}
      </div>
    </div>
  );
};
