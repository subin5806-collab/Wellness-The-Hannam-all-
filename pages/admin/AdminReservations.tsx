
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { Reservation, Therapist, Member, Program } from '../../types';
import { 
  ChevronLeft, ChevronRight, Plus, Trash2, X,
  Edit3, Clock, MoreVertical, CheckCircle2, UserCheck, ArrowRight
} from 'lucide-react';

type ViewMode = 'month' | 'week' | 'staff-daily';

export const AdminReservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [view, setView] = useState<ViewMode>('week');
  
  const [isResModalOpen, setIsResModalOpen] = useState(false);
  const [isStaffListOpen, setIsStaffListOpen] = useState(false);
  const [isProgramListOpen, setIsProgramListOpen] = useState(false);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  
  const [newRes, setNewRes] = useState({ memberId: '', therapistId: '', dateTime: '', serviceType: '', price: 0 });
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [programForm, setProgramForm] = useState({ name: '', description: '', basePrice: 0, unit: '회' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [r, t, m, p] = await Promise.all([
      dbService.getReservations(),
      dbService.getTherapists(),
      dbService.getAllMembers(),
      dbService.getAllPrograms()
    ]);
    setReservations(r);
    setTherapists(t);
    setMembers(m);
    setPrograms(p);
  };

  const handleCreateReservation = async () => {
    if (!selectedMember || !newRes.therapistId || !newRes.dateTime || !newRes.serviceType) return alert('모든 항목을 정확히 입력하세요.');
    const therapist = therapists.find(t => t.id === newRes.therapistId);
    
    await dbService.createReservation({
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      therapistId: newRes.therapistId,
      therapistName: therapist?.name || '알 수 없음',
      dateTime: newRes.dateTime,
      serviceType: newRes.serviceType,
      price: newRes.price
    });
    
    alert('새로운 예약 등록이 완료되었습니다.');
    handleCloseResModal();
    loadData();
  };

  const handleCloseResModal = () => {
    setIsResModalOpen(false);
    setNewRes({ memberId: '', therapistId: '', dateTime: '', serviceType: '', price: 0 });
    setMemberSearchTerm('');
    setSelectedMember(null);
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programForm.name || programForm.basePrice < 0) return alert('정보를 올바르게 입력하세요.');
    if (editingProgram) {
      await dbService.updateProgram(editingProgram.id, programForm);
    } else {
      await dbService.saveProgram(programForm);
    }
    setIsProgramModalOpen(false);
    setProgramForm({ name: '', description: '', basePrice: 0, unit: '회' });
    setEditingProgram(null);
    loadData();
  };

  const handleDeleteProgram = async (id: string) => {
    if (confirm('프로그램을 삭제하시겠습니까?')) {
      await dbService.updateProgram(id, { isActive: false });
      loadData();
    }
  };

  const handleSelectProgramInRes = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prog = programs.find(p => p.id === e.target.value);
    if (prog) {
      setNewRes({ ...newRes, serviceType: prog.name, price: prog.basePrice });
    }
  };

  const filteredMembers = memberSearchTerm.length >= 1 
    ? members.filter(m => m.name.includes(memberSearchTerm) || m.phone.includes(memberSearchTerm))
    : [];

  const hours = Array.from({ length: 14 }, (_, i) => i + 8); 
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="p-10 bg-hannam-bg min-h-screen font-sans animate-smooth-fade">
      <div className="max-w-7xl mx-auto space-y-10">
        
        <header className="flex justify-between items-end border-b border-hannam-border pb-10">
          <div>
            <h1 className="text-3xl font-serif font-bold text-hannam-green tracking-tight uppercase">Reservation Console</h1>
            <p className="text-[11px] font-black text-hannam-gold uppercase tracking-[0.4em] mt-2">프라이빗 웰니스 통합 예약 시스템</p>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsStaffListOpen(true)}
               className="px-6 py-3.5 bg-white border border-hannam-border rounded-xl text-[11px] font-black text-hannam-muted hover:text-hannam-green hover:border-hannam-green transition-all shadow-hannam-soft"
             >
                전문가 풀 관리
             </button>
             <button 
               onClick={() => setIsProgramListOpen(true)}
               className="px-6 py-3.5 bg-white border border-hannam-border rounded-xl text-[11px] font-black text-hannam-muted hover:text-hannam-green hover:border-hannam-green transition-all shadow-hannam-soft"
             >
                서비스 항목 설정
             </button>
             <button 
               onClick={() => setIsResModalOpen(true)}
               className="bg-hannam-green text-white px-8 py-3.5 rounded-xl text-[11px] font-black flex items-center gap-2.5 hover:bg-black transition-all shadow-hannam-deep active:scale-95 uppercase tracking-widest"
             >
                <Plus className="w-4 h-4" /> 신규 예약 생성
             </button>
          </div>
        </header>

        <div className="flex justify-between items-center bg-white/40 p-4 rounded-[32px] border border-hannam-border shadow-hannam-soft">
           <div className="flex items-center gap-8 px-4">
              <div className="flex items-center gap-2">
                 <button className="p-2 hover:bg-white rounded-lg text-hannam-muted transition-all"><ChevronLeft className="w-5 h-5"/></button>
                 <button className="p-2 hover:bg-white rounded-lg text-hannam-muted transition-all"><ChevronRight className="w-5 h-5"/></button>
              </div>
              <h3 className="text-xl font-serif font-bold text-hannam-green tracking-tight">
                {view === 'month' ? 'December 2025' : view === 'week' ? 'Dec 14 – 20, 2025' : "Today's Expertise"}
              </h3>
           </div>
           <div className="flex bg-hannam-bg p-1.5 rounded-2xl border border-hannam-border">
              {[
                { id: 'month', label: '월간 현황' },
                { id: 'week', label: '주간 일정' },
                { id: 'staff-daily', label: '전문가별' }
              ].map((m) => (
                <button 
                  key={m.id}
                  onClick={() => setView(m.id as any)} 
                  className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === m.id ? 'bg-white text-hannam-green shadow-sm' : 'text-hannam-muted hover:text-hannam-text'}`}
                >
                  {m.label}
                </button>
              ))}
           </div>
        </div>

        <div className="bg-white border border-hannam-border rounded-[48px] overflow-hidden shadow-hannam-soft min-h-[650px] relative">
           {view === 'month' && (
              <div className="grid grid-cols-7 h-full">
                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className={`p-6 text-center border-b border-hannam-border bg-hannam-bg/30 text-[9px] font-black uppercase tracking-[0.2em] text-hannam-muted`}>{d}</div>
                 ))}
                 {monthDays.map(day => {
                    const dailyRes = reservations.filter(r => parseInt(r.dateTime.split('-')[2]) === day);
                    return (
                      <div key={day} className="min-h-[140px] p-6 border-r border-b border-hannam-border/40 hover:bg-hannam-bg/20 transition-all group">
                         <span className={`text-[13px] font-black num-data ${day === 17 ? 'text-hannam-gold underline decoration-2 underline-offset-4' : 'text-hannam-text opacity-40 group-hover:opacity-100'}`}>{day}</span>
                         <div className="mt-4 space-y-1.5">
                            {dailyRes.slice(0, 3).map(res => (
                               <div key={res.id} className="flex items-center gap-1.5 py-1 px-2.5 bg-white border border-hannam-border rounded-lg shadow-sm">
                                  <div className="w-1 h-1 rounded-full bg-hannam-gold" />
                                  <span className="text-[10px] font-bold text-hannam-green truncate">{res.memberName}</span>
                               </div>
                            ))}
                            {dailyRes.length > 3 && <p className="text-[9px] font-black text-hannam-gold pl-2">+{dailyRes.length - 3} More</p>}
                         </div>
                      </div>
                    )
                 })}
              </div>
           )}

           {view === 'week' && (
              <>
                <div className="grid grid-cols-8 bg-hannam-bg/40 border-b border-hannam-border">
                   <div className="p-6 border-r border-hannam-border"></div>
                   {weekDays.map(day => (
                     <div key={day} className={`p-6 text-center border-l border-hannam-border/40 text-[9px] font-black uppercase tracking-[0.2em] text-hannam-muted`}>
                       {day}
                     </div>
                   ))}
                </div>
                <div className="h-[600px] overflow-y-auto no-scrollbar bg-white">
                   {hours.map(hour => (
                      <div key={hour} className="grid grid-cols-8 border-b border-hannam-border/30 min-h-[100px]">
                         <div className="p-6 text-[10px] font-black text-hannam-muted text-right border-r border-hannam-border/40 bg-hannam-bg/10">
                            <span className="num-data">{hour < 12 ? `${hour} AM` : hour === 12 ? `12 PM` : `${hour - 12} PM`}</span>
                         </div>
                         {weekDays.map((_, di) => {
                           const cellRes = di === 4 && hour === 14 ? [reservations[0]] : []; 
                           return (
                             <div key={di} className="border-l border-hannam-border/30 relative p-2 hover:bg-hannam-bg/5 transition-colors">
                               {cellRes.map(res => res && (
                                 <div 
                                   key={res.id} 
                                   className="h-full bg-white border border-hannam-gold/30 p-4 rounded-2xl shadow-hannam-soft group cursor-pointer hover:border-hannam-green transition-all"
                                 >
                                    <div className="flex justify-between items-start">
                                       <p className="text-[12px] font-black text-hannam-green">{res.memberName} 님</p>
                                       <MoreVertical className="w-3.5 h-3.5 text-hannam-border group-hover:text-hannam-gold" />
                                    </div>
                                    <p className="text-[10px] font-bold text-hannam-muted mt-1 uppercase tracking-tight">{res.therapistName} Expert</p>
                                 </div>
                               ))}
                             </div>
                           )
                         })}
                      </div>
                   ))}
                </div>
              </>
           )}

           {view === 'staff-daily' && (
              <div className="p-16 space-y-20">
                 {therapists.map(staff => {
                    const todayRes = reservations.filter(r => r.therapistId === staff.id);
                    return (
                       <section key={staff.id} className="space-y-8 animate-smooth-fade">
                          <div className="flex items-end justify-between border-b border-hannam-border pb-6">
                             <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-hannam-bg border border-hannam-border rounded-2xl flex items-center justify-center">
                                   <UserCheck className="w-8 h-8 text-hannam-gold opacity-50" />
                                </div>
                                <div>
                                   <h4 className="text-xl font-serif font-bold text-hannam-green">{staff.name} 전문가</h4>
                                   <p className="text-[10px] font-black text-hannam-gold uppercase tracking-[0.3em] mt-1">{staff.specialty}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[9px] font-black text-hannam-muted uppercase tracking-widest mb-1">Today's Load</p>
                                <p className="text-3xl font-bold text-hannam-green num-data leading-none">{todayRes.length} <span className="text-xs uppercase font-black opacity-30">Sessions</span></p>
                             </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                             {todayRes.map(res => (
                                <div key={res.id} className="bg-[#FBFBFB] border border-hannam-border p-8 rounded-[32px] hover:bg-white hover:border-hannam-gold hover:shadow-hannam-soft transition-all cursor-pointer group">
                                   <div className="flex justify-between items-start mb-6">
                                      <span className="text-[15px] font-black text-hannam-text">{res.memberName} 님</span>
                                      <span className="text-[11px] font-black num-data text-hannam-gold py-1 px-3 bg-white border border-hannam-border rounded-lg">{res.dateTime.split('T')[1].substring(0, 5)}</span>
                                   </div>
                                   <div className="mt-8 pt-6 border-t border-hannam-border/40 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all">
                                      <span className="text-[9px] font-black text-hannam-gold uppercase tracking-[0.2em]">관리 콘솔 입장</span>
                                      <ArrowRight className="w-4 h-4 text-hannam-green" />
                                   </div>
                                </div>
                             ))}
                          </div>
                       </section>
                    )
                 })}
              </div>
           )}
        </div>
      </div>

      {/* 전문가 목록 모달 */}
      {isStaffListOpen && (
        <div className="fixed inset-0 bg-hannam-text/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-3xl rounded-[48px] p-12 shadow-hannam-deep border border-hannam-border animate-smooth-fade">
              <div className="flex justify-between items-start mb-12">
                 <div>
                    <h2 className="text-2xl font-serif font-bold text-hannam-green tracking-tight uppercase">Expert Registry</h2>
                    <p className="text-[10px] font-black text-hannam-gold uppercase tracking-[0.2em] mt-2">프라이빗 전문가 인력 풀 관리</p>
                 </div>
                 <button onClick={() => setIsStaffListOpen(false)} className="p-2 text-hannam-muted hover:text-hannam-green transition-colors"><X className="w-7 h-7" /></button>
              </div>
              <div className="grid grid-cols-2 gap-6 max-h-[450px] overflow-y-auto no-scrollbar mb-10 pr-2">
                 {therapists.map(t => (
                    <div key={t.id} className="p-8 bg-hannam-bg/50 rounded-[40px] border border-hannam-border flex flex-col justify-between group hover:bg-white hover:border-hannam-gold transition-all">
                       <div>
                          <p className="text-[18px] font-serif font-bold text-hannam-green">{t.name} 전문가</p>
                          <p className="text-[10px] font-black text-hannam-gold uppercase tracking-[0.2em] mt-1">{t.specialty}</p>
                       </div>
                       <div className="mt-8 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-hannam-muted num-data">{t.phone}</span>
                          <button onClick={() => dbService.deleteTherapist(t.id).then(loadData)} className="px-4 py-2 bg-white border border-hannam-border rounded-xl text-[10px] font-bold text-hannam-muted hover:text-red-500 transition-colors">삭제</button>
                       </div>
                    </div>
                 ))}
                 <button 
                  onClick={() => {
                    const name = prompt('전문가 성함:');
                    const specialty = prompt('전문 분야:');
                    const phone = prompt('연락처:');
                    if(name && specialty && phone) dbService.addTherapist({name, specialty, phone}).then(loadData);
                  }}
                  className="p-8 border-2 border-dashed border-hannam-border rounded-[40px] flex flex-col items-center justify-center gap-4 text-hannam-muted hover:border-hannam-gold hover:text-hannam-green transition-all"
                 >
                    <Plus className="w-8 h-8 opacity-40" />
                    <span className="text-[10px] font-black uppercase tracking-widest">전문가 추가 등록</span>
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* 프로그램 목록 모달 */}
      {isProgramListOpen && (
        <div className="fixed inset-0 bg-hannam-text/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[48px] p-12 shadow-hannam-deep border border-hannam-border animate-smooth-fade">
              <div className="flex justify-between items-start mb-12">
                 <div>
                    <h2 className="text-2xl font-serif font-bold text-hannam-green tracking-tight uppercase">Services Catalogue</h2>
                    <p className="text-[10px] font-black text-hannam-gold uppercase tracking-[0.2em] mt-2">프라이빗 서비스 항목 전체 아카이브</p>
                 </div>
                 <button onClick={() => setIsProgramListOpen(false)} className="p-2 text-hannam-muted hover:text-hannam-green transition-colors"><X className="w-7 h-7" /></button>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar mb-12 pr-2">
                 {programs.filter(p => p.isActive).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-7 bg-hannam-bg/50 rounded-[32px] border border-hannam-border group hover:bg-white hover:border-hannam-gold transition-all">
                       <div>
                          <div className="flex items-center gap-4">
                             <p className="text-[16px] font-black text-hannam-text">{p.name}</p>
                             <span className="px-3 py-1 bg-white border border-hannam-border text-[9px] font-black text-hannam-gold rounded-lg uppercase tracking-widest">{p.unit}</span>
                          </div>
                          <p className="text-[12px] text-hannam-muted font-bold mt-2 num-data">Price: ₩ {p.basePrice.toLocaleString()}</p>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => { setEditingProgram(p); setProgramForm({ name: p.name, description: p.description, basePrice: p.basePrice, unit: p.unit }); setIsProgramModalOpen(true); }} className="px-4 py-2 bg-white border border-hannam-border rounded-xl text-[10px] font-bold text-hannam-gold">수정</button>
                          <button onClick={() => handleDeleteProgram(p.id)} className="px-4 py-2 bg-white border border-hannam-border rounded-xl text-[10px] font-bold text-red-400">삭제</button>
                       </div>
                    </div>
                 ))}
              </div>
              <button onClick={() => { setEditingProgram(null); setProgramForm({ name: '', description: '', basePrice: 0, unit: '회' }); setIsProgramModalOpen(true); }} className="w-full py-6 bg-hannam-green text-white rounded-[24px] text-[12px] font-black shadow-lg flex items-center justify-center gap-3 hover:bg-black transition-all uppercase tracking-widest">
                 <Plus className="w-5 h-5" /> 신규 서비스 항목 등록
              </button>
           </div>
        </div>
      )}

      {/* 프로그램 등록/수정 모달 */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 bg-hannam-text/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
           <form onSubmit={handleSaveProgram} className="bg-white w-full max-w-md rounded-[48px] p-12 shadow-hannam-deep border border-hannam-border animate-smooth-fade">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-xl font-serif font-bold text-hannam-green tracking-tight">{editingProgram ? 'Edit Program Details' : 'New Program Entry'}</h2>
                 <button type="button" onClick={() => setIsProgramModalOpen(false)} className="text-hannam-muted hover:text-hannam-text transition-colors"><X className="w-7 h-7" /></button>
              </div>
              <div className="space-y-8">
                 <div className="space-y-2.5">
                    <label className="text-[11px] font-black text-hannam-muted ml-1 uppercase tracking-widest">프로그램 명칭 *</label>
                    <input type="text" value={programForm.name} onChange={e => setProgramForm({...programForm, name: e.target.value})} className="w-full p-5 bg-hannam-bg/50 border border-hannam-border rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-hannam-gold transition-all" placeholder="명칭 입력" required />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                       <label className="text-[11px] font-black text-hannam-muted ml-1 uppercase tracking-widest">기본 단가 (₩)</label>
                       <input type="number" value={programForm.basePrice} onChange={e => setProgramForm({...programForm, basePrice: Number(e.target.value)})} className="w-full p-5 bg-hannam-bg/50 border border-hannam-border rounded-2xl font-black text-sm outline-none focus:bg-white focus:border-hannam-gold num-data" required />
                    </div>
                    <div className="space-y-2.5">
                       <label className="text-[11px] font-black text-hannam-muted ml-1 uppercase tracking-widest">청구 단위</label>
                       <input type="text" value={programForm.unit} onChange={e => setProgramForm({...programForm, unit: e.target.value})} className="w-full p-5 bg-hannam-bg/50 border border-hannam-border rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-hannam-gold" placeholder="회, 분 등" required />
                    </div>
                 </div>
                 <button type="submit" className="w-full py-6 bg-black text-white rounded-[24px] text-[12px] font-black shadow-xl mt-6 active:scale-95 transition-all uppercase tracking-[0.2em]">
                    항목 저장하기
                 </button>
              </div>
           </form>
        </div>
      )}

      {/* 예약 등록 모달 */}
      {isResModalOpen && (
        <div className="fixed inset-0 bg-hannam-text/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[48px] p-12 shadow-hannam-deep border border-hannam-border animate-smooth-fade flex flex-col">
              <div className="flex justify-between items-start mb-10">
                 <div>
                    <h2 className="text-2xl font-serif font-bold text-hannam-green tracking-tight uppercase">New Appointment</h2>
                    <p className="text-[10px] font-black text-hannam-gold uppercase tracking-[0.2em] mt-2">프라이빗 세션 일정 등록</p>
                 </div>
                 <button onClick={handleCloseResModal} className="p-2 text-hannam-muted hover:text-hannam-text transition-colors"><X className="w-7 h-7" /></button>
              </div>
              <div className="space-y-10 overflow-y-auto no-scrollbar pr-1">
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-hannam-muted ml-1 uppercase tracking-widest">회원 선택 *</label>
                    <input 
                      type="text" 
                      value={memberSearchTerm}
                      onChange={e => setMemberSearchTerm(e.target.value)}
                      className="w-full px-6 py-5 bg-hannam-bg/50 border border-hannam-border rounded-3xl font-bold text-sm outline-none focus:bg-white focus:border-hannam-gold transition-all" 
                      placeholder="이름 또는 연락처 검색..." 
                    />
                    {filteredMembers.length > 0 && !selectedMember && (
                      <div className="mt-2 bg-white border border-hannam-border rounded-3xl shadow-hannam-deep overflow-hidden max-h-48 overflow-y-auto">
                        {filteredMembers.map(m => (
                          <div key={m.id} onClick={() => { setSelectedMember(m); setMemberSearchTerm(m.name); }} className="px-6 py-4 hover:bg-hannam-bg cursor-pointer flex justify-between items-center border-b border-hannam-border last:border-0">
                            <span className="text-[14px] font-bold text-hannam-text">{m.name}</span>
                            <span className="text-[11px] text-hannam-muted num-data">{m.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                       <label className="text-[11px] font-black text-hannam-muted ml-1 uppercase tracking-widest">배정 전문가</label>
                       <select value={newRes.therapistId} onChange={e => setNewRes({...newRes, therapistId: e.target.value})} className="w-full p-5 bg-hannam-bg border border-hannam-border rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-hannam-gold">
                          <option value="">전문가 선택</option>
                          {therapists.map(t => <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>)}
                       </select>
                    </div>
                    <div className="space-y-2.5">
                       <label className="text-[11px] font-black text-hannam-muted ml-1 uppercase tracking-widest">서비스 선택</label>
                       <select onChange={handleSelectProgramInRes} className="w-full p-5 bg-hannam-bg border border-hannam-border rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-hannam-gold">
                          <option value="">프로그램 선택</option>
                          {programs.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </select>
                    </div>
                 </div>
                 <div className="space-y-2.5">
                    <label className="text-[11px] font-black text-hannam-muted ml-1 uppercase tracking-widest">예약 일시 설정</label>
                    <input type="datetime-local" value={newRes.dateTime} onChange={e => setNewRes({...newRes, dateTime: e.target.value})} className="w-full px-6 py-5 bg-hannam-bg border border-hannam-border rounded-3xl font-black text-sm outline-none focus:bg-white focus:border-hannam-gold num-data" />
                 </div>
                 <button onClick={handleCreateReservation} className="w-full py-6 bg-hannam-green text-white rounded-[24px] text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl mt-4 hover:bg-black transition-all">
                    예약 확정하기
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
