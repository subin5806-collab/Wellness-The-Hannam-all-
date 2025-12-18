
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../../services/dbService';
import { Member, Reservation } from '../../types';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';

export const AdminCareSession: React.FC = () => {
  const { resId } = useParams<{ resId: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [res, setRes] = useState<Reservation | null>(null);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [comment, setComment] = useState('');
  const [rec, setRec] = useState('');
  const [dir, setDir] = useState('');
  const [signature, setSignature] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    dbService.getReservations().then(list => {
      const found = list.find(r => r.id === resId);
      if (found) {
        setRes(found);
        dbService.getMemberById(found.memberId).then(setMember);
      }
    });
  }, [resId]);

  if (!member || !res) return <div className="p-20 text-center animate-pulse">Loading Session...</div>;

  const discountRate = member.tier === 'ROYAL' ? 0.2 : member.tier === 'GOLD' ? 0.15 : 0.1;
  const discountedPrice = originalPrice * (1 - discountRate);

  const handleProcess = async () => {
    if (originalPrice <= 0) return alert('금액을 입력해주세요.');
    if (!signature) return alert('회원 서명이 필요합니다.');
    
    setIsProcessing(true);
    try {
      const newRecord = await dbService.processCareSession({
        memberId: member.id,
        reservationId: res.id,
        originalPrice,
        discountedPrice,
        content: res.serviceType,
        therapist: res.therapistName,
        comment,
        recommendation: rec,
        direction: dir,
        signature // 서명 데이터 전달
      });
      
      // 결과 페이지로 이동 시 서명 데이터를 영구 저장하기 위해 dbService 내에서 처리됨
      await dbService.signCareRecord(newRecord.id, signature);
      
      navigate(`/admin/care-result/${newRecord.id}`);
    } catch (e) {
      alert('정산 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#FBF9F6] min-h-screen font-sans flex flex-col animate-fade-in">
      <header className="bg-white px-10 py-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-50 shadow-sm">
         <div className="flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-black text-xs font-bold uppercase tracking-widest transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="w-[1px] h-6 bg-gray-100" />
            <h1 className="text-xl font-serif font-bold text-gray-900">Care Session Processing</h1>
         </div>
         <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Reservation ID: {res.id}</p>
      </header>

      <div className="flex-1 max-w-[95%] mx-auto py-12 grid grid-cols-12 gap-10 w-full">
         {/* Left: Member Summary */}
         <div className="col-span-4 flex flex-col gap-6">
            <div className="bg-white p-10 rounded-[32px] border border-gray-50 shadow-sm text-center">
               <div className="w-20 h-20 bg-gray-900 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold border-4 border-[#C9B08F]/20 shadow-xl">
                  {member.name[0]}
               </div>
               <h2 className="text-2xl font-serif font-bold text-gray-900 mb-1">{member.name} 님</h2>
               <p className="text-[10px] font-black text-[#C9B08F] uppercase tracking-[0.2em] mb-10">{member.tier} Membership</p>
               
               <div className="text-left space-y-6">
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Financial Overview</p>
                    <div className="space-y-3">
                       <div className="flex justify-between text-xs font-bold"><span className="text-gray-400">예치금 잔액</span><span className="text-gray-900">₩{member.remaining.toLocaleString()}</span></div>
                       <div className="flex justify-between text-xs font-bold"><span className="text-gray-400">적용 할인율</span><span className="text-[#C9B08F]">{discountRate * 100}% DC</span></div>
                    </div>
                  </div>
                  
                  <div className="px-2">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-4">Contact Info</p>
                    <div className="space-y-2 text-[11px] font-bold text-gray-500">
                       <p>{member.phone}</p>
                       <p className="truncate">{member.address}</p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="bg-white p-10 rounded-[32px] border border-gray-50 shadow-sm flex-1">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">현장 고객 서명 (Required)</h4>
               <div className="h-48">
                  <SignaturePad 
                    onSave={(data) => setSignature(data)} 
                    onClear={() => setSignature('')} 
                  />
               </div>
            </div>
         </div>

         {/* Right: Editor */}
         <div className="col-span-8 bg-white p-12 rounded-[40px] shadow-sm border border-gray-50">
            <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">케어 기록 및 정산</h3>
            <p className="text-xs text-gray-400 font-medium mb-12">세션 종료 전 금액을 확정하고 고객의 서명을 받으세요.</p>

            <div className="grid grid-cols-2 gap-8 mb-10">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Service Type</label>
                  <input type="text" readOnly value={res.serviceType} className="w-full p-5 bg-[#FBF9F6] rounded-2xl font-bold text-gray-900 border border-transparent" />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Original Price (KRW)</label>
                  <input 
                    type="number" 
                    value={originalPrice} 
                    onChange={e => setOriginalPrice(Number(e.target.value))}
                    className="w-full p-5 border border-gray-200 rounded-2xl font-black text-gray-900 outline-none focus:border-black transition-all" 
                    placeholder="서비스 정가를 입력하세요"
                  />
               </div>
            </div>

            <div className="bg-hannam-green p-10 rounded-[32px] text-white shadow-2xl mb-12 relative overflow-hidden">
               <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-[#C9B08F] uppercase tracking-widest mb-2">Final Settlement Amount</p>
                    <h4 className="text-5xl font-serif font-bold tracking-tighter">₩ {discountedPrice.toLocaleString()}</h4>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Expected Balance After</p>
                     <p className="text-lg font-bold">₩ {(member.remaining - discountedPrice).toLocaleString()}</p>
                  </div>
               </div>
            </div>

            <div className="space-y-8 mb-12">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Care Feedback</label>
                  <textarea 
                    rows={4} 
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="고객의 반응이나 케어 시 특이사항을 기록하세요." 
                    className="w-full p-6 bg-white border border-gray-200 rounded-2xl font-medium text-sm outline-none focus:border-[#C9B08F] transition-all" 
                  />
               </div>
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Recommendation</label>
                     <input value={rec} onChange={e => setRec(e.target.value)} placeholder="차회 추천 프로그램" className="w-full p-5 border border-gray-100 rounded-xl text-sm font-medium outline-none" />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Follow-up</label>
                     <input value={dir} onChange={e => setDir(e.target.value)} placeholder="향후 관리 방향성" className="w-full p-5 border border-gray-100 rounded-xl text-sm font-medium outline-none" />
                  </div>
               </div>
            </div>

            <button 
              onClick={handleProcess}
              disabled={isProcessing || !signature || originalPrice <= 0}
              className="w-full py-7 bg-[#1A1A1A] text-white rounded-[24px] text-sm font-black uppercase tracking-widest shadow-2xl shadow-black/20 hover:bg-black transition-all active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing Transaction...' : '정산 완료 및 영수증 발행 (Sign & Complete)'}
            </button>
         </div>
      </div>
    </div>
  );
};
