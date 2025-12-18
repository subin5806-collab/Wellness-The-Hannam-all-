
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { Inquiry } from '../../types';
import { Search, Plus, Calendar } from 'lucide-react';

export const AdminInquiries: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    dbService.getInquiries().then(setInquiries);
  }, []);

  const filteredInquiries = inquiries.filter(i => {
    const matchesSearch = i.memberName.includes(searchTerm) || i.content.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-12 bg-[#FBF9F6] min-h-screen font-sans animate-fade-in flex flex-col">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-12 gap-8">
         {/* Top Stats */}
         <div className="col-span-3 bg-[#3A453F] text-white p-10 rounded-[32px] shadow-xl relative overflow-hidden group">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Total Inquiries</p>
            <h3 className="text-5xl font-serif font-bold mb-8">{inquiries.length}건</h3>
            <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black">+0 (전월 대비)</span>
         </div>
         <div className="col-span-6 bg-white p-10 rounded-[32px] border border-gray-50 shadow-sm">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">Channel Breakdown</p>
            <div className="flex justify-between items-end h-24 pb-2">
               {['Call', 'Web', 'Visit', 'SNS'].map((c, i) => (
                 <div key={c} className="flex flex-col items-center gap-2">
                    <div className="w-8 bg-[#FBF9F6] rounded-t-lg transition-all hover:bg-[#C9B08F]" style={{height: `${30 + (i*15)}%`}} />
                    <span className="text-[8px] font-black text-gray-300 uppercase">{c}</span>
                 </div>
               ))}
            </div>
         </div>
         <div className="col-span-3 bg-white p-10 rounded-[32px] border border-gray-50 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</span>
            </div>
            <div className="space-y-3">
               <div className="flex justify-between text-xs font-bold"><span>신규 (New)</span><span>{inquiries.filter(i => i.status === 'new').length}</span></div>
               <div className="flex justify-between text-xs font-bold text-gray-300"><span>진행 중</span><span>0</span></div>
               <div className="flex justify-between text-xs font-bold text-gray-300"><span>예약 완료</span><span>0</span></div>
            </div>
         </div>

         {/* Main List */}
         <div className="col-span-8 bg-white rounded-[32px] shadow-sm border border-gray-50 overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-6 border-b border-gray-50 flex gap-4 items-center bg-[#FBF9F6]/30">
               <div className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-300" /> 2025년 12월
               </div>
               <div className="flex-1 relative">
                  <Search className="absolute left-4 top-[14px] w-4 h-4 text-gray-300" />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="이름, 번호, 내용 검색..." 
                    className="w-full pl-12 pr-6 py-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-black transition-all" 
                  />
               </div>
               <select 
                 value={statusFilter}
                 onChange={e => setStatusFilter(e.target.value)}
                 className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none cursor-pointer"
               >
                 <option value="all">모든 상태</option>
                 <option value="new">신규 (New)</option>
                 <option value="replied">처리 완료</option>
               </select>
               <button className="bg-[#333] text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-black transition-all"><Plus className="w-4 h-4"/> 문의 등록</button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto no-scrollbar">
               {filteredInquiries.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-20 text-center">
                    <p className="text-gray-300 font-bold italic">검색 결과가 없습니다.</p>
                  </div>
               ) : (
                  <table className="w-full text-left">
                     <thead className="text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                        <tr>
                           <th className="px-6 py-4">이름/정보</th>
                           <th className="px-6 py-4">문의 내용</th>
                           <th className="px-6 py-4 text-center">상태</th>
                           <th className="px-6 py-4 text-right">날짜</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {filteredInquiries.map(inq => (
                           <tr key={inq.id} className="text-xs hover:bg-gray-50 cursor-pointer group transition-colors">
                              <td className="px-6 py-6 font-bold text-gray-900">{inq.memberName}</td>
                              <td className="px-6 py-6 text-gray-500 font-medium max-w-xs truncate">{inq.content}</td>
                              <td className="px-6 py-6 text-center">
                                 <span className={`px-2 py-0.5 rounded uppercase text-[8px] font-black border ${inq.status === 'new' ? 'bg-red-50 text-red-400 border-red-100' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                   {inq.status}
                                 </span>
                              </td>
                              <td className="px-6 py-6 text-gray-300 font-bold text-right">{inq.createdAt}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               )}
            </div>
         </div>

         {/* Detail Sidebar */}
         <div className="col-span-4 bg-white rounded-[32px] border border-gray-50 shadow-sm p-12 flex flex-col items-center justify-center text-center gap-6">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
               <Search className="w-8 h-8" />
            </div>
            <p className="text-xs text-gray-300 font-medium leading-relaxed max-w-[180px]">좌측 리스트에서 문의를 선택하거나 신규 등록 버튼을 눌러주세요.</p>
         </div>
      </div>
    </div>
  );
};
