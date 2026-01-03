
import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useNavigate } from 'react-router-dom';
import { ContractTemplate, Member, Contract, Program } from '../../types';
import { FileText, CheckCircle2, Search, DollarSign, ShieldCheck, Mail, ArrowLeft, ChevronRight } from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';
import { useAuth } from '../../AuthContext';

type CreationMode = 'SEARCH' | 'MANUAL';

export const ContractCreator: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<CreationMode>('SEARCH');
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalContract, setFinalContract] = useState<Contract | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const [searchNo, setSearchNo] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [memberFound, setMemberFound] = useState<Member | null>(null);

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
    dbService.getPrograms().then(setPrograms);
  }, []);

  const handleSearch = async () => {
    if (!searchNo) return;
    const results = await dbService.searchMembers(searchNo);
    setSearchResults(results);
    if (results.length === 1) {
      selectMember(results[0]);
    }
  };

  const selectMember = (m: Member) => {
    setMemberFound(m);
    setSearchResults([]);
    setFormData(prev => ({
      ...prev,
      memberId: m.id,
      memberName: m.name,
      memberEmail: m.email,
      memberPhone: m.phone,
      memberJoinedAt: m.joinedAt
    }));
  };

  const handleProgramSelect = (id: string) => {
    const prog = programs.find(p => p.id === id);
    if (prog) {
      setSelectedProgram(prog);
      setFormData(prev => ({
        ...prev,
        typeName: prog.name,
        amount: prog.basePrice
      }));
    }
  };

  const handleFinalSubmit = async () => {
    if (!formData.signature) return alert('관리자 승인 서명을 완료해주세요.');
    setIsProcessing(true);
    try {
      const result = await dbService.createContract({
        ...formData,
        type: 'MEMBERSHIP',
        adminName: user?.name,
        pdfContent: `본 계약은 더 한남과(와) ${formData.memberName} 회원 간의 멤버십 계약으로, ₩${formData.amount.toLocaleString()}의 크레딧 충전을 포함합니다.`
      });
      setFinalContract(result.contract);
      setStep(4);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-hannam-bg font-sans flex flex-col animate-smooth-fade">
      <header className="bg-white px-10 py-6 border-b border-hannam-border flex justify-between items-center sticky top-0 z-50 shadow-sm">
         <div>
           <h1 className="text-xl font-serif font-bold text-hannam-green tracking-tight uppercase">Initiate Agreement</h1>
           <p className="text-[10px] font-black text-hannam-gold uppercase tracking-[0.2em] mt-1">단계 {step} / 4 — 전자 계약 구성 진행 중</p>
         </div>
         <button onClick={() => navigate('/admin/contracts')} className="text-[12px] font-bold text-hannam-muted hover:text-red-500 transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> 작성 취소 및 나가기
         </button>
      </header>

      <div className="flex-1 flex flex-col items-center py-20 px-8 max-w-5xl mx-auto w-full">
        {step === 1 && (
          <div className="w-full max-w-2xl space-y-12">
             <div className="flex bg-white p-1.5 rounded-[24px] border border-hannam-border shadow-hannam-soft">
                <button onClick={() => setMode('SEARCH')} className={`flex-1 py-4.5 rounded-[20px] text-[12px] font-bold transition-all ${mode === 'SEARCH' ? 'bg-hannam-bg text-hannam-green shadow-inner' : 'text-hannam-muted hover:text-hannam-text'}`}>회원 정보 검색</button>
                <button onClick={() => setMode('MANUAL')} className={`flex-1 py-4.5 rounded-[20px] text-[12px] font-bold transition-all ${mode === 'MANUAL' ? 'bg-hannam-bg text-hannam-green shadow-inner' : 'text-hannam-muted hover:text-hannam-text'}`}>직접 정보 입력</button>
             </div>

             {mode === 'SEARCH' && (
               <div className="space-y-6">
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-hannam-border" />
                    <input 
                      type="text" 
                      value={searchNo} 
                      onChange={e => setSearchNo(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleSearch()} 
                      className="w-full pl-16 pr-40 py-6 bg-white rounded-[32px] font-bold text-sm border border-hannam-border focus:border-hannam-gold outline-none shadow-hannam-soft transition-all" 
                      placeholder="회원 이름 또는 연락처 뒷번호 검색..." 
                    />
                    <button onClick={handleSearch} className="absolute right-4 top-1/2 -translate-y-1/2 bg-hannam-green text-white px-8 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all">검색</button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="bg-white border border-hannam-border rounded-[32px] overflow-hidden shadow-hannam-deep max-h-72 overflow-y-auto no-scrollbar animate-in slide-in-from-top-4 duration-300">
                      {searchResults.map(m => (
                        <div key={m.id} onClick={() => selectMember(m)} className="p-6 border-b border-hannam-border last:border-0 hover:bg-hannam-bg/40 cursor-pointer flex justify-between items-center transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-hannam-bg rounded-full flex items-center justify-center text-hannam-green font-serif font-black">{m.name[0]}</div>
                            <div>
                              <p className="text-[14px] font-black text-hannam-text">{m.name} 님</p>
                              <p className="text-[11px] text-hannam-muted font-bold num-data">{m.phone}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-hannam-border" />
                        </div>
                      ))}
                    </div>
                  )}

                  {memberFound && (
                    <div className="bg-white p-12 rounded-[48px] border border-hannam-gold/40 shadow-hannam-deep animate-in zoom-in-95 duration-400">
                       <div className="flex justify-between items-start mb-10">
                          <div>
                             <p className="text-[10px] font-black text-hannam-gold uppercase tracking-[0.3em] mb-1">Target Client</p>
                             <h3 className="text-2xl font-serif font-bold text-hannam-text">{memberFound.name} 님</h3>
                          </div>
                          <ShieldCheck className="w-8 h-8 text-hannam-green opacity-20" />
                       </div>
                       <div className="grid grid-cols-2 gap-10 py-8 border-y border-hannam-border">
                          <div><p className="text-[10px] font-black text-hannam-muted uppercase tracking-widest mb-1.5">연락처</p><p className="text-[14px] font-bold text-hannam-text num-data">{memberFound.phone}</p></div>
                          <div><p className="text-[10px] font-black text-hannam-muted uppercase tracking-widest mb-1.5">이메일</p><p className="text-[14px] font-bold text-hannam-text">{memberFound.email}</p></div>
                       </div>
                       <button onClick={() => setStep(2)} className="w-full py-6 bg-hannam-green text-white rounded-[24px] text-[13px] font-black uppercase tracking-widest mt-10 shadow-hannam-deep hover:bg-black active:scale-95 transition-all">다음 단계로 이동</button>
                    </div>
                  )}
               </div>
             )}
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-2xl space-y-10">
             <div className="bg-white p-12 rounded-[48px] border border-hannam-border shadow-hannam-deep space-y-10">
                <div className="space-y-3">
                   <label className="text-[12px] font-black text-hannam-muted uppercase tracking-widest ml-1">멤버십 프로그램 선택</label>
                   <select 
                     onChange={(e) => handleProgramSelect(e.target.value)}
                     className="w-full p-5 bg-hannam-bg/50 border border-hannam-border rounded-[24px] font-bold text-[14px] outline-none focus:bg-white focus:border-hannam-gold transition-all"
                   >
                      <option value="">프로그램을 선택하세요</option>
                      {programs.map(p => <option key={p.id} value={p.id}>{p.name} (₩{p.basePrice.toLocaleString()})</option>)}
                   </select>
                </div>
                <div className="space-y-3">
                   <label className="text-[12px] font-black text-hannam-muted uppercase tracking-widest ml-1">최종 계약 금액 (₩)</label>
                   <div className="relative">
                      <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-hannam-gold" />
                      <input 
                        type="number" 
                        value={formData.amount} 
                        onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                        className="w-full pl-16 pr-8 py-7 bg-hannam-bg/80 border border-hannam-border rounded-[32px] font-black text-3xl outline-none num-data focus:bg-white focus:border-hannam-gold transition-all" 
                      />
                   </div>
                   <p className="text-[11px] text-hannam-gold font-bold mt-4 ml-2">* 계약 체결 시 해당 금액이 즉시 회원 잔액으로 합산됩니다.</p>
                </div>
                <div className="flex gap-4 pt-6">
                  <button onClick={() => setStep(1)} className="flex-1 py-5.5 bg-hannam-bg text-hannam-muted rounded-[24px] text-[12px] font-bold uppercase tracking-widest border border-hannam-border">이전 단계</button>
                  <button onClick={() => setStep(3)} disabled={!formData.typeName || formData.amount <= 0} className="flex-[2] py-5.5 bg-hannam-green text-white rounded-[24px] text-[12px] font-black uppercase tracking-widest shadow-xl disabled:opacity-20 hover:bg-black transition-all active:scale-95">계약서 초안 확인</button>
                </div>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="w-full grid grid-cols-12 gap-12 animate-smooth-fade">
             <div className="col-span-8 bg-hannam-bg p-10 rounded-[56px] border border-hannam-border shadow-inner h-[80vh] overflow-hidden">
                <div className="h-full bg-white rounded-3xl shadow-2xl p-16 space-y-12 overflow-y-auto no-scrollbar relative border border-hannam-border">
                   <div className="text-center border-b border-hannam-border pb-12">
                      <h2 className="text-3xl font-serif font-bold uppercase text-hannam-green tracking-widest">Membership Agreement</h2>
                      <p className="text-[11px] font-black text-hannam-gold mt-3 tracking-[0.3em]">더 한남 공식 전자 계약 증명서</p>
                   </div>
                   <div className="grid grid-cols-2 gap-12">
                      <div className="space-y-8">
                         <div><p className="text-[10px] font-black text-hannam-muted uppercase tracking-widest mb-1.5">계약 대상자</p><p className="text-[16px] font-black text-hannam-text">{formData.memberName} 님</p></div>
                         <div><p className="text-[10px] font-black text-hannam-muted uppercase tracking-widest mb-1.5">연락처</p><p className="text-[16px] font-bold text-hannam-text num-data">{formData.memberPhone}</p></div>
                      </div>
                      <div className="text-right space-y-8">
                         <div><p className="text-[10px] font-black text-hannam-muted uppercase tracking-widest mb-1.5">멤버십 프로그램</p><p className="text-[16px] font-black text-hannam-gold">{formData.typeName}</p></div>
                         <div><p className="text-[10px] font-black text-hannam-muted uppercase tracking-widest mb-1.5">계약 총액</p><p className="text-[24px] font-black text-hannam-green num-data">₩ {formData.amount.toLocaleString()}</p></div>
                      </div>
                   </div>
                   <div className="pt-12 border-t border-hannam-bg space-y-6">
                      <p className="text-[13px] text-hannam-text leading-relaxed font-medium">
                         1. 본 계약은 체결 즉시 효력이 발생하며, 납부된 금액은 회원님의 멤버십 크레딧으로 즉시 적립됩니다.<br/>
                         2. 서비스 이용 시 회원 등급에 따른 차감 정책 및 취소 규정이 적용됩니다.<br/>
                         3. 환불 시에는 기 사용분 및 서비스 수수료를 제외한 금액이 반환됩니다.
                      </p>
                   </div>
                   <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                      <ShieldCheck className="w-64 h-64 text-hannam-green" />
                   </div>
                </div>
             </div>
             <div className="col-span-4 space-y-8 flex flex-col">
                <div className="bg-white p-10 rounded-[40px] border border-hannam-border shadow-hannam-soft space-y-8">
                   <h3 className="text-[12px] font-black uppercase text-hannam-gold tracking-widest">최종 확인 사항</h3>
                   <div className="space-y-5">
                      {[
                        { key: 'confirmed', label: '기재된 계약 정보가 정확함' },
                        { key: 'termsRead', label: '이용 약관 및 취소 정책 고지함' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center gap-4 cursor-pointer group" onClick={() => setCheckList(p => ({...p, [item.key]: !p[item.key] as any}))}>
                           <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checkList[item.key as keyof typeof checkList] ? 'bg-hannam-green border-hannam-green' : 'border-hannam-border'}`}>
                              <CheckCircle2 className={`w-4 h-4 ${checkList[item.key as keyof typeof checkList] ? 'text-white' : 'text-transparent'}`} />
                           </div>
                           <span className={`text-[12px] font-bold ${checkList[item.key as keyof typeof checkList] ? 'text-hannam-text' : 'text-hannam-muted'}`}>{item.label}</span>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-hannam-border shadow-hannam-soft h-72 flex flex-col">
                   <p className="text-[10px] font-black text-hannam-gold uppercase tracking-widest mb-4 ml-2">관리자 승인 서명</p>
                   <div className="flex-1"><SignaturePad onSave={url => setFormData({...formData, signature: url})} onClear={() => setFormData({...formData, signature: ''})} /></div>
                </div>
                <button 
                  onClick={handleFinalSubmit} 
                  disabled={!formData.signature || !checkList.confirmed || !checkList.termsRead || isProcessing} 
                  className="w-full py-7 bg-hannam-green text-white rounded-[32px] text-[14px] font-black uppercase tracking-widest shadow-hannam-deep disabled:opacity-10 hover:bg-black transition-all active:scale-95"
                >
                  {isProcessing ? '처리 중...' : '계약 확정 및 전송'}
                </button>
             </div>
          </div>
        )}

        {step === 4 && finalContract && (
           <div className="w-full max-w-2xl space-y-12 animate-in zoom-in-95 duration-500 flex flex-col items-center">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border border-green-100 shadow-inner">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <div className="text-center">
                 <h2 className="text-3xl font-serif font-bold text-hannam-green uppercase tracking-tight">Contract Authorized</h2>
                 <p className="text-hannam-muted font-bold mt-3 text-[14px]">계약이 성공적으로 체결되었습니다. 회원 잔액 충전 및 이메일 전송 완료.</p>
              </div>
              <div className="w-full bg-white p-12 rounded-[56px] border border-hannam-border shadow-hannam-deep space-y-10">
                 <div className="flex justify-between items-center pb-10 border-b border-hannam-bg">
                    <div>
                       <p className="text-[10px] font-black text-hannam-muted uppercase tracking-widest mb-1.5">체결 대상 회원</p>
                       <p className="text-xl font-black text-hannam-text">{finalContract.memberName} 님</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-hannam-muted uppercase tracking-widest mb-1.5">최종 결제 금액</p>
                       <p className="text-3xl font-black text-hannam-gold num-data">₩ {finalContract.amount.toLocaleString()}</p>
                    </div>
                 </div>
                 <button onClick={() => navigate('/admin/contracts')} className="w-full py-6 bg-hannam-bg text-hannam-muted rounded-[24px] text-[13px] font-black uppercase tracking-widest border border-hannam-border hover:text-hannam-text transition-all">계약서 보관함으로 이동</button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
