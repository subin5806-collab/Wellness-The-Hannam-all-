
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
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
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
      alert('템플릿이 성공적으로 DB에 저장되었습니다.');
      setIsTemplateModalOpen(false);
      setNewTemplateTitle('');
      await loadData(); // DB 재조회하여 정합성 유지
    } catch (err) {
      alert('파일 저장 실패');
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
    <div className="min-h-screen bg-[#FBF9F6] p-8 font-sans animate-smooth-fade">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{ADMIN_UI.contracts.title}</h1>
            <p className="text-[11px] font-medium text-gray-400 mt-1 uppercase tracking-wider">{ADMIN_UI.contracts.subtitle}</p>
          </div>
          <button 
            onClick={() => navigate('/admin/contract/new')} 
            className="px-6 py-3 bg-gray-900 text-white rounded-md text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all"
          >
            <Plus className="w-3.5 h-3.5 inline mr-2" /> {ADMIN_UI.contracts.newContract}
          </button>
        </header>

        <div className="flex gap-4 mb-8">
           <div className="flex bg-white p-1 rounded-md border border-gray-200">
             <button onClick={() => setActiveTab('inbox')} className={`px-6 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'inbox' ? 'bg-gray-900 text-white' : 'text-gray-400'}`}>{ADMIN_UI.contracts.tabs.inbox}</button>
             <button onClick={() => setActiveTab('forms')} className={`px-6 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'forms' ? 'bg-gray-900 text-white' : 'text-gray-400'}`}>{ADMIN_UI.contracts.tabs.forms}</button>
           </div>
           <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="회원명 검색..." className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-md text-xs font-medium outline-none focus:border-gray-400" />
           </div>
        </div>

        {activeTab === 'inbox' ? (
          <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-200">
                  <th className="px-6 py-4">계약자 정보</th>
                  <th className="px-6 py-4">유형</th>
                  <th className="px-6 py-4 text-right">금액</th>
                  <th className="px-6 py-4 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredContracts.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-gray-900">{c.memberName}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{c.id.toUpperCase()}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-sm uppercase">{c.typeName}</span>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-gray-900 num-data">₩{c.amount.toLocaleString()}</td>
                    <td className="px-6 py-5 text-right">
                      <button onClick={() => setViewingContract(c)} className="text-gray-300 hover:text-gray-900 transition-colors p-2"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-5">
             <div onClick={() => { setNewTemplateTitle(''); setIsTemplateModalOpen(true); }} className="bg-white border-2 border-dashed border-gray-200 p-8 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-all group h-48">
                <Upload className="w-8 h-8 text-gray-200 group-hover:text-gray-400 mb-4" />
                <span className="text-[11px] font-bold text-gray-400 uppercase">신규 템플릿 업로드</span>
             </div>
             {templates.map(tmpl => (
               <div key={tmpl.id} className="bg-white border border-gray-200 p-6 rounded-md shadow-sm relative group h-48 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <FileText className="w-8 h-8 text-gray-200" />
                    <button onClick={() => handleDeleteTemplate(tmpl.id, tmpl.title)} className="text-gray-200 hover:text-red-500 p-2"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 mb-1">{tmpl.title}</h4>
                    <p className="text-[10px] text-gray-400 font-medium truncate">{tmpl.pdfName}</p>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-md p-8 shadow-2xl border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-sm font-bold text-gray-900 uppercase">템플릿 업로드</h2>
                 <button onClick={() => setIsTemplateModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">템플릿 명칭</label>
                    <input type="text" value={newTemplateTitle} onChange={e => setNewTemplateTitle(e.target.value)} placeholder="명칭 입력" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md font-bold text-xs outline-none" />
                 </div>
                 <div className="p-8 border-2 border-dashed border-gray-100 rounded-md flex flex-col items-center gap-4">
                    <input type="file" ref={fileInputRef} onChange={handleTemplateUpload} accept=".pdf" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={!newTemplateTitle || isProcessing} className="w-full py-3.5 bg-gray-900 text-white rounded-md text-[11px] font-bold uppercase disabled:opacity-30">
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
