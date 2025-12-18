
import React, { useEffect, useState } from 'react';
import { dbService, generateHannamFilename } from '../../services/dbService';
import { Contract, ContractTemplate } from '../../types';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Upload, 
  Calendar, 
  Filter, 
  ChevronRight, 
  FileCheck 
} from 'lucide-react';

export const ContractDashboard: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'inbox' | 'forms'>('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ title: '', type: 'MEMBERSHIP', pdfName: '', contentBody: '' });
  
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [c, t] = await Promise.all([
      dbService.getAllContracts(),
      dbService.getTemplates()
    ]);
    setContracts(c);
    setTemplates(t);
  };

  const availableMonths = Array.from(new Set(contracts.map(c => c.yearMonth))).sort().reverse();

  const handleAddTemplate = async () => {
    if (!newTemplate.title || !newTemplate.contentBody) return alert('필수 항목을 입력하세요.');
    await dbService.saveTemplate(newTemplate);
    setIsModalOpen(false);
    setNewTemplate({ title: '', type: 'MEMBERSHIP', pdfName: '', contentBody: '' });
    loadData();
  };

  const handleDownload = (c: Contract) => {
    const filename = generateHannamFilename(c.memberName, c.memberId, c.memberJoinedAt, c.typeName);
    
    // 표준 파일명으로 다운로드 시뮬레이션
    const blob = new Blob([`THE HANNAM OFFICIAL CONTRACT\n\nDocID: ${c.id}\nClient: ${c.memberName}\nType: ${c.typeName}\nCreated: ${c.createdAt}`], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    alert(`파일이 다운로드 되었습니다:\n${filename}`);
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.memberName.includes(searchTerm) || c.memberPhone.includes(searchTerm);
    const matchesMonth = selectedMonth === 'all' || c.yearMonth === selectedMonth;
    return matchesSearch && matchesMonth;
  });

  return (
    <div className="min-h-screen bg-[#FBF9F6] p-12 font-sans animate-fade-in relative">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-16">
          <div>
            <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">전자 계약 관리</h1>
            <p className="text-sm text-gray-400 font-medium tracking-wide uppercase">Standardized Contract Library & Archive</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white border border-gray-100 px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Upload className="w-4 h-4 text-[#C9B08F]" /> 서식 등록 (Template)
            </button>
            <button 
              onClick={() => navigate('/admin/contract/new')}
              className="bg-[#1a1a1a] text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-black/10 hover:bg-black transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" /> 새 계약 작성
            </button>
          </div>
        </header>

        {/* Filters & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
             <button 
               onClick={() => setActiveTab('inbox')} 
               className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inbox' ? 'bg-[#1a1a1a] text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}
             >
               계약 보관함 ({contracts.length})
             </button>
             <button 
               onClick={() => setActiveTab('forms')} 
               className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'forms' ? 'bg-[#1a1a1a] text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}
             >
               마스터 서식 ({templates.length})
             </button>
          </div>

          {activeTab === 'inbox' && (
            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  placeholder="회원 검색..." 
                  className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none shadow-sm focus:border-[#C9B08F]"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <select 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="pl-12 pr-10 py-3.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none cursor-pointer shadow-sm appearance-none focus:border-[#C9B08F]"
                >
                  <option value="all">전체 연월</option>
                  {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Content View */}
        <div className="bg-white rounded-[48px] shadow-sm border border-gray-100 overflow-hidden">
           {activeTab === 'inbox' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-[#FBFBFB] text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] border-b border-gray-50">
                         <th className="px-12 py-8">회원 정보 (Standard Naming)</th>
                         <th className="px-12 py-8">계약 유형</th>
                         <th className="px-12 py-8 text-center">금액</th>
                         <th className="px-12 py-8">분류 (Year-Month)</th>
                         <th className="px-12 py-8 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {filteredContracts.map(c => (
                        <tr key={c.id} className="group hover:bg-[#FBF9F6]/50 transition-colors">
                           <td className="px-12 py-10">
                              <p className="text-xl font-bold text-gray-900 mb-1">{c.memberName}</p>
                              <div className="flex items-center gap-2 text-[10px] font-mono text-gray-300 group-hover:text-[#C9B08F] transition-colors">
                                <FileCheck className="w-3 h-3" />
                                {generateHannamFilename(c.memberName, c.memberId, c.memberJoinedAt, c.typeName)}
                              </div>
                           </td>
                           <td className="px-12 py-10">
                              <span className="text-[10px] font-black px-4 py-1.5 bg-white border border-gray-100 rounded-xl text-[#C9B08F] shadow-sm">{c.typeName}</span>
                           </td>
                           <td className="px-12 py-10 text-center font-bold text-gray-900">₩{c.amount.toLocaleString()}</td>
                           <td className="px-12 py-10 text-xs text-gray-400 font-black">{c.yearMonth}</td>
                           <td className="px-12 py-10 text-right">
                              <div className="flex justify-end gap-3">
                                 <button onClick={() => handleDownload(c)} className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-black hover:border-black shadow-sm transition-all"><Download className="w-4 h-4" /></button>
                                 <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-500 shadow-sm transition-all"><Trash2 className="w-4 h-4" /></button>
                              </div>
                           </td>
                        </tr>
                      ))}
                      {filteredContracts.length === 0 && (
                        <tr><td colSpan={5} className="py-40 text-center text-gray-300 font-bold italic">No records found for the selection.</td></tr>
                      )}
                   </tbody>
                </table>
              </div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-12">
                 {templates.map(tmpl => (
                   <div key={tmpl.id} className="bg-[#FBF9F6] p-10 rounded-[40px] border border-gray-100 hover:border-[#1a1a1a] transition-all group flex flex-col justify-between">
                      <div>
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-200 mb-8 group-hover:bg-[#1a1a1a] group-hover:text-white transition-all shadow-sm">
                           <FileText className="w-6 h-6" />
                        </div>
                        <h4 className="text-2xl font-serif font-bold text-gray-900 mb-2">{tmpl.title}</h4>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-10">{tmpl.pdfName}</p>
                      </div>
                      <div className="flex justify-between items-center pt-8 border-t border-gray-200/50">
                         <span className="text-[10px] font-black text-[#C9B08F] uppercase tracking-[0.2em]">{tmpl.type}</span>
                         <button className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                 ))}
                 <button 
                   onClick={() => setIsModalOpen(true)}
                   className="p-12 border-2 border-dashed border-gray-100 rounded-[40px] flex flex-col items-center justify-center gap-4 text-gray-300 hover:bg-white hover:border-[#C9B08F] hover:text-[#C9B08F] transition-all"
                 >
                    <Plus className="w-10 h-10" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Add Master Template</span>
                 </button>
              </div>
           )}
        </div>
      </div>

      {/* Template Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[48px] p-16 animate-in zoom-in-95 duration-300 shadow-2xl">
             <div className="flex justify-between items-center mb-12">
                <h2 className="text-3xl font-serif font-bold">마스터 서식 등록</h2>
                <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-300 hover:text-black" /></button>
             </div>
             
             <div className="space-y-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">서식 명칭 (Title)</label>
                   <input 
                     type="text" 
                     value={newTemplate.title} 
                     onChange={e => setNewTemplate({...newTemplate, title: e.target.value})} 
                     className="w-full p-6 bg-gray-50 rounded-2xl outline-none focus:ring-1 focus:ring-[#C9B08F] font-bold" 
                     placeholder="예: 2025 멤버십 가입 약관" 
                   />
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">계약 유형</label>
                      <select 
                        value={newTemplate.type} 
                        onChange={e => setNewTemplate({...newTemplate, type: e.target.value as any})} 
                        className="w-full p-6 bg-gray-50 rounded-2xl font-bold outline-none cursor-pointer"
                      >
                         <option value="MEMBERSHIP">멤버십 가입</option>
                         <option value="WAIVER">면책 동의서</option>
                         <option value="PT_AGREEMENT">레슨 계약</option>
                      </select>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">PDF 파일명(가상)</label>
                      <input 
                        type="text" 
                        value={newTemplate.pdfName} 
                        onChange={e => setNewTemplate({...newTemplate, pdfName: e.target.value})} 
                        className="w-full p-6 bg-gray-50 rounded-2xl font-bold outline-none" 
                        placeholder="Master_Template.pdf" 
                      />
                   </div>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">약관 본문 (Content Body)</label>
                   <textarea 
                     rows={5} 
                     value={newTemplate.contentBody}
                     onChange={e => setNewTemplate({...newTemplate, contentBody: e.target.value})}
                     className="w-full p-6 bg-gray-50 rounded-2xl outline-none text-sm font-medium leading-relaxed" 
                     placeholder="회원가입 약관의 상세 내용을 입력하세요."
                   />
                </div>

                <div className="flex gap-4 pt-8">
                   <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-gray-100 rounded-[20px] text-[10px] font-black uppercase tracking-widest">취소</button>
                   <button onClick={handleAddTemplate} className="flex-1 py-5 bg-[#1a1a1a] text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10">등록 완료</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Lucide icon import fix for X
import { X } from 'lucide-react';
