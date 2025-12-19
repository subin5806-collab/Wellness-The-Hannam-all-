
import React, { useEffect, useState } from 'react';
import { dbService, generateHannamFilename } from '../../services/dbService';
import { Contract, ContractTemplate } from '../../types';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Download, Calendar, Upload, FileCheck, X } from 'lucide-react';

export const ContractDashboard: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'inbox' | 'forms'>('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [c, t] = await Promise.all([dbService.getAllContracts(), dbService.getTemplates()]);
    setContracts(c);
    setTemplates(t);
  };

  const availableMonths = Array.from(new Set(contracts.map(c => c.yearMonth))).sort().reverse();

  const handleDownload = (c: Contract) => {
    const filename = generateHannamFilename(c.memberName, c.memberId, c.createdAt, c.typeName);
    const content = `THE HANNAM OFFICIAL CONTRACT\n\nClient: ${c.memberName}\nType: ${c.typeName}\nAmount: ${c.amount.toLocaleString()} KRW\nCreated: ${c.createdAt}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredContracts = contracts.filter(c => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = c.memberName.toLowerCase().includes(query) || c.memberPhone.includes(query);
    const matchesMonth = selectedMonth === 'all' || c.yearMonth === selectedMonth;
    return matchesSearch && matchesMonth;
  });

  return (
    <div className="min-h-screen bg-[#FBF9F6] p-12 font-sans animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-16">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-1 uppercase tracking-wider">Contract Management</h1>
            <p className="text-[10px] font-black text-[#C9B08F] uppercase tracking-[0.4em]">Digital Archive & Templates</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate('/admin/contract/new')} className="bg-[#1a1a1a] text-white px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
              <Plus className="w-4 h-4" /> 계약서 신규 작성
            </button>
          </div>
        </header>

        <div className="flex justify-between items-center mb-10">
          <div className="flex bg-white p-1 rounded-2xl border border-gray-100">
             <button onClick={() => setActiveTab('inbox')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inbox' ? 'bg-[#1a1a1a] text-white shadow-md' : 'text-gray-400'}`}>보관함</button>
             <button onClick={() => setActiveTab('forms')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'forms' ? 'bg-[#1a1a1a] text-white shadow-md' : 'text-gray-400'}`}>템플릿</button>
          </div>

          {activeTab === 'inbox' && (
            <div className="flex gap-4">
              <div className="relative w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="회원 검색..." className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none" />
              </div>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="pl-12 pr-10 py-3.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none appearance-none">
                  <option value="all">전체 날짜</option>
                  {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-[#FBFBFB] text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                    <th className="px-10 py-6">회원 정보 / 문서명</th>
                    <th className="px-10 py-6">계약 유형</th>
                    <th className="px-10 py-6 text-center">금액</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {filteredContracts.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                       <td className="px-10 py-8">
                          <p className="text-sm font-bold text-gray-900">{c.memberName}</p>
                          <p className="text-[9px] font-mono text-[#C9B08F]">{generateHannamFilename(c.memberName, c.memberId, c.createdAt, c.typeName)}</p>
                       </td>
                       <td className="px-10 py-8">
                          <span className="text-[9px] font-black px-3 py-1 bg-white border border-gray-100 rounded-lg text-gray-400">{c.typeName}</span>
                       </td>
                       <td className="px-10 py-8 text-center font-bold text-gray-900">₩{c.amount.toLocaleString()}</td>
                       <td className="px-10 py-8 text-right">
                          <button onClick={() => handleDownload(c)} className="p-3 bg-gray-50 rounded-xl text-gray-300 hover:text-black transition-all"><Download className="w-4 h-4" /></button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};
