
import React, { useEffect, useState, useRef } from 'react';
import { dbService } from '../../services/dbService';
import { Member } from '../../types';
import { Search, ChevronRight, UserPlus, Upload, X, Save, Download, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_UI } from '../../constants/adminLocale';

export const AdminMembers: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
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
    
    let matchesStatus = true;
    if (statusFilter === 'LOW_BALANCE') {
      matchesStatus = m.remaining <= 500000;
    } else if (statusFilter === 'EXPIRING_SOON') {
      if (!m.expiryDate) {
        matchesStatus = false;
      } else {
        const expiry = new Date(m.expiryDate);
        const today = new Date();
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        matchesStatus = diffDays >= 0 && diffDays <= 30;
      }
    }

    return matchesSearch && matchesTier && matchesStatus;
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
      alert(`일괄 등록이 완료되었습니다.`);
      loadMembers();
      setIsBulkModalOpen(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-10 bg-hannam-bg min-h-screen animate-fade-up">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-12 border-b border-hannam-border pb-10">
          <div>
            <h1 className="text-3xl font-serif font-bold text-hannam-green tracking-tight">{ADMIN_UI.members.title}</h1>
            <p className="text-[10px] font-bold text-hannam-gold uppercase tracking-luxury mt-2">{ADMIN_UI.members.subtitle}</p>
          </div>
          <div className="flex gap-3">
             <button onClick={() => dbService.exportMembersToCSV()} className="bg-white border border-hannam-border text-hannam-muted px-6 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-hannam-bg transition-all">
                <Download className="w-4 h-4" /> {ADMIN_UI.members.actions.csv}
             </button>
             <button onClick={() => dbService.backupAllData()} className="bg-white border border-hannam-border text-hannam-muted px-6 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-hannam-bg transition-all">
                <Save className="w-4 h-4" /> {ADMIN_UI.members.actions.backup}
             </button>
             <button onClick={() => setIsBulkModalOpen(true)} className="bg-white border border-hannam-border text-hannam-muted px-6 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-hannam-bg transition-all">
                <Upload className="w-4 h-4" /> {ADMIN_UI.members.actions.bulk}
             </button>
             <button onClick={() => navigate('/admin/register')} className="btn-hannam-primary px-8 py-3.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg">
                <UserPlus className="w-4 h-4" /> {ADMIN_UI.members.actions.register}
             </button>
          </div>
        </header>

        <div className="flex gap-4 mb-8">
           <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-hannam-muted opacity-50" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={ADMIN_UI.members.filters.searchPlaceholder} 
                className="w-full pl-14 pr-8 py-4 bg-white rounded-2xl text-sm font-medium outline-none border border-hannam-border shadow-hannam-soft focus:border-hannam-gold transition-all" 
              />
           </div>
           
           <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-2xl border border-hannam-border shadow-hannam-soft">
              <Filter className="w-3.5 h-3.5 text-hannam-muted" />
              <select 
                value={tierFilter} 
                onChange={e => setTierFilter(e.target.value)}
                className="bg-transparent text-[10px] font-bold text-hannam-muted uppercase tracking-widest outline-none cursor-pointer"
              >
                 <option value="ALL">{ADMIN_UI.members.filters.allTiers}</option>
                 <option value="ROYAL">ROYAL</option>
                 <option value="GOLD">GOLD</option>
                 <option value="SILVER">SILVER</option>
              </select>
           </div>
        </div>

        <div className="card-premium overflow-hidden">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-hannam-bg/50 text-[9px] font-bold text-hannam-muted uppercase tracking-widest border-b border-hannam-border">
                    <th className="px-10 py-6">{ADMIN_UI.members.table.identity}</th>
                    <th className="px-10 py-6">{ADMIN_UI.members.table.contact}</th>
                    <th className="px-10 py-6 text-center">{ADMIN_UI.members.table.membership}</th>
                    <th className="px-10 py-6 text-right">{ADMIN_UI.members.table.balance}</th>
                    <th className="px-10 py-6 text-right"></th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-hannam-border">
                 {filteredMembers.map(member => (
                    <tr key={member.id} onClick={() => navigate(`/admin/member/${member.id}`)} className="group hover:bg-hannam-bg cursor-pointer transition-colors">
                       <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-hannam-green rounded-xl flex items-center justify-center text-white text-[11px] font-serif shadow-sm">
                              {member.name[0]}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-hannam-text group-hover:text-hannam-green transition-colors">{member.name}</p>
                               <p className="text-[9px] text-hannam-muted font-bold tracking-luxury uppercase mt-0.5">#{member.id.slice(-6)}</p>
                            </div>
                          </div>
                       </td>
                       <td className="px-10 py-6 text-xs text-hannam-muted font-medium num-data">{member.phone}</td>
                       <td className="px-10 py-6 text-center">
                          <span className={`px-4 py-1 rounded-lg text-[9px] font-bold border transition-all ${member.tier === 'ROYAL' ? 'bg-hannam-green text-white border-transparent' : 'bg-white text-hannam-muted border-hannam-border'}`}>{member.tier}</span>
                       </td>
                       <td className="px-10 py-6 text-right">
                          <p className={`text-sm num-data font-bold ${member.remaining <= 500000 ? 'text-red-500' : 'text-hannam-text'}`}>₩ {member.remaining.toLocaleString()}</p>
                          <p className="text-[9px] text-hannam-muted font-bold uppercase tracking-luxury mt-0.5">만료일: {member.expiryDate || 'N/A'}</p>
                       </td>
                       <td className="px-10 py-6 text-right">
                          <ChevronRight className="w-4 h-4 text-hannam-border group-hover:text-hannam-gold transition-colors inline" />
                       </td>
                    </tr>
                 ))}
                 {filteredMembers.length === 0 && (
                   <tr>
                     <td colSpan={5} className="py-40 text-center text-hannam-muted font-serif italic tracking-luxury uppercase">데이터가 없습니다.</td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>

      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-hannam-text/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[40px] p-16 animate-fade-up shadow-hannam-deep">
              <div className="flex justify-between items-center mb-12">
                 <h2 className="text-2xl font-serif font-bold text-hannam-green uppercase tracking-wide">일괄 등록</h2>
                 <button onClick={() => setIsBulkModalOpen(false)}><X className="w-6 h-6 text-hannam-border" /></button>
              </div>
              <div className="p-16 border-2 border-dashed border-hannam-border rounded-[32px] flex flex-col items-center group hover:border-hannam-gold transition-colors">
                 <Upload className="w-10 h-10 text-hannam-border mb-8 group-hover:text-hannam-gold transition-colors" />
                 <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                 <button onClick={() => fileInputRef.current?.click()} className="btn-hannam-primary px-12 py-4 text-[10px] font-bold uppercase tracking-widest shadow-lg">CSV 파일 선택</button>
                 <p className="text-[9px] text-hannam-muted font-bold mt-6 uppercase tracking-widest">CSV 양식: 이름, 연락처, 이메일, 예치금, 만료일</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
