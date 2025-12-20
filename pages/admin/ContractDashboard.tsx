
import React, { useEffect, useState, useRef } from 'react';
import { dbService, generateHannamFilename } from '../../services/dbService';
import { Contract, ContractTemplate } from '../../types';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Download, Calendar, Mail, Upload, X, Trash2, Edit3, Eye, Printer, ShieldCheck } from 'lucide-react';

export const ContractDashboard: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'inbox' | 'forms'>('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [resendingId, setResendingId] = useState<string | null>(null);
  
  // Modal states
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  
  // Contract View Modal
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [c, t] = await Promise.all([dbService.getAllContracts(), dbService.getTemplates()]);
    setContracts(c);
    setTemplates(t);
  };

  const handleResend = async (c: Contract) => {
    setResendingId(c.id);
    await dbService.resendEmail('contract', c.id);
    alert(`${c.memberName} 회원님께 계약서가 재발송되었습니다.`);
    setResendingId(null);
  };

  const handleDownload = (c: Contract) => {
    const filename = generateHannamFilename(c.memberName, c.memberId, c.createdAt);
    const content = `THE HANNAM OFFICIAL CONTRACT\n\nClient: ${c.memberName}\nID: ${c.memberId}\nType: ${c.typeName}\nAmount: ${c.amount.toLocaleString()} KRW\nCreated: ${c.createdAt}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTemplateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateTitle) return;

    if (editingTemplateId) {
      await dbService.updateTemplate(editingTemplateId, { title: newTemplateTitle });
      alert('템플릿이 수정되었습니다.');
    } else {
      alert('파일을 선택하여 업로드를 완료해주세요.');
      return;
    }
    
    setIsTemplateModalOpen(false);
    setEditingTemplateId(null);
    setNewTemplateTitle('');
    loadData();
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !newTemplateTitle) return;
    await dbService.uploadTemplate(newTemplateTitle, file);
    alert('신규 템플릿이 등록되었습니다.');
    setIsTemplateModalOpen(false);
    setNewTemplateTitle('');
    loadData();
  };

  const handleEditTemplate = (tmpl: ContractTemplate) => {
    setEditingTemplateId(tmpl.id);
    setNewTemplateTitle(tmpl.title);
    setIsTemplateModalOpen(true);
  };

  const handleDeleteTemplate = async (id: string, title: string) => {
    if (confirm(`'${title}' 템플릿을 영구적으로 삭제하시겠습니까?\n이 작업은 취소할 수 없습니다.`)) {
      await dbService.deleteTemplate(id);
      loadData();
    }
  };

  const availableMonths = Array.from(new Set(contracts.map(c => c.yearMonth))).sort().reverse();

  const filteredContracts = contracts.filter(c => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = c.memberName.toLowerCase().includes(query) || c.memberPhone.includes(query) || c.memberId.includes(query);
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
            <button onClick={() => navigate('/admin/contract/new')} className="bg-[#1A362E] text-white px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
              <Plus className="w-4 h-4" /> 신규 계약서 작성
            </button>
          </div>
        </header>

        <div className="flex justify-between items-center mb-10">
          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
             <button onClick={() => setActiveTab('inbox')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inbox' ? 'bg-[#1A362E] text-white shadow-md' : 'text-gray-400'}`}>계약서 보관함</button>
             <button onClick={() => setActiveTab('forms')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'forms' ? 'bg-[#1A362E] text-white shadow-md' : 'text-gray-400'}`}>템플릿 관리</button>
          </div>

          <div className="flex gap-4">
            <div className="relative w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="회원명, 번호 검색..." className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none shadow-sm" />
            </div>
            {activeTab === 'inbox' && (
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="pl-12 pr-10 py-3.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none appearance-none shadow-sm">
                  <option value="all">전체 날짜</option>
                  {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {activeTab === 'inbox' ? (
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
                      <tr key={c.id} className="hover:bg-gray-50 group">
                        <td className="px-10 py-8">
                            <p className="text-sm font-bold text-gray-900">{c.memberName}</p>
                            <p className="text-[9px] font-mono text-[#C9B08F] mt-1">{generateHannamFilename(c.memberName, c.memberId, c.createdAt)}</p>
                        </td>
                        <td className="px-10 py-8">
                            <span className="text-[9px] font-black px-3 py-1 bg-white border border-gray-100 rounded-lg text-gray-400">{c.typeName}</span>
                        </td>
                        <td className="px-10 py-8 text-center font-bold text-gray-900 num-clean">₩{c.amount.toLocaleString()}</td>
                        <td className="px-10 py-8 text-right flex justify-end gap-3">
                            <button 
                              onClick={() => setViewingContract(c)} 
                              className="p-3 bg-gray-50 rounded-xl text-gray-300 hover:text-hannam-green hover:bg-gray-100 transition-all" 
                              title="계약서 보기"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleResend(c)} 
                              disabled={resendingId === c.id}
                              className={`p-3 rounded-xl transition-all ${resendingId === c.id ? 'bg-gray-100 text-gray-300' : 'bg-[#E7F0FF] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white'}`}
                              title="재발송"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDownload(c)} className="p-3 bg-gray-50 rounded-xl text-gray-300 hover:text-black transition-all" title="다운로드"><Download className="w-4 h-4" /></button>
                        </td>
                      </tr>
                  ))}
                  {filteredContracts.length === 0 && (
                    <tr><td colSpan={4} className="py-32 text-center text-gray-300 font-bold italic">No documents found.</td></tr>
                  )}
                </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             <div 
               onClick={() => { setEditingTemplateId(null); setNewTemplateTitle(''); setIsTemplateModalOpen(true); }}
               className="bg-white p-12 rounded-[40px] border-2 border-dashed border-gray-100 hover:border-hannam-gold cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
             >
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-hannam-gold group-hover:text-white transition-all mb-6">
                   <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-gray-900">템플릿 업로드</h4>
                <p className="text-[9px] text-gray-400 font-black uppercase mt-1 tracking-widest">New PDF Master</p>
             </div>
             {templates.map(tmpl => (
               <div key={tmpl.id} className="bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm relative group hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-[#FBF9F6] rounded-xl flex items-center justify-center text-[#1A362E] mb-8">
                     <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{tmpl.title}</h4>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{tmpl.pdfName}</p>
                  <div className="absolute top-6 right-6 flex gap-2">
                     <button onClick={() => handleEditTemplate(tmpl)} className="p-2 text-gray-200 hover:text-hannam-gold transition-colors" title="수정"><Edit3 className="w-4 h-4" /></button>
                     <button onClick={() => handleDeleteTemplate(tmpl.id, tmpl.title)} className="p-2 text-gray-200 hover:text-red-500 transition-colors" title="삭제"><Trash2 className="w-4 h-4" /></button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Contract Viewer Modal (Digital PDF Simulator) */}
      {viewingContract && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-8 overflow-y-auto">
           <div className="bg-white w-full max-w-4xl min-h-[90vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 relative">
              <div className="absolute top-6 right-6 z-50 flex gap-4">
                 <button onClick={() => window.print()} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-black transition-colors shadow-sm">
                    <Printer className="w-5 h-5" />
                 </button>
                 <button onClick={() => setViewingContract(null)} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex-1 p-16 md:p-24 overflow-y-auto print:p-0">
                 <div className="max-w-3xl mx-auto border border-gray-100 p-16 shadow-inner relative bg-white">
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                       <h2 className="text-8xl font-serif font-bold -rotate-45">THE HANNAM</h2>
                    </div>

                    <header className="text-center mb-16 border-b border-gray-100 pb-12">
                       <h2 className="text-3xl font-serif font-bold text-hannam-green tracking-widest uppercase mb-2">Service Membership Agreement</h2>
                       <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">Wellness, The Hannam Official Document</p>
                    </header>

                    <section className="space-y-10 relative z-10">
                       <div className="grid grid-cols-2 gap-12">
                          <div className="space-y-4">
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50 pb-2">Client Information</p>
                             <div className="space-y-2">
                                <p className="text-sm font-bold text-gray-900">{viewingContract.memberName}</p>
                                <p className="text-xs font-medium text-gray-500 num-clean">{viewingContract.memberPhone}</p>
                                <p className="text-xs font-medium text-gray-500">{viewingContract.memberEmail}</p>
                             </div>
                          </div>
                          <div className="space-y-4 text-right">
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50 pb-2 text-right">Agreement ID</p>
                             <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-900 num-clean">{viewingContract.id.toUpperCase()}</p>
                                <p className="text-[10px] font-black text-hannam-gold uppercase tracking-widest">{viewingContract.createdAt.split('T')[0]}</p>
                             </div>
                          </div>
                       </div>

                       <div className="bg-[#FBF9F6] p-10 rounded-2xl border border-gray-50">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Plan Summary</h4>
                          <div className="flex justify-between items-end">
                             <div>
                                <h3 className="text-2xl font-serif font-bold text-gray-900">{viewingContract.typeName}</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Official Plan Execution</p>
                             </div>
                             <div className="text-right">
                                <p className="text-3xl font-black text-hannam-green num-clean">₩{viewingContract.amount.toLocaleString()}</p>
                             </div>
                          </div>
                       </div>

                       <div className="pt-10 space-y-4">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">General Provisions</h4>
                          <p className="text-[11px] leading-relaxed text-gray-400 font-medium italic">
                             본 계약은 더 한남 웰니스 센터와 체결한 공식 서비스 멤버십 계약입니다. 
                             모든 서비스는 당사 운영 규정 및 약관에 따라 제공되며, 본 전자 서명을 통해 상호 합의가 완료되었습니다.
                             계약 체결 시점의 예치금은 멤버십 잔액으로 즉시 전환됩니다.
                          </p>
                       </div>

                       <div className="pt-20 flex justify-between items-end">
                          <div className="flex items-center gap-3">
                             <ShieldCheck className="w-8 h-8 text-hannam-gold opacity-30" />
                             <div>
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Verified By</p>
                                <p className="text-xs font-bold text-gray-900">Wellness The Hannam Staff</p>
                             </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-3">
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Client Signature</p>
                             <div className="w-48 h-20 bg-gray-50/50 rounded-xl border border-gray-50 overflow-hidden flex items-center justify-center p-2">
                                {viewingContract.signature ? (
                                   <img src={viewingContract.signature} alt="Client Signature" className="max-h-full object-contain mix-blend-multiply opacity-80" />
                                ) : (
                                   <span className="text-[10px] text-gray-300 italic">No Digital Signature</span>
                                )}
                             </div>
                          </div>
                       </div>
                    </section>

                    <footer className="mt-24 pt-8 border-t border-gray-100 text-center">
                       <p className="text-[9px] font-serif font-bold text-gray-300 uppercase tracking-[0.5em]">Wellness Heritage, The Hannam — Private Registry Office</p>
                    </footer>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Template Upload/Edit Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[40px] p-12 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-xl font-serif font-bold text-gray-900 uppercase tracking-widest">
                   {editingTemplateId ? 'Edit Template' : 'Upload Template'}
                 </h2>
                 <button onClick={() => setIsTemplateModalOpen(false)}><X className="w-6 h-6 text-gray-300" /></button>
              </div>
              <form onSubmit={handleTemplateAction} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Template Title</label>
                    <input type="text" value={newTemplateTitle} onChange={e => setNewTemplateTitle(e.target.value)} placeholder="예: 골드 멤버십 계약서" className="w-full p-4 bg-gray-50 rounded-xl font-bold outline-none border border-transparent focus:border-hannam-gold" required />
                 </div>
                 
                 {!editingTemplateId ? (
                   <div className="p-10 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center">
                      <input type="file" ref={fileInputRef} onChange={handleTemplateUpload} accept=".pdf" className="hidden" />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!newTemplateTitle}
                        className="px-8 py-3 bg-[#1A362E] text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                      >
                        Select PDF File
                      </button>
                      <p className="text-[9px] text-gray-300 mt-4 font-bold">제목을 먼저 입력해주세요.</p>
                   </div>
                 ) : (
                   <button 
                     type="submit"
                     className="w-full py-4 bg-[#1A362E] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg"
                   >
                     수정 완료
                   </button>
                 )}
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
