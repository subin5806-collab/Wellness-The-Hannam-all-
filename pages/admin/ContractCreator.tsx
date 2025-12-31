
import React, { useState, useEffect } from 'react';
import { dbService, generateHannamFilename } from '../../services/dbService';
import { useNavigate } from 'react-router-dom';
import { ContractTemplate, Member, Contract } from '../../types';
import { FileText, CheckCircle2, Search, User, Phone, Mail, DollarSign, ArrowRight, ShieldCheck, AlertCircle, Info, Download, Trash2, Smartphone, UserPlus } from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';
import { PDFViewer } from '../../components/PDFViewer';
import { useAuth } from '../../AuthContext';

type CreationMode = 'SEARCH' | 'MANUAL';

export const ContractCreator: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State Management
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<CreationMode>('SEARCH');
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalContract, setFinalContract] = useState<Contract | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);

  // Search Track States
  const [searchNo, setSearchNo] = useState('');
  const [memberFound, setMemberFound] = useState<Member | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    memberEmail: '',
    memberPhone: '',
    memberGender: '여성',
    memberJoinedAt: '',
    adminMemo: '',
    typeName: '',
    amount: 0,
    signature: '',
  });

  const [checkList, setCheckList] = useState({
    confirmed: false,
    termsRead: false,
    legalBinding: false
  });

  useEffect(() => {
    dbService.getTemplates().then(setTemplates);
  }, []);

  // Handle Member Search
  const handleSearch = async () => {
    if (!searchNo) return;
    try {
      const m = await dbService.getMemberByNo(searchNo);
      setMemberFound(m);
      setFormData(prev => ({
        ...prev,
        memberId: m.id,
        memberName: m.name,
        memberEmail: m.email,
        memberPhone: m.phone,
        memberJoinedAt: m.joinedAt
      }));
    } catch (e: any) {
      alert(e.message);
      setMemberFound(null);
    }
  };

  // Handle Manual Mode Switch
  const handleModeSwitch = (m: CreationMode) => {
    setMode(m);
    setMemberFound(null);
    setSearchNo('');
    setFormData({
      memberId: '',
      memberName: '',
      memberEmail: '',
      memberPhone: '',
      memberGender: '여성',
      memberJoinedAt: '',
      adminMemo: '',
      typeName: '',
      amount: 0,
      signature: '',
    });
  };

  const handleFinalSubmit = async () => {
    if (!formData.signature) return alert('디지털 서명을 완료해주세요.');
    setIsProcessing(true);
    try {
      const result = await dbService.createContract({
        ...formData,
        type: 'MEMBERSHIP',
        adminName: user?.name
      });
      setFinalContract(result.contract);
      setStep(4);
    } catch (e) {
      alert('계약 생성 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6] font-sans flex flex-col">
      {/* Progress Header */}
      <header className="bg-hannam-green text-white p-8 flex justify-between items-center sticky top-0 z-50 shadow-lg">
         <div>
           <h1 className="text-2xl font-serif font-bold tracking-tight uppercase">Registry Initiation</h1>
           <p className="text-[9px] font-black text-hannam-gold uppercase tracking-widest mt-1">Step {step} of 4 — Wellness Management</p>
         </div>
         <div className="flex gap-6 items-center">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${step === s ? 'bg-hannam-gold border-hannam-gold text-white scale-110' : step > s ? 'bg-white border-white text-hannam-green' : 'bg-transparent border-white/20 text-white/30'}`}>
                   {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 4 && <div className={`w-8 h-[1px] ${step > s ? 'bg-white' : 'bg-white/10'}`} />}
              </div>
            ))}
         </div>
      </header>

      <div className="flex-1 flex flex-col items-center py-16 px-8 max-w-7xl mx-auto w-full">
        
        {/* STEP 1: Member Identification (CORE) */}
        {step === 1 && (
          <div className="w-full max-w-2xl animate-smooth-fade">
             <div className="text-center mb-12">
                <h2 className="text-3xl font-serif font-bold text-hannam-green uppercase tracking-wide">Identity Verification</h2>
                <p className="text-gray-400 text-sm mt-2">계약을 진행할 회원을 확인하거나 수기로 정보를 입력하세요.</p>
             </div>

             {/* Mode Selection Tabs */}
             <div className="flex bg-white p-1 rounded-2xl border border-hannam-border shadow-sm mb-10">
                <button 
                  onClick={() => handleModeSwitch('SEARCH')} 
                  className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'SEARCH' ? 'bg-hannam-green text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  ① 회원번호로 조회
                </button>
                <button 
                  onClick={() => handleModeSwitch('MANUAL')} 
                  className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'MANUAL' ? 'bg-hannam-green text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  ② 회원 미등록 (수기 입력)
                </button>
             </div>

             {/* Search Track UI */}
             {mode === 'SEARCH' && (
               <div className="space-y-6">
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input 
                      type="text" 
                      value={searchNo}
                      onChange={e => setSearchNo(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-16 pr-32 py-6 bg-white rounded-3xl font-bold outline-none border border-hannam-border focus:border-hannam-gold shadow-sm" 
                      placeholder="회원번호(휴대폰번호) 입력" 
                    />
                    <button onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2 bg-hannam-green text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">조회</button>
                  </div>

                  {memberFound && (
                    <div className="bg-white p-10 rounded-[40px] border border-hannam-gold shadow-hannam-deep animate-smooth-fade">
                       <div className="flex justify-between items-start mb-8">
                          <div>
                             <h4 className="text-[10px] font-black text-hannam-gold uppercase tracking-widest mb-2">Member Identified</h4>
                             <h3 className="text-2xl font-serif font-bold text-hannam-green">{memberFound.name} 귀하</h3>
                          </div>
                          <div className="px-4 py-1.5 bg-hannam-bg rounded-full text-[9px] font-bold text-hannam-muted uppercase">{memberFound.tier} Tier</div>
                       </div>
                       <div className="grid grid-cols-2 gap-8 py-6 border-t border-gray-50">
                          <div><p className="text-[9px] font-bold text-gray-300 uppercase mb-1">Contact</p><p className="text-sm font-bold num-data">{memberFound.phone}</p></div>
                          <div><p className="text-[9px] font-bold text-gray-300 uppercase mb-1">Email</p><p className="text-sm font-bold">{memberFound.email}</p></div>
                       </div>
                       <p className="text-center text-[11px] font-medium text-hannam-muted mt-8">“이 회원으로 계약서를 작성하시겠습니까?”</p>
                       <button onClick={() => setStep(2)} className="w-full py-5 bg-hannam-green text-white rounded-2xl text-[11px] font-black uppercase tracking-widest mt-6 shadow-xl hover:bg-black">확인 및 다음 단계</button>
                    </div>
                  )}
               </div>
             )}

             {/* Manual Track UI */}
             {mode === 'MANUAL' && (
               <div className="bg-white p-12 rounded-[40px] border border-hannam-border shadow-hannam-soft space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">이름 *</label>
                        <input type="text" value={formData.memberName} onChange={e => setFormData({...formData, memberName: e.target.value})} className="w-full p-5 bg-hannam-bg rounded-2xl font-bold text-xs outline-none" placeholder="실명 입력" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">성별</label>
                        <select value={formData.memberGender} onChange={e => setFormData({...formData, memberGender: e.target.value})} className="w-full p-5 bg-hannam-bg rounded-2xl font-bold text-xs outline-none">
                           <option>여성</option><option>남성</option>
                        </select>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">휴대폰 번호 *</label>
                     <input type="text" value={formData.memberPhone} onChange={e => setFormData({...formData, memberPhone: e.target.value})} className="w-full p-5 bg-hannam-bg rounded-2xl font-bold text-xs outline-none num-data" placeholder="010-0000-0000" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">이메일 주소 *</label>
                     <input type="email" value={formData.memberEmail} onChange={e => setFormData({...formData, memberEmail: e.target.value})} className="w-full p-5 bg-hannam-bg rounded-2xl font-bold text-xs outline-none" placeholder="member@hannam.com" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">메모 (선택)</label>
                     <textarea rows={2} value={formData.adminMemo} onChange={e => setFormData({...formData, adminMemo: e.target.value})} className="w-full p-5 bg-hannam-bg rounded-2xl font-bold text-xs outline-none" placeholder="특이사항 기록" />
                  </div>
                  <button 
                    disabled={!formData.memberName || !formData.memberPhone || !formData.memberEmail}
                    onClick={() => setStep(2)} 
                    className="w-full py-5 bg-hannam-green text-white rounded-2xl text-[11px] font-black uppercase tracking-widest mt-4 shadow-xl disabled:opacity-20"
                  >
                    계약서 작성 활성화
                  </button>
               </div>
             )}
          </div>
        )}

        {/* STEP 2: Template Selection */}
        {step === 2 && (
          <div className="w-full animate-smooth-fade">
             <div className="text-center mb-16">
                <h2 className="text-3xl font-serif font-bold text-hannam-green uppercase tracking-wider">Plan Configuration</h2>
                <p className="text-gray-400 text-sm mt-2">등록할 멤버십 프로그램 및 금액을 설정해 주세요.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {templates.map(tmpl => (
                  <div 
                    key={tmpl.id} 
                    onClick={() => { setSelectedTemplate(tmpl); setFormData({...formData, typeName: tmpl.title}); }}
                    className={`bg-white p-12 rounded-[48px] border-2 transition-all cursor-pointer shadow-sm relative overflow-hidden group ${selectedTemplate?.id === tmpl.id ? 'border-hannam-green shadow-hannam-deep scale-105' : 'border-transparent hover:border-hannam-gold'}`}
                  >
                     <FileText className={`w-10 h-10 mb-6 transition-colors ${selectedTemplate?.id === tmpl.id ? 'text-hannam-green' : 'text-gray-200 group-hover:text-hannam-gold'}`} />
                     <h4 className="text-lg font-bold text-gray-900">{tmpl.title}</h4>
                     <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-2">Digital Master Form</p>
                     {selectedTemplate?.id === tmpl.id && <div className="absolute top-6 right-6 w-3 h-3 bg-hannam-green rounded-full animate-pulse" />}
                  </div>
                ))}
             </div>

             <div className={`max-w-2xl mx-auto space-y-8 transition-all duration-700 ${selectedTemplate ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
                <div className="bg-white p-10 rounded-[40px] border border-hannam-border shadow-hannam-soft">
                   <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1 mb-4 block">Transaction Amount (KRW)</label>
                   <div className="relative">
                      <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-hannam-gold" />
                      <input 
                        type="number" 
                        value={formData.amount} 
                        onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                        className="w-full pl-16 pr-8 py-6 bg-hannam-bg rounded-3xl font-black text-2xl outline-none border border-transparent focus:border-hannam-gold num-data" 
                        placeholder="0"
                      />
                   </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 py-5 bg-white border border-hannam-border text-hannam-muted rounded-2xl text-[10px] font-black uppercase tracking-widest">이전 단계</button>
                  <button onClick={() => setStep(3)} disabled={!formData.typeName || formData.amount <= 0} className="flex-[2] py-5 bg-hannam-green text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl disabled:opacity-20">검토 및 서명 단계</button>
                </div>
             </div>
          </div>
        )}

        {/* STEP 3: Document Review & Digital Seal */}
        {step === 3 && (
          <div className="w-full grid grid-cols-12 gap-12 animate-smooth-fade">
             {/* Left: Document View */}
             <div className="col-span-8 bg-[#E5E5E5] p-8 rounded-[48px] shadow-inner border border-gray-200 min-h-[85vh]">
                <div className="h-full rounded-2xl overflow-hidden shadow-2xl bg-white relative">
                   {selectedTemplate?.fileData ? (
                      <PDFViewer url={selectedTemplate.fileData} className="h-full" />
                   ) : (
                      <div className="p-20 flex flex-col items-center justify-center text-center">
                         <Info className="w-16 h-16 text-gray-100 mb-6" />
                         <p className="text-gray-300 font-serif italic text-lg uppercase tracking-widest">Digital Preview Preparing...</p>
                      </div>
                   )}
                </div>
             </div>

             {/* Right: Signature & Action */}
             <div className="col-span-4 space-y-8 flex flex-col sticky top-32">
                <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-50 space-y-6">
                   <h3 className="text-[11px] font-black text-hannam-green uppercase tracking-widest border-b border-gray-50 pb-4">Digital Seal Verification</h3>
                   <div className="space-y-4">
                      {[
                        { id: 'confirmed', label: '상기 기재된 모든 정보의 정확성 확인' },
                        { id: 'termsRead', label: '디지털 계약의 법적 효력 및 조항 인지' },
                        { id: 'legalBinding', label: '서명 즉시 본 계약이 체결됨을 확인' }
                      ].map(item => (
                        <div key={item.id} className="flex items-center gap-4 cursor-pointer" onClick={() => setCheckList(p => ({...p, [item.id]: !p[item.id as keyof typeof checkList]}))}>
                           <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${checkList[item.id as keyof typeof checkList] ? 'bg-hannam-green border-hannam-green text-white' : 'border-gray-200'}`}>
                              {checkList[item.id as keyof typeof checkList] && <CheckCircle2 className="w-3.5 h-3.5" />}
                           </div>
                           <span className={`text-[11px] font-bold ${checkList[item.id as keyof typeof checkList] ? 'text-gray-900' : 'text-gray-300'}`}>{item.label}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className={`bg-white p-8 rounded-[40px] border shadow-sm transition-all duration-500 ${Object.values(checkList).every(v => v) ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
                   <p className="text-[10px] font-black text-hannam-green uppercase tracking-widest text-center mb-6">Authorize Document</p>
                   <div className="h-48">
                      <SignaturePad 
                        onSave={(url) => setFormData({...formData, signature: url})} 
                        onClear={() => setFormData({...formData, signature: ''})} 
                      />
                   </div>
                </div>

                <div className="space-y-4">
                   <button 
                     onClick={handleFinalSubmit} 
                     disabled={!formData.signature || isProcessing || !Object.values(checkList).every(v => v)}
                     className="w-full py-7 bg-hannam-green text-white rounded-[24px] text-[12px] font-black uppercase tracking-widest shadow-2xl disabled:opacity-5"
                   >
                      {isProcessing ? 'Transmitting Registry...' : 'Complete & Send Contract'}
                   </button>
                   <button onClick={() => setStep(2)} className="w-full text-[10px] font-black text-gray-300 uppercase tracking-widest text-center hover:text-black transition-colors">Go Back</button>
                </div>
             </div>
          </div>
        )}

        {/* STEP 4: Success Result */}
        {step === 4 && finalContract && (
           <div className="w-full max-w-3xl space-y-12 animate-smooth-fade flex flex-col items-center">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
                 <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <div className="text-center">
                 <h2 className="text-4xl font-serif font-bold text-hannam-green uppercase tracking-[0.2em]">Registry Authorized</h2>
                 <p className="text-gray-400 font-medium mt-4">계약이 안전하게 체결되었으며 회원 이메일로 발송되었습니다.</p>
              </div>

              <div className="w-full bg-white p-12 rounded-[48px] border border-hannam-border shadow-hannam-deep space-y-10">
                 <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <div><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Member</p><p className="text-lg font-bold text-gray-900">{finalContract.memberName}</p></div>
                       <div><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Plan</p><p className="text-lg font-bold text-hannam-gold">{finalContract.typeName}</p></div>
                    </div>
                    <div className="text-right space-y-6">
                       <div><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Transaction</p><p className="text-3xl font-black text-hannam-green num-data">₩ {finalContract.amount.toLocaleString()}</p></div>
                       <div><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Status</p><span className="text-[10px] font-black text-green-600 uppercase flex items-center justify-end gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Legally Verified</span></div>
                    </div>
                 </div>
                 <div className="p-6 bg-hannam-bg rounded-3xl flex justify-between items-center">
                    <div className="flex items-center gap-4">
                       <Mail className="w-5 h-5 text-hannam-gold" />
                       <span className="text-[11px] font-bold text-hannam-muted">{finalContract.memberEmail}</span>
                    </div>
                    <span className="text-[9px] font-black text-hannam-muted uppercase tracking-widest">자동 발송 완료</span>
                 </div>
              </div>

              <div className="flex gap-6">
                 <button onClick={() => navigate('/admin/contracts')} className="px-12 py-5 bg-white border border-hannam-border text-hannam-muted rounded-2xl text-[10px] font-black uppercase tracking-widest">목록으로 이동</button>
                 <button onClick={() => { setStep(1); setFormData({...formData, signature: '', amount: 0}); setMemberFound(null); }} className="px-12 py-5 bg-hannam-green text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">신규 계약 추가</button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
