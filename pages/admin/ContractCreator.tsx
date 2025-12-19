
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../../services/dbService';
import { useNavigate } from 'react-router-dom';
import { ContractTemplate, Member } from '../../types';
import { ChevronRight, FileText, User, PenTool, X, Trash2, Upload, FileCheck, Search, Plus, File, CheckCircle2, Info } from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';

export const ContractCreator: React.FC = () => {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
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
  
  // 컨설팅 체크리스트
  const [explanationCheck, setExplanationCheck] = useState({
    termsExplained: false,
    refundPolicyConfirmed: false,
    expiryDateConfirmed: false,
    serviceLimitsUnderstood: false
  });

  const allExplained = Object.values(explanationCheck).every(v => v === true);

  const navigate = useNavigate();

  useEffect(() => {
    dbService.getTemplates().then(setTemplates);
    dbService.getAllMembers().then(setMembers);
  }, []);

  const handlePhoneChange = (val: string) => {
    const cleanPhone = val.replace(/[^0-9]/g, '');
    const found = members.find(m => m.id === cleanPhone);
    
    if (found) {
      setFormData({
        ...formData,
        memberPhone: val,
        memberName: found.name,
        memberEmail: found.email
      });
    } else {
      setFormData({
        ...formData,
        memberPhone: val
      });
    }
  };

  const handleComplete = async () => {
    if (!formData.signature) return alert('서명을 완료해주세요.');
    if (!allExplained) return alert('상세 항목 설명을 확인해주세요.');
    
    await dbService.createContract(formData);
    alert(`${formData.memberName}님의 계약이 체결되었습니다.`);
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

  return (
    <div className="min-h-screen bg-[#FBF9F6] font-sans animate-fade-in flex flex-col">
      <header className="bg-white p-8 flex justify-between items-center border-b border-gray-100 sticky top-0 z-50 shadow-sm">
         <div>
           <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight uppercase">Contract Creation</h1>
           <p className="text-[10px] font-black text-hannam-gold uppercase tracking-widest mt-1">Hannam Intelligence Registry</p>
         </div>
         <div className="flex items-center gap-8">
            {[1, 2, 3].map(s => (
              <div key={s} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step >= s ? 'bg-[#1A362E]' : 'bg-gray-200'}`} />
            ))}
            <button onClick={() => navigate(-1)} className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-6">Cancel</button>
         </div>
      </header>

      <div className="flex-1 flex flex-col items-center py-20 px-8">
        {step === 1 && (
          <div className="w-full max-w-5xl text-center animate-fade-in">
             <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4 uppercase tracking-widest">Select Master Form</h2>
             <p className="text-gray-400 font-bold mb-20 tracking-tight">계약 종류를 선택하십시오. 업로드된 공식 템플릿이 표시됩니다.</p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {templates.map(tmpl => (
                  <div 
                    key={tmpl.id} 
                    onClick={() => selectTemplate(tmpl)} 
                    className="bg-white p-12 rounded-[48px] border-2 border-transparent hover:border-[#1A362E] cursor-pointer transition-all shadow-sm group flex flex-col items-center"
                  >
                     <div className="w-16 h-16 bg-[#FBF9F6] rounded-2xl flex items-center justify-center text-gray-300 mb-10 group-hover:bg-[#1A362E] group-hover:text-white transition-all">
                        <FileText className="w-8 h-8" />
                     </div>
                     <h4 className="text-2xl font-bold text-gray-900 mb-2">{tmpl.title}</h4>
                     <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{tmpl.pdfName}</p>
                  </div>
                ))}
                
                <div onClick={() => navigate('/admin/contracts')} className="bg-white/50 border-2 border-dashed border-gray-100 rounded-[48px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white transition-all">
                   <Plus className="w-8 h-8 text-gray-200" />
                   <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Manage Templates</span>
                </div>
             </div>
          </div>
        )}

        {step === 2 && (
           <div className="w-full max-w-2xl bg-white p-16 rounded-[60px] shadow-sm animate-fade-in border border-gray-50">
              <h2 className="text-3xl font-serif font-bold mb-12 text-center uppercase text-[#1A362E]">Member Identity</h2>
              
              <div className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Access (ID)</label>
                    <input type="text" value={formData.memberPhone} onChange={e => handlePhoneChange(e.target.value)} className="w-full p-6 bg-[#FBF9F6] rounded-[24px] font-bold outline-none border border-transparent focus:border-hannam-gold transition-all num-clean text-lg" placeholder="010-0000-0000" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Client Name</label>
                       <input type="text" value={formData.memberName} onChange={e => setFormData({...formData, memberName: e.target.value})} className="w-full p-6 bg-[#FBF9F6] rounded-[24px] font-bold outline-none text-sm" placeholder="성함" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contract Value (₩)</label>
                       <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full p-6 bg-[#FBF9F6] rounded-[24px] font-black outline-none num-clean text-sm" />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Client Email</label>
                    <input type="email" value={formData.memberEmail} onChange={e => setFormData({...formData, memberEmail: e.target.value})} className="w-full p-6 bg-[#FBF9F6] rounded-[24px] font-bold outline-none text-sm" placeholder="email@example.com" />
                 </div>
                 <button onClick={() => setStep(3)} className="w-full py-6 bg-[#1A362E] text-white rounded-[24px] font-black shadow-2xl tracking-widest uppercase text-xs mt-8">Review & Confirmation</button>
              </div>
           </div>
        )}

        {step === 3 && (
           <div className="w-full max-w-6xl space-y-12 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                 <div className="lg:col-span-7 bg-white p-16 rounded-[60px] shadow-sm border border-gray-50">
                    <div className="flex items-center gap-3 mb-10">
                       <Info className="w-6 h-6 text-hannam-gold" />
                       <h4 className="text-2xl font-serif font-bold text-[#1A362E] uppercase">Consultation Confirmation</h4>
                    </div>
                    
                    <div className="bg-[#FBF9F6] p-10 rounded-[40px] h-[450px] overflow-y-auto mb-12 text-[13px] leading-relaxed text-gray-500 font-medium border border-gray-100 no-scrollbar">
                       <p className="font-bold text-gray-900 mb-4 text-base underline">THE HANNAM MEMBERSHIP AGREEMENT</p>
                       <p className="mb-10">본 계약서는 {formData.typeName} 서비스를 체결하기 위한 공식 문서입니다.</p>
                       <p className="font-bold text-gray-800 mb-2">[고객 고지 사항]</p>
                       <p className="mb-6">1. 멤버십 권한은 양도가 불가합니다.</p>
                       <p className="mb-6">2. 유효 기간 이후의 잔액은 소멸될 수 있습니다.</p>
                       <p className="mb-6">3. 관리 예약은 최소 24시간 전에 요청해주셔야 합니다.</p>
                       <p className="text-gray-300 italic">... 이하 상세 약관 생략 ...</p>
                    </div>

                    <div className="space-y-4">
                       {[
                         { id: 'termsExplained', label: '서비스 약관 및 멤버십 혜택 설명 완료' },
                         { id: 'refundPolicyConfirmed', label: '환불 및 해지 정책 안내 완료' },
                         { id: 'expiryDateConfirmed', label: '멤버십 유효 기간 고지 완료' },
                       ].map(item => (
                         <div key={item.id} className="flex items-center gap-5 cursor-pointer group" onClick={() => setExplanationCheck(prev => ({...prev, [item.id]: !prev[item.id as keyof typeof explanationCheck]}))}>
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${explanationCheck[item.id as keyof typeof explanationCheck] ? 'bg-[#1A362E] border-[#1A362E] text-white' : 'border-gray-100 bg-white group-hover:border-hannam-gold'}`}>
                               {explanationCheck[item.id as keyof typeof explanationCheck] && <CheckCircle2 className="w-4 h-4" />}
                            </div>
                            <span className={`text-sm font-bold ${explanationCheck[item.id as keyof typeof explanationCheck] ? 'text-gray-900' : 'text-gray-300 group-hover:text-gray-500'}`}>{item.label}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
                    <div className={`bg-white p-12 rounded-[60px] shadow-sm border transition-all duration-500 flex-1 flex flex-col ${allExplained ? 'opacity-100 border-gray-100' : 'opacity-30 border-transparent grayscale pointer-events-none'}`}>
                       <h3 className="text-xl font-serif font-bold text-[#1A362E] mb-10 uppercase text-center tracking-widest">Client Signature</h3>
                       <div className="flex-1 min-h-[350px]">
                          <SignaturePad onSave={(dataUrl) => setFormData({...formData, signature: dataUrl})} onClear={() => setFormData({...formData, signature: ''})} />
                       </div>
                       <div className="mt-10 flex items-center gap-4">
                          <input type="checkbox" checked={formData.agreed} onChange={e => setFormData({...formData, agreed: e.target.checked})} className="w-6 h-6 rounded-lg accent-[#1A362E] cursor-pointer" />
                          <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">I agree to the terms provided above.</label>
                       </div>
                    </div>

                    <button 
                      onClick={handleComplete}
                      disabled={!formData.signature || !formData.agreed || !allExplained}
                      className="w-full py-8 bg-[#1A362E] text-white rounded-[32px] text-lg font-black shadow-2xl disabled:opacity-20 transition-all hover:bg-black tracking-widest uppercase"
                    >
                      Authorize Contract
                    </button>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
