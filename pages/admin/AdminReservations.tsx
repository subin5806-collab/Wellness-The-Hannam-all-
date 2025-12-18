
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { Reservation } from '../../types';
import { ChevronLeft, ChevronRight, Plus, List, Calendar as CalIcon, Grid } from 'lucide-react';

export const AdminReservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [view, setView] = useState<'week' | 'list'>('week');
  const [currentDate, setCurrentDate] = useState(new Date('2025-12-18'));

  useEffect(() => {
    dbService.getReservations().then(setReservations);
  }, []);

  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
  const days = ['12. 14. (일)', '12. 15. (월)', '12. 16. (화)', '12. 17. (수)', '12. 18. (목)', '12. 19. (금)', '12. 20. (토)'];

  const resetToToday = () => {
    setCurrentDate(new Date('2025-12-18'));
    alert('오늘 날짜로 이동합니다.');
  };

  const handleNewReservation = () => {
    alert('신규 예약 등록 팝업이 준비 중입니다.');
  };

  return (
    <div className="p-12 bg-[#FBF9F6] min-h-screen font-sans animate-fade-in">
      <div className="max-w-[95%] mx-auto bg-white rounded-[32px] p-10 shadow-sm border border-gray-50">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900">예약 관리 (Reservations)</h1>
            <p className="text-xs text-gray-400 font-medium">예약 현황을 캘린더 또는 리스트로 확인하세요.</p>
          </div>
          <div className="flex items-center gap-4">
             <select className="bg-[#FBF9F6] border border-gray-100 px-4 py-2 rounded-xl text-xs font-bold outline-none cursor-pointer">
                <option>모든 테라피스트</option>
                <option>사라 테라피스트</option>
                <option>김 원장</option>
             </select>
             <button 
               onClick={handleNewReservation}
               className="bg-[#333] text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-black transition-colors"
             >
                <Plus className="w-4 h-4" /> 예약 등록 (New)
             </button>
          </div>
        </header>

        <div className="flex justify-between items-center mb-8">
           <div className="flex gap-2">
              <button className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-400 hover:text-black transition-colors"><ChevronLeft className="w-4 h-4"/></button>
              <button className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-400 hover:text-black transition-colors"><ChevronRight className="w-4 h-4"/></button>
              <button onClick={resetToToday} className="px-4 py-2 bg-gray-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest ml-2 hover:bg-black transition-colors">오늘</button>
           </div>
           <h3 className="text-xl font-serif font-bold text-gray-900">2025년 12월 14일 – 20일</h3>
           <div className="flex bg-gray-50 p-1 rounded-xl">
              <button onClick={() => setView('week')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'week' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>주간</button>
              <button onClick={() => setView('list')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>리스트</button>
           </div>
        </div>

        {/* Weekly Grid */}
        <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-inner bg-white">
           <div className="grid grid-cols-8 bg-[#FBF9F6]/50 border-b border-gray-100">
              <div className="p-4"></div>
              {days.map(day => (
                 <div key={day} className="p-4 text-center border-l border-gray-100 text-[10px] font-black text-gray-900">{day}</div>
              ))}
           </div>
           <div className="h-[600px] overflow-y-auto no-scrollbar">
              {hours.map(hour => (
                 <div key={hour} className="grid grid-cols-8 border-b border-gray-50 min-h-[60px]">
                    <div className="p-4 text-[10px] font-bold text-gray-300 uppercase text-right">
                       {hour < 12 ? `오전 ${hour}시` : hour === 12 ? `오후 12시` : `오후 ${hour - 12}시`}
                    </div>
                    {days.map((day, di) => {
                      const res = reservations.find(r => r.dateTime.includes('12-18') && parseInt(r.dateTime.split('T')[1]) === hour && di === 4);
                      return (
                        <div key={di} className="border-l border-gray-50 relative p-1 group">
                          {res && (
                            <div className="bg-[#3A453F] text-white p-3 rounded-xl shadow-lg border border-black/10 animate-in zoom-in-95 duration-200 cursor-pointer hover:bg-black transition-colors">
                               <p className="text-[8px] font-black text-white/50 mb-1 uppercase tracking-tighter">오후 {hour-12}:00 - {hour-10}:30</p>
                               <p className="text-[10px] font-black mb-0.5">{res.memberName} – {res.serviceType.split(' ')[0]}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
