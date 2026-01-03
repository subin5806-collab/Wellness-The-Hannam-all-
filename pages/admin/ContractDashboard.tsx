
import React, { useEffect, useState, useRef } from 'react';
import { dbService } from '../../services/dbService';
import { Contract, ContractTemplate } from '../../types';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Download, Trash2, Edit3, Eye, Upload, X, ShieldCheck, ChevronRight } from 'lucide-react';
import { ADMIN_UI } from '../../constants/adminLocale';

export const ContractDashboard: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'inbox' | 'forms'>('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsProcessing(true);
    try {
      const [c, t] = await Promise.all([dbService.getAllContracts(), dbService.getTemplates()]);
      setContracts(c);
      setTemplates(t);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !newTemplateTitle) return;
    
    setIsProcessing(true);
    try {
      await dbService.uploadTemplate(newTemplateTitle, file);
      alert('새로운 계약 템플릿이 보관함에 저장되었습니다.');
      setIsTemplateModalOpen(false);
      setNewTemplateTitle('');
      await loadData();
    } catch (err) {
      alert('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteTemplate = async (id: string, title: string) => {
    if (!confirm(`'${title}' 템플릿을 삭제하시겠습니까?`)) return;
    await dbService.deleteTemplate(id);
    await loadData();
  };

  const filteredContracts = contracts.filter(c => {
    const query = searchTerm.toLowerCase();
    return c.memberName.toLowerCase().includes(query) || c.memberPhone.includes(query);
  });

  return (
    <div className="min-h-screen bg-hannam-bg p-10 font-sans animate-smooth-fade">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-12 border-b border-hannam-border pb-10">
          <div>
            <h1 className="text-3xl font-serif font-bold text-hannam-green tracking-tight uppercase">Document Archive</h1>
            <p className="text-[11px] font-black text-hannam-gold uppercase tracking-[0.3em] mt-2">{ADMIN_UI.contracts.subtitle}</p>
          </div>
          <button 
            onClick={() => navigate('/admin/contract/new')} 
            className="bg-hannam-green text-white px-8 py-3.5 rounded-xl text-[12px] font-bold flex items-center gap-2.5 shadow-hannam-deep hover:bg-black transition-all active:scale-95"
          >
            <Plus className="w-4.5 h-4.5" /> {ADMIN_UI.contracts.newContract}
          </button>
        </header>

        <div className="flex gap-4 mb-8">
           <div className="flex bg-white p-1.5 rounded-2xl border border-hannam-border shadow-hannam-soft">
              <button 
                onClick={() => setActiveTab('inbox')} 
                className={`px-8 py-2.5 rounded-xl text-[12px] font-bold transition-all ${activeTab === 'inbox' ? 'bg-hannam-bg text-hannam-green shadow-inner' : 'text-hannam-muted hover:text-hannam-text'}`}
              >
                계약 보관함
              </button>
              <button 
                onClick={() => setActiveTab('forms')} 
                className={`px-8 py-2.5 rounded-xl text-[12px] font-bold transition-all ${activeTab === 'forms' ? 'bg-hannam-bg text-hannam-green shadow-inner' : 'text-hannam-muted hover:text-hannam-text'}`}
              >
                템플릿 관리
              </button>
           </div>
           <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-hannam-border" />
              <input 
                type="text" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="회원 성함 또는 연락처로 계약서 검색..." 
                className="w-full pl-14 pr-6 py-4 bg-white border border-hannam-border rounded-2xl text-[13px] font-bold outline-none focus:border-hannam-gold shadow-hannam-soft transition-all" 
              />
           </div>
        </div>

        {activeTab === 'inbox' ? (
          <div className="bg-white rounded-[40px] border border-hannam-border overflow-hidden shadow-hannam-soft">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-hannam-bg/40 text-[11px] font-bold text-hannam-muted uppercase border-b border-hannam-border">
                  <th className="px-10 py-6">계약 체결 정보</th>
                  <th className="px-10 py-6">문서 유형</th>
                  <th className="px-10 py-6 text-right">계약 금액</th>
                  <th className="px-10 py-6 text-right">관리 제어</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hannam-border">
                {filteredContracts.map(c => (
                  <tr key={c.id} className="group hover:bg-hannam-bg/20 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-hannam-bg rounded-full flex items-center justify-center text-hannam-green font-serif font-black border border-hannam-border">
                           {c.memberName[0]}
                         </div>
                         <div>
                            <p className="text-[14px] font-black text-hannam-text group-hover:text-hannam-green transition-colors">{c.memberName} 님</p>
                            <p className="text-[10px] text-hannam-muted font-bold mt-0.5 uppercase tracking-tighter">체결일: {c.createdAt.split('T')[0]}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-[10px] font-black text-hannam-gold bg-hannam-bg px-3 py-1.5 rounded-lg border border-hannam-gold/20 uppercase tracking-tight">{c.typeName}</span>
                    </td>
                    <td className="px-10 py-6 text-right font-black text-hannam-text text-[15px] num-data">
                      <span className="text-[11px] mr-1 opacity-40">₩</span>{c.amount.toLocaleString()}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setViewingContract(c)} className="p-3 text-hannam-border hover:text-hannam-green transition-colors bg-hannam-bg rounded-xl border border-transparent hover:border-hannam-border">
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        <button className="p-3 text-hannam-border hover:text-hannam-gold transition-colors">
                          <Download className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredContracts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-32 text-center">
                       <FileText className="w-12 h-12 text-hannam-border mx-auto mb-6 opacity-40" />
                       <p className="text-[13px] text-hannam-muted font-bold tracking-tight">저장된 전자 계약서 내역이 없습니다.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             <div 
               onClick={() => { setNewTemplateTitle(''); setIsTemplateModalOpen(true); }} 
               className="bg-white border-2 border-dashed border-hannam-border p-10 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:border-hannam-gold hover:bg-hannam-bg/20 transition-all group h-[280px]"
             >
                <div className="w-16 h-16 bg-hannam-bg rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <Upload className="w-7 h-7 text-hannam-gold" />
                </div>
                <span className="text-[12px] font-black text-hannam-muted uppercase tracking-widest group-hover:text-hannam-green transition-colors">신규 템플릿 등록</span>
             </div>
             {templates.map(tmpl => (
               <div key={tmpl.id} className="bg-white border border-hannam-border p-10 rounded-[32px] shadow-hannam-soft relative group h-[280px] flex flex-col justify-between hover:border-hannam-gold transition-all">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-hannam-bg rounded-2xl flex items-center justify-center text-hannam-gold">
                       <FileText className="w-6 h-6" />
                    </div>
                    <button onClick={() => handleDeleteTemplate(tmpl.id, tmpl.title)} className="text-hannam-border hover:text-red-400 p-2 transition-colors"><Trash2 className="w-4.5 h-4.5" /></button>
                  </div>
                  <div>
                    <h4 className="text-[16px] font-black text-hannam-text mb-2 tracking-tight">{tmpl.title}</h4>
                    <p className="text-[11px] text-hannam-muted font-medium truncate uppercase opacity-60">{tmpl.pdfName}</p>
                    <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-hannam-gold uppercase tracking-widest">
                       기본 템플릿 <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* 템플릿 업로드 모달 */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-hannam-text/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[48px] p-12 shadow-hannam-deep border border-hannam-border animate-smooth-fade">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-xl font-serif font-bold text-hannam-green tracking-tight uppercase">Upload Template</h2>
                 <button onClick={() => setIsTemplateModalOpen(false)} className="text-hannam-muted hover:text-hannam-text transition-colors"><X className="w-7 h-7" /></button>
              </div>
              <div className="space-y-8">
                 <div className="space-y-2.5">
                    <label className="text-[12px] font-black text-hannam-muted ml-1 uppercase tracking-widest">공식 템플릿 명칭</label>
                    <input 
                      type="text" 
                      value={newTemplateTitle} 
                      onChange={e => setNewTemplateTitle(e.target.value)} 
                      placeholder="예: 멤버십 이용 동의서" 
                      className="w-full p-4.5 bg-hannam-bg/50 border border-hannam-border rounded-2xl font-bold text-xs outline-none focus:bg-white focus:border-hannam-gold transition-all" 
                    />
                 </div>
                 <div className="p-10 border-2 border-dashed border-hannam-border rounded-[32px] flex flex-col items-center gap-6 bg-hannam-bg/20">
                    <input type="file" ref={fileInputRef} onChange={handleTemplateUpload} accept=".pdf" className="hidden" />
                    <p className="text-[11px] text-hannam-muted font-bold text-center leading-relaxed">디지털 계약용 PDF 문서를<br/>이곳에 업로드하세요.</p>
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      disabled={!newTemplateTitle || isProcessing} 
                      className="w-full py-4.5 bg-black text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl disabled:opacity-30 active:scale-95 transition-all"
                    >
                       {isProcessing ? '처리 중...' : 'PDF 파일 선택'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
