
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { Reservation, Therapist, Member } from '../../types';
import { ChevronLeft, ChevronRight, Plus, User, Trash2, X, Users } from 'lucide-react';

export const AdminReservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [view, setView] = useState<'week' | 'list'>('week');
  const [currentDate, setCurrentDate] = useState(new Date('2025-12-18'));
  
  // Modals
  const [isResModalOpen, setIsResModalOpen] = useState(false);
  const [isStaffListOpen, setIsStaffListOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  
  // Form States
  const [newRes, setNewRes] = useState({ memberId: '', therapistId: '', dateTime: '', serviceType: '' });
  const [newStaff, setNewStaff] = useState({ name: '', specialty: '', phone: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [r, t, m] = await Promise.all([
      dbService.getReservations(),
      dbService.getTherapists(),
      dbService.getAllMembers()
    ]);
    setReservations(r);
    setTherapists(t);
    setMembers(m);
  };

  const hours = Array.from({ length: 14 }, (_, i) => i + 8); 
  const days = ['12. 14. (일)', '12. 15. (월)', '12. 16. (화)', '12. 17. (수)', '12. 18. (목)', '12. 19. (금)', '12. 20. (토)'];

  const handleCreateReservation = async () => {
    if (!newRes.memberId || !newRes.therapistId || !newRes.dateTime || !newRes.serviceType) return alert('모든 필드를 입력하세요.');
    const member = members.find(m => m.id === newRes.memberId);
    const therapist = therapists.find(t => t.id === newRes.therapistId);
    
    await dbService.createReservation({
      memberId: newRes.memberId,
      memberName: member?.name || 'Unknown',
      therapistId: newRes.therapistId,
      therapistName: therapist?.name || 'Unknown',
      dateTime: newRes.dateTime,
      serviceType: newRes.serviceType
    });
    
    alert('새 예약이 등록되었습니다.');
    setIsResModalOpen(false);
    setNewRes({ memberId: '', therapistId: '', dateTime: '', serviceType: '' });
    loadData();
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.specialty) return alert('스탭 정보를 입력하세요.');
    await dbService.addTherapist(newStaff);
    alert('스탭이 추가되었습니다.');
    setIsStaffModalOpen(false);
    setNewStaff({ name: '', specialty: '', phone: '' });
    loadData();
  };

  const handleDeleteStaff = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await dbService.deleteTherapist(id);
      loadData();
    }
  };

  return (
    <div className="p-12 bg-[#FBF9F6] min-h-screen font-sans animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-[32px] p-10 shadow-sm border border-gray-50">
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-2xl font-serif font-bold text-gray-900 uppercase tracking-widest">Reservation Management</h1>
              <p className="text-xs text-gray-400 font-medium">관리자 전용 예약 통합 관리</p>
            </div>
            <div className="flex gap-4">
               <button 
                 onClick={() => setIsStaffListOpen(true)}
                 className="bg-white border border-gray-200 text-gray-600 px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
               >
                  <Users className="w-4 h-4" /> 스탭 관리
               </button>
               <button 
                 onClick={() => setIsResModalOpen(true)}
                 className="bg-[#1A362E] text-white px-8 py-3 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg"
               >
                  <Plus className="w-4 h-4" /> 예약 등록
               </button>
            </div>
          </header>

          <div className="flex justify-between items-center mb-8">
             <div className="flex gap-2">
                <button className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-400"><ChevronLeft className="w-4 h-4"/></button>
                <button className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-400"><ChevronRight className="w-4 h-4"/></button>
             </div>
             <h3 className="text-lg font-serif font-bold text-gray-900 tracking-wider">2025년 12월 3주차</h3>
             <div className="flex bg-gray-50 p-1 rounded-xl">
                <button onClick={() => setView('week')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'week' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>Weekly</button>
                <button onClick={() => setView('list')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>List</button>
             </div>
          </div>

          <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-inner bg-white">
             <div className="grid grid-cols-8 bg-[#FBF9F6]/50 border-b border-gray-100">
                <div className="p-4"></div>
                {days.map(day => <div key={day} className="p-4 text-center border-l border-gray-100 text-[9px] font-black text-gray-900">{day}</div>)}
             </div>
             <div className="h-[500px] overflow-y-auto no-scrollbar">
                {hours.map(hour => (
                   <div key={hour} className="grid grid-cols-8 border-b border-gray-50 min-h-[60px]">
                      <div className="p-4 text-[9px] font-bold text-gray-300 uppercase text-right">
                         {hour < 12 ? `${hour} AM` : hour === 12 ? `12 PM` : `${hour - 12} PM`}
                      </div>
                      {days.map((day, di) => {
                        const cellRes = reservations.filter(r => {
                          const rHour = parseInt(r.dateTime.split('T')[1]?.split(':')[0]);
                          return rHour === hour && di === 4; // Mocking specific column for demo
                        });
                        return (
                          <div key={di} className="border-l border-gray-50 relative p-1">
                            {cellRes.map(res => (
                              <div key={res.id} className="bg-[#3A453F] text-white p-2 rounded-lg text-[8px] font-bold mb-1 truncate shadow-md">
                                {res.memberName} / {res.therapistName}
                              </div>
                            ))}
                          </div>
                        )
                      })}
                   </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Staff List Modal */}
      {isStaffListOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-xl font-serif font-bold text-gray-900 uppercase tracking-widest">Expert Staff</h2>
                 <button onClick={() => setIsStaffListOpen(false)}><X className="w-6 h-6 text-gray-300" /></button>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar mb-8">
                 {therapists.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-hannam-gray-bg rounded-2xl border border-hannam-border group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-hannam-border shadow-sm">
                             <User className="w-5 h-5 text-hannam-gold opacity-50" />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-hannam-text">{t.name}</p>
                             <p className="text-[10px] text-hannam-gold font-medium uppercase tracking-widest">{t.specialty}</p>
                          </div>
                       </div>
                       <button onClick={() => handleDeleteStaff(t.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-300 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                 ))}
                 {therapists.length === 0 && (
                   <p className="text-center py-10 text-gray-300 text-xs italic">등록된 스탭이 없습니다.</p>
                 )}
              </div>
              <button 
                onClick={() => setIsStaffModalOpen(true)}
                className="w-full py-4 bg-hannam-gold text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> New Staff Member
              </button>
           </div>
        </div>
      )}

      {/* New Reservation Modal */}
      {isResModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[40px] p-12 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-serif font-bold text-gray-900 uppercase tracking-wider">New Appointment</h2>
                 <button onClick={() => setIsResModalOpen(false)}><X className="w-6 h-6 text-gray-300" /></button>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Member</label>
                    <select value={newRes.memberId} onChange={e => setNewRes({...newRes, memberId: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs outline-none">
                       <option value="">회원 선택</option>
                       {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Expert (Staff)</label>
                    <select value={newRes.therapistId} onChange={e => setNewRes({...newRes, therapistId: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs outline-none">
                       <option value="">스탭 선택</option>
                       {therapists.map(t => <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Date & Time</label>
                       <input type="datetime-local" value={newRes.dateTime} onChange={e => setNewRes({...newRes, dateTime: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs outline-none" />
                    </div>
                    <div>
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Program</label>
                       <input type="text" placeholder="서비스 항목" value={newRes.serviceType} onChange={e => setNewRes({...newRes, serviceType: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs outline-none" />
                    </div>
                 </div>
                 <button onClick={handleCreateReservation} className="w-full py-5 bg-[#1A362E] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl mt-4">Confirm Reservation</button>
              </div>
           </div>
        </div>
      )}

      {/* New Staff Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[40px] p-12 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-xl font-serif font-bold text-gray-900 uppercase tracking-wider">Expert Registration</h2>
                 <button onClick={() => setIsStaffModalOpen(false)}><X className="w-6 h-6 text-gray-300" /></button>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Name</label>
                    <input type="text" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs outline-none" />
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Specialty</label>
                    <input type="text" placeholder="예: Hydro Specialist" value={newStaff.specialty} onChange={e => setNewStaff({...newStaff, specialty: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs outline-none" />
                 </div>
                 <button onClick={handleAddStaff} className="w-full py-5 bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl mt-4">Add Staff</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
