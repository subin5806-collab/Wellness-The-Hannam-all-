
import React, { useState, useEffect } from 'react';
import { dbService, generateHannamFilename } from '../../services/dbService';
import { useNavigate } from 'react-router-dom';
import { ContractTemplate, Member, Contract } from '../../types';
import { ChevronRight, FileText, CheckCircle2, Info, Plus, Mail, Smartphone, Download, ArrowRight, ShieldCheck, MailCheck } from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';
import { useAuth } from '../../App';

export const ContractCreator: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalContract, setFinalContract] = useState<Contract | null>(null);
  
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
    agreed: false
  });
  
  const [explanationCheck, setExplanationCheck] = useState({
    termsExplained: false,
    refundPolicyConfirmed: false,
    expiryDateConfirmed: false
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
      setFormData({ ...formData, memberPhone: val });
    }
  };

  const handleComplete = async () => {
    if (!formData.signature) return alert('회원 서명을 완료해주세요.');
    if (!formData.agreed) return alert('약관 동의가 필요합니다.');
    
    setIsProcessing(true);
    try {
      const result = await dbService.createContract({
        ...formData,
        adminName: user?.name || 'Staff'
      });
      setFinalContract(result.contract);
      setStep(4); // 완료 및 영수증 페이지로 이동
    } catch (e) {
      alert('계약 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!finalContract) return;
    const filename = generateHannamFilename(finalContract.memberName, finalContract.memberId, finalContract.createdAt);
    const content = `THE HANNAM OFFICIAL CONTRACT RECEIPT\n\n----------------------------\nClient: ${finalContract.memberName}\nID: ${finalContract.memberId}\nType: ${finalContract.typeName}\nAmount: ${finalContract.amount.toLocaleString()} KRW\nCreated: ${new Date(finalContract.createdAt).toLocaleString()}\n----------------------------\nSignature Verified: SUCCESS\nAdmin: ${user?.name || 'Staff'}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectTemplate = (tmpl: ContractTemplate) => {
    setFormData({
      ...formData,
      templateId: tmpl.id,
      type: tmpl.type,
      typeName: tmpl.title,
      pdfName: tmpl.pdfName
    });
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6] font-sans animate-fade-in flex flex-col">
      <header className="bg-white p-8 flex justify-between items-center border-b border-gray-100 sticky top-0 z-50 shadow-sm">
         <div>
           <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight uppercase">Contract Creation</h1>
           <p className="text-[10px] font-black text-hannam-gold uppercase tracking-widest mt-1">Registry Management Console</p>
         </div>
         <div className="flex items-center gap-8">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step >= s ? 'bg-[#1A362E]' : 'bg-gray-200'}`} />
            ))}
            {step < 4 && <button onClick={() => navigate(-1)} className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-6">Cancel</button>}
         </div>
      </header>

      <div className="flex-1 flex flex-col items-center py-16 px-8">
        {step === 1 && (
          <div className="w-full max-w-5xl text-center animate-fade-in">
             <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4 uppercase tracking-widest">Select Plan</h2>
             <p className="text-gray-400 font-bold mb-16 tracking-tight uppercase tracking-widest text-[10px]">체결하실 멤버십 상품을 선택하십시오.</p>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {templates.map(tmpl => (
                  <div key={tmpl.id} onClick={() => selectTemplate(tmpl)} className="bg-white p-12 rounded-[48px] border-2 border-transparent hover:border-[#1A362E] cursor-pointer transition-all shadow-sm group flex flex-col items-center">
                     <div className="w-16 h-16 bg-[#FBF9F6] rounded-2xl flex items-center justify-center text-gray-300 mb-10 group-hover:bg-[#1A362E] group-hover:text-white transition-all">
                        <FileText className="w-8 h-8" />
                     </div>
                     <h4 className="text-xl font-bold text-gray-900 mb-2">{tmpl.title}</h4>
                     <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{tmpl.pdfName}</p>
                  </div>
                ))}
             </div>
          </div>
        )}

        {step === 2 && (
           <div className="w-full max-w-2xl bg-white p-16 rounded-[60px] shadow-sm animate-fade-in border border-gray-50">
              <h2 className="text-3xl font-serif font-bold mb-12 text-center uppercase text-[#1A362E]">Member Identity</h2>
              <div className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile ID (Phone)</label>
                    <input type="text" value={formData.memberPhone} onChange={e => handlePhoneChange(e.target.value)} className="w-full p-6 bg-[#FBF9F6] rounded-[24px] font-bold outline-none border border-transparent focus:border-hannam-gold transition-all num-clean text-lg" placeholder="010-0000-0000" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Client Name</label>
                       <input type="text" value={formData.memberName} onChange={e => setFormData({...formData, memberName: e.target.value})} className="w-full p-6 bg-[#FBF9F6] rounded-[24px] font-bold outline-none text-sm" placeholder="성함" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Plan Value (₩)</label>
                       <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full p-6 bg-[#FBF9F6] rounded-[24px] font-black outline-none num-clean text-sm" />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notification Email</label>
                    <input type="email" value={formData.memberEmail} onChange={e => setFormData({...formData, memberEmail: e.target.value})} className="w-full p-6 bg-[#FBF9F6] rounded-[24px] font-bold outline-none text-sm" placeholder="email@example.com" />
                 </div>
                 <button onClick={() => setStep(3)} className="w-full py-6 bg-[#1A362E] text-white rounded-[24px] font-black shadow-2xl tracking-widest uppercase text-xs mt-8">Review & Signature</button>
              </div>
           </div>
        )}

        {step === 3 && (
           <div className="w-full max-w-6xl space-y-12 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                 <div className="lg:col-span-7 bg-white p-16 rounded-[60px] shadow-sm border border-gray-50">
                    <div className="flex items-center gap-3 mb-10">
                       <Info className="w-6 h-6 text-hannam-gold" />
                       <h4 className="text-2xl font-serif font-bold text-[#1A362E] uppercase">Agreement Details</h4>
                    </div>
                    <div className="bg-[#FBF9F6] p-10 rounded-[40px] h-[400px] overflow-y-auto mb-10 text-[13px] leading-relaxed text-gray-500 font-medium border border-gray-100 no-scrollbar">
                       <p className="font-bold text-gray-900 mb-4 text-base underline uppercase">Wellness The Hannam Service Policy</p>
                       <p className="mb-6">본 계약은 {formData.typeName} 서비스를 정식으로 체결함을 의미하며, 명시된 금액(₩{formData.amount.toLocaleString()})이 멤버십 예치금으로 전환됩니다.</p>
                       <div className="space-y-4 text-gray-600">
                          <p>1. 모든 관리 세션은 사전 예약을 통해 진행됩니다.</p>
                          <p>2. 유효기간 만료 시 미사용 잔액에 대한 규정은 당사 약관을 따릅니다.</p>
                          <p>3. 서명된 계약서는 고객의 이메일({formData.memberEmail})로 즉시 전송됩니다.</p>
                       </div>
                    </div>
                    <div className="space-y-4">
                       {[
                         { id: 'termsExplained', label: '멤버십 혜택 및 이용 수칙 안내 완료' },
                         { id: 'refundPolicyConfirmed', label: '중도 해지 및 환불 규정 고지 완료' },
                         { id: 'expiryDateConfirmed', label: '예치금 유효 기간 안내 완료' },
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
                    <div className={`bg-white p-12 rounded-[60px] shadow-sm border transition-all duration-500 flex-1 flex flex-col ${allExplained ? 'opacity-100 border-gray-100 shadow-xl' : 'opacity-30 border-transparent grayscale pointer-events-none'}`}>
                       <h3 className="text-xl font-serif font-bold text-[#1A362E] mb-10 uppercase text-center tracking-widest">Client Signature</h3>
                       <div className="flex-1 min-h-[350px]">
                          <SignaturePad 
                            onSave={(dataUrl) => setFormData({...formData, signature: dataUrl})} 
                            onClear={() => setFormData({...formData, signature: ''})} 
                          />
                       </div>
                       <div className="mt-10 flex items-center gap-4">
                          <input type="checkbox" checked={formData.agreed} onChange={e => setFormData({...formData, agreed: e.target.checked})} className="w-6 h-6 rounded-lg accent-[#1A362E] cursor-pointer" />
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">I confirm the authenticity of this contract.</label>
                       </div>
                    </div>
                    <button 
                      onClick={handleComplete} 
                      disabled={!formData.signature || !formData.agreed || !allExplained || isProcessing} 
                      className="w-full py-8 bg-[#1A362E] text-white rounded-[32px] text-lg font-black shadow-2xl disabled:opacity-20 transition-all hover:bg-black tracking-widest uppercase active:scale-95"
                    >
                      {isProcessing ? 'Processing...' : 'Authorize Contract'}
                    </button>
                 </div>
              </div>
           </div>
        )}

        {step === 4 && finalContract && (
           <div className="w-full max-w-4xl space-y-10 animate-fade-in flex flex-col items-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-4 shadow-xl shadow-green-200">
                 <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="text-center">
                 <h2 className="text-3xl font-serif font-bold text-gray-900 uppercase tracking-widest">Authorized Successfully</h2>
                 <p className="text-gray-400 font-bold mt-2 uppercase tracking-[0.2em] text-[10px]">Contract ID: {finalContract.id}</p>
              </div>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                       <MailCheck className="w-5 h-5 text-hannam-gold" />
                       <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Delivery Status</span>
                    </div>
                    <div className="space-y-5">
                       <div className="flex justify-between items-center p-4 bg-[#FBFBFB] rounded-2xl border border-gray-50">
                          <div>
                             <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Email Receipt</p>
                             <p className="text-xs font-bold text-gray-700 mt-0.5">{finalContract.memberEmail}</p>
                          </div>
                          <span className="text-[9px] font-black text-green-500 uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Sent</span>
                       </div>
                       <div className="flex justify-between items-center p-4 bg-[#FBFBFB] rounded-2xl border border-gray-50">
                          <div>
                             <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">SMS Gateway</p>
                             <p className="text-xs font-bold text-gray-700 mt-0.5">{finalContract.memberPhone}</p>
                          </div>
                          <span className="text-[9px] font-black text-green-500 uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Delivered</span>
                       </div>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed italic text-center px-4">
                      회원님의 계정으로 공식 계약서 사본이 안전하게 전송되었습니다.
                    </p>
                 </div>

                 <div className="bg-[#1A362E] p-12 rounded-[40px] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck className="w-24 h-24" /></div>
                    <div className="relative z-10">
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Official Receipt Summary</p>
                       <h4 className="text-2xl font-serif font-bold text-hannam-gold">{finalContract.typeName}</h4>
                       <div className="mt-8 pt-8 border-t border-white/10">
                          <p className="text-[10px] text-white/40 uppercase font-black">Plan Amount</p>
                          <h5 className="text-3xl font-bold mt-2 num-clean">₩ {finalContract.amount.toLocaleString()}</h5>
                       </div>
                    </div>
                    <button onClick={handleDownload} className="w-full py-5 bg-white text-[#1A362E] rounded-2xl text-[10px] font-black uppercase tracking-widest mt-12 flex items-center justify-center gap-2 hover:bg-hannam-gold hover:text-white transition-all shadow-xl">
                       <Download className="w-4 h-4" /> Download Official PDF
                    </button>
                 </div>
              </div>

              <div className="flex gap-4 mt-8">
                 <button onClick={() => navigate('/admin/contracts')} className="px-12 py-5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all">Go to List</button>
                 <button onClick={() => setStep(1)} className="px-12 py-5 bg-[#1A362E] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-black">Create New <ArrowRight className="w-4 h-4" /></button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
