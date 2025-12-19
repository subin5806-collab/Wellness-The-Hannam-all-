
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { authService } from '../../services/authService';
import { Member, CareRecord, Reservation, CareStatus, MemberTier } from '../../types';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  LogOut, 
  RefreshCw,
  Clock,
  FileText,
  ChevronRight,
  Info
} from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';

export const MemberPortal: React.FC = () => {
  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<CareRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [pendingRecord, setPendingRecord] = useState<CareRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'notes'>('home');
  
  const [signature, setSignature] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    loadMemberData();
  }, [currentUser]);

  const loadMemberData = async () => {
    if (!currentUser) return;
    const [m, h, r] = await Promise.all([
      dbService.getMemberById(currentUser.id),
      dbService.getMemberCareHistory(currentUser.id),
      dbService.getReservations(currentUser.id)
    ]);

    if (m) {
      setMember(m);
      setHistory(h);
      setReservations(r);
      const pending = h.find(rec => rec.status === CareStatus.WAITING_SIGNATURE);
      setPendingRecord(pending || null);
    }
  };

  const handleSignComplete = async () => {
    if (!pendingRecord || !signature) return;
    setIsProcessing(true);
    try {
      await dbService.signCareRecord(pendingRecord.id, signature);
      alert('결제 승인이 완료되었습니다.');
      setPendingRecord(null);
      setSignature('');
      await loadMemberData();
    } catch (e) {
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getWeeklyReservations = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return reservations.filter(res => {
      const resDate = new Date(res.dateTime);
      return resDate >= today && resDate <= nextWeek && res.status === 'booked';
    });
  };

  const getTierInfo = (tier: MemberTier) => {
    switch (tier) {
      case MemberTier.ROYAL: return { discount: '20%', next: null, target: 0 };
      case MemberTier.GOLD: return { discount: '15%', next: MemberTier.ROYAL, target: 10000000 };
      default: return { discount: '10%', next: MemberTier.GOLD, target: 5000000 };
    }
  };

  if (!member) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold uppercase tracking-widest text-xs">Loading Hannam Portal...</div>;

  const tierInfo = getTierInfo(member.tier);

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-hannam-text pb-32">
      {/* Header */}
      <header className="px-6 py-5 flex justify-between items-center bg-white sticky top-0 z-[60] border-b border-gray-100 shadow-sm">
        <div className="flex flex-col">
          <h1 className="text-[11px] font-serif font-bold tracking-[0.2em] text-hannam-green uppercase">WELLNESS, THE HANNAM</h1>
          <p className="text-[9px] text-hannam-gold font-bold uppercase tracking-widest">Private Member Console</p>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={loadMemberData} className="p-2 text-gray-300 active:scale-95 transition-transform"><RefreshCw className="w-4 h-4" /></button>
           <div className="w-8 h-8 bg-hannam-green rounded-lg flex items-center justify-center text-white text-[11px] font-serif">{member.name[0]}</div>
        </div>
      </header>

      <main className="px-5 py-6 space-y-8 max-w-lg mx-auto">
        
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fade-in">
            {/* 1. 싸인 알람 (Signature Pending) - 최상단 고정 */}
            {pendingRecord && (
              <section>
                <div className="bg-white rounded-2xl shadow-xl border border-red-50 p-6 space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-bold text-red-600 leading-tight">결제 승인 대기</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Authorization Required</p>
                    </div>
                    <span className="bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded">URGENT</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center border border-gray-100">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">{pendingRecord.content}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{pendingRecord.date} • {pendingRecord.therapistName}</p>
                    </div>
                    <p className="text-base font-black text-red-600 num-clean">-₩{pendingRecord.discountedPrice.toLocaleString()}</p>
                  </div>
                  <div className="h-44 bg-white rounded-xl border border-gray-200 overflow-hidden relative">
                    <SignaturePad onSave={setSignature} onClear={() => setSignature('')} />
                  </div>
                  <button 
                    onClick={handleSignComplete}
                    disabled={!signature || isProcessing}
                    className={`w-full py-4.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                      signature ? 'bg-hannam-green text-white shadow-lg' : 'bg-gray-100 text-gray-300'
                    }`}
                  >
                    {isProcessing ? 'Processing...' : '서명 후 결제 승인'}
                  </button>
                </div>
              </section>
            )}

            {/* 2. 멤버십 한도 카드 (이미지 1 스타일 반영) */}
            <section>
              <div className="bg-hannam-green rounded-2xl p-8 text-white min-h-[200px] flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mb-16" />
                <div>
                  <p className="text-[12px] font-medium text-white/70 mb-4 tracking-tight">Remaining Membership Limit</p>
                  <h3 className="text-5xl font-serif font-medium tracking-tight">
                    <span className="text-3xl mr-1">₩</span>
                    {member.remaining.toLocaleString()}
                  </h3>
                </div>
                <div className="flex gap-12 pt-6 border-t border-white/10 mt-6">
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Total Deposit</p>
                    <p className="text-[15px] font-medium num-clean">₩{member.deposit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Total Usage</p>
                    <p className="text-[15px] font-medium num-clean text-red-400">₩{member.used.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. 멤버십 혜택 현황 (이미지 2 스타일 반영) */}
            <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
               <h4 className="text-xl font-serif font-bold text-hannam-green border-b border-gray-50 pb-4">Membership Benefits</h4>
               <div className="flex items-center gap-3">
                  <h5 className="text-2xl font-bold text-slate-800">{member.tier} Tier</h5>
                  <span className="bg-green-50 text-hannam-green text-[10px] font-black uppercase px-3 py-1.5 rounded-md border border-green-100">
                    {tierInfo.discount} Discount Applied
                  </span>
               </div>
               {tierInfo.next && (
                 <div className="space-y-4">
                   <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                     Deposit an additional <span className="font-bold text-slate-900 num-clean">₩{(tierInfo.target - member.deposit).toLocaleString()}</span> to upgrade to the next tier with <span className="font-bold text-slate-900">20% discount</span> benefits.
                   </p>
                   <p className="text-[10px] text-slate-300 leading-relaxed italic">
                     Note: Discount rates are calculated based on cumulative deposits and are automatically applied to all services and product payments.
                   </p>
                 </div>
               )}
            </section>

            {/* 4. 금주 예약 일정 (스크롤 시 노출) */}
            <section className="space-y-4">
               <div className="flex justify-between items-end px-1">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Weekly Schedule</h3>
                  <button onClick={() => setActiveTab('history')} className="text-[9px] font-black text-hannam-gold uppercase tracking-widest">View All</button>
               </div>
               <div className="space-y-3">
                  {getWeeklyReservations().length > 0 ? getWeeklyReservations().map(res => (
                    <div key={res.id} className="bg-white border border-gray-100 p-5 rounded-xl flex items-center gap-4 shadow-sm">
                       <div className="w-10 h-10 bg-gray-50 rounded-lg flex flex-col items-center justify-center">
                          <span className="text-[8px] font-black text-gray-300 uppercase">{new Date(res.dateTime).toLocaleDateString('ko-KR', {month:'short'})}</span>
                          <span className="text-sm font-black text-hannam-green num-clean leading-none">{new Date(res.dateTime).getDate()}</span>
                       </div>
                       <div className="flex-1">
                          <p className="text-xs font-bold text-gray-900">{res.serviceType}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{new Date(res.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} • {res.therapistName}</p>
                       </div>
                       <ChevronRight className="w-4 h-4 text-gray-200" />
                    </div>
                  )) : (
                    <div className="py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                       <p className="text-[11px] text-gray-300 font-medium italic">예정된 일정이 없습니다.</p>
                    </div>
                  )}
               </div>
            </section>

            {/* 5. 최근 케어 노트 요약 (3개) */}
            <section className="space-y-4">
               <div className="flex justify-between items-end px-1">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Recent Care Notes</h3>
                  <button onClick={() => setActiveTab('notes')} className="text-[9px] font-black text-hannam-gold uppercase tracking-widest">Archive</button>
               </div>
               <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {history.filter(h => h.status === CareStatus.COMPLETED).slice(0, 3).map(note => (
                    <div key={note.id} className="min-w-[280px] bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                       <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-hannam-gold uppercase tracking-widest">{note.date}</span>
                          <span className="text-[9px] font-bold text-gray-300">{note.therapistName}</span>
                       </div>
                       <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{note.content}</h4>
                       <p className="text-[11px] text-gray-500 italic line-clamp-2 leading-relaxed">"{note.feedback || '세션 완료'}"</p>
                    </div>
                  ))}
                  {history.filter(h => h.status === CareStatus.COMPLETED).length === 0 && (
                     <div className="w-full py-10 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-[11px] text-gray-300 font-medium italic">기록된 케어 노트가 없습니다.</p>
                     </div>
                  )}
               </div>
            </section>

            {/* 6. 다음 추천 관리 (관리자 설정값 노출) */}
            <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
               <div className="flex items-center gap-2 mb-4">
                  <Info className="w-3.5 h-3.5 text-hannam-gold" />
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Personal Wellness Plan</h4>
               </div>
               <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 mb-1">Focus Goal</p>
                    <p className="text-xs font-bold text-slate-900">{member.coreGoal || '설정된 목표가 없습니다.'}</p>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-[10px] font-bold text-hannam-gold mb-1">Recommended Next Care</p>
                    <p className="text-xs font-bold text-hannam-green">{member.aiRecommended || '담당자 추천 대기 중'}</p>
                  </div>
               </div>
            </section>

            {/* 로그아웃 버튼 (홈 화면 최하단에 단 한 번만 노출) */}
            <div className="pt-16 pb-6 text-center">
              <button 
                onClick={() => { if(confirm('로그아웃 하시겠습니까?')) { authService.logout(); navigate('/'); } }}
                className="text-[10px] font-bold text-gray-300 uppercase tracking-widest hover:text-red-400 transition-colors flex items-center justify-center gap-1.5 mx-auto"
              >
                <LogOut className="w-3 h-3" /> Logout from Portal
              </button>
              <p className="text-[8px] text-gray-200 mt-2 uppercase tracking-widest font-bold">WELLNESS, THE HANNAM v2.5</p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 animate-fade-in">
             <h3 className="text-lg font-serif font-bold text-hannam-green border-b border-gray-100 pb-3 uppercase tracking-wider">Reservation History</h3>
             <div className="space-y-4">
                {history.map(item => (
                   <div key={item.id} className="bg-white p-5 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                      <div className="space-y-1">
                         <p className="text-xs font-bold text-slate-900">{item.content}</p>
                         <p className="text-[10px] text-gray-400 font-medium">{item.date} • {item.therapistName}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-slate-900 num-clean">₩{item.discountedPrice.toLocaleString()}</p>
                         <span className={`text-[8px] font-black uppercase tracking-widest ${item.status === CareStatus.COMPLETED ? 'text-hannam-green' : 'text-amber-500'}`}>
                           {item.status}
                         </span>
                      </div>
                   </div>
                ))}
                {history.length === 0 && <p className="py-20 text-center text-[11px] text-gray-300 italic">내역이 없습니다.</p>}
             </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-6 animate-fade-in">
             <h3 className="text-lg font-serif font-bold text-hannam-green border-b border-gray-100 pb-3 uppercase tracking-wider">Care Notes Archive</h3>
             <div className="space-y-5">
                {history.filter(h => h.status === CareStatus.COMPLETED).map(note => (
                   <div key={note.id} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                         <span className="px-2.5 py-1 bg-gray-50 text-gray-400 rounded-md text-[9px] font-black uppercase tracking-widest">{note.content}</span>
                         <span className="text-[10px] font-bold text-gray-300 num-clean">{note.date}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-600 leading-relaxed italic">
                         "{note.feedback || '세션 완료'}"
                      </p>
                      <div className="bg-[#FBF9F6] p-4 rounded-xl space-y-1.5 border border-hannam-gold/10">
                         <p className="text-[9px] font-black text-hannam-gold uppercase tracking-widest">Recommended Therapy</p>
                         <p className="text-[11px] font-bold text-gray-500">{note.recommendation}</p>
                      </div>
                      <p className="text-right text-[9px] font-bold text-gray-300 uppercase tracking-widest">- {note.therapistName}</p>
                   </div>
                ))}
                {history.filter(h => h.status === CareStatus.COMPLETED).length === 0 && <p className="py-20 text-center text-[11px] text-gray-300 italic">작성된 케어 노트가 없습니다.</p>}
             </div>
          </div>
        )}
      </main>

      {/* Floating Navigation Bar: 홈 / 예약 내역 / 케어 노트 */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-hannam-green text-white px-8 py-4 rounded-2xl shadow-2xl flex justify-between items-center z-[100] border border-white/5 backdrop-blur-md bg-opacity-95">
         {[
           { id: 'home', icon: LayoutGrid, label: 'Home' },
           { id: 'history', icon: Clock, label: 'History' },
           { id: 'notes', icon: FileText, label: 'Care Notes' }
         ].map(item => (
           <button 
             key={item.id}
             onClick={() => setActiveTab(item.id as any)}
             className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${activeTab === item.id ? 'text-hannam-gold' : 'text-white/30'}`}
           >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">{item.label}</span>
           </button>
         ))}
      </nav>
    </div>
  );
};
