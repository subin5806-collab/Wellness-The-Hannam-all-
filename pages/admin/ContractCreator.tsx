
import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useNavigate } from 'react-router-dom';
import { ContractTemplate, Member, Contract, Program } from '../../types';
import { FileText, CheckCircle2, Search, DollarSign, ShieldCheck, Mail, ArrowLeft, ChevronRight, TrendingUp } from 'lucide-react';
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
  const [updatedMember, setUpdatedMember] = useState<Member | null>(null);
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
    balanceUpdateAgreement: false
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
        pdfContent: `본 계약은 더 한남과(와) ${formData.memberName} 회원 간의 멤버십 계약으로, ₩${formData.amount.toLocaleString()}의 크레딧 충전 및 멤버십 자격 부여를 포함합니다.`
      });
      setFinalContract(result.contract);
      setUpdatedMember(result.updatedMember);
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
           <h1 className="text-xl font-serif font-bold text-hannam-green tracking-tight uppercase">Membership Initiation</h1>
           <p className="text-[10px] font-black text-hannam-gold uppercase tracking-[0.2em] mt-1">단계 {step} / 4 — 멤버십 갱신 및 잔액 충전 flow</p>
         </div>
         <button onClick={() => navigate('/admin/contracts')} className="text-[12px] font-bold text-hannam-muted hover:text-red-500 transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> 작성 취소
         </button>
      </header>

      <div className="flex-1 flex flex-col items-center py-20 px-8 max-w-5xl mx-auto w-full">
        {step === 1 && (
          <div className="w-full max-w-2xl space-y-12">
             <div className="flex bg-white p-1.5 rounded-[24px] border border-hannam-border shadow-hannam-soft">
                <button onClick={() => setMode('SEARCH')} className={`flex-1 py-4.5 rounded-[20px] text-[12px] font-bold transition-all ${mode === 'SEARCH' ? 'bg-hannam-bg text-hannam-green shadow-inner' : 'text-hannam-muted hover:text-hannam-text'}`}>회원 검색</button>
                <button onClick={() => setMode('MANUAL')} className={`flex-1 py-4.5 rounded-[20px] text-[12px] font-bold transition-all ${mode === 'MANUAL' ? 'bg-hannam-bg text-hannam-green shadow-inner' : 'text-hannam-muted hover:text-hannam-text'}`}>정보 직접 입력</button>
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
                              <p className="text-[11px] text-hannam-muted font-bold num-data">현재 잔액: ₩ {m.remaining.toLocaleString()}</p>
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
                             <p className="text-[10px] font-black text-hannam-gold uppercase tracking-[0.3em] mb-1">Target Client Profile</p>
                             <h3 className="text-2xl font-serif font-bold text-hannam-text">{memberFound.name} 님</h3>
                          </div>
                          <ShieldCheck className="w-8 h-8 text-hannam-green opacity-20" />
                       </div>
                       <div className="grid grid-cols-2 gap-10 py-8 border-y border-hannam-border">
                          <div><p className="text-[10px] font-black text-hannam-muted uppercase tracking-widest mb-1.5">현재 멤버십 등급</p><p className="text-[14px] font-black text-hannam-gold uppercase">{memberFound.tier}</p></div>
                          <div><p className="text-[10px] font-black text-hannam-muted uppercase tracking-widest mb-1.5">보유 크레딧</p><p className="text-[14px] font-bold text-hannam-text num-data">₩ {memberFound.remaining.toLocaleString()}</p></div>
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
                   <label className="text-[12px] font-black text-hannam-muted uppercase tracking-widest ml-1">갱신/구매할 멤버십 프로그램 선택</label>
                   <select 
                     onChange={(e) => handleProgramSelect(e.target.value)}
                     className="w-full p-5 bg-hannam-bg/50 border border-hannam-border rounded-[24px] font-bold text-[14px] outline-none focus:bg-white focus:border-hannam-gold transition-all"
                   >
                      <option value="">프로그램을 선택하세요</option>
                      {programs.map(p => <option key={p.id} value={p.id}>{p.name} (₩{p.basePrice.toLocaleString()})</option>)}
                   </select>
                </div>
                <div className="space-y-3">
                   <label className="text-[12px] font-black text-hannam-muted uppercase tracking-widest ml-1">최종 계약 및 충전 금액 (₩)</label>
                   <div className="relative">
                      <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-hannam-gold" />
                      <input 
                        type="number" 
                        value={formData.amount} 
                        onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                        className="w-full pl-16 pr-8 py-7 bg-hannam-bg/80 border border-hannam-border rounded-[32px] font-black text-3xl outline-none num-data focus:bg-white focus:border-hannam-gold transition-all" 
                      />
                   </div>
                   <div className="mt-6 p-6 bg-hannam-bg/30 rounded-2xl border border-hannam-border border-dashed">
                      <p className="text-[11px] text-hannam-gold font-bold leading-relaxed">
                        * 안내: 본 계약 체결 시 선택한 금액 ₩{formData.amount.toLocaleString()}은 즉시 회원의 잔액으로 충전되며, 누적 예치액에 따라 멤버십 등급이 실시간으로 상향 조정될 수 있습니다.
                      </p>
                   </div>
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
                      <p className="text-[11px] font-black text-hannam-gold mt-3 tracking-[0.3em]">더 한남 공식 전자 멤버십 체결 증명서</p>
                   </div>
                   <div className="grid grid-cols-2 gap-12">
                      <div className="space-y-8">
                         <div><p className="text-[10px] font-black text-hannam-muted uppercase tracking-widest mb-1.5">계약 대상자</p><p className="text-[16px] font-black text-hannam-text">{formData.memberName} 님</p></div>
                         <div><p className="text-[10px] font-black text-hannam-muted uppercase tracking-widest mb-1.5">연락처</p><p className="text-[16px] font-bold text-hannam-text num-data">{formData.memberPhone}</p></div>
                      </div>
                      <div className="text-right space-y-8">
                         <div><p className="text-[10px] font-black text-hannam-muted uppercase tracking-widest mb-1.5">프로그램명</p><p className="text-[16px] font-black text-hannam-gold">{formData.typeName}</p></div>
                         <div><p className="text-[10px] font-black text-hannam-muted uppercase tracking-widest mb-1.5">충전 합계액</p><p className="text-[24px] font-black text-hannam-green num-data">₩ {formData.amount.toLocaleString()}</p></div>
                      </div>
                   </div>
                   <div className="pt-12 border-t border-hannam-bg space-y-6">
                      <p className="text-[13px] text-hannam-text leading-relaxed font-medium">
                         1. 본 계약은 서명 즉시 효력이 발생하며, 기재된 금액은 회원님의 멤버십 크레딧으로 즉시 통합됩니다.<br/>
                         2. 충전된 크레딧은 더 한남의 전 서비스를 이용하는 데 사용되며, 등급별 차감 혜택이 적용됩니다.<br/>
                         3. 전자 계약 정보는 시스템에 아카이빙되어 향후 멤버십 갱신 및 이력 대조의 기준이 됩니다.
                      </p>
                   </div>
                   <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                      <ShieldCheck className="w-64 h-64 text-hannam-green" />
                   </div>
                </div>
             </div>
             <div className="col-span-4 space-y-8 flex flex-col">
                <div className="bg-white p-10 rounded-[40px] border border-hannam-border shadow-hannam-soft space-y-8">
                   <h3 className="text-[12px] font-black uppercase text-hannam-gold tracking-widest">최종 확인 및 자산 반영 동의</h3>
                   <div className="space-y-5">
                      {[
                        { key: 'confirmed', label: '충전 금액 및 대상자 확인 완료' },
                        { key: 'termsRead', label: '이용 약관 고지 및 회원 동의 수령' },
                        { key: 'balanceUpdateAgreement', label: '체결 즉시 회원의 실제 잔액을 갱신함' }
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
                   <p className="text-[10px] font-black text-hannam-gold uppercase tracking-widest mb-4 ml-2">관리자 승인 인장</p>
                   <div className="flex-1"><SignaturePad onSave={url => setFormData({...formData, signature: url})} onClear={() => setFormData({...formData, signature: ''})} /></div>
                </div>
                <button 
                  onClick={handleFinalSubmit} 
                  disabled={!formData.signature || !checkList.confirmed || !checkList.termsRead || !checkList.balanceUpdateAgreement || isProcessing} 
                  className="w-full py-7 bg-hannam-green text-white rounded-[32px] text-[14px] font-black uppercase tracking-widest shadow-hannam-deep disabled:opacity-10 hover:bg-black transition-all active:scale-95"
                >
                  {isProcessing ? '금융 트랜잭션 처리 중...' : '계약 확정 및 멤버십 활성화'}
                </button>
             </div>
          </div>
        )}

        {step === 4 && finalContract && updatedMember && (
           <div className="w-full max-w-2xl space-y-12 animate-in zoom-in-95 duration-500 flex flex-col items-center">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border border-green-100 shadow-inner">
                <TrendingUp className="w-12 h-12 text-green-500" />
              </div>
              <div className="text-center">
                 <h2 className="text-3xl font-serif font-bold text-hannam-green uppercase tracking-tight">Financial Sync Complete</h2>
                 <p className="text-hannam-muted font-bold mt-3 text-[14px]">계약 체결 및 멤버십 자산 반영이 성공적으로 완료되었습니다.</p>
              </div>
              <div className="w-full bg-white p-12 rounded-[56px] border border-hannam-border shadow-hannam-deep space-y-10">
                 <div className="grid grid-cols-2 gap-8 pb-10 border-b border-hannam-bg">
                    <div className="p-6 bg-hannam-bg/50 rounded-3xl">
                       <p className="text-[10px] font-black text-hannam-muted uppercase tracking-widest mb-2">충전 후 최종 잔액</p>
                       <p className="text-2xl font-black text-hannam-green num-data">₩ {updatedMember.remaining.toLocaleString()}</p>
                    </div>
                    <div className="p-6 bg-hannam-bg/50 rounded-3xl">
                       <p className="text-[10px] font-black text-hannam-muted uppercase tracking-widest mb-2">현재 멤버십 등급</p>
                       <p className="text-2xl font-black text-hannam-gold uppercase tracking-widest">{updatedMember.tier}</p>
                    </div>
                 </div>
                 <div className="flex justify-between items-center px-4">
                    <span className="text-[11px] font-black text-hannam-muted uppercase tracking-widest">전자 계약서 고유 번호</span>
                    <span className="text-[11px] font-mono font-bold text-gray-300">{finalContract.id}</span>
                 </div>
                 <button onClick={() => navigate('/admin/contracts')} className="w-full py-6 bg-hannam-bg text-hannam-muted rounded-[24px] text-[13px] font-black uppercase tracking-widest border border-hannam-border hover:text-hannam-text transition-all">계약서 보관함으로 이동</button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
