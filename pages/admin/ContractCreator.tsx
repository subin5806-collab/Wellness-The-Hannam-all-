
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../../services/dbService';
import { useNavigate } from 'react-router-dom';
import { ContractTemplate } from '../../types';
import { ChevronRight, FileText, User, PenTool, X, Trash2, Upload, FileCheck, Search, Plus, File } from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';

export const ContractCreator: React.FC = () => {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    templateId: '',
    memberName: '',
    memberEmail: '',
    memberPhone: '',
    type: 'MEMBERSHIP' as any,
    typeName: '',
    amount: 0,
    signature: '',
    pdfName: '',
    agreed: false,
    isCustomUpload: false
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    dbService.getTemplates().then(setTemplates);
  }, []);

  const handleComplete = async () => {
    if (!formData.signature) return alert('서명을 완료해주세요.');
    const result = await dbService.createContract(formData);
    alert(`${result.member.name}님의 계약이 체결되었습니다. 회원 등급이 업데이트되었습니다.`);
    navigate('/admin/contracts');
  };

  const selectTemplate = (tmpl: ContractTemplate) => {
    setFormData({
      ...formData,
      templateId: tmpl.id,
      type: tmpl.type,
      typeName: tmpl.title,
      pdfName: tmpl.pdfName,
      isCustomUpload: false
    });
    setStep(2);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('PDF 파일만 업로드 가능합니다.');
        return;
      }
      setFormData({
        ...formData,
        templateId: '',
        type: 'MEMBERSHIP',
        typeName: `Custom: ${file.name}`,
        pdfName: file.name,
        isCustomUpload: true
      });
      setStep(2);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] font-sans animate-fade-in flex flex-col">
      <header className="bg-white p-8 flex justify-between items-center border-b border-gray-50 sticky top-0 z-50">
         <h1 className="text-3xl font-black text-gray-900 tracking-tight">전자 계약서 작성</h1>
         <div className="flex items-center gap-12">
            {[1, 2, 3].map(s => (
              <div key={s} className={`w-3 h-3 rounded-full ${step >= s ? 'bg-black' : 'bg-gray-200'}`} />
            ))}
         </div>
         <button onClick={() => navigate(-1)} className="text-gray-400 font-black text-xs uppercase tracking-widest">취소</button>
      </header>

      <div className="flex-1 flex flex-col items-center py-20 px-8">
        {step === 1 && (
          <div className="w-full max-w-5xl text-center animate-fade-in">
             <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">등록된 서식에서 선택</h2>
             <p className="text-gray-400 font-bold mb-16 tracking-tight">이미 등록된 마스터 서식을 사용하거나 새로운 PDF를 업로드하세요.</p>
             
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileUpload} 
               accept=".pdf" 
               className="hidden" 
             />

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div 
                  onClick={triggerFileUpload}
                  className="bg-white p-10 rounded-[32px] border-2 border-dashed border-gray-100 hover:border-hannam-gold cursor-pointer transition-all shadow-sm group flex flex-col items-center justify-center text-center"
                >
                   <div className="w-12 h-12 bg-hannam-gold/10 rounded-2xl flex items-center justify-center text-hannam-gold mb-8 group-hover:bg-hannam-gold group-hover:text-white transition-all">
                      <Upload className="w-6 h-6" />
                   </div>
                   <h4 className="text-xl font-bold text-gray-900 mb-2">커스텀 PDF 업로드</h4>
                   <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">외부 계약서 파일 사용</p>
                </div>

                {templates.map(tmpl => (
                  <div 
                    key={tmpl.id}
                    onClick={() => selectTemplate(tmpl)}
                    className="bg-white p-10 rounded-[32px] border-2 border-transparent hover:border-black cursor-pointer transition-all shadow-sm group"
                  >
                     <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-8 group-hover:bg-black group-hover:text-white">
                        <FileText className="w-6 h-6" />
                     </div>
                     <h4 className="text-xl font-bold text-gray-900 mb-2">{tmpl.title}</h4>
                     <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">{tmpl.type}</p>
                  </div>
                ))}
                
                <div 
                  onClick={() => navigate('/admin/contracts')}
                  className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-gray-100 transition-all"
                >
                   <Plus className="w-8 h-8 text-gray-300" />
                   <span className="text-xs font-black text-gray-400 uppercase tracking-widest">마스터 서식 관리</span>
                </div>
             </div>
          </div>
        )}

        {step === 2 && (
           <div className="w-full max-w-2xl bg-white p-16 rounded-[48px] shadow-sm animate-fade-in">
              <h2 className="text-3xl font-bold mb-12 text-center">회원 정보 입력</h2>
              
              {formData.isCustomUpload && (
                <div className="mb-10 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                  <File className="w-5 h-5 text-hannam-gold" />
                  <div>
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">업로드된 파일</p>
                    <p className="text-xs font-bold text-gray-700">{formData.pdfName}</p>
                  </div>
                </div>
              )}

              <div className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">성함</label>
                    <input type="text" value={formData.memberName} onChange={e => setFormData({...formData, memberName: e.target.value})} className="w-full p-6 bg-gray-50 rounded-2xl font-bold outline-none" placeholder="홍길동" />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">연락처</label>
                    <input type="text" value={formData.memberPhone} onChange={e => setFormData({...formData, memberPhone: e.target.value})} className="w-full p-6 bg-gray-50 rounded-2xl font-bold outline-none" placeholder="010-0000-0000" />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">계약 금액 (₩)</label>
                    <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full p-6 bg-gray-50 rounded-2xl font-bold outline-none" />
                 </div>
                 <button onClick={() => setStep(3)} className="w-full py-6 bg-black text-white rounded-2xl font-black shadow-xl">다음 단계로</button>
              </div>
           </div>
        )}

        {step === 3 && (
           <div className="w-full max-w-4xl space-y-12 animate-fade-in">
              <div className="bg-white p-12 rounded-[40px] shadow-sm">
                 <h4 className="text-xl font-bold mb-8">{formData.typeName}</h4>
                 
                 {formData.isCustomUpload ? (
                    <div className="bg-gray-50 p-16 rounded-3xl mb-10 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                       <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                          <FileCheck className="w-8 h-8 text-hannam-gold" />
                       </div>
                       <p className="text-sm font-bold text-gray-900 mb-1">외부 계약서 파일이 준비되었습니다.</p>
                       <p className="text-[11px] text-gray-400 font-medium">파일명: {formData.pdfName}</p>
                    </div>
                 ) : (
                    <div className="bg-gray-50 p-10 rounded-3xl h-64 overflow-y-auto mb-10 text-sm leading-relaxed text-gray-500 font-medium border border-gray-100">
                       {templates.find(t => t.id === formData.templateId)?.contentBody || '계약 약관 본문입니다...'}
                    </div>
                 )}

                 <div className="flex items-center gap-4">
                    <input type="checkbox" checked={formData.agreed} onChange={e => setFormData({...formData, agreed: e.target.checked})} className="w-6 h-6 rounded-lg accent-black cursor-pointer" />
                    <label className="text-lg font-bold">위 약관에 동의하며 계약을 체결합니다.</label>
                 </div>
              </div>

              <div className="bg-white p-12 rounded-[40px] shadow-sm">
                 <h3 className="text-xl font-bold mb-8">전자 서명</h3>
                 <div className="h-[400px]">
                    <SignaturePad 
                      onSave={(dataUrl) => setFormData({...formData, signature: dataUrl})} 
                      onClear={() => setFormData({...formData, signature: ''})} 
                    />
                 </div>
              </div>
              
              <button 
                onClick={handleComplete}
                disabled={!formData.signature || !formData.agreed}
                className="w-full py-8 bg-[#3A453F] text-white rounded-[32px] text-xl font-black shadow-2xl disabled:opacity-30 transition-all hover:bg-black"
              >
                계약 체결 및 회원 등록 완료
              </button>
           </div>
        )}
      </div>
    </div>
  );
};
