
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { authService } from '../../services/authService';
import { Member, CareRecord, Reservation, CareStatus, Therapist } from '../../types';
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
  Calendar,
  Plus,
  X
} from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';

export const MemberPortal: React.FC = () => {
  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<CareRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'notes' | 'concierge'>('dashboard');
  const [pendingRecord, setPendingRecord] = useState<CareRecord | null>(null);
  
  // Modals & Forms
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({ therapistId: '', dateTime: '', serviceType: 'Premium Wellness Therapy' });
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
    const [m, th] = await Promise.all([
      dbService.getMemberById(currentUser.id),
      dbService.getTherapists()
    ]);
    if (m) {
      setMember(m);
      setTherapists(th);
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

  const handleBookingSubmit = async () => {
    if (!member || !bookingForm.therapistId || !bookingForm.dateTime) return alert('전문가와 시간을 선택해주세요.');
    const therapist = therapists.find(t => t.id === bookingForm.therapistId);
    
    await dbService.createReservation({
      memberId: member.id,
      memberName: member.name,
      therapistId: bookingForm.therapistId,
      therapistName: therapist?.name || 'Unknown',
      dateTime: bookingForm.dateTime,
      serviceType: bookingForm.serviceType
    });
    
    alert('예약이 정상적으로 신청되었습니다.');
    setIsBookingModalOpen(false);
    loadMemberData();
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
           <button onClick={loadMemberData} className="flex items-center gap-2 px-3 py-1.5 border border-hannam-border rounded-full text-[10px] text-hannam-subtext font-medium hover:bg-hannam-gray-bg transition-colors">
             <RefreshCw className="w-3 h-3" /> Refresh
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
              {/* Membership & Benefits Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

                 <div className="card-minimal p-10 flex flex-col justify-center">
                    <h4 className="text-xl font-serif text-hannam-green mb-8">Membership Status</h4>
                    <div className="flex items-center gap-4 mb-6">
                       <span className="text-2xl font-bold text-hannam-text">{member.tier} Tier Member</span>
                    </div>
                    <p className="text-[13px] text-hannam-subtext leading-relaxed">
                       Wellness, The Hannam의 프라이빗 멤버십 회원입니다. 전담 전문가의 맞춤 관리를 통해 당신의 가치를 더 높여드립니다.
                    </p>
                 </div>
              </div>

              {/* Pending Signature Section */}
              {pendingRecord && (
                <div className="bg-white p-8 rounded-xl border border-hannam-gold shadow-lg animate-fade-in">
                   <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-hannam-gold" />
                        <h4 className="text-lg font-serif text-hannam-green">Confirm Today's Session</h4>
                      </div>
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-50 px-3 py-1 rounded border border-red-100">Signature Required</span>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div className="bg-hannam-gray-bg p-6 rounded-lg flex flex-col justify-center border border-hannam-border">
                         <h5 className="text-lg font-bold text-hannam-text mb-1">{pendingRecord.content}</h5>
                         <p className="text-xs text-hannam-subtext mb-4">Expert: {pendingRecord.therapistName}</p>
                         <div className="flex justify-between items-baseline pt-4 border-t border-hannam-border">
                            <span className="text-xs text-hannam-subtext font-medium">Session Value</span>
                            <span className="text-2xl font-serif text-hannam-green">₩{pendingRecord.discountedPrice.toLocaleString()}</span>
                         </div>
                      </div>
                      <div className="h-[220px]">
                         <SignaturePad onSave={setSignature} onClear={() => setSignature('')} />
                      </div>
                   </div>
                   <button 
                     onClick={handleSignComplete}
                     disabled={!signature || isProcessing}
                     className="w-full py-4 btn-primary rounded-lg text-xs font-bold uppercase tracking-[0.2em] shadow-lg disabled:opacity-50"
                   >
                     {isProcessing ? 'Processing...' : 'Complete Verification'}
                   </button>
                </div>
              )}

              {/* Schedule Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="card-minimal p-10 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                       <div className="flex items-center gap-3">
                          <div className="w-1 h-6 bg-hannam-gold rounded-full" />
                          <h4 className="text-xl font-serif text-hannam-green">Upcoming Schedule</h4>
                       </div>
                       <button 
                         onClick={() => setIsBookingModalOpen(true)}
                         className="flex items-center gap-1.5 px-3 py-1.5 bg-hannam-green text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                       >
                          <Plus className="w-3.5 h-3.5" /> Book Now
                       </button>
                    </div>
                    <div className="space-y-4 flex-1">
                       {reservations.length > 0 ? reservations.slice(0, 3).map(res => (
                         <div key={res.id} className="bg-hannam-gray-bg p-6 rounded-lg border border-hannam-border">
                            <h5 className="text-base font-bold text-hannam-text mb-1">{res.serviceType}</h5>
                            <p className="text-xs text-hannam-gold font-medium num-clean uppercase mb-4">
                              {new Date(res.dateTime).toLocaleString('en-US', { month: 'short', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-[11px] font-medium text-hannam-subtext">Expert: {res.therapistName}</p>
                         </div>
                       )) : <p className="text-hannam-subtext italic text-xs py-10 text-center">No scheduled sessions.</p>}
                    </div>
                 </div>

                 <div className="card-minimal p-10 flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                       <div className="w-1 h-6 bg-hannam-gold rounded-full" />
                       <h4 className="text-xl font-serif text-hannam-green">Wellness AI Focus</h4>
                    </div>
                    <div className="space-y-6 flex-1">
                       <div className="flex justify-between items-center border-b border-hannam-border pb-4">
                          <p className="text-sm font-medium text-hannam-text">Personal Goal</p>
                          <p className="text-sm font-bold text-hannam-subtext">{member.coreGoal}</p>
                       </div>
                       <div className="flex justify-between items-center border-b border-hannam-border pb-4">
                          <p className="text-sm font-medium text-hannam-text">AI Recommendation</p>
                          <p className="text-sm font-bold text-hannam-gold">{member.aiRecommended}</p>
                       </div>
                    </div>
                    <button className="w-full mt-8 py-4 bg-hannam-gray-bg text-hannam-subtext rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                       <Sparkles className="w-4 h-4 text-hannam-gold" /> AI Concierge Sync
                    </button>
                 </div>
              </div>
           </div>
         )}

         {/* Rest of the tabs remain same ... */}
         {activeTab === 'notes' && (
           <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((note) => (
                 <div key={note.id} className="card-minimal p-8 flex flex-col h-[300px] hover:border-hannam-gold group transition-all">
                    <div className="flex justify-between items-center mb-6">
                       <span className="bg-hannam-gray-bg px-3 py-1 rounded text-[9px] font-bold text-hannam-subtext border border-hannam-border uppercase">{note.status}</span>
                       <span className="text-[11px] font-bold text-hannam-subtext num-clean">{note.date}</span>
                    </div>
                    <p className="text-sm font-serif italic text-hannam-text leading-relaxed mb-6 flex-1 line-clamp-4">
                       "{note.feedback || '세션 진행이 완료되었습니다.'}"
                    </p>
                    <div className="pt-6 border-t border-hannam-border">
                       <p className="text-[10px] font-bold text-hannam-gold uppercase mb-2 tracking-widest">Recommendation</p>
                       <p className="text-xs text-hannam-subtext font-medium leading-tight">{note.recommendation}</p>
                    </div>
                 </div>
              ))}
           </div>
         )}
      </main>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[40px] p-12 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-serif font-bold text-gray-900 uppercase tracking-wider">New Appointment</h2>
                 <button onClick={() => setIsBookingModalOpen(false)}><X className="w-6 h-6 text-gray-300" /></button>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Select Expert</label>
                    <select 
                      value={bookingForm.therapistId} 
                      onChange={e => setBookingForm({...bookingForm, therapistId: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs outline-none border border-transparent focus:border-hannam-gold"
                    >
                       <option value="">스탭을 선택하세요</option>
                       {therapists.map(t => <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Date & Time</label>
                    <input 
                      type="datetime-local" 
                      value={bookingForm.dateTime} 
                      onChange={e => setBookingForm({...bookingForm, dateTime: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs outline-none" 
                    />
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Session Type</label>
                    <input 
                      type="text" 
                      value={bookingForm.serviceType} 
                      onChange={e => setBookingForm({...bookingForm, serviceType: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs outline-none" 
                    />
                 </div>
                 <button 
                   onClick={handleBookingSubmit}
                   className="w-full py-5 bg-[#1A362E] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl mt-4"
                 >
                    Confirm Appointment
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
