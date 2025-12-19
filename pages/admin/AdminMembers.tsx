
import React, { useEffect, useState, useRef } from 'react';
import { dbService } from '../../services/dbService';
import { Member } from '../../types';
import { Search, ChevronRight, UserPlus, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminMembers: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = () => { dbService.getAllMembers().then(setMembers); };

  const filteredMembers = members.filter(m => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      m.name.toLowerCase().includes(query) || 
      m.phone.includes(query) || 
      m.email.toLowerCase().includes(query) ||
      m.id.includes(query);
    const matchesTier = tierFilter === 'ALL' || m.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).filter(l => l.trim()).map(l => {
        const v = l.split(',').map(v => v.trim());
        const entry: any = {};
        headers.forEach((h, i) => entry[h] = v[i]);
        return entry;
      });
      const res = await dbService.registerMembersBulk(data);
      alert(`반입 완료 (성공: ${res.successCount}, 제외: ${res.skipCount})`);
      loadMembers();
      setIsBulkModalOpen(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-10 bg-hannam-bg min-h-screen animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-12 border-b border-hannam-border pb-10">
          <div>
            <h1 className="text-2xl font-serif font-medium text-hannam-soft-black uppercase tracking-wider">Member Directory</h1>
            <p className="text-[10px] font-medium text-hannam-gold uppercase tracking-[0.4em] mt-2">Hannam Database Archive</p>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setIsBulkModalOpen(true)} className="btn-secondary px-8 py-4 rounded-xl text-[11px] font-medium uppercase tracking-widest flex items-center gap-3">
                <Upload className="w-4 h-4" /> 일괄 등록
             </button>
             <button onClick={() => navigate('/admin/register')} className="btn-primary px-8 py-4 rounded-xl text-[11px] font-medium uppercase tracking-widest flex items-center gap-3 shadow-sm">
                <UserPlus className="w-4 h-4" /> 회원 등록
             </button>
          </div>
        </header>

        <div className="flex gap-6 mb-10">
           <div className="flex-1 relative">
              <Search className="absolute left-5 top-[15px] w-4 h-4 text-gray-300" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="성함, 연락처, 이메일 통합 검색" 
                className="w-full pl-14 pr-8 py-4 bg-hannam-bg text-[13px] font-medium" 
              />
           </div>
           <select 
             value={tierFilter} 
             onChange={e => setTierFilter(e.target.value)}
             className="px-8 py-4 bg-hannam-bg text-[11px] font-medium text-gray-500 uppercase tracking-widest cursor-pointer"
           >
              <option value="ALL">ALL MEMBERS</option>
              <option value="ROYAL">ROYAL</option>
              <option value="GOLD">GOLD</option>
              <option value="SILVER">SILVER</option>
           </select>
        </div>

        <div className="card-minimal overflow-hidden border-hannam-border">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-hannam-gray-100/50 text-[10px] font-medium text-gray-400 uppercase tracking-widest border-b border-hannam-border">
                    <th className="px-10 py-6">Member Identity</th>
                    <th className="px-10 py-6">Contact Info</th>
                    <th className="px-10 py-6 text-center">Membership Tier</th>
                    <th className="px-10 py-6 text-right">Balance</th>
                    <th className="px-10 py-6 text-right">Profile</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-hannam-border">
                 {filteredMembers.map(member => (
                    <tr key={member.id} onClick={() => navigate(`/admin/member/${member.id}`)} className="group hover:bg-hannam-gray-100/30 cursor-pointer transition-colors">
                       <td className="px-10 py-6 flex items-center gap-5">
                          <div className="w-12 h-12 bg-hannam-dark-green rounded-full flex items-center justify-center text-hannam-bg text-sm font-serif">{member.name[0]}</div>
                          <div>
                             <p className="text-[14px] font-medium text-hannam-soft-black group-hover:text-hannam-gold transition-colors">{member.name}</p>
                             <p className="text-[10px] text-gray-300 font-medium tracking-widest mt-0.5">ID: {member.id}</p>
                          </div>
                       </td>
                       <td className="px-10 py-6 text-[12px] text-gray-500 font-medium num-clean">{member.phone}</td>
                       <td className="px-10 py-6 text-center">
                          <span className={`px-4 py-1.5 rounded-lg text-[9px] font-medium border ${member.tier === 'ROYAL' ? 'bg-hannam-dark-green text-hannam-bg border-transparent' : 'bg-hannam-bg text-gray-400 border-hannam-border'}`}>{member.tier}</span>
                       </td>
                       <td className="px-10 py-6 text-right">
                          <p className="text-[15px] num-clean text-hannam-soft-black">₩ {member.remaining.toLocaleString()}</p>
                       </td>
                       <td className="px-10 py-6 text-right">
                          <ChevronRight className="w-5 h-5 text-hannam-border group-hover:text-hannam-soft-black transition-colors inline" />
                       </td>
                    </tr>
                 ))}
                 {filteredMembers.length === 0 && (
                   <tr>
                     <td colSpan={5} className="py-40 text-center text-gray-300 font-serif italic tracking-widest">검색 결과가 존재하지 않습니다.</td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>

      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-hannam-soft-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-hannam-bg w-full max-w-lg rounded-[40px] p-16 animate-in zoom-in-95 shadow-sm border border-hannam-border">
              <div className="flex justify-between items-center mb-12">
                 <h2 className="text-2xl font-serif font-medium text-hannam-soft-black uppercase tracking-wider">Bulk Database Entry</h2>
                 <button onClick={() => setIsBulkModalOpen(false)}><X className="w-6 h-6 text-gray-300 hover:text-hannam-soft-black transition-colors" /></button>
              </div>
              <div className="p-16 border border-dashed border-hannam-border rounded-[32px] flex flex-col items-center group hover:border-hannam-gold transition-colors">
                 <Upload className="w-10 h-10 text-gray-200 mb-8 group-hover:text-hannam-gold transition-colors" />
                 <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                 <button onClick={() => fileInputRef.current?.click()} className="btn-primary px-12 py-4 rounded-xl text-[11px] font-medium uppercase tracking-widest">CSV 파일 선택</button>
                 <p className="text-[10px] text-gray-300 font-medium mt-6 uppercase tracking-widest">Format: name, phone, email, deposit</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
