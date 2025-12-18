
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { authService } from '../../services/authService';
import { Member, CareRecord, Reservation, CareStatus } from '../../types';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  MessageCircle, 
  Sparkles, 
  LogOut, 
  RefreshCw, 
  CheckCircle,
  Calendar,
  ChevronRight,
  Info,
  Clock,
  User,
  ExternalLink
} from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';

export const MemberPortal: React.FC = () => {
  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<CareRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'notes' | 'ai'>('dashboard');
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
      // 서명 대기중인(관리자가 방금 보낸) 최신 기록 확인
      const pending = h.find(rec => rec.status === CareStatus.WAITING_SIGNATURE);
      setPendingRecord(pending || null);
    }
  };

  const handleSignComplete = async () => {
    if (!pendingRecord || !signature) return;
    setIsProcessing(true);
    // 실제 차감 로직 실행
    await dbService.signCareRecord(pendingRecord.id, signature);
    setPendingRecord(null);
    setSignature('');
    await loadMemberData(); // 차감된 잔액 반영을 위해 다시 로드
    setIsProcessing(false);
    alert('오늘의 세션 확인 및 결제 처리가 완료되었습니다.');
  };

  if (!member) return <div className="p-20 text-center animate-pulse font-serif text-gray-400">Opening Your Private Sanctuary...</div>;

  return (
    <div className="min-h-screen bg-[#FBF9F6] font-sans text-gray-900 pb-20">
      {/* Top Header (Image 1 상단 로고 및 싱크) */}
      <header className="px-12 py-6 flex justify-between items-center bg-white border-b border-gray-50">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-hannam-green rounded-full flex items-center justify-center text-white text-[8px] font-black uppercase shadow-lg">Logo</div>
           <div className="flex flex-col">
              <h1 className="text-lg font-serif font-bold text-[#1A1A1A] tracking-tight">THE HANNAM</h1>
              <p className="text-[10px] text-gray-400 font-medium">Welcome, <span className="text-hannam-gold font-bold">{member.name} Kim.</span></p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={loadMemberData} className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-100 rounded-full text-[9px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all">
             <RefreshCw className="w-3 h-3" /> Sync Data
           </button>
           <button onClick={() => { authService.logout(); navigate('/'); }} className="text-gray-300 hover:text-black">
             <LogOut className="w-4 h-4" />
           </button>
        </div>
      </header>

      {/* Main Hero (Image 1 중앙 타이틀) */}
      <section className="pt-20 pb-12 text-center">
         <h2 className="text-[44px] font-serif font-bold tracking-tight text-[#1A362E] mb-2 uppercase">WELLNESS, THE HANNAM</h2>
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-8">PRIVATE WELL-AGING CENTER</p>
         <p className="text-[13px] font-serif italic text-gray-400">"Balanced Life, Immeasurable Value"</p>
      </section>

      {/* Navigation Tabs (Image 1 상단 탭) */}
      <nav className="flex justify-center gap-12 border-b border-gray-100 mb-12 max-w-4xl mx-auto">
         {[
           { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
           { id: 'notes', label: 'Care Notes', icon: MessageCircle },
           { id: 'ai', label: 'AI Concierge', icon: Sparkles },
         ].map(item => (
           <button 
             key={item.id}
             onClick={() => setActiveTab(item.id as any)}
             className={`flex items-center gap-3 pb-5 text-[13px] font-bold tracking-tight relative transition-all ${activeTab === item.id ? 'text-[#1A362E]' : 'text-gray-300 hover:text-gray-500'}`}
           >
             <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-hannam-gold' : 'text-gray-200'}`} />
             {item.label}
             {activeTab === item.id && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-hannam-green" />}
           </button>
         ))}
      </nav>

      <main className="max-w-[1280px] mx-auto px-8">
         {activeTab === 'dashboard' && (
           <div className="space-y-12 animate-fade-in">
              {/* Top Section (Image 1 상단 카드 영역) */}
              <div className="flex items-center gap-3 mb-4">
                 <div className="bg-gray-100 px-3 py-1 rounded-md flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 text-gray-400" />
                    <span className="text-[9px] font-bold text-gray-400">Offline Demo Mode</span>
                 </div>
                 <div className="ml-auto text-[10px] font-mono text-gray-300">Member ID: {member.id}</div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                 {/* Remaining Membership Limit Card (Image 1 좌측) */}
                 <div className="bg-[#1A362E] rounded-[16px] p-12 text-white shadow-2xl relative overflow-hidden group h-[340px] flex flex-col justify-between">
                    <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 bg-white/5 rounded-full" />
                    <div>
                       <p className="text-[13px] font-medium text-white/60 mb-6">Remaining Membership Limit</p>
                       <h3 className="text-[52px] font-serif font-bold tracking-tight mb-8">₩{member.remaining.toLocaleString()}</h3>
                    </div>
                    <div className="flex gap-12 border-t border-white/10 pt-8">
                       <div>
                          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Total Deposit</p>
                          <p className="text-sm font-bold text-white/80">₩{member.deposit.toLocaleString()}</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Total Usage</p>
                          <p className="text-sm font-bold text-white/80">₩{member.used.toLocaleString()}</p>
                       </div>
                    </div>
                 </div>

                 {/* Membership Benefits Card (Image 1 우측) */}
                 <div className="bg-white rounded-[16px] p-12 border border-gray-100 shadow-sm flex flex-col h-[340px]">
                    <h4 className="text-[20px] font-serif font-bold text-[#1A362E] mb-8">Membership Benefits</h4>
                    <div className="flex items-center gap-4 mb-6">
                       <span className="text-2xl font-serif font-bold">{member.tier} Tier</span>
                       <span className="bg-[#E7F7EF] text-[#27AE60] text-[10px] font-black px-4 py-1.5 rounded-md border border-[#D5EEDB]">15% Discount Applied</span>
                    </div>
                    <p className="text-[14px] text-gray-500 font-medium leading-relaxed mb-auto">
                       Deposit an additional <span className="text-gray-900 font-bold">₩3,000,000</span> to upgrade to the next tier with <span className="text-hannam-gold font-bold">20% discount</span> benefits.
                    </p>
                    <p className="text-[11px] text-gray-300 font-medium italic">
                       Note: Discount rates are calculated based on cumulative deposits and are automatically applied to all services and product payments.
                    </p>
                 </div>
              </div>

              {/* Confirm & Sign Section (Image 3 - 관리자가 정산 요청 시에만 노출) */}
              {pendingRecord && (
                <div className="bg-white p-12 rounded-[16px] border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4">
                   <div className="flex justify-between items-center mb-10">
                      <h4 className="text-[20px] font-serif font-bold text-hannam-gold">Confirm Today's Session & Sign</h4>
                      <span className="bg-[#FFF1F0] text-[#FF4D4D] px-5 py-2 rounded-md text-[10px] font-black uppercase tracking-widest border border-[#FFE5E3]">Awaiting Signature</span>
                   </div>
                   <div className="bg-[#F0F7FF] p-10 rounded-xl border border-[#D9EAFF] flex items-center gap-6 mb-12">
                      <div className="w-12 h-12 bg-[#3498DB] rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                         <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                         <h5 className="text-[18px] font-bold text-[#1A362E] mb-1">{pendingRecord.content} (Today)</h5>
                         <p className="text-[15px] font-bold text-[#3498DB]">Deduction: ₩{pendingRecord.discountedPrice.toLocaleString()}</p>
                      </div>
                   </div>
                   <div className="h-[360px] mb-10">
                      <SignaturePad 
                        onSave={(data) => setSignature(data)} 
                        onClear={() => setSignature('')} 
                      />
                   </div>
                   <button 
                     onClick={handleSignComplete}
                     disabled={!signature || isProcessing}
                     className="w-full py-6 bg-[#E9EDF1] text-[#718096] rounded-xl text-lg font-bold hover:bg-hannam-green hover:text-white transition-all active:scale-[0.99] disabled:opacity-50"
                   >
                     {isProcessing ? 'Processing...' : 'Confirm Session & Complete'}
                   </button>
                   <p className="mt-6 text-center text-[11px] text-gray-400 font-medium">* This signature has legal effect under the Electronic Documents Act and signifies agreement to the service usage details.</p>
                </div>
              )}

              {/* Upcoming Schedule & Profile Section (Image 1 하단) */}
              <div className="grid grid-cols-2 gap-8">
                 <div className="bg-white p-12 rounded-[16px] border border-gray-100 shadow-sm">
                    <h4 className="text-[18px] font-serif font-bold text-[#1A362E] mb-10 border-l-[3px] border-hannam-gold pl-6 flex items-center">Upcoming Schedule</h4>
                    <div className="grid grid-cols-1 gap-6 mb-10">
                       {reservations.length > 0 ? reservations.slice(0, 2).map(res => (
                         <div key={res.id} className="bg-[#FBF9F6] p-8 rounded-xl flex flex-col group">
                            <h5 className="text-[16px] font-bold text-gray-900 mb-1">{res.serviceType}</h5>
                            <p className="text-[11px] text-gray-400 font-bold mb-6">{new Date(res.dateTime).toLocaleString('en-US', { month: 'short', day: 'numeric', weekday: 'short', hour: 'numeric', minute: '2-digit' })}</p>
                            <div className="flex items-center gap-2">
                               <span className="bg-white px-2 py-0.5 rounded text-[8px] font-black uppercase text-gray-400 border border-gray-100">Staff</span>
                               <span className="text-[11px] font-bold text-gray-500">Therapist: {res.therapistName}</span>
                            </div>
                         </div>
                       )) : <p className="text-gray-300 italic py-10">No upcoming sessions booked.</p>}
                    </div>
                    <button className="w-full py-5 bg-[#F4F6F8] text-[#718096] rounded-xl text-xs font-bold flex items-center justify-center gap-3 hover:bg-gray-100 transition-all">
                       <Calendar className="w-4 h-4" /> View All Reservations
                    </button>
                 </div>

                 <div className="bg-white p-12 rounded-[16px] border border-gray-100 shadow-sm flex flex-col h-full">
                    <h4 className="text-[18px] font-serif font-bold text-[#1A362E] mb-10 border-l-[3px] border-hannam-gold pl-6">Personal Wellness Profile</h4>
                    <div className="space-y-10 mb-auto">
                       <div className="flex justify-between items-end border-b border-gray-50 pb-6">
                          <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Core Care Goal</p>
                          <p className="text-[14px] font-bold text-gray-900">{member.coreGoal || 'Stress Care & Sleep Quality'}</p>
                       </div>
                       <div className="flex justify-between items-end border-b border-gray-50 pb-6">
                          <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest">AI Recommended Session</p>
                          <p className="text-[14px] font-bold text-hannam-gold">{member.aiRecommended || 'Meditation & Yoga Therapy'}</p>
                       </div>
                    </div>
                    <button className="w-full mt-10 py-6 bg-hannam-green text-white rounded-xl text-xs font-bold shadow-xl flex items-center justify-center gap-3 hover:scale-[1.01] transition-transform">
                       <Sparkles className="w-4 h-4 text-hannam-gold" /> Request AI Concierge Analysis
                    </button>
                 </div>
              </div>

              {/* History Table (Image 2 - 차감 내역 테이블) */}
              <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden">
                 <div className="p-12 pb-8">
                    <h4 className="text-[20px] font-serif font-bold text-[#1A362E] border-l-[3px] border-hannam-gold pl-6">Usage History & Contract Management</h4>
                 </div>
                 <div className="px-12 pb-12">
                    <h5 className="text-[16px] font-serif font-bold text-gray-500 mb-8">Recent Deductions</h5>
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                             <th className="py-6 font-medium">Date</th>
                             <th className="py-6 font-medium">Service</th>
                             <th className="py-6 font-medium text-right">Amount Deducted</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {history.filter(h => h.status === CareStatus.COMPLETED).slice(0, 5).map(h => (
                             <tr key={h.id} className="text-sm">
                                <td className="py-8 font-medium text-gray-500">{h.date}</td>
                                <td className="py-8 font-bold text-gray-900">{h.content}</td>
                                <td className="py-8 font-black text-gray-900 text-right">₩{h.discountedPrice.toLocaleString()}</td>
                             </tr>
                          ))}
                          {history.length === 0 && (
                            <tr><td colSpan={3} className="py-20 text-center text-gray-300 italic font-medium">No usage records available yet.</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
         )}

         {activeTab === 'notes' && (
           <div className="animate-fade-in">
              <h3 className="text-3xl font-serif font-bold text-hannam-green mb-16 px-2">Wellness Care Notes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                 {/* Care Notes Grid (Image 4 시안 적용) */}
                 {history.filter(h => h.status === CareStatus.COMPLETED).map((note, idx) => (
                    <div key={note.id} className="bg-white p-12 rounded-[12px] border border-gray-100 shadow-sm flex flex-col hover:shadow-xl transition-all group">
                       <div className="flex justify-between items-center mb-10">
                          <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${idx === 0 ? 'bg-hannam-green text-white' : 'bg-[#EBF0EE] text-gray-500'}`}>
                            {idx === 0 ? 'Today Session' : note.content.split(' ')[0]}
                          </span>
                          <span className="text-[11px] font-bold text-gray-300">{note.date}</span>
                       </div>
                       <p className="text-[17px] font-serif italic text-gray-900 leading-relaxed mb-10 flex-1">
                          "{note.feedback}"
                       </p>
                       <div className="space-y-6 pt-10 border-t border-gray-50">
                          <div className="flex items-start gap-4">
                             <CheckCircle className="w-4 h-4 text-hannam-green mt-1 flex-shrink-0" />
                             <div className="flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Recommendation</p>
                                <div className="p-5 bg-[#F6FAF8] rounded-lg text-[13px] text-gray-600 leading-relaxed font-medium">
                                   {note.recommendation}
                                </div>
                             </div>
                          </div>
                          <div className="flex justify-between items-center pt-4">
                             <button className="text-[11px] font-black text-hannam-gold uppercase tracking-widest flex items-center gap-2 hover:text-[#1A362E] transition-colors">
                                <Info className="w-3.5 h-3.5" /> See Details
                             </button>
                             <p className="text-[10px] font-bold text-gray-400">- {note.therapistName}</p>
                          </div>
                       </div>
                    </div>
                 ))}
                 {history.length === 0 && <div className="col-span-3 py-40 text-center text-gray-300 italic border-2 border-dashed rounded-[16px] font-medium">No care notes available yet.</div>}
              </div>
           </div>
         )}

         {activeTab === 'ai' && (
           <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-hannam-green rounded-3xl flex items-center justify-center text-white shadow-2xl mb-12">
                 <Sparkles className="w-12 h-12 text-hannam-gold" />
              </div>
              <h3 className="text-4xl font-serif font-bold text-hannam-green mb-6">AI WELLNESS CONCIERGE</h3>
              <p className="text-gray-400 font-medium leading-relaxed mb-12">
                 당신의 최근 케어 데이터와 바이오 리듬을 분석하여,<br/>오늘 가장 필요한 최적의 휴식 코스를 설계합니다.
              </p>
              <button className="px-12 py-6 bg-hannam-green text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform">
                 Generate Personalized Report <ChevronRight className="w-4 h-4" />
              </button>
           </div>
         )}
      </main>
    </div>
  );
};
