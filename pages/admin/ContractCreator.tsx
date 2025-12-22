
import React, { useState, useEffect } from 'react';
import { dbService, generateHannamFilename } from '../../services/dbService';
import { useNavigate } from 'react-router-dom';
import { ContractTemplate, Member, Contract } from '../../types';
import { FileText, CheckCircle2, Info, Mail, Smartphone, Download, ArrowRight, ShieldCheck, MailCheck, User, Phone, DollarSign, Eye, AlertTriangle, Printer } from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';
import { PDFViewer } from '../../components/PDFViewer';
import { useAuth } from '../../App';

export const ContractCreator: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
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

  const handleTemplateSelect = (tmpl: ContractTemplate) => {
    setSelectedTemplate(tmpl);
    setFormData({
      ...formData,
      templateId: tmpl.id,
      typeName: tmpl.title
    });
    setStep(2);
  };

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
    const content = `
[THE HANNAM OFFICIAL DIGITAL CONTRACT]
--------------------------------------------------
DOCUMENT ID: ${finalContract.id.toUpperCase()}
DATE OF ISSUE: ${new Date(finalContract.createdAt).toLocaleString()}
--------------------------------------------------

1. CLIENT INFORMATION
- Name: ${finalContract.memberName}
- Contact: ${finalContract.memberPhone}
- Email: ${finalContract.memberEmail}

2. AGREEMENT DETAILS
- Contract Type: ${finalContract.typeName}
- Total Amount: KRW ${finalContract.amount.toLocaleString()}
- Status: COMPLETED & LEGALLY BINDING

--------------------------------------------------
THE HANNAM WELLNESS REGISTRY CENTER
    `;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6] font-sans flex flex-col">
      {/* Step Progress Header */}
      <header className="bg-[#1A362E] text-white p-8 flex justify-between items-center sticky top-0 z-50 shadow-lg">
         <div>
           <h1 className="text-2xl font-serif font-bold tracking-tight uppercase">Contract Initiation</h1>
           <p className="text-[9px] font-black text-hannam-gold uppercase tracking-widest mt-1">Registry Console — Step {step} of 4</p>
         </div>
         <div className="flex gap-6 items-center">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border transition-all duration-500 ${step === s ? 'bg-hannam-gold border-hannam-gold text-white scale-110 shadow-lg' : step > s ? 'bg-white border-white text-hannam-green' : 'bg-transparent border-white/20 text-white/30'}`}>
                   {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 4 && <div className={`w-8 h-[1px] ${step > s ? 'bg-white' : 'bg-white/10'}`} />}
              </div>
            ))}
         </div>
      </header>

      <div className="flex-1 flex flex-col items-center py-16 px-8">
        
        {/* STEP 1: Template Selection */}
        {step === 1 && (
          <div className="w-full max-w-5xl text-center animate-fade-in">
             <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4 uppercase tracking-widest text-hannam-green">Select Membership Plan</h2>
             <p className="text-gray-400 text-sm font-medium mb-12">계약서 작성을 시작하기 위해 등록할 멤버십 서식을 선택해 주세요.</p>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                {templates.map(tmpl => (
                  <div 
                    key={tmpl.id} 
                    onClick={() => handleTemplateSelect(tmpl)} 
                    className="bg-white p-16 rounded-[48px] border-2 border-transparent hover:border-[#1A362E] cursor-pointer transition-all shadow-sm hover:shadow-2xl group relative overflow-hidden text-left"
                  >
                     <div className="absolute top-0 right-0 w-24 h-24 bg-[#FBF9F6] rounded-bl-full -mr-8 -mt-8 group-hover:bg-hannam-gold/10 transition-colors" />
                     <FileText className="w-12 h-12 text-gray-200 mb-8 group-hover:text-hannam-green transition-all group-hover:scale-110" />
                     <h4 className="text-xl font-bold text-gray-900 group-hover:text-hannam-green">{tmpl.title}</h4>
                     <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-2 mb-4">Official PDF Form</p>
                     <ul className="text-[11px] text-gray-500 space-y-2 mt-4">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-hannam-gold" /> 프리미엄 케어 서식 포함</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-hannam-gold" /> 법적 효력 디지털 문서</li>
                     </ul>
                  </div>
                ))}
                {templates.length === 0 && (
                  <div className="col-span-3 py-20 text-center text-gray-300 italic font-bold">등록된 계약서 서식이 없습니다. 대시보드에서 템플릿을 먼저 등록하세요.</div>
                )}
             </div>
          </div>
        )}

        {/* STEP 2: Member Info */}
        {step === 2 && (
           <div className="w-full max-w-2xl bg-white p-16 rounded-[60px] shadow-2xl animate-fade-in border border-gray-50 relative">
              <div className="absolute top-10 left-10">
                <button onClick={() => setStep(1)} className="text-gray-300 hover:text-black transition-colors"><ArrowRight className="w-5 h-5 rotate-180" /></button>
              </div>
              <h2 className="text-3xl font-serif font-bold mb-12 text-center uppercase text-[#1A362E] tracking-tight">Identity Verification</h2>
              <div className="space-y-6">
                 <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input type="text" value={formData.memberPhone} onChange={e => handlePhoneChange(e.target.value)} className="w-full pl-16 pr-6 py-6 bg-[#FBF9F6] rounded-[24px] font-bold outline-none border border-transparent focus:border-hannam-gold transition-all" placeholder="회원 연락처 (ID)" />
                 </div>
                 <div className="relative">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input type="text" value={formData.memberName} onChange={e => setFormData({...formData, memberName: e.target.value})} className="w-full pl-16 pr-6 py-6 bg-[#FBF9F6] rounded-[24px] font-bold outline-none border border-transparent focus:border-hannam-gold transition-all" placeholder="회원 성함" />
                 </div>
                 <div className="relative">
                    <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full pl-16 pr-6 py-6 bg-[#FBF9F6] rounded-[24px] font-black outline-none border border-transparent focus:border-hannam-gold transition-all text-xl num-clean" placeholder="충전/결제 금액 (₩)" />
                 </div>
                 <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input type="email" value={formData.memberEmail} onChange={e => setFormData({...formData, memberEmail: e.target.value})} className="w-full pl-16 pr-6 py-6 bg-[#FBF9F6] rounded-[24px] font-bold outline-none border border-transparent focus:border-hannam-gold transition-all" placeholder="이메일 주소" />
                 </div>
                 <button 
                  onClick={() => setStep(3)} 
                  disabled={!formData.memberName || !formData.memberPhone || formData.amount <= 0}
                  className="w-full py-6 bg-[#1A362E] text-white rounded-[24px] font-black uppercase tracking-widest text-xs mt-8 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20"
                 >
                   Review & Authorize
                 </button>
              </div>
           </div>
        )}

        {/* STEP 3: Document Review & Signature */}
        {step === 3 && (
           <div className="w-full max-w-7xl animate-fade-in flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-10 px-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-hannam-green shadow-sm border border-gray-100">
                       <FileText className="w-6 h-6" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-serif font-bold text-gray-900 tracking-tight uppercase">Actual Form Review</h2>
                       <p className="text-[10px] font-black text-hannam-gold uppercase tracking-widest">업로드된 실제 서식의 모든 페이지를 확인하고 서명해 주세요.</p>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start w-full">
                 
                 {/* Left: Real Document Preview (Visual PDF Rendering or Uploaded File) */}
                 <div className="lg:col-span-8 bg-[#E5E5E5] p-8 rounded-[48px] shadow-inner border border-gray-200 overflow-hidden min-h-[85vh]">
                    {selectedTemplate?.fileData ? (
                       <div className="h-full rounded-2xl overflow-hidden shadow-2xl bg-white">
                          {selectedTemplate.fileData.startsWith('data:application/pdf') ? (
                             <PDFViewer url={selectedTemplate.fileData} className="h-[80vh]" />
                          ) : (
                             <div className="h-[80vh] overflow-y-auto no-scrollbar bg-white p-8">
                                <img src={selectedTemplate.fileData} alt="Uploaded Form" className="w-full shadow-lg" />
                             </div>
                          )}
                       </div>
                    ) : (
                       <div className="bg-white aspect-[1/1.414] w-full max-w-[800px] mx-auto p-16 md:p-24 shadow-2xl relative flex flex-col justify-between overflow-y-auto max-h-[85vh] no-scrollbar">
                          {/* Fallback to simulated document if no fileData */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                             <h2 className="text-[140px] font-serif font-bold -rotate-45 uppercase">THE HANNAM</h2>
                          </div>
                          <header className="text-center mb-16 border-b-2 border-gray-100 pb-12">
                             <h2 className="text-3xl font-serif font-bold text-hannam-green tracking-widest uppercase mb-2">Service Membership Agreement</h2>
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">Wellness Heritage Registry — Official Document</p>
                          </header>
                          <section className="space-y-10 relative z-10 flex-1">
                             <div className="grid grid-cols-2 gap-12 text-sm">
                                <div className="space-y-4">
                                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Member Details</p>
                                   <div className="space-y-2 font-medium">
                                      <p className="text-gray-900 font-bold text-lg">{formData.memberName} <span className="text-[10px] text-gray-300 font-normal ml-1">귀하</span></p>
                                      <p className="text-gray-500 num-clean">{formData.memberPhone}</p>
                                   </div>
                                </div>
                                <div className="space-y-4 text-right">
                                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 text-right">Registry Reference</p>
                                   <div className="space-y-2 font-medium">
                                      <p className="text-gray-900 num-clean font-bold uppercase tracking-widest text-xs">DOC-AUTH-{Date.now().toString().slice(-6)}</p>
                                      <p className="text-hannam-gold font-bold">{new Date().toLocaleDateString('ko-KR', {year:'numeric', month:'long', day:'numeric'})}</p>
                                   </div>
                                </div>
                             </div>
                             <div className="bg-[#FBF9F6] p-12 rounded-[32px] border border-gray-100 mt-12 shadow-inner">
                                <h4 className="text-lg font-serif font-bold text-gray-900 mb-8">Plan: {formData.typeName}</h4>
                                <h3 className="text-3xl font-black text-hannam-green num-clean">₩ {formData.amount.toLocaleString()}</h3>
                                <p className="text-[11px] text-gray-500 mt-6 leading-relaxed">본 계약은 '더 한남' 웰니스 센터 가입을 확약하는 공식 문서입니다.</p>
                             </div>
                          </section>
                       </div>
                    )}
                 </div>

                 {/* Right: Controls & Signing Area */}
                 <div className="lg:col-span-4 space-y-8 flex flex-col sticky top-32">
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-50">
                       <div className="flex items-center gap-3 mb-8">
                          <Info className="w-5 h-5 text-hannam-gold" />
                          <h4 className="text-[11px] font-black uppercase text-hannam-green tracking-widest">Digital Review Checklist</h4>
                       </div>
                       
                       <div className="space-y-4">
                          {[
                            { id: 'termsExplained', label: '상단 업로드된 서식의 모든 조항을 읽고 이해함' },
                            { id: 'refundPolicyConfirmed', label: '서비스 차감 방식 및 환불 정책 확인 완료' },
                            { id: 'expiryDateConfirmed', label: '디지털 서명의 법적 효력 인지 및 확인' }
                          ].map(item => (
                            <div 
                              key={item.id} 
                              className="flex items-center gap-4 cursor-pointer group" 
                              onClick={() => setExplanationCheck(prev => ({...prev, [item.id]: !prev[item.id as keyof typeof explanationCheck]}))}
                            >
                               <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${explanationCheck[item.id as keyof typeof explanationCheck] ? 'bg-[#1A362E] border-[#1A362E] text-white' : 'bg-white border-gray-100 group-hover:border-hannam-gold'}`}>
                                  {explanationCheck[item.id as keyof typeof explanationCheck] && <CheckCircle2 className="w-4 h-4" />}
                               </div>
                               <span className={`text-[12px] font-bold transition-colors ${explanationCheck[item.id as keyof typeof explanationCheck] ? 'text-gray-900' : 'text-gray-300'}`}>
                                 {item.label}
                               </span>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className={`bg-white p-10 rounded-[40px] shadow-sm border transition-all duration-500 ${allExplained ? 'opacity-100 scale-100' : 'opacity-20 scale-95 pointer-events-none'}`}>
                       <h3 className="text-[11px] font-black text-hannam-green mb-8 uppercase text-center tracking-widest">Sign to Authorize</h3>
                       <div className="h-[280px]">
                          <SignaturePad 
                            onSave={(url) => setFormData({...formData, signature: url})} 
                            onClear={() => setFormData({...formData, signature: ''})} 
                          />
                       </div>
                       <p className="text-[9px] text-gray-300 text-center mt-4 font-bold uppercase tracking-wider">서명이 실시간으로 계약 데이터에 바인딩됩니다.</p>
                    </div>

                    <div className="space-y-4">
                       <button 
                         onClick={handleComplete} 
                         disabled={!formData.signature || isProcessing || !allExplained} 
                         className="w-full py-7 bg-[#1A362E] text-white rounded-[24px] text-[12px] font-black uppercase tracking-widest shadow-2xl disabled:opacity-5 hover:bg-black transition-all active:scale-[0.98]"
                       >
                          {isProcessing ? 'Finalizing Registry...' : 'Complete & Store Registry'}
                       </button>
                       {!allExplained && (
                         <div className="flex items-center justify-center gap-2 text-amber-500">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <p className="text-[10px] font-bold uppercase">Check all review items above</p>
                         </div>
                       )}
                       <button onClick={() => setStep(2)} className="w-full text-[10px] font-black text-gray-300 uppercase tracking-widest text-center hover:text-black transition-colors">Go Back to Info</button>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* STEP 4: Success Result */}
        {step === 4 && finalContract && (
           <div className="w-full max-w-4xl space-y-10 animate-fade-in flex flex-col items-center">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-serif font-bold text-gray-900 uppercase tracking-[0.2em]">Authorized Successfully</h2>
                <p className="text-gray-400 font-medium mt-2">계약이 안전하게 체결되었으며 아카이브에 저장되었습니다.</p>
              </div>
              
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                       <MailCheck className="w-5 h-5 text-hannam-gold" />
                       <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Digital Archive Status</span>
                    </div>
                    <div className="flex justify-between items-center p-5 bg-[#FBFBFB] rounded-2xl">
                       <div>
                          <p className="text-xs font-bold text-gray-900">Email Receipt</p>
                          <p className="text-[9px] text-gray-400 font-medium">{finalContract.memberEmail}</p>
                       </div>
                       <span className="text-[9px] font-black text-green-500 uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Sent</span>
                    </div>
                    <div className="flex justify-between items-center p-5 bg-[#FBFBFB] rounded-2xl">
                       <div>
                          <p className="text-xs font-bold text-gray-900">Registry Log</p>
                          <p className="text-[9px] text-gray-400 font-medium">HANNAM-DOC-${finalContract.id.slice(-4)}</p>
                       </div>
                       <span className="text-[9px] font-black text-green-500 uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Stored</span>
                    </div>
                 </div>
                 
                 <div className="bg-[#1A362E] p-12 rounded-[40px] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                       <ShieldCheck className="w-20 h-20" />
                    </div>
                    <div>
                       <h4 className="text-2xl font-serif font-bold text-hannam-gold uppercase tracking-widest">{finalContract.typeName}</h4>
                       <h5 className="text-4xl font-bold mt-4 num-clean">₩ {finalContract.amount.toLocaleString()}</h5>
                       <p className="text-[9px] font-bold text-white/30 uppercase mt-2 tracking-widest">Transaction Verified: {finalContract.id.toUpperCase()}</p>
                    </div>
                    <button 
                      onClick={handleDownload} 
                      className="w-full py-5 bg-white text-[#1A362E] rounded-2xl text-[10px] font-black uppercase mt-12 flex items-center justify-center gap-3 hover:bg-hannam-gold hover:text-white transition-all shadow-lg"
                    >
                       <Download className="w-4 h-4" /> Download Official PDF Summary
                    </button>
                 </div>
              </div>
              
              <div className="flex gap-6 mt-8">
                <button 
                  onClick={() => navigate('/admin/contracts')} 
                  className="px-12 py-5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black hover:border-black transition-all"
                >
                  Go to Registry
                </button>
                <button 
                  onClick={() => { setStep(1); setFormData({ ...formData, signature: '', amount: 0, memberName: '', memberPhone: '', memberEmail: '' }); setSelectedTemplate(null); }} 
                  className="px-12 py-5 bg-hannam-gold text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  Initiate Another
                </button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

const MailCheck = ({className}: {className?: string}) => <Mail className={className} />;
