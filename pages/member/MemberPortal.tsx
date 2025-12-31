
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { Member, CareRecord, Reservation, CareStatus } from '../../types';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, RefreshCw, Clock, Sparkles, AlertCircle, LogOut, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';
import { useAuth } from '../../AuthContext';
import { useLanguage } from '../../LanguageContext';

export const MemberPortal: React.FC = () => {
  const { logout, user: currentUser } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<CareRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [pendingRecord, setPendingRecord] = useState<CareRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'notes'>('home');
  const [signature, setSignature] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'MEMBER') { navigate('/'); return; }
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
      // [상태값 변경] REQUESTED 상태인 것만 서명 유도
      const pending = h.find(rec => rec.status === CareStatus.REQUESTED);
      setPendingRecord(pending || null);
    }
  };

  const handleSignComplete = async () => {
    if (!pendingRecord || !signature) return;
    setIsProcessing(true);
    try {
      const success = await dbService.signCareRecord(pendingRecord.id, signature);
      if (success) {
        alert(lang === 'ko' ? '기록 확인이 완료되었습니다.' : 'Confirmation complete.');
        setPendingRecord(null);
        setSignature('');
        await loadMemberData();
      }
    } catch (e) { 
      alert('Error occurred.'); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  if (!member) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold uppercase tracking-[0.3em]">Connecting...</div>;

  return (
    <div className="min-h-screen bg-hannam-bg font-sans text-hannam-text pb-48 animate-smooth-fade">
      <header className="px-8 py-6 flex justify-between items-center bg-white/60 backdrop-blur-2xl sticky top-0 z-[60] border-b border-[#F1EFEA]">
        <div className="flex flex-col">
          <h1 className="text-xs font-serif font-bold tracking-widest text-hannam-green uppercase">{t('portal.title')}</h1>
          <p className="text-[9px] text-hannam-gold font-bold uppercase tracking-widest mt-1">Concierge Portal</p>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex items-center bg-hannam-bg/50 px-3 py-1.5 rounded-full border border-hannam-border">
              <button onClick={() => setLang('ko')} className={`text-[9px] font-bold px-2 ${lang === 'ko' ? 'text-hannam-green' : 'text-hannam-muted'}`}>KR</button>
              <span className="text-[9px] text-hannam-border">|</span>
              <button onClick={() => setLang('en')} className={`text-[9px] font-bold px-2 ${lang === 'en' ? 'text-hannam-green' : 'text-hannam-muted'}`}>EN</button>
           </div>
           <button onClick={() => confirm(t('portal.common.logout')) && logout()} className="p-2 text-hannam-muted hover:text-red-500"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      <main className="px-6 py-10 space-y-12 max-w-lg mx-auto">
        
        {/* 잔액 요약 섹션 */}
        <section className="bg-hannam-green rounded-[40px] p-10 text-white shadow-hannam-deep relative overflow-hidden">
           <div className="relative z-10">
              <p className="text-[10px] font-bold text-white/40 mb-3 tracking-widest uppercase">{member.name} — Remaining Credit</p>
              <h3 className="text-4xl font-serif font-medium tracking-tight mb-8"><span className="text-xl mr-2 text-hannam-gold">₩</span><span className="num-data">{member.remaining.toLocaleString()}</span></h3>
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/10">
                 <div><p className="text-[9px] text-white/30 uppercase font-black mb-1">Total Usage</p><p className="text-xs font-bold num-data">₩{member.used.toLocaleString()}</p></div>
                 <div className="text-right"><p className="text-[9px] text-white/30 uppercase font-black mb-1">Tier</p><p className="text-[10px] font-black text-hannam-gold uppercase">{member.tier}</p></div>
              </div>
           </div>
        </section>

        {/* 1. 서명 요청 알림 (최상단 고정) */}
        {pendingRecord && (
          <section className="bg-white rounded-[32px] shadow-xl border-2 border-hannam-gold/20 p-8 space-y-6 animate-smooth-fade">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-hannam-text">내역 확인 요청</h2>
                <p className="text-[10px] font-bold text-hannam-gold uppercase tracking-widest mt-1">차감 완료 / 사후 서명 요청</p>
              </div>
              <AlertCircle className="w-5 h-5 text-hannam-gold" />
            </div>
            <div className="bg-[#FBF9F6] rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold"><span className="text-gray-400">서비스</span><span>{pendingRecord.content}</span></div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-100"><span className="text-gray-400">차감액</span><span className="num-data text-red-500">- ₩{pendingRecord.discountedPrice.toLocaleString()}</span></div>
            </div>
            <div className="h-40 bg-[#FBF9F6] rounded-2xl border border-gray-100 overflow-hidden relative shadow-inner">
               <SignaturePad onSave={setSignature} onClear={() => setSignature('')} />
               {!signature && <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30 text-[9px] font-bold uppercase tracking-widest">이곳에 서명해 주세요</div>}
            </div>
            <button onClick={handleSignComplete} disabled={!signature || isProcessing} className="w-full py-5 bg-hannam-green text-white rounded-[20px] text-[11px] font-black uppercase tracking-widest shadow-lg disabled:opacity-20">
               {isProcessing ? 'Verifying...' : '서명 전송 및 확인 완료'}
            </button>
          </section>
        )}

        {/* 2. 웰니스 케어 노트 (상시 노출) */}
        <section className="space-y-6">
           <div className="flex items-center gap-3 px-4">
              <Sparkles className="w-5 h-5 text-hannam-gold" />
              <h3 className="text-sm font-serif font-black text-hannam-green uppercase tracking-widest">Wellness Care Notes</h3>
           </div>
           
           {history.filter(h => h.status === CareStatus.SIGNED).length > 0 ? (
             history.filter(h => h.status === CareStatus.SIGNED).slice(0, 2).map(item => (
               <div key={item.id} className="bg-white rounded-[32px] p-8 border border-[#F1EFEA] shadow-hannam-soft space-y-6 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-[9px] font-black text-gray-300 uppercase mb-1">{item.date} Service Recap</p>
                        <h4 className="text-sm font-black text-hannam-text">{item.content}</h4>
                     </div>
                     <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="bg-[#FBF9F6] p-6 rounded-2xl italic">
                     <p className="text-xs text-hannam-text leading-relaxed font-medium">"{item.feedback || '전담 전문가의 코멘트를 준비 중입니다.'}"</p>
                  </div>
                  <div className="pt-2">
                     <p className="text-[9px] font-black text-hannam-gold uppercase tracking-widest mb-2">Expert Recommendation</p>
                     <p className="text-xs font-bold text-hannam-green leading-relaxed">{item.recommendation || '최상의 컨디션을 위해 다음 전략을 구상 중입니다.'}</p>
                  </div>
               </div>
             ))
           ) : (
             <div className="py-20 text-center bg-white rounded-[32px] border border-dashed border-hannam-border">
                <p className="text-gray-300 text-[10px] font-black uppercase tracking-widest">아직 기록된 케어 노트가 없습니다</p>
             </div>
           )}
        </section>

        {/* 3. 예정된 일정 */}
        <section className="space-y-6">
           <div className="flex items-center gap-3 px-4">
              <Clock className="w-5 h-5 text-hannam-gold" />
              <h3 className="text-sm font-serif font-black text-hannam-green uppercase tracking-widest">Upcoming Sessions</h3>
           </div>
           {reservations.filter(r => r.status === 'booked').map(res => (
              <div key={res.id} className="bg-white p-6 rounded-[28px] border border-[#F1EFEA] flex justify-between items-center group shadow-hannam-soft">
                 <div className="flex gap-6 items-center">
                    <div className="w-12 h-12 bg-hannam-bg rounded-2xl flex flex-col items-center justify-center font-bold">
                       <span className="text-[8px] text-hannam-gold uppercase">{new Date(res.dateTime).toLocaleString('en', {month:'short'})}</span>
                       <span className="text-lg text-hannam-green num-data">{new Date(res.dateTime).getDate()}</span>
                    </div>
                    <div><p className="text-sm font-black text-hannam-text">{res.serviceType}</p><p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{new Date(res.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} • {res.therapistName}</p></div>
                 </div>
                 <ChevronRight className="w-4 h-4 text-gray-200" />
              </div>
           ))}
        </section>

      </main>

      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-hannam-green/95 backdrop-blur-3xl text-white px-10 py-6 rounded-[32px] shadow-2xl flex justify-between items-center z-[100]">
         <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-2 ${activeTab === 'home' ? 'text-hannam-gold' : 'text-white/30'}`}>
            <LayoutGrid className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-widest">Portal</span>
         </button>
         <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-2 ${activeTab === 'history' ? 'text-hannam-gold' : 'text-white/30'}`}>
            <Clock className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-widest">Ledger</span>
         </button>
         <button onClick={() => setActiveTab('notes')} className={`flex flex-col items-center gap-2 ${activeTab === 'notes' ? 'text-hannam-gold' : 'text-white/30'}`}>
            <Sparkles className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-widest">Insights</span>
         </button>
      </nav>
    </div>
  );
};
