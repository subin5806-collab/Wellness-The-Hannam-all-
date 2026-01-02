
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CareRecord, Member, CareStatus } from '../../types';
import { dbService } from '../../services/dbService';
import { ArrowLeft, CheckCircle2, Sparkles, ShieldCheck, Wallet, Calendar, User, ClipboardList, Info } from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';

export const ContractViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<CareRecord | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [signature, setSignature] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    if (id) {
      dbService.getCareRecordById(id).then(async (rec) => {
        if (rec) {
          setRecord(rec);
          const m = await dbService.getMemberById(rec.memberId);
          if (m) setMember(m);
        }
      });
    }
  }, [id]);

  const handleSign = async () => {
    if (!record || !signature) return;
    setIsSigning(true);
    try {
      await dbService.signCareRecord(record.id, signature);
      alert('세션 확인 및 서명이 완료되었습니다.');
      navigate('/member');
    } catch (e) {
      alert('서명 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSigning(false);
    }
  };

  if (!record || !member) return (
    <div className="min-h-screen flex items-center justify-center bg-hannam-bg font-serif text-hannam-gold uppercase tracking-[0.3em]">
      Retrieving Care Report...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBF9F6] p-6 md:p-12 lg:p-20 font-sans animate-smooth-fade">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* 상단 컨트롤러 */}
        <div className="flex justify-between items-center">
          <button onClick={() => navigate('/member')} className="flex items-center gap-2 text-hannam-muted hover:text-hannam-text transition-colors text-[10px] font-black uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Back to Portal
          </button>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-white rounded-full border border-hannam-border shadow-hannam-soft flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${record.status === CareStatus.SIGNED ? 'bg-green-500' : 'bg-hannam-gold animate-pulse'}`} />
                <span className="text-[10px] font-black text-hannam-muted uppercase tracking-widest">
                  {record.status === CareStatus.SIGNED ? 'Report Verified' : 'Awaiting Confirmation'}
                </span>
             </div>
          </div>
        </div>

        {/* 메인 리포트 카드 */}
        <main className="bg-white rounded-[48px] shadow-hannam-deep border border-[#F1EFEA] overflow-hidden">
           
           {/* Header Section */}
           <div className="bg-hannam-green p-12 md:p-16 text-white relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Wellness Session Report</p>
                    <h1 className="text-3xl md:text-4xl font-serif font-medium tracking-tight leading-tight">{record.content}</h1>
                    <div className="flex gap-6 pt-2">
                       <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-hannam-gold" />
                          <span className="text-[11px] font-bold num-data text-white/80">{record.date}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-hannam-gold" />
                          <span className="text-[11px] font-bold text-white/80">{record.therapistName} Expert</span>
                       </div>
                    </div>
                 </div>
                 <div className="text-right bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Session ID</p>
                    <p className="text-[10px] font-mono font-bold tracking-widest">{record.id.slice(-8).toUpperCase()}</p>
                 </div>
              </div>
              <Sparkles className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-[0.03] pointer-events-none" />
           </div>

           {/* Financial Context Section */}
           <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 border-b border-gray-100">
              <div className="p-10 md:p-12 flex items-center gap-6">
                 <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                    <Wallet className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Deduction Amount</p>
                    <p className="text-xl font-black text-red-500 num-data">₩ {record.discountedPrice.toLocaleString()}</p>
                 </div>
              </div>
              <div className="p-10 md:p-12 flex items-center gap-6">
                 <div className="w-12 h-12 bg-hannam-bg rounded-2xl flex items-center justify-center text-hannam-green">
                    <ShieldCheck className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Remaining Balance</p>
                    <p className="text-xl font-black text-hannam-text num-data">₩ {member.remaining.toLocaleString()}</p>
                 </div>
              </div>
           </div>

           {/* Core Insights Section (Care Note) */}
           <div className="p-12 md:p-16 space-y-12">
              <div className="space-y-10">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-hannam-bg rounded-xl flex items-center justify-center text-hannam-gold">
                       <ClipboardList className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black text-hannam-text uppercase tracking-widest">Wellness Insights & Feedback</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-12">
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-hannam-gold uppercase tracking-widest">금일 관리 피드백 및 개선 포인트</p>
                       <div className="bg-[#FBF9F6] p-8 rounded-[32px] border border-[#F1EFEA] relative">
                          <p className="text-sm text-gray-700 leading-relaxed font-medium italic">
                            "{record.feedback || '전담 전문가가 정밀 피드백을 작성 중입니다.'}"
                          </p>
                          <Info className="absolute top-4 right-4 w-4 h-4 text-gray-200" />
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-hannam-green uppercase tracking-widest">차기 세션 추천 전략 (Expert Strategy)</p>
                       <div className="bg-hannam-green/5 p-8 rounded-[32px] border border-hannam-green/10">
                          <p className="text-sm text-hannam-green font-bold leading-relaxed">
                            {record.recommendation || '최상의 컨디션을 유지하기 위한 다음 단계의 프로그램을 구상하고 있습니다.'}
                          </p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Confirmation Section */}
              {record.status === CareStatus.REQUESTED ? (
                <div className="pt-16 border-t border-gray-100 space-y-8">
                   <div className="text-center space-y-2">
                      <h4 className="text-lg font-bold text-gray-900">본인 확인 및 승인</h4>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Sign below to finalize the report confirmation</p>
                   </div>
                   
                   <div className="h-64 max-w-lg mx-auto">
                      <SignaturePad onSave={setSignature} onClear={() => setSignature('')} />
                   </div>
                   
                   <div className="max-w-lg mx-auto pt-4">
                      <button 
                        onClick={handleSign}
                        disabled={!signature || isSigning}
                        className={`w-full py-6 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all shadow-2xl ${
                          signature 
                            ? 'bg-hannam-green text-white hover:scale-[1.01] active:scale-[0.98]' 
                            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {isSigning ? 'Transmitting Seal...' : '세션 확인 및 서명 완료'}
                      </button>
                      <p className="text-[9px] text-gray-300 text-center mt-6 leading-relaxed italic">
                        * 본 리포트의 확인은 디지털 인장 시스템을 통해 법적 효력을 가지며,<br/>이후 취소 및 환불이 제한될 수 있음에 동의함을 의미합니다.
                      </p>
                   </div>
                </div>
              ) : (
                <div className="pt-16 border-t border-gray-100 flex flex-col items-center text-center space-y-6">
                   <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                      <CheckCircle2 className="w-10 h-10" />
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-lg font-bold text-gray-900">서명 확인 완료</h4>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                        Verified at {new Date(record.signedAt || '').toLocaleString()}
                      </p>
                   </div>
                </div>
              )}
           </div>
        </main>
      </div>
    </div>
  );
};
