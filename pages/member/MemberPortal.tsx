
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { authService } from '../../services/authService';
import { Member, CareRecord, Reservation, CareStatus } from '../../types';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  MessageCircle, 
  User, 
  LogOut, 
  ChevronRight,
  Clock,
  Globe
} from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';

type Lang = 'ko' | 'en';

const translations = {
  ko: {
    welcome: '님, 반갑습니다',
    dashboard: '대시보드',
    careNotes: '케어 노트',
    concierge: '컨시어지',
    balance: '멤버십 잔액',
    deposit: '누적 예치금',
    used: '누적 차감액',
    grade: '멤버십 등급',
    discount: '서비스 할인 적용 중',
    signTitle: '오늘의 세션 확인 및 서명',
    awaitingSign: '서명 대기 중',
    processing: '처리 중...',
    pay: '세션 확인 및 결제하기',
    upcoming: '다가오는 예약',
    noRes: '예약된 일정이 없습니다.',
    wellnessProfile: '웰니스 프로필',
    mainGoal: '주요 목표',
    recommended: '추천 테라피',
    connect: '전담 컨시어지 연결',
    history: '최근 이용 내역',
    latest: '최신 기록',
    past: '과거 기록',
    therapistFeedback: '테라피스트 어드바이스'
  },
  en: {
    welcome: 'Welcome, ',
    dashboard: 'DASHBOARD',
    careNotes: 'CARE NOTES',
    concierge: 'CONCIERGE',
    balance: 'BALANCE',
    deposit: 'TOTAL DEPOSIT',
    used: 'TOTAL USED',
    grade: 'GRADE',
    discount: 'Discount Applied',
    signTitle: 'SESSION VERIFICATION',
    awaitingSign: 'Awaiting Signature',
    processing: 'Processing...',
    pay: 'CONFIRM & AUTHORIZE',
    upcoming: 'UPCOMING',
    noRes: 'No scheduled sessions.',
    wellnessProfile: 'WELLNESS PROFILE',
    mainGoal: 'CORE GOAL',
    recommended: 'RECOMMENDED',
    connect: 'Contact Concierge',
    history: 'HISTORY',
    latest: 'Latest',
    past: 'Past',
    therapistFeedback: 'Therapist Feedback'
  }
};

export const MemberPortal: React.FC = () => {
  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<CareRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'notes' | 'concierge'>('dashboard');
  const [pendingRecord, setPendingRecord] = useState<CareRecord | null>(null);
  const [signature, setSignature] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lang, setLang] = useState<Lang>('ko');
  
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const t = translations[lang];

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    loadMemberData();
  }, [currentUser]);

  const loadMemberData = async () => {
    if (!currentUser) return;
    const m = await dbService.getMemberById(currentUser.id);
    if (m) {
      setMember(m);
      const [h, r] = await Promise.all([
        dbService.getMemberCareHistory(m.id),
        dbService.getReservations(m.id)
      ]);
      setHistory(h);
      setReservations(r);
      const pending = h.find(rec => rec.status === CareStatus.WAITING_SIGNATURE);
      setPendingRecord(pending || null);
    }
  };

  const handleSignComplete = async () => {
    if (!pendingRecord || !signature) return;
    setIsProcessing(true);
    await dbService.signCareRecord(pendingRecord.id, signature);
    setPendingRecord(null);
    setSignature('');
    await loadMemberData();
    setIsProcessing(false);
  };

  if (!member) return <div className="min-h-screen flex items-center justify-center font-serif text-gray-300 tracking-widest uppercase">The Hannam...</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-[#1A1A1A] pb-16">
      <header className="px-8 py-4 flex justify-between items-center bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-hannam-green rounded-full flex items-center justify-center text-white text-[7px] font-black tracking-tighter">HANNAM</div>
           <h1 className="text-xs font-serif font-bold tracking-[0.2em] text-[#1A1A1A]">THE HANNAM</h1>
        </div>
        <div className="flex items-center gap-5">
           <div className="flex items-center gap-2 border border-gray-100 rounded-full px-3 py-1 bg-gray-50/50">
              <button onClick={() => setLang('ko')} className={`text-[9px] font-black ${lang === 'ko' ? 'text-hannam-gold' : 'text-gray-300 hover:text-gray-500'}`}>KR</button>
              <div className="w-[1px] h-2 bg-gray-200" />
              <button onClick={() => setLang('en')} className={`text-[9px] font-black ${lang === 'en' ? 'text-hannam-gold' : 'text-gray-300 hover:text-gray-500'}`}>EN</button>
           </div>
           <span className="text-[10px] font-bold text-gray-500">{lang === 'ko' ? `${member.name}${t.welcome}` : `${t.welcome}${member.name}`}</span>
           <button onClick={() => { authService.logout(); navigate('/'); }} className="text-gray-300 hover:text-red-400">
             <LogOut className="w-3.5 h-3.5" />
           </button>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-6 pt-10">
         <section className="text-center mb-10">
            <h2 className="text-2xl font-serif font-bold tracking-widest text-[#1A362E] mb-6 uppercase">PRIVATE PORTAL</h2>
            <div className="flex justify-center gap-10 border-b border-gray-100">
               {[
                 { id: 'dashboard', label: t.dashboard, icon: LayoutGrid },
                 { id: 'notes', label: t.careNotes, icon: MessageCircle },
                 { id: 'concierge', label: t.concierge, icon: User },
               ].map(item => (
                 <button 
                   key={item.id}
                   onClick={() => setActiveTab(item.id as any)}
                   className={`flex items-center gap-2 pb-3 text-[10px] font-black tracking-[0.15em] relative transition-all ${activeTab === item.id ? 'text-[#1A362E]' : 'text-gray-300 hover:text-gray-500'}`}
                 >
                   {item.label}
                   {activeTab === item.id && <div className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-[#1A362E]" />}
                 </button>
               ))}
            </div>
         </section>

         {activeTab === 'dashboard' && (
           <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                 <div className="lg:col-span-2 bg-[#1A362E] rounded-xl p-7 text-white shadow-md relative overflow-hidden h-[200px] flex flex-col justify-between">
                    <div className="absolute top-[-30px] right-[-30px] w-36 h-36 bg-white/5 rounded-full" />
                    <div>
                       <p className="text-[8px] font-black text-white/50 mb-2 uppercase tracking-widest">{t.balance}</p>
                       <h3 className="text-4xl num-clean">₩{member.remaining.toLocaleString()}</h3>
                    </div>
                    <div className="flex gap-8 pt-4 border-t border-white/10">
                       <div>
                          <p className="text-[7px] font-black text-white/30 uppercase mb-1 tracking-tighter">{t.deposit}</p>
                          <p className="text-[10px] num-clean text-white/70">₩{member.deposit.toLocaleString()}</p>
                       </div>
                       <div>
                          <p className="text-[7px] font-black text-white/30 uppercase mb-1 tracking-tighter">{t.used}</p>
                          <p className="text-[10px] num-clean text-white/70">₩{member.used.toLocaleString()}</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white rounded-xl p-7 border border-gray-100 shadow-sm flex flex-col h-[200px]">
                    <h4 className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-4">{t.grade}</h4>
                    <div className="mb-auto">
                       <span className="text-xl font-serif font-bold block text-[#1A1A1A]">{member.tier} <span className="text-[9px] font-sans text-gray-400 font-black">CLASS</span></span>
                       <span className="mt-2 inline-block bg-[#E7F7EF] text-[#27AE60] text-[7px] font-black px-2 py-1 rounded border border-[#D5EEDB] uppercase">{t.discount}</span>
                    </div>
                    <p className="text-[9px] text-gray-400 italic">Balanced & Sustainable Wellness</p>
                 </div>
              </div>

              {pendingRecord && (
                <div className="bg-white p-6 rounded-xl border border-hannam-gold/30 shadow-lg animate-fade-in">
                   <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-hannam-gold" />
                        <h4 className="text-xs font-bold text-[#1A362E]">{t.signTitle}</h4>
                      </div>
                      <span className="text-[8px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-2 py-1 rounded">{t.awaitingSign}</span>
                   </div>
                   
                   <div className="bg-[#F8F9FB] p-4 rounded-lg flex items-center justify-between mb-5">
                      <div>
                         <h5 className="text-[11px] font-bold text-[#1A1A1A] mb-0.5">{pendingRecord.content}</h5>
                         <p className="text-[9px] text-gray-400 font-medium">{pendingRecord.therapistName} Therapist</p>
                      </div>
                      <p className="text-base num-clean text-[#1A1A1A]">₩{pendingRecord.discountedPrice.toLocaleString()}</p>
                   </div>

                   <div className="h-[220px] mb-5">
                      <SignaturePad 
                        onSave={(data) => setSignature(data)} 
                        onClear={() => setSignature('')} 
                      />
                   </div>

                   <button 
                     onClick={handleSignComplete}
                     disabled={!signature || isProcessing}
                     className="w-full py-3.5 bg-hannam-green text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-md hover:bg-black transition-all disabled:opacity-50"
                   >
                     {isProcessing ? t.processing : t.pay}
                   </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                 <div className="bg-white p-7 rounded-xl border border-gray-100 shadow-sm">
                    <h4 className="text-[9px] font-black text-gray-300 mb-5 uppercase tracking-widest">{t.upcoming}</h4>
                    <div className="space-y-3">
                       {reservations.length > 0 ? reservations.slice(0, 2).map(res => (
                         <div key={res.id} className="bg-[#FBF9F6] p-4 rounded-lg flex justify-between items-center">
                            <div>
                               <h5 className="text-[11px] font-bold text-[#1A1A1A]">{res.serviceType}</h5>
                               <p className="text-[8px] text-gray-400 font-bold mt-1 num-clean uppercase">
                                 {new Date(res.dateTime).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' })} | {new Date(res.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </p>
                            </div>
                            <span className="text-[7px] font-black text-gray-300 uppercase">Confirmed</span>
                         </div>
                       )) : <p className="text-gray-300 italic text-[9px] py-4 text-center">{t.noRes}</p>}
                    </div>
                 </div>

                 <div className="bg-white p-7 rounded-xl border border-gray-100 shadow-sm">
                    <h4 className="text-[9px] font-black text-gray-300 mb-5 uppercase tracking-widest">{t.wellnessProfile}</h4>
                    <div className="space-y-3">
                       <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                          <p className="text-[8px] font-black text-gray-300 uppercase">{t.mainGoal}</p>
                          <p className="text-[10px] font-bold text-[#1A1A1A]">{member.coreGoal}</p>
                       </div>
                       <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                          <p className="text-[8px] font-black text-gray-300 uppercase">{t.recommended}</p>
                          <p className="text-[10px] font-bold text-hannam-gold">{member.aiRecommended}</p>
                       </div>
                       <button className="w-full py-3 mt-2 bg-[#FBF9F6] text-hannam-gold rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                          {t.connect} <ChevronRight className="w-3 h-3" />
                       </button>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                 <div className="px-7 py-4 border-b border-gray-50">
                    <h4 className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{t.history}</h4>
                 </div>
                 <table className="w-full text-left">
                    <thead className="bg-[#FBF9F6]/50">
                       <tr className="text-[8px] font-black text-gray-300 uppercase tracking-widest">
                          <th className="px-7 py-3">Date</th>
                          <th className="px-7 py-3">Service</th>
                          <th className="px-7 py-3 text-right">Amount</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {history.filter(h => h.status === CareStatus.COMPLETED).slice(0, 5).map(h => (
                          <tr key={h.id} className="text-[10px]">
                             <td className="px-7 py-3.5 text-gray-400 num-clean">{h.date}</td>
                             <td className="px-7 py-3.5 font-bold text-[#1A1A1A]">{h.content}</td>
                             <td className="px-7 py-3.5 font-black text-right text-[#1A1A1A] num-clean">₩{h.discountedPrice.toLocaleString()}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
         )}

         {activeTab === 'notes' && (
           <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {history.filter(h => h.status === CareStatus.COMPLETED).map((note, idx) => (
                 <div key={note.id} className="card-minimal p-6 flex flex-col h-[280px]">
                    <div className="flex justify-between items-center mb-4">
                       <span className={`px-2 py-1 rounded text-[7px] font-black uppercase tracking-widest ${idx === 0 ? 'bg-hannam-green text-white' : 'bg-gray-50 text-gray-400'}`}>
                         {idx === 0 ? t.latest : t.past}
                       </span>
                       <span className="text-[9px] font-bold text-gray-300 num-clean">{note.date}</span>
                    </div>
                    <p className="text-[13px] font-serif italic text-[#1A1A1A] leading-relaxed mb-6 flex-1 line-clamp-4">
                       "{note.feedback}"
                    </p>
                    <div className="pt-4 border-t border-gray-50">
                       <p className="text-[7px] font-black text-gray-300 uppercase mb-1">{t.therapistFeedback}</p>
                       <p className="text-[10px] text-gray-500 font-medium leading-tight">
                          {note.recommendation}
                       </p>
                    </div>
                 </div>
              ))}
              {history.length === 0 && <div className="col-span-3 py-32 text-center text-gray-200 font-serif text-lg border-2 border-dashed rounded-xl uppercase">No care data recorded.</div>}
           </div>
         )}

         {activeTab === 'concierge' && (
           <div className="animate-fade-in py-16 text-center max-w-lg mx-auto flex flex-col items-center">
              <div className="w-14 h-14 bg-hannam-green rounded-full flex items-center justify-center text-white shadow-lg mb-6">
                 <User className="w-7 h-7 text-hannam-gold" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A] mb-3 uppercase tracking-[0.1em]">THE HANNAM CONCIERGE</h3>
              <p className="text-gray-400 font-medium mb-10 text-[11px] leading-relaxed">
                 {lang === 'ko' ? '회원님의 품격 있는 휴식을 위해 전담 컨시어지가 대기하고 있습니다.' : 'Dedicated concierge is available to ensure your premium relaxation experience.'}
              </p>
              <div className="grid grid-cols-2 gap-3 w-full mb-8">
                 <div className="p-4 card-minimal text-left">
                    <p className="text-[7px] font-black text-gray-300 uppercase tracking-widest mb-1">Direct Line</p>
                    <p className="text-[11px] font-bold text-hannam-gold num-clean">02.1234.5678</p>
                 </div>
                 <div className="p-4 card-minimal text-left">
                    <p className="text-[7px] font-black text-gray-300 uppercase tracking-widest mb-1">Hours</p>
                    <p className="text-[11px] font-bold text-gray-800 num-clean">10:00 - 20:00</p>
                 </div>
              </div>
              <button className="px-8 py-4 bg-hannam-green text-white rounded-lg text-[9px] font-black uppercase tracking-[0.4em] shadow-lg hover:scale-[1.02] transition-transform">
                 {lang === 'ko' ? '전담 컨시어지 문의하기' : 'CONTACT CONCIERGE'}
              </button>
           </div>
         )}
      </main>
    </div>
  );
};
