
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { Calendar, Clock, AlertCircle, TrendingDown, ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    dbService.getDashboardStats().then(setStats);
    dbService.getReservations().then(res => setReservations(res.filter(r => r.status === 'booked')));
  }, []);

  if (!stats) return <div className="p-20 text-center animate-pulse">데이터 로드 중...</div>;

  const statItems = [
    { label: '금일 예약', value: `${stats.todayReservations}건`, sub: '컨시어지 스케줄', icon: Calendar, color: 'bg-white', path: '/admin/reservations' },
    { label: '서명 대기', value: `${stats.pendingSignatures}건`, sub: '확인 필요', icon: Clock, color: 'bg-white', path: '/admin/members' },
    { label: '미처리 문의', value: `${stats.unprocessedInquiries}건`, sub: '신규 리드', icon: AlertCircle, color: 'bg-red-50', iconColor: 'text-red-400', badge: true, path: '/admin/inquiries' },
    { label: '잔액 부족 주의', value: `${stats.lowBalanceCount}명`, sub: '재결제 유도 필요', icon: TrendingDown, color: 'bg-red-50', iconColor: 'text-red-400', badge: true, path: '/admin/members' },
  ];

  return (
    <div className="p-12 bg-[#FBF9F6] min-h-screen font-sans animate-fade-in">
      <div className="flex justify-between items-end mb-16">
        <div>
          <h1 className="text-4xl font-serif font-medium text-gray-900 mb-2">통합 대시보드</h1>
          <p className="text-sm text-gray-400 font-medium">Wellness, The Hannam 운영 현황</p>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black text-[#C9B08F] uppercase tracking-widest mb-1">Date</p>
           <p className="text-lg font-bold text-gray-900">2025년 12월 18일 목요일</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        {statItems.map((item, i) => (
          <div 
            key={i} 
            onClick={() => navigate(item.path)}
            className={`${item.color} p-8 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between h-48 relative group hover:shadow-md hover:scale-[1.02] cursor-pointer transition-all`}
          >
            {item.badge && <div className="absolute top-6 right-6 w-2 h-2 bg-red-500 rounded-full" />}
            <div className={`w-12 h-12 ${item.iconColor || 'text-gray-300'} bg-gray-50 rounded-xl flex items-center justify-center`}>
               <item.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
              <h3 className="text-3xl font-bold text-gray-900 leading-none">{item.value}</h3>
              <p className="text-[10px] text-gray-300 font-medium mt-2">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-7 bg-white p-10 rounded-[32px] shadow-sm border border-gray-50">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-bold text-gray-900">금일 컨시어지 스케줄</h3>
            <span className="text-xs text-gray-400 font-medium">2025-12-18</span>
          </div>
          <div className="space-y-4">
             {reservations.map(res => (
               <div 
                 key={res.id} 
                 onClick={() => navigate(`/admin/care-session/${res.id}`)}
                 className="flex items-center gap-6 p-6 bg-[#FBF9F6] rounded-2xl border border-gray-100 hover:border-[#C9B08F] cursor-pointer transition-all group"
               >
                 <div className="w-20 text-center border-r border-gray-200 pr-6">
                    <p className="text-sm font-bold text-gray-900">{res.dateTime.split('T')[1].substring(0, 5)}</p>
                    <p className="text-[10px] text-gray-300 font-black uppercase">Time</p>
                 </div>
                 <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-0.5">{res.memberName}</h4>
                    <p className="text-xs text-gray-400 font-medium">{res.serviceType} / {res.therapistName}</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-400 text-[9px] font-black uppercase tracking-widest rounded-lg">confirmed</span>
                    <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-gray-900 transition-colors" />
                 </div>
               </div>
             ))}
          </div>
        </div>

        <div className="col-span-5 space-y-8">
           <div className="bg-white p-10 rounded-[32px] shadow-sm border border-gray-50">
              <div className="flex items-center gap-3 mb-8">
                 <AlertCircle className="w-5 h-5 text-orange-400" />
                 <h3 className="text-lg font-bold text-gray-900">잔액 부족 회원 ({stats.lowBalanceCount})</h3>
              </div>
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-gray-50 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                       <th className="pb-4 font-black">회원명</th>
                       <th className="pb-4 font-black text-center">현재 잔액</th>
                       <th className="pb-4 font-black text-right">상태</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {stats.lowBalanceMembers.map((m: any) => (
                       <tr key={m.id} onClick={() => navigate(`/admin/member/${m.id}`)} className="text-sm hover:bg-gray-50 cursor-pointer transition-colors">
                          <td className="py-4 font-bold text-gray-900">{m.name}</td>
                          <td className="py-4 font-bold text-red-500 text-center">₩{m.remaining.toLocaleString()}</td>
                          <td className="py-4 text-right">
                             <span className="px-2 py-0.5 bg-red-50 text-red-400 text-[9px] font-black uppercase rounded">충전 필요</span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           <div className="bg-white p-10 rounded-[32px] shadow-sm border border-gray-50">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-lg font-bold text-gray-900">미처리 문의</h3>
                 <button onClick={() => navigate('/admin/inquiries')} className="text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-widest">전체 보기</button>
              </div>
              <div className="space-y-6">
                 {stats.recentInquiries.map((inq: any) => (
                    <div key={inq.id} onClick={() => navigate('/admin/inquiries')} className="group cursor-pointer">
                       <div className="flex justify-between items-start mb-1">
                          <h5 className="text-sm font-bold text-gray-900 group-hover:text-[#C9B08F] transition-colors">{inq.memberName}</h5>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[8px] font-black uppercase rounded">New</span>
                       </div>
                       <p className="text-[10px] text-gray-300 font-medium">{inq.createdAt}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
