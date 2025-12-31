
import React, { useEffect, useState, useRef } from 'react';
import { dbService, generateHannamFilename } from '../../services/dbService';
import { Contract, ContractTemplate } from '../../types';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Download, Calendar, Mail, Upload, X, Trash2, Edit3, Eye, Printer, ShieldCheck } from 'lucide-react';
import { ADMIN_UI } from '../../constants/adminLocale';

export const ContractDashboard: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'inbox' | 'forms'>('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [resendingId, setResendingId] = useState<string | null>(null);
  
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
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
    const content = `
==================================================
        더 한남 공식 디지털 계약서 (영수증)
==================================================

1. 문서 정보
- 문서 ID: ${c.id.toUpperCase()}
- 발행 일시: ${new Date(c.createdAt).toLocaleString('ko-KR')}
- 계약 유형: ${c.typeName}

2. 회원 정보
- 성함: ${c.memberName}
- 연락처: ${c.memberPhone}
- 이메일: ${c.memberEmail}
- 등록일: ${c.memberJoinedAt}

3. 결제 요약
- 총 계약 금액: ₩${c.amount.toLocaleString()}
- 상태: 결제 및 검증 완료 (COMPLETED)

4. 법적 고지
- 본 문서는 더 한남 웰니스 센터의 공식 멤버십 계약서 및 영수증입니다.
- 본 문서에 포함된 모든 디지털 서명은 전자거래기본법에 따라 법적 효력을 가집니다.

--------------------------------------------------
더 한남 웰니스 레지스트리 센터
서울특별시 한남동
==================================================
    `;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
    if (confirm(`'${title}' 템플릿을 영구적으로 삭제하시겠습니까?`)) {
      await dbService.deleteTemplate(id);
      loadData();
    }
  };

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
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-1 uppercase tracking-wider text-hannam-green">{ADMIN_UI.contracts.title}</h1>
            <p className="text-[10px] font-black text-[#C9B08F] uppercase tracking-[0.4em]">{ADMIN_UI.contracts.subtitle}</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/admin/contract/new')} 
              className="bg-[#1A362E] text-white px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-black transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> {ADMIN_UI.contracts.newContract}
            </button>
          </div>
        </header>

        <div className="flex justify-between items-center mb-10">
          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
             <button onClick={() => setActiveTab('inbox')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inbox' ? 'bg-[#1A362E] text-white shadow-md' : 'text-gray-400'}`}>{ADMIN_UI.contracts.tabs.inbox}</button>
             <button onClick={() => setActiveTab('forms')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'forms' ? 'bg-[#1A362E] text-white shadow-md' : 'text-gray-400'}`}>{ADMIN_UI.contracts.tabs.forms}</button>
          </div>

          <div className="flex gap-4">
            <div className="relative w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="회원명, 번호 검색..." className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none shadow-sm" />
            </div>
          </div>
        </div>

        {activeTab === 'inbox' ? (
          <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#FBFBFB] text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                      <th className="px-10 py-6">{ADMIN_UI.contracts.table.info}</th>
                      <th className="px-10 py-6">{ADMIN_UI.contracts.table.type}</th>
                      <th className="px-10 py-6 text-center">{ADMIN_UI.contracts.table.amount}</th>
                      <th className="px-10 py-6 text-right">{ADMIN_UI.contracts.table.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredContracts.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50 group transition-colors">
                        <td className="px-10 py-8">
                            <p className="text-sm font-bold text-gray-900">{c.memberName}</p>
                            <p className="text-[9px] font-mono text-[#C9B08F] mt-1">{generateHannamFilename(c.memberName, c.memberId, c.createdAt)}</p>
                        </td>
                        <td className="px-10 py-8">
                            <span className="text-[9px] font-black px-3 py-1 bg-white border border-gray-100 rounded-lg text-gray-400 group-hover:text-hannam-green group-hover:border-hannam-green/20 transition-all">{c.typeName}</span>
                        </td>
                        <td className="px-10 py-8 text-center font-bold text-gray-900 num-clean">₩{c.amount.toLocaleString()}</td>
                        <td className="px-10 py-8 text-right flex justify-end gap-3">
                            <button 
                              onClick={() => setViewingContract(c)} 
                              className="p-3 bg-gray-50 rounded-xl text-gray-300 hover:text-hannam-green hover:bg-gray-100 transition-all shadow-sm" 
                              title="상세 보기"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleResend(c)} 
                              disabled={resendingId === c.id}
                              className={`p-3 rounded-xl transition-all shadow-sm ${resendingId === c.id ? 'bg-gray-100 text-gray-300' : 'bg-[#E7F0FF] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white'}`}
                              title="재전송"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDownload(c)} 
                              className="p-3 bg-gray-50 rounded-xl text-gray-300 hover:text-black transition-all shadow-sm" 
                              title="다운로드"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                        </td>
                      </tr>
                  ))}
                  {filteredContracts.length === 0 && (
                    <tr><td colSpan={4} className="py-32 text-center text-gray-300 font-bold italic tracking-widest uppercase">계약 내역이 없습니다.</td></tr>
                  )}
                </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             <div 
               onClick={() => { setEditingTemplateId(null); setNewTemplateTitle(''); setIsTemplateModalOpen(true); }}
               className="bg-white p-12 rounded-[40px] border-2 border-dashed border-gray-100 hover:border-hannam-gold cursor-pointer transition-all flex flex-col items-center justify-center text-center group shadow-sm"
             >
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-hannam-gold group-hover:text-white transition-all mb-6">
                   <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-gray-900">템플릿 업로드</h4>
                <p className="text-[9px] text-gray-400 font-black uppercase mt-1 tracking-widest">New Master PDF Form</p>
             </div>
             {templates.map(tmpl => (
               <div key={tmpl.id} className="bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm relative group hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-[#FBF9F6] rounded-xl flex items-center justify-center text-[#1A362E] mb-8 group-hover:bg-hannam-green group-hover:text-white transition-all">
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

      {/* Contract Viewer Modal */}
      {viewingContract && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-8 overflow-y-auto">
           <div className="bg-white w-full max-w-4xl min-h-[90vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 relative">
              <div className="absolute top-6 right-6 z-50 flex gap-4 print:hidden">
                 <button onClick={() => window.print()} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-black transition-colors shadow-sm">
                    <Printer className="w-5 h-5" />
                 </button>
                 <button onClick={() => setViewingContract(null)} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex-1 p-16 md:p-24 overflow-y-auto print:p-0 flex justify-center">
                 <div className="w-full max-w-2xl border-2 border-gray-100 p-16 shadow-2xl relative bg-white aspect-[1/1.414] flex flex-col justify-between">
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                       <h2 className="text-[120px] font-serif font-bold -rotate-45">THE HANNAM</h2>
                    </div>

                    <header className="text-center mb-16 border-b border-gray-100 pb-12">
                       <h2 className="text-3xl font-serif font-bold text-hannam-green tracking-widest uppercase mb-2">멤버십 서비스 계약서</h2>
                       <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">Official Digital Reference</p>
                    </header>

                    <section className="space-y-10 relative z-10">
                       <div className="grid grid-cols-2 gap-12">
                          <div className="space-y-4">
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50 pb-2">회원 정보</p>
                             <div className="space-y-2">
                                <p className="text-sm font-bold text-gray-900">{viewingContract.memberName}</p>
                                <p className="text-xs font-medium text-gray-500 num-clean">{viewingContract.memberPhone}</p>
                                <p className="text-xs font-medium text-gray-500">{viewingContract.memberEmail}</p>
                             </div>
                          </div>
                          <div className="space-y-4 text-right">
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50 pb-2 text-right">문서 참조</p>
                             <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-900 num-clean">{viewingContract.id.toUpperCase()}</p>
                                <p className="text-[10px] font-black text-hannam-gold uppercase tracking-widest">{viewingContract.createdAt.split('T')[0]}</p>
                             </div>
                          </div>
                       </div>

                       <div className="bg-[#FBF9F6] p-10 rounded-2xl border border-gray-50">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">계약 상세</h4>
                          <div className="flex justify-between items-end">
                             <div>
                                <h3 className="text-2xl font-serif font-bold text-gray-900">{viewingContract.typeName}</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Membership Activated</p>
                             </div>
                             <div className="text-right">
                                <p className="text-3xl font-black text-hannam-green num-clean">₩{viewingContract.amount.toLocaleString()}</p>
                             </div>
                          </div>
                       </div>

                       <div className="pt-20 flex justify-between items-end">
                          <div className="flex items-center gap-3">
                             <ShieldCheck className="w-10 h-10 text-hannam-gold opacity-30" />
                             <div>
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">승인자</p>
                                <p className="text-xs font-bold text-gray-900 italic">Hannam Registry Center</p>
                             </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-3">
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">회원 디지털 서명</p>
                             <div className="w-48 h-24 bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden flex items-center justify-center p-2 shadow-inner">
                                {viewingContract.signature ? (
                                   <img src={viewingContract.signature} alt="서명" className="max-h-full object-contain mix-blend-multiply opacity-80 scale-125" />
                                ) : (
                                   <span className="text-[10px] text-gray-300 italic">서명 없음</span>
                                )}
                             </div>
                          </div>
                       </div>
                    </section>

                    <footer className="mt-24 pt-8 border-t border-gray-100 text-center">
                       <p className="text-[9px] font-serif font-bold text-gray-300 uppercase tracking-[0.5em]">Wellness Heritage, The Hannam — Unified Database Record</p>
                    </footer>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
