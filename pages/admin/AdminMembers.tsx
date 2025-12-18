
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
    <div className="p-10 bg-[#FDFDFD] min-h-screen font-sans animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-10 border-b border-gray-50 pb-8">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">Member Registry</h1>
            <p className="text-[10px] font-black text-[#C9B08F] uppercase tracking-[0.4em] mt-1">Hannam Wellness Professional Network</p>
          </div>
          <button 
            onClick={() => navigate('/admin/register')}
            className="bg-[#1A1A1A] text-white px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" /> 신규 등록
          </button>
        </header>

        {/* Filter Bar - Compact */}
        <div className="flex gap-4 mb-8">
           <div className="flex-1 relative">
              <Search className="absolute left-4 top-[14px] w-3.5 h-3.5 text-gray-300" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Name or Phone Number..." 
                className="w-full pl-10 pr-6 py-3 bg-white border border-gray-100 rounded-lg text-[12px] font-bold outline-none focus:border-[#C9B08F] transition-all" 
              />
           </div>
           <button className="px-6 py-3 bg-white border border-gray-100 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 hover:border-[#C9B08F] transition-all">
              <Filter className="w-3 h-3" /> Status
           </button>
           <button className="px-6 py-3 bg-white border border-gray-100 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 hover:border-[#C9B08F] transition-all">
              <ArrowUpDown className="w-3 h-3" /> Sort By
           </button>
        </div>

        {/* Member Table - Professional */}
        <div className="card-minimal overflow-hidden">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-[#FBFBFB] text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] border-b border-gray-100">
                    <th className="px-8 py-5">Profile</th>
                    <th className="px-8 py-5">Reg. Date</th>
                    <th className="px-8 py-5 text-center">Tier</th>
                    <th className="px-8 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-right">Balance</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {filteredMembers.map(member => (
                    <tr 
                      key={member.id} 
                      onClick={() => navigate(`/admin/member/${member.id}`)}
                      className="group hover:bg-[#FDFDFD] cursor-pointer transition-colors"
                    >
                       <td className="px-8 py-5 flex items-center gap-4">
                          <div className="w-10 h-10 bg-hannam-green rounded-full flex items-center justify-center text-white text-xs font-serif font-bold">
                             {member.name[0]}
                          </div>
                          <div>
                             <p className="text-[13px] font-bold text-[#1A1A1A] group-hover:text-[#C9B08F] transition-colors">{member.name}</p>
                             <p className="text-[10px] text-gray-300 num-clean tracking-tighter">{member.phone}</p>
                          </div>
                       </td>
                       <td className="px-8 py-5 text-[12px] num-clean text-gray-400">{member.joinedAt}</td>
                       <td className="px-8 py-5 text-center">
                          <span className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                             member.tier === 'ROYAL' ? 'bg-[#1A1A1A] text-white border-transparent' : 'bg-white text-gray-300 border-gray-100'
                          }`}>
                             {member.tier}
                          </span>
                       </td>
                       <td className="px-8 py-5 text-center">
                          <span className="text-[9px] font-black text-[#27AE60] uppercase tracking-widest">Active</span>
                       </td>
                       <td className="px-8 py-5 text-right">
                          <p className="text-[14px] num-clean text-[#1A1A1A]">₩{member.remaining.toLocaleString()}</p>
                       </td>
                       <td className="px-8 py-5 text-right">
                          <ChevronRight className="w-4 h-4 text-gray-100 group-hover:text-[#1A1A1A] transition-colors inline" />
                       </td>
                    </tr>
                 ))}
                 {filteredMembers.length === 0 && (
                   <tr>
                     <td colSpan={6} className="px-10 py-20 text-center text-[11px] text-gray-300 italic font-medium uppercase tracking-widest">No matching results in registry.</td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};
