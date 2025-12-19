
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { Calendar, Clock, AlertCircle, TrendingDown, ChevronRight, User } from 'lucide-react';
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
      <div className="font-serif text-hannam-gold tracking-[0.4em] uppercase animate-pulse text-[12px]">Hannam Intelligence System Loading...</div>
    </div>
  );

  const statItems = [
    { label: '당일 예약 현황', value: stats.todayReservations || 0, unit: '건', icon: Calendar, path: '/admin/reservations' },
    { label: '서명 대기 세션', value: stats.pendingSignatures || 0, unit: '건', icon: Clock, path: '/admin/members' },
    { label: '신규 문의 사항', value: stats.unprocessedInquiries || 0, unit: '건', icon: AlertCircle, color: (stats.unprocessedInquiries || 0) > 0 ? 'text-red-500' : 'text-hannam-text', path: '/admin/inquiries' },
    { label: '잔액 부족 회원', value: stats.lowBalanceCount || 0, unit: '명', icon: TrendingDown, color: (stats.lowBalanceCount || 0) > 0 ? 'text-red-500' : 'text-hannam-text', path: '/admin/members' },
  ];

  return (
    <div className="p-10 bg-hannam-bg min-h-screen animate-fade-in">
      {/* Dashboard Header */}
      <div className="flex justify-between items-end mb-12 max-w-7xl mx-auto border-b border-hannam-border pb-8">
        <div>
          <h1 className="text-2xl font-serif font-medium text-hannam-green uppercase tracking-wider">Administration Dashboard</h1>
          <p className="text-[10px] font-medium text-hannam-gold uppercase tracking-[0.4em] mt-2">Intelligence Center Management</p>
        </div>
        <div className="flex items-center gap-4 text-[12px] font-medium text-hannam-subtext">
          <Calendar className="w-4 h-4 text-hannam-gold opacity-50" />
          <span className="num-clean">{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          {statItems.map((item, i) => (
            <div 
              key={i} 
              onClick={() => navigate(item.path)}
              className="card-minimal p-6 flex flex-col justify-between h-[140px] cursor-pointer group hover:border-hannam-gold"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-hannam-subtext uppercase tracking-widest">{item.label}</span>
                <item.icon className="w-5 h-5 text-hannam-gold opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className={`text-4xl num-clean ${item.color || 'text-hannam-text'}`}>{item.value}</h3>
                <span className="text-[10px] font-bold text-hannam-subtext uppercase tracking-widest">{item.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Content Area - Schedule */}
          <div className="col-span-8 card-minimal p-10">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                 <div className="w-1 h-6 bg-hannam-gold rounded-full" />
                 <h3 className="text-lg font-serif text-hannam-green uppercase tracking-widest">실시간 센터 예약 현황</h3>
              </div>
              <button onClick={() => navigate('/admin/reservations')} className="text-[10px] text-hannam-subtext hover:text-hannam-text font-bold uppercase tracking-widest transition-colors flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="space-y-3">
               {reservations && reservations.length > 0 ? reservations.slice(0, 6).map(res => (
                 <div 
                   key={res.id} 
                   onClick={() => navigate(`/admin/care-session/${res.id}`)}
                   className="flex items-center gap-8 p-5 rounded-xl bg-hannam-gray-bg hover:bg-white hover:border-hannam-gold border border-transparent transition-all cursor-pointer group"
                 >
                   <div className="w-20 text-center border-r border-hannam-border pr-8">
                      <p className="text-[15px] num-clean font-medium text-hannam-text">{res.dateTime?.split('T')[1]?.substring(0, 5) || '--:--'}</p>
                   </div>
                   <div className="flex-1 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-bold text-hannam-text">{res.memberName} 회원님</h4>
                        <p className="text-[11px] text-hannam-subtext mt-1">{res.serviceType}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-medium text-hannam-subtext">
                        <User className="w-3 h-3 opacity-30" /> {res.therapistName}
                      </div>
                   </div>
                   <ChevronRight className="w-4 h-4 text-hannam-border group-hover:text-hannam-gold transition-colors" />
                 </div>
               )) : <div className="py-32 text-center text-hannam-subtext font-serif italic text-sm border border-dashed border-hannam-border rounded-xl">등록된 오늘 일정이 없습니다.</div>}
            </div>
          </div>

          {/* Sidebar Area - Insights */}
          <div className="col-span-4 space-y-8">
             <div className="card-minimal p-8">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-1 h-4 bg-hannam-gold rounded-full" />
                   <h3 className="text-[11px] font-bold text-hannam-green uppercase tracking-widest">잔액 관리 대상</h3>
                </div>
                <div className="space-y-4">
                   {stats.lowBalanceMembers && stats.lowBalanceMembers.slice(0, 5).map((m: any) => (
                      <div key={m.id} onClick={() => navigate(`/admin/member/${m.id}`)} className="flex justify-between items-center group cursor-pointer border-b border-hannam-border pb-4 last:border-0 last:pb-0 hover:border-hannam-gold transition-colors">
                         <div className="flex flex-col">
                            <p className="text-[13px] font-bold text-hannam-text">{m.name}</p>
                            <span className="text-[9px] text-hannam-subtext uppercase tracking-widest">{m.tier} Member</span>
                         </div>
                         <p className="text-[14px] num-clean font-medium text-red-500">₩{m.remaining?.toLocaleString() || '0'}</p>
                      </div>
                   ))}
                   {(!stats.lowBalanceMembers || stats.lowBalanceMembers.length === 0) && (
                     <p className="text-center text-[11px] text-hannam-subtext py-10 italic">관리 대상자가 없습니다.</p>
                   )}
                </div>
             </div>

             <div className="card-minimal p-8">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-1 h-4 bg-hannam-gold rounded-full" />
                   <h3 className="text-[11px] font-bold text-hannam-green uppercase tracking-widest">신규 문의 사항</h3>
                </div>
                <div className="space-y-5">
                   {stats.recentInquiries && stats.recentInquiries.slice(0, 3).map((inq: any) => (
                      <div key={inq.id} className="border-b border-hannam-border pb-5 last:border-0 last:pb-0">
                         <div className="flex justify-between items-center mb-2">
                            <p className="text-[13px] font-bold text-hannam-text">{inq.memberName}</p>
                            <span className="text-[9px] font-bold text-hannam-gold uppercase border border-hannam-gold px-2 py-0.5 rounded">NEW</span>
                         </div>
                         <p className="text-[11px] text-hannam-subtext line-clamp-2 leading-relaxed font-medium">{inq.content}</p>
                      </div>
                   ))}
                   {(!stats.recentInquiries || stats.recentInquiries.length === 0) && (
                     <p className="text-center text-[11px] text-hannam-subtext py-10 italic">새로운 문의가 없습니다.</p>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
