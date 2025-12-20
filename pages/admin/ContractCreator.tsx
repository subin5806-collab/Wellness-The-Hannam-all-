
import React, { useState, useEffect } from 'react';
import { dbService, generateHannamFilename } from '../../services/dbService';
import { useNavigate } from 'react-router-dom';
import { ContractTemplate, Member, Contract } from '../../types';
import { FileText, CheckCircle2, Info, Mail, Smartphone, Download, ArrowRight, ShieldCheck, MailCheck } from 'lucide-react';
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
      setFormData({ ...formData, memberPhone: val, memberName: found.name, memberEmail: found.email });
    } else {
      setFormData({ ...formData, memberPhone: val });
    }
  };

  const handleComplete = async () => {
    if (!formData.signature) return alert('서명을 완료해주세요.');
    setIsProcessing(true);
    try {
      const result = await dbService.createContract({ ...formData, adminName: user?.name });
      setFinalContract(result.contract);
      setStep(4);
    } catch (e) {
      alert('계약 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!finalContract) return;
    const filename = generateHannamFilename(finalContract.memberName, finalContract.memberId, finalContract.createdAt);
    const content = `WELLNESS THE HANNAM - OFFICIAL RECEIPT\n\nMember: ${finalContract.memberName}\nType: ${finalContract.typeName}\nAmount: ₩${finalContract.amount.toLocaleString()}\nDate: ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6] font-sans flex flex-col">
      <header className="bg-[#1A362E] text-white p-8 flex justify-between items-center sticky top-0 z-50 shadow-lg">
         <div>
           <h1 className="text-2xl font-serif font-bold tracking-tight uppercase">Contract Initiation</h1>
           <p className="text-[9px] font-black text-hannam-gold uppercase tracking-widest mt-1">Registry Console</p>
         </div>
         <div className="flex gap-4">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step >= s ? 'bg-hannam-gold' : 'bg-white/20'}`} />
            ))}
         </div>
      </header>

      <div className="flex-1 flex flex-col items-center py-16 px-8 bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')]">
        {step === 1 && (
          <div className="w-full max-w-5xl text-center">
             <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4 uppercase tracking-widest">Select Plan</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                {templates.map(tmpl => (
                  <div key={tmpl.id} onClick={() => { setFormData({...formData, templateId: tmpl.id, typeName: tmpl.title}); setStep(2); }} className="bg-white p-12 rounded-[48px] border-2 border-transparent hover:border-[#1A362E] cursor-pointer transition-all shadow-sm group">
                     <FileText className="w-10 h-10 mx-auto text-gray-300 mb-6 group-hover:text-hannam-green" />
                     <h4 className="text-xl font-bold text-gray-900">{tmpl.title}</h4>
                  </div>
                ))}
             </div>
          </div>
        )}

        {step === 2 && (
           <div className="w-full max-w-2xl bg-white p-16 rounded-[60px] shadow-sm animate-fade-in border border-gray-50">
              <h2 className="text-3xl font-serif font-bold mb-12 text-center uppercase text-[#1A362E]">Member Identity</h2>
              <div className="space-y-8">
                 <input type="text" value={formData.memberPhone} onChange={e => handlePhoneChange(e.target.value)} className="w-full p-6 bg-[#FBF9F6] rounded-[24px] font-bold outline-none border border-transparent focus:border-hannam-gold transition-all" placeholder="연락처 (ID)" />
                 <input type="text" value={formData.memberName} onChange={e => setFormData({...formData, memberName: e.target.value})} className="w-full p-6 bg-[#FBF9F6] rounded-[24px] font-bold outline-none" placeholder="성함" />
                 <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full p-6 bg-[#FBF9F6] rounded-[24px] font-black outline-none" placeholder="계약 금액" />
                 <input type="email" value={formData.memberEmail} onChange={e => setFormData({...formData, memberEmail: e.target.value})} className="w-full p-6 bg-[#FBF9F6] rounded-[24px] font-bold outline-none" placeholder="이메일" />
                 <button onClick={() => setStep(3)} className="w-full py-6 bg-[#1A362E] text-white rounded-[24px] font-black uppercase tracking-widest text-xs mt-8">Review & Signature</button>
              </div>
           </div>
        )}

        {step === 3 && (
           <div className="w-full max-w-6xl space-y-12 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                 <div className="lg:col-span-7 bg-white p-16 rounded-[60px] shadow-sm border border-gray-50">
                    <div className="flex items-center gap-3 mb-10"><Info className="w-6 h-6 text-hannam-gold" /><h4 className="text-2xl font-serif font-bold uppercase">Agreement Details</h4></div>
                    <div className="bg-[#FBF9F6] p-10 rounded-[40px] h-[350px] overflow-y-auto mb-10 text-[13px] leading-relaxed text-gray-500 font-medium">
                       <p className="font-bold text-gray-900 mb-4 underline uppercase">Wellness The Hannam Service Policy</p>
                       <p>본 계약은 {formData.typeName} 서비스를 정식으로 체결함을 의미하며, 서명 시 고객의 이메일({formData.memberEmail})로 전자 계약서가 즉시 발송됩니다.</p>
                    </div>
                    <div className="space-y-4">
                       {['termsExplained', 'refundPolicyConfirmed', 'expiryDateConfirmed'].map(id => (
                         <div key={id} className="flex items-center gap-5 cursor-pointer" onClick={() => setExplanationCheck(prev => ({...prev, [id]: !prev[id as keyof typeof explanationCheck]}))}>
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${explanationCheck[id as keyof typeof explanationCheck] ? 'bg-[#1A362E] text-white' : 'bg-white'}`}>{explanationCheck[id as keyof typeof explanationCheck] && <CheckCircle2 className="w-4 h-4" />}</div>
                            <span className="text-sm font-bold text-gray-900">안내 사항 확인 완료</span>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="lg:col-span-5 flex flex-col justify-between">
                    <div className={`bg-white p-12 rounded-[60px] shadow-sm border ${allExplained ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                       <h3 className="text-xl font-serif font-bold text-[#1A362E] mb-10 uppercase text-center tracking-widest">Client Signature</h3>
                       <div className="h-[350px]"><SignaturePad onSave={(url) => setFormData({...formData, signature: url})} onClear={() => setFormData({...formData, signature: ''})} /></div>
                    </div>
                    <button onClick={handleComplete} disabled={!formData.signature || isProcessing || !allExplained} className="w-full py-8 bg-[#1A362E] text-white rounded-[32px] text-lg font-black shadow-2xl disabled:opacity-20 mt-8">Authorize Contract</button>
                 </div>
              </div>
           </div>
        )}

        {step === 4 && finalContract && (
           <div className="w-full max-w-4xl space-y-10 animate-fade-in flex flex-col items-center">
              <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
              <h2 className="text-3xl font-serif font-bold text-gray-900 uppercase tracking-widest">Authorized Successfully</h2>
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4"><MailCheck className="w-5 h-5 text-hannam-gold" /><span className="text-[10px] font-black uppercase text-gray-400">Delivery Status</span></div>
                    <div className="flex justify-between items-center p-4 bg-[#FBFBFB] rounded-2xl"><p className="text-xs font-bold">Email Receipt</p><span className="text-[9px] font-black text-green-500 uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Sent</span></div>
                    <div className="flex justify-between items-center p-4 bg-[#FBFBFB] rounded-2xl"><p className="text-xs font-bold">SMS Gateway</p><span className="text-[9px] font-black text-green-500 uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Delivered</span></div>
                 </div>
                 <div className="bg-[#1A362E] p-12 rounded-[40px] text-white shadow-2xl flex flex-col justify-between">
                    <h4 className="text-2xl font-serif font-bold text-hannam-gold">{finalContract.typeName}</h4>
                    <h5 className="text-3xl font-bold mt-2">₩ {finalContract.amount.toLocaleString()}</h5>
                    <button onClick={handleDownload} className="w-full py-5 bg-white text-[#1A362E] rounded-2xl text-[10px] font-black uppercase mt-12 flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download PDF Receipt</button>
                 </div>
              </div>
              <button onClick={() => navigate('/admin/contracts')} className="px-12 py-5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400">Return to Dashboard</button>
           </div>
        )}
      </div>
    </div>
  );
};

const MailCheck = ({className}: {className?: string}) => <Mail className={className} />;
