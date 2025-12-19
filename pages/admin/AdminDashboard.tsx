
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { Calendar, Clock, AlertCircle, TrendingDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    dbService.getDashboardStats().then(setStats);
    dbService.getReservations().then(res => setReservations(res.filter(r => r.status === 'booked')));
  }, []);

  if (!stats) return (
    <div className="min-h-screen flex items-center justify-center bg-hannam-bg">
      <div className="font-serif text-hannam-gold tracking-[0.4em] uppercase animate-pulse text-[11px]">Intelligence System Loading...</div>
    </div>
  );

  const statItems = [
    { label: '당일 예약 현황', value: stats.todayReservations || 0, unit: '건', icon: Calendar, path: '/admin/reservations' },
    { label: '서명 대기 세션', value: stats.pendingSignatures || 0, unit: '건', icon: Clock, path: '/admin/members' },
    { label: '신규 문의 사항', value: stats.unprocessedInquiries || 0, unit: '건', icon: AlertCircle, color: (stats.unprocessedInquiries || 0) > 0 ? 'text-red-400' : 'text-hannam-soft-black', path: '/admin/inquiries' },
    { label: '잔액 부족 회원', value: stats.lowBalanceCount || 0, unit: '명', icon: TrendingDown, color: (stats.lowBalanceCount || 0) > 0 ? 'text-red-400' : 'text-hannam-soft-black', path: '/admin/members' },
  ];

  return (
    <div className="p-10 bg-hannam-bg min-h-screen animate-fade-in">
      <div className="flex justify-between items-end mb-10 max-w-6xl mx-auto border-b border-hannam-border pb-8">
        <div>
          <h1 className="text-2xl font-serif font-medium text-hannam-soft-black uppercase tracking-wider">Dashboard</h1>
          <p className="text-[10px] font-medium text-hannam-gold uppercase tracking-[0.3em] mt-2">Hannam Wellness Intelligence</p>
        </div>
        <p className="text-[12px] num-clean text-gray-400">{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-4 gap-6 mb-10">
          {statItems.map((item, i) => (
            <div 
              key={i} 
              onClick={() => navigate(item.path)}
              className="card-minimal p-6 flex flex-col justify-between h-[120px] cursor-pointer group"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{item.label}</span>
                <item.icon className="w-4 h-4 text-gray-300 group-hover:text-hannam-gold transition-colors" />
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className={`text-3xl num-clean ${item.color || 'text-hannam-soft-black'}`}>{item.value}</h3>
                <span className="text-[9px] font-medium text-gray-300 uppercase">{item.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 card-minimal p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[11px] font-medium text-hannam-soft-black border-l-2 border-hannam-gold pl-4 uppercase tracking-widest">실시간 스케줄</h3>
              <button onClick={() => navigate('/admin/reservations')} className="text-[9px] text-gray-400 hover:text-hannam-soft-black font-medium uppercase tracking-widest transition-colors">전체 일정 보기</button>
            </div>
            <div className="space-y-2">
               {reservations && reservations.length > 0 ? reservations.slice(0, 6).map(res => (
                 <div 
                   key={res.id} 
                   onClick={() => navigate(`/admin/care-session/${res.id}`)}
                   className="flex items-center gap-6 p-4 rounded-xl hover:bg-hannam-gray-100 transition-all cursor-pointer group border border-transparent"
                 >
                   <div className="w-16 text-center border-r border-hannam-border pr-6">
                      <p className="text-[13px] num-clean text-hannam-soft-black">{res.dateTime?.split('T')[1]?.substring(0, 5) || '--:--'}</p>
                   </div>
                   <div className="flex-1">
                      <h4 className="text-[13px] font-medium text-hannam-soft-black">{res.memberName} 회원님</h4>
                      <p className="text-[10px] text-gray-400 mt-1">{res.serviceType}</p>
                   </div>
                   <ChevronRight className="w-4 h-4 text-hannam-border group-hover:text-hannam-gold transition-colors" />
                 </div>
               )) : <p className="text-center py-24 text-[11px] text-gray-300 font-medium italic">등록된 오늘 일정이 없습니다.</p>}
            </div>
          </div>

          <div className="col-span-4 space-y-6">
             <div className="card-minimal p-6">
                <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-6">잔액 관리가 필요한 회원</h3>
                <div className="space-y-4">
                   {stats.lowBalanceMembers && stats.lowBalanceMembers.slice(0, 4).map((m: any) => (
                      <div key={m.id} onClick={() => navigate(`/admin/member/${m.id}`)} className="flex justify-between items-center group cursor-pointer border-b border-hannam-border pb-3 last:border-0 last:pb-0">
                         <div>
                            <p className="text-[12px] font-medium text-hannam-soft-black group-hover:text-hannam-gold transition-colors">{m.name}</p>
                         </div>
                         <p className="text-[12px] num-clean text-red-400">₩{m.remaining?.toLocaleString() || '0'}</p>
                      </div>
                   ))}
                   {(!stats.lowBalanceMembers || stats.lowBalanceMembers.length === 0) && (
                     <p className="text-center text-[10px] text-gray-300 py-6 italic">대상자가 없습니다.</p>
                   )}
                </div>
             </div>

             <div className="card-minimal p-6">
                <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-6">최근 문의 내역</h3>
                <div className="space-y-4">
                   {stats.recentInquiries && stats.recentInquiries.slice(0, 3).map((inq: any) => (
                      <div key={inq.id} className="border-b border-hannam-border pb-3 last:border-0 last:pb-0">
                         <div className="flex justify-between items-center mb-2">
                            <p className="text-[12px] font-medium text-hannam-soft-black">{inq.memberName}</p>
                            <span className="text-[8px] font-medium text-hannam-gold uppercase border border-hannam-gold px-1.5 py-0.5 rounded">New</span>
                         </div>
                         <p className="text-[11px] text-gray-400 line-clamp-1 leading-relaxed">{inq.content}</p>
                      </div>
                   ))}
                   {(!stats.recentInquiries || stats.recentInquiries.length === 0) && (
                     <p className="text-center text-[10px] text-gray-300 py-6 italic">새로운 문의가 없습니다.</p>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
