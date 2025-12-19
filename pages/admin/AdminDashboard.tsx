
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
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
      <div className="font-serif text-gray-300 tracking-[0.3em] uppercase animate-pulse text-[10px]">Intelligence Loading...</div>
    </div>
  );

  const statItems = [
    { label: 'Reservations', value: stats.todayReservations, unit: 'SES', icon: Calendar, path: '/admin/reservations' },
    { label: 'Pending Sign', value: stats.pendingSignatures, unit: 'WAI', icon: Clock, path: '/admin/members' },
    { label: 'New Inquiries', value: stats.unprocessedInquiries, unit: 'NEW', icon: AlertCircle, color: stats.unprocessedInquiries > 0 ? 'text-red-500' : 'text-gray-900', path: '/admin/inquiries' },
    { label: 'Low Balance', value: stats.lowBalanceCount, unit: 'MEM', icon: TrendingDown, color: stats.lowBalanceCount > 0 ? 'text-red-500' : 'text-gray-900', path: '/admin/members' },
  ];

  return (
    <div className="p-8 bg-[#FDFDFD] min-h-screen font-sans animate-fade-in">
      <div className="flex justify-between items-end mb-8 max-w-6xl mx-auto border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-xl font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">Dashboard</h1>
          <p className="text-[8px] font-black text-[#C9B08F] uppercase tracking-[0.4em] mt-1">Hannam Intelligence System</p>
        </div>
        <p className="text-[11px] num-clean text-gray-400">2025. 12. 18</p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {statItems.map((item, i) => (
            <div 
              key={i} 
              onClick={() => navigate(item.path)}
              className="card-minimal p-4 flex flex-col justify-between h-[100px] cursor-pointer group"
            >
              <div className="flex justify-between items-start">
                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{item.label}</span>
                <item.icon className="w-3 h-3 text-gray-200 group-hover:text-[#C9B08F] transition-colors" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <h3 className={`text-3xl num-clean ${item.color || 'text-gray-900'}`}>{item.value}</h3>
                <span className="text-[7px] font-black text-gray-200 uppercase">{item.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 card-minimal p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black text-[#1A1A1A] border-l-2 border-[#C9B08F] pl-3 uppercase tracking-widest">Today's Schedule</h3>
              <button onClick={() => navigate('/admin/reservations')} className="text-[8px] text-gray-300 hover:text-[#1A1A1A] font-black uppercase tracking-widest">View All</button>
            </div>
            <div className="space-y-1">
               {reservations.length > 0 ? reservations.slice(0, 5).map(res => (
                 <div 
                   key={res.id} 
                   onClick={() => navigate(`/admin/care-session/${res.id}`)}
                   className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#FBFBFB] transition-all cursor-pointer group border border-transparent hover:border-gray-100"
                 >
                   <div className="w-12 text-center border-r border-gray-100 pr-3">
                      <p className="text-[11px] num-clean text-[#1A1A1A]">{res.dateTime.split('T')[1].substring(0, 5)}</p>
                   </div>
                   <div className="flex-1">
                      <h4 className="text-[12px] font-bold text-[#1A1A1A]">{res.memberName}</h4>
                      <p className="text-[9px] text-gray-400 font-medium">{res.serviceType}</p>
                   </div>
                   <ChevronRight className="w-3 h-3 text-gray-100 group-hover:text-[#C9B08F] transition-colors" />
                 </div>
               )) : <p className="text-center py-16 text-[10px] text-gray-300 font-medium">No schedules today.</p>}
            </div>
          </div>

          <div className="col-span-4 space-y-5">
             <div className="card-minimal p-5">
                <h3 className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-5">Low Balance</h3>
                <div className="space-y-3">
                   {stats.lowBalanceMembers.slice(0, 3).map((m: any) => (
                      <div key={m.id} onClick={() => navigate(`/admin/member/${m.id}`)} className="flex justify-between items-center group cursor-pointer border-b border-gray-50 pb-2 last:border-0">
                         <div>
                            <p className="text-[11px] font-bold text-gray-800 group-hover:text-hannam-gold">{m.name}</p>
                         </div>
                         <p className="text-[11px] num-clean text-red-500">₩{m.remaining.toLocaleString()}</p>
                      </div>
                   ))}
                </div>
             </div>

             <div className="card-minimal p-5">
                <h3 className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-5">Recent Inquiries</h3>
                <div className="space-y-3">
                   {stats.recentInquiries.slice(0, 2).map((inq: any) => (
                      <div key={inq.id} className="border-b border-gray-50 pb-2 last:border-0">
                         <div className="flex justify-between items-center mb-1">
                            <p className="text-[11px] font-bold text-gray-800">{inq.memberName}</p>
                            <span className="text-[7px] font-black text-hannam-gold uppercase">New</span>
                         </div>
                         <p className="text-[9px] text-gray-400 line-clamp-1 font-medium leading-relaxed">{inq.content}</p>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
