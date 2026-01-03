
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../../services/dbService';
import { authService } from '../../services/authService';
import { Member, CareRecord, Reservation, Contract, NotificationType } from '../../types';
import { 
  ArrowLeft, Mail, Phone, UserCheck, Settings, ShieldCheck, 
  History, Download, ChevronRight, ClipboardList, Send, Bell, X,
  FileText, Calendar, Wallet, Sparkles
} from 'lucide-react';

export const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  
  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<CareRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activeTab, setActiveTab] = useState<'financial' | 'contracts' | 'care' | 'notes' | 'logs'>('financial');
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
        case 'membership':
          await dbService.exportMembershipInfo(member, currentUser.name);
          break;
        case 'financial':
          await dbService.exportFinancialHistory(member, currentUser.name);
          break;
        case 'notes':
          await dbService.exportWellnessNotes(member, currentUser.name);
          break;
        case 'reservations':
          await dbService.exportReservationHistory(member, currentUser.name);
          break;
      }
    } catch (e) {
      alert('다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleSendCustomNoti = async () => {
    if (!member || !notiMsg) return;
    await dbService.sendNotification({
      memberId: member.id,
      type: notiType,
      title: notiType === NotificationType.SIGN_REQUEST ? '서명 확인 요청' : '안내 메시지',
      message: notiMsg
    });
    alert('알림이 전송되었습니다.');
    setIsNotiModalOpen(false);
    setNotiMsg('');
  };

  if (!member) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold uppercase tracking-widest">데이터 로딩 중...</div>;

  return (
    <div className="min-h-screen bg-[#FBF9F6] font-sans pb-24 animate-smooth-fade">
      <header className="bg-white border-b border-gray-100 px-10 py-5 sticky top-0 z-[100] shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/admin/members')} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-gray-900">{member.name} <span className="text-gray-300 ml-1 font-medium text-sm">#{member.id}</span></h2>
              <div className="flex gap-4 mt-1">
                <span className="text-[10px] font-bold text-gray-400 num-data">{member.phone}</span>
                <span className="text-[10px] font-bold text-gray-400">{member.email}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => setIsNotiModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-hannam-gold text-white rounded-xl text-[11px] font-bold hover:bg-black transition-all shadow-sm">
                <Bell className="w-3.5 h-3.5" /> 회원 알림 보내기
             </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-10 py-10">
        {/* 회원 정보 및 잔액 카드 */}
        <div className="grid grid-cols-12 gap-8 mb-10">
          <div className="col-span-5 bg-hannam-green p-10 rounded-[40px] text-white shadow-hannam-deep relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">현재 잔여 금액</p>
              <h3 className="text-5xl font-serif font-medium tracking-tight mb-10"><span className="text-2xl mr-2 text-hannam-gold">₩</span><span className="num-data">{member.remaining.toLocaleString()}</span></h3>
              <div className="flex gap-8 pt-8 border-t border-white/10">
                <div><p className="text-[9px] font-black text-white/30 uppercase mb-1">총 예치금</p><p className="text-sm font-bold num-data">₩ {(member.deposit + member.used).toLocaleString()}</p></div>
                <div><p className="text-[9px] font-black text-white/30 uppercase mb-1">누적 사용액</p><p className="text-sm font-bold num-data text-hannam-gold">₩ {member.used.toLocaleString()}</p></div>
              </div>
            </div>
            <ShieldCheck className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-[0.03] pointer-events-none" />
          </div>

          {/* 데이터 리포트 센터 (신규 섹션) */}
          <div className="col-span-7 bg-white p-10 rounded-[40px] border border-hannam-border shadow-hannam-soft">
             <div className="flex items-center gap-3 mb-8">
                <Download className="w-4.5 h-4.5 text-hannam-gold" />
                <h4 className="text-[11px] font-black text-hannam-text uppercase tracking-widest">Data Report Center</h4>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleExport('membership')}
                  className="flex items-center justify-between p-5 bg-hannam-bg/50 border border-hannam-border rounded-2xl hover:bg-white hover:border-hannam-gold transition-all group"
                >
                   <div className="flex items-center gap-4">
                      <FileText className="w-5 h-5 text-hannam-muted group-hover:text-hannam-gold" />
                      <span className="text-[12px] font-bold text-hannam-text">멤버십 기본 정보</span>
                   </div>
                   <ChevronRight className="w-4 h-4 text-hannam-border" />
                </button>
                <button 
                  onClick={() => handleExport('financial')}
                  className="flex items-center justify-between p-5 bg-hannam-bg/50 border border-hannam-border rounded-2xl hover:bg-white hover:border-hannam-gold transition-all group"
                >
                   <div className="flex items-center gap-4">
                      <Wallet className="w-5 h-5 text-hannam-muted group-hover:text-hannam-gold" />
                      <span className="text-[12px] font-bold text-hannam-text">금액 및 차감 내역</span>
                   </div>
                   <ChevronRight className="w-4 h-4 text-hannam-border" />
                </button>
                <button 
                  onClick={() => handleExport('reservations')}
                  className="flex items-center justify-between p-5 bg-hannam-bg/50 border border-hannam-border rounded-2xl hover:bg-white hover:border-hannam-gold transition-all group"
                >
                   <div className="flex items-center gap-4">
                      <Calendar className="w-5 h-5 text-hannam-muted group-hover:text-hannam-gold" />
                      <span className="text-[12px] font-bold text-hannam-text">예약 및 관리 이력</span>
                   </div>
                   <ChevronRight className="w-4 h-4 text-hannam-border" />
                </button>
                <button 
                  onClick={() => handleExport('notes')}
                  className="flex items-center justify-between p-5 bg-hannam-bg/50 border border-hannam-border rounded-2xl hover:bg-white hover:border-hannam-gold transition-all group"
                >
                   <div className="flex items-center gap-4">
                      <Sparkles className="w-5 h-5 text-hannam-muted group-hover:text-hannam-gold" />
                      <span className="text-[12px] font-bold text-hannam-text">웰니스 케어 노트</span>
                   </div>
                   <ChevronRight className="w-4 h-4 text-hannam-border" />
                </button>
             </div>
          </div>
        </div>

        {/* 탭 네비게이션 및 상세 내역 */}
        <div className="space-y-10">
          <div className="flex gap-12 border-b border-gray-100 py-2">
             {['financial', 'contracts', 'care', 'notes'].map(tab => (
               <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-4 text-[11px] font-black uppercase tracking-[0.15em] relative transition-all ${activeTab === tab ? 'text-gray-900' : 'text-gray-300 hover:text-gray-500'}`}>
                  {tab.toUpperCase()}
                  {activeTab === tab && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-gray-900" />}
               </button>
             ))}
          </div>
          <div className="min-h-[400px]">
             {activeTab === 'financial' && (
                <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-hannam-soft">
                  <table className="w-full text-left">
                    <thead><tr className="bg-hannam-bg/20 text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50"><th className="px-10 py-5">차감 일시</th><th className="px-10 py-5">서비스명</th><th className="px-10 py-5">차감 금액</th><th className="px-10 py-5 text-right">상태</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {history.map(record => (
                        <tr key={record.id} className="hover:bg-gray-50/50">
                          <td className="px-10 py-7 text-xs text-gray-500 num-data">{record.date}</td>
                          <td className="px-10 py-7 text-sm font-bold text-gray-900">{record.content}</td>
                          <td className="px-10 py-7 text-sm font-black text-red-500 num-data">- ₩{record.discountedPrice.toLocaleString()}</td>
                          <td className="px-10 py-7 text-right"><span className="px-3 py-1 bg-gray-100 text-gray-500 text-[9px] font-black rounded-lg uppercase">Deducted</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             )}
          </div>
        </div>
      </div>

      {isNotiModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[48px] p-12 shadow-2xl border border-hannam-border animate-smooth-fade">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-xl font-serif font-bold text-hannam-green uppercase">Individual Notification</h2>
                 <button onClick={() => setIsNotiModalOpen(false)}><X className="w-6 h-6 text-gray-300" /></button>
              </div>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">알림 유형</label>
                    <select value={notiType} onChange={e => setNotiType(e.target.value as NotificationType)} className="w-full p-4 bg-hannam-bg rounded-2xl font-bold text-xs outline-none">
                       <option value={NotificationType.GENERAL}>일반 안내</option>
                       <option value={NotificationType.SIGN_REQUEST}>서명 확인 요청</option>
                       <option value={NotificationType.CONTRACT_CONFIRM}>계약 체결 안내</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">메시지 내용 *</label>
                    <textarea value={notiMsg} onChange={e => setNotiMsg(e.target.value)} rows={4} placeholder="회원에게 전달할 내용을 입력하세요." className="w-full p-5 bg-hannam-bg border border-hannam-border rounded-2xl font-medium text-xs outline-none focus:bg-white focus:border-hannam-gold transition-all" />
                 </div>
                 <button onClick={handleSendCustomNoti} className="w-full py-5 bg-hannam-green text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-xl mt-6 hover:bg-black transition-all active:scale-95">
                    알림 전송하기
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
