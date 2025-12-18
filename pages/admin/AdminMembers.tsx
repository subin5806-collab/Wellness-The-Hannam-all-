
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { Member } from '../../types';
import { Search, Filter, ArrowUpDown, ChevronRight, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminMembers: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    dbService.getAllMembers().then(setMembers);
  }, []);

  const filteredMembers = members.filter(m => 
    m.name.includes(searchTerm) || m.phone.includes(searchTerm)
  );

  return (
    <div className="p-12 bg-[#FBF9F6] min-h-screen font-sans animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-3xl font-serif font-medium text-gray-900 mb-2">회원 명부 (Registry)</h1>
          </div>
          <button 
            onClick={() => navigate('/admin/register')}
            className="bg-[#333] text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-black shadow-lg transition-all"
          >
            <UserPlus className="w-4 h-4" /> 신규 등록
          </button>
        </header>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 mb-8">
           <div className="flex-1 relative">
              <Search className="absolute left-4 top-[14px] w-4 h-4 text-gray-300" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="이름 또는 전화번호 검색..." 
                className="w-full pl-12 pr-6 py-3 bg-[#FBF9F6] rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#C9B08F] transition-all" 
              />
           </div>
           <button className="px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-400 flex items-center gap-2 hover:bg-gray-50">
              <Filter className="w-4 h-4" /> 전체 상태
           </button>
           <button className="px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-400 flex items-center gap-2 hover:bg-gray-50">
              <ArrowUpDown className="w-4 h-4" /> 최신 등록순
           </button>
        </div>

        {/* Member Table */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-50 overflow-hidden">
           <table className="w-full text-left">
              <thead>
                 <tr className="border-b border-gray-50 text-[10px] font-black text-gray-300 uppercase tracking-widest bg-[#FBF9F6]/50">
                    <th className="px-10 py-6">회원 정보 (Client)</th>
                    <th className="px-10 py-6">가입일 (Reg. Date)</th>
                    <th className="px-10 py-6 text-center">등급 (Tier)</th>
                    <th className="px-10 py-6 text-center">상태 (Status)</th>
                    <th className="px-10 py-6">잔여 예치금</th>
                    <th className="px-10 py-6 text-right">상세</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {filteredMembers.map(member => (
                    <tr 
                      key={member.id} 
                      onClick={() => navigate(`/admin/member/${member.id}`)}
                      className="group hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                       <td className="px-10 py-8 flex items-center gap-5">
                          <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                             {member.name[0]}
                          </div>
                          <div>
                             <p className="text-lg font-bold text-gray-900">{member.name}</p>
                             <p className="text-xs text-gray-400 font-medium">{member.phone}</p>
                          </div>
                       </td>
                       <td className="px-10 py-8 text-sm font-bold text-gray-400">{member.joinedAt}</td>
                       <td className="px-10 py-8 text-center">
                          <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                             member.tier === 'ROYAL' ? 'bg-gray-800 text-white border-transparent' : 'bg-white text-gray-400 border-gray-200'
                          }`}>
                             {member.tier === 'ROYAL' ? 'Prestige' : member.tier === 'GOLD' ? 'Premium' : 'Standard'}
                          </span>
                       </td>
                       <td className="px-10 py-8 text-center">
                          <span className="px-3 py-1 bg-green-50 text-green-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-green-100">Active</span>
                       </td>
                       <td className="px-10 py-8">
                          <p className="text-lg font-bold text-gray-900">₩{member.remaining.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-300 font-bold">총 ₩{member.deposit.toLocaleString()}</p>
                       </td>
                       <td className="px-10 py-8 text-right">
                          <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-gray-900 transition-colors inline" />
                       </td>
                    </tr>
                 ))}
                 {filteredMembers.length === 0 && (
                   <tr>
                     <td colSpan={6} className="px-10 py-20 text-center text-gray-300 font-bold">검색 결과가 없습니다.</td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};
