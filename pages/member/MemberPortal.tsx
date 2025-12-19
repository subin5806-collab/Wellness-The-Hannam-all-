
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { authService } from '../../services/authService';
import { Member, CareRecord, Reservation, CareStatus } from '../../types';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  MessageSquare, 
  User, 
  LogOut, 
  ChevronRight,
  Clock,
  Sparkles,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';

export const MemberPortal: React.FC = () => {
  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<CareRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'notes' | 'concierge'>('dashboard');
  const [pendingRecord, setPendingRecord] = useState<CareRecord | null>(null);
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

  if (!member) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold tracking-[0.4em] uppercase">WELLNESS, THE HANNAM...</div>;

  return (
    <div className="min-h-screen bg-hannam-bg font-sans text-hannam-text pb-20">
      {/* Top Utility Nav */}
      <header className="px-8 py-3 flex justify-between items-center border-b border-hannam-border bg-white">
        <div className="flex items-center gap-4">
           <div className="w-8 h-8 bg-hannam-green rounded-full flex items-center justify-center text-white text-[8px] font-bold">Logo</div>
           <div className="flex flex-col">
             <h1 className="text-sm font-bold tracking-wider leading-none">THE HANNAM</h1>
             <p className="text-[10px] text-hannam-gold font-medium mt-1">Welcome, <span className="font-bold">{member.name} Member.</span></p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <button className="flex items-center gap-2 px-3 py-1.5 border border-hannam-border rounded-full text-[10px] text-hannam-subtext font-medium hover:bg-hannam-gray-bg transition-colors">
             <RefreshCw className="w-3 h-3" /> Sync Data
           </button>
           <button onClick={() => { authService.logout(); navigate('/'); }} className="text-hannam-subtext hover:text-red-500 transition-colors">
             <LogOut className="w-4 h-4" />
           </button>
        </div>
      </header>

      {/* Main Brand Header */}
      <section className="text-center py-16 animate-fade-in">
        <h2 className="text-4xl font-serif font-medium tracking-[0.2em] text-hannam-green mb-3 uppercase">WELLNESS, THE HANNAM</h2>
        <p className="text-[10px] font-medium text-hannam-subtext uppercase tracking-[0.5em] mb-4">PRIVATE WELL-AGING CENTER</p>
        <p className="text-xs font-serif italic text-hannam-gold opacity-80">"Balanced Life, Immeasurable Value"</p>
      </section>

      {/* Main Tab Navigation */}
      <nav className="flex justify-center gap-12 mb-16 border-t border-hannam-border pt-6">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
          { id: 'notes', label: 'Care Notes', icon: MessageSquare },
          { id: 'concierge', label: 'AI Concierge', icon: Sparkles },
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex items-center gap-2.5 px-2 pb-2 text-[11px] font-bold tracking-wider transition-all border-b-2 ${
              activeTab === item.id ? 'border-hannam-green text-hannam-green' : 'border-transparent text-hannam-subtext hover:text-hannam-text'
            }`}
          >
            <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-hannam-gold' : 'text-hannam-gold opacity-50'}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <main className="max-w-6xl mx-auto px-6">
         {activeTab === 'dashboard' && (
           <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center px-2">
                 <div className="flex items-center gap-2 text-[10px] text-hannam-subtext font-medium bg-hannam-gray-bg px-3 py-1 rounded border border-hannam-border">
                    <RefreshCw className="w-3 h-3 opacity-50" /> Offline Demo Mode
                 </div>
                 <p className="text-[10px] text-hannam-subtext font-bold uppercase tracking-widest opacity-60">Member ID: {member.id}</p>
              </div>

              {/* Membership & Benefits Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Membership Card */}
                 <div className="membership-card rounded-xl p-10 text-white flex flex-col justify-between h-[300px]">
                    <div>
                       <p className="text-[11px] font-medium text-white/60 mb-2 uppercase tracking-widest">Remaining Membership Limit</p>
                       <h3 className="text-5xl font-serif leading-tight">₩{member.remaining.toLocaleString()}</h3>
                    </div>
                    <div className="flex gap-12 border-t border-white/10 pt-6">
                       <div>
                          <p className="text-[9px] font-bold text-white/40 uppercase mb-1 tracking-widest">Total Deposit</p>
                          <p className="text-sm font-medium num-clean">₩{member.deposit.toLocaleString()}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-bold text-white/40 uppercase mb-1 tracking-widest">Total Usage</p>
                          <p className="text-sm font-medium num-clean">₩{member.used.toLocaleString()}</p>
                       </div>
                    </div>
                 </div>

                 {/* Membership Benefits Card */}
                 <div className="card-minimal p-10 flex flex-col justify-center">
                    <h4 className="text-xl font-serif text-hannam-green mb-8">Membership Benefits</h4>
                    <div className="flex items-center gap-4 mb-6">
                       <span className="text-2xl font-bold text-hannam-text">{member.tier} Tier</span>
                       <span className="bg-[#E7F7EF] text-[#27AE60] text-[10px] font-bold px-3 py-1 rounded border border-[#D5EEDB] uppercase">15% Discount Applied</span>
                    </div>
                    <p className="text-[13px] text-hannam-subtext leading-relaxed mb-8">
                       Deposit an additional <span className="font-bold text-hannam-text">₩3,000,000</span> to upgrade to the next tier with <span className="font-bold text-hannam-text">20% discount</span> benefits.
                    </p>
                    <p className="text-[10px] text-hannam-subtext opacity-50 italic">
                       Note: Discount rates are calculated based on cumulative deposits and are automatically applied to all services and product payments.
                    </p>
                 </div>
              </div>

              {/* Pending Signature Section (If any) */}
              {pendingRecord && (
                <div className="bg-white p-8 rounded-xl border border-hannam-gold shadow-lg animate-fade-in">
                   <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-hannam-gold" />
                        <h4 className="text-lg font-serif text-hannam-green">오늘의 세션 확인 및 서명</h4>
                      </div>
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-50 px-3 py-1 rounded border border-red-100">서명 대기 중</span>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div className="bg-hannam-gray-bg p-6 rounded-lg flex flex-col justify-center border border-hannam-border">
                         <h5 className="text-lg font-bold text-hannam-text mb-1">{pendingRecord.content}</h5>
                         <p className="text-xs text-hannam-subtext mb-4">{pendingRecord.therapistName} Specialist</p>
                         <div className="flex justify-between items-baseline">
                            <span className="text-xs text-hannam-subtext font-medium">최종 차감액</span>
                            <span className="text-3xl font-serif text-hannam-green">₩{pendingRecord.discountedPrice.toLocaleString()}</span>
                         </div>
                      </div>
                      <div className="h-[220px]">
                         <SignaturePad 
                           onSave={(data) => setSignature(data)} 
                           onClear={() => setSignature('')} 
                         />
                      </div>
                   </div>
                   <button 
                     onClick={handleSignComplete}
                     disabled={!signature || isProcessing}
                     className="w-full py-4 btn-primary rounded-lg text-xs font-bold uppercase tracking-[0.2em] shadow-lg disabled:opacity-50"
                   >
                     {isProcessing ? '처리 중...' : '세션 확인 및 서명 완료'}
                   </button>
                </div>
              )}

              {/* Schedule & Profile Bottom Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Upcoming Schedule */}
                 <div className="card-minimal p-10 flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                       <div className="w-1 h-6 bg-hannam-gold rounded-full" />
                       <h4 className="text-xl font-serif text-hannam-green">Upcoming Schedule</h4>
                    </div>
                    <div className="space-y-4 flex-1">
                       {reservations.length > 0 ? reservations.slice(0, 2).map(res => (
                         <div key={res.id} className="bg-hannam-gray-bg p-6 rounded-lg border border-hannam-border group hover:border-hannam-gold transition-colors">
                            <h5 className="text-base font-bold text-hannam-text mb-1">{res.serviceType}</h5>
                            <p className="text-xs text-hannam-subtext font-medium num-clean uppercase mb-4">
                              {new Date(res.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })} | {new Date(res.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <div className="flex items-center gap-2">
                               <span className="bg-white px-2 py-0.5 rounded text-[10px] font-bold text-hannam-subtext border border-hannam-border">Staff</span>
                               <span className="text-[11px] font-medium text-hannam-subtext">Therapist: {res.therapistName}</span>
                            </div>
                         </div>
                       )) : <p className="text-hannam-subtext italic text-xs py-10 text-center">No scheduled sessions.</p>}
                    </div>
                    <button className="w-full mt-6 py-4 bg-hannam-gray-bg text-hannam-subtext rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-hannam-border transition-all flex items-center justify-center gap-2">
                       <Calendar className="w-4 h-4 opacity-50" /> View All Reservations
                    </button>
                 </div>

                 {/* Wellness Profile */}
                 <div className="card-minimal p-10 flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                       <div className="w-1 h-6 bg-hannam-gold rounded-full" />
                       <h4 className="text-xl font-serif text-hannam-green">Personal Wellness Profile</h4>
                    </div>
                    <div className="space-y-6 flex-1">
                       <div className="flex justify-between items-center border-b border-hannam-border pb-4">
                          <p className="text-sm font-medium text-hannam-text">Core Care Goal</p>
                          <p className="text-sm font-bold text-hannam-subtext">{member.coreGoal}</p>
                       </div>
                       <div className="flex justify-between items-center border-b border-hannam-border pb-4">
                          <p className="text-sm font-medium text-hannam-text">AI Recommended Session</p>
                          <p className="text-sm font-bold text-hannam-gold">{member.aiRecommended}</p>
                       </div>
                    </div>
                    <button className="w-full mt-8 py-4 bg-hannam-green text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2">
                       <Sparkles className="w-4 h-4 text-hannam-gold" /> Request AI Concierge Analysis
                    </button>
                 </div>
              </div>
           </div>
         )}

         {activeTab === 'notes' && (
           <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.filter(h => h.status === CareStatus.COMPLETED).map((note, idx) => (
                 <div key={note.id} className="card-minimal p-8 flex flex-col h-[300px] hover:border-hannam-gold group transition-all">
                    <div className="flex justify-between items-center mb-6">
                       <span className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${idx === 0 ? 'bg-hannam-green text-white' : 'bg-hannam-gray-bg text-hannam-subtext border border-hannam-border'}`}>
                         {idx === 0 ? 'Latest Session' : 'Past Record'}
                       </span>
                       <span className="text-[11px] font-bold text-hannam-subtext num-clean">{note.date}</span>
                    </div>
                    <p className="text-sm font-serif italic text-hannam-text leading-relaxed mb-6 flex-1 line-clamp-4">
                       "{note.feedback}"
                    </p>
                    <div className="pt-6 border-t border-hannam-border">
                       <p className="text-[10px] font-bold text-hannam-gold uppercase mb-2 tracking-widest">Therapist Recommendation</p>
                       <p className="text-xs text-hannam-subtext font-medium leading-tight line-clamp-2">
                          {note.recommendation}
                       </p>
                    </div>
                 </div>
              ))}
              {history.length === 0 && <div className="col-span-3 py-40 text-center text-hannam-subtext font-serif text-lg border border-dashed border-hannam-border rounded-xl uppercase tracking-widest">No care data recorded.</div>}
           </div>
         )}

         {activeTab === 'concierge' && (
           <div className="animate-fade-in py-20 text-center max-w-xl mx-auto flex flex-col items-center">
              <div className="w-16 h-16 bg-hannam-green rounded-full flex items-center justify-center text-white shadow-lg mb-8">
                 <Sparkles className="w-8 h-8 text-hannam-gold" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-hannam-green mb-4 uppercase tracking-luxury">Hannam AI Concierge</h3>
              <p className="text-hannam-subtext font-medium mb-12 text-sm leading-relaxed">
                 회원님의 최근 건강 데이터와 세션 피드백을 분석하여 최상의 컨디션을 위한 맞춤형 프로그램을 제안해드립니다.
              </p>
              <div className="grid grid-cols-2 gap-6 w-full mb-12">
                 <div className="p-8 card-minimal text-left">
                    <p className="text-[10px] font-bold text-hannam-subtext uppercase tracking-widest mb-2">Analysis Status</p>
                    <p className="text-sm font-bold text-hannam-gold">Optimization Ready</p>
                 </div>
                 <div className="p-8 card-minimal text-left">
                    <p className="text-[10px] font-bold text-hannam-subtext uppercase tracking-widest mb-2">Service Line</p>
                    <p className="text-sm font-bold text-hannam-text num-clean">02.1234.5678</p>
                 </div>
              </div>
              <button className="px-12 py-5 bg-hannam-green text-white rounded-lg text-xs font-bold uppercase tracking-luxury shadow-xl hover:scale-[1.02] transition-transform">
                 전담 컨시어지와 분석 상담하기
              </button>
           </div>
         )}
      </main>
    </div>
  );
};
