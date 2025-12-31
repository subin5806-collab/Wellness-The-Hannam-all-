
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../../services/dbService';
import { Member, Reservation, Therapist, CareStatus } from '../../types';
import { ArrowLeft, Send, ShieldCheck, AlertCircle } from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';

export const AdminCareSession: React.FC = () => {
  const { resId } = useParams<{ resId: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [res, setRes] = useState<Reservation | null>(null);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [selectedTherapistId, setSelectedTherapistId] = useState('');
  
  const [originalPrice, setOriginalPrice] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [signature, setSignature] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    dbService.getTherapists().then(setTherapists);
    dbService.getReservations().then(list => {
      const found = list.find(r => r.id === resId);
      if (found) {
        setRes(found);
        dbService.getMemberById(found.memberId).then(setMember);
        setSelectedTherapistId(found.therapistId);
      }
    });
  }, [resId]);

  if (!member || !res) return <div className="p-20 text-center animate-pulse font-serif text-hannam-gold uppercase tracking-widest">Loading Executive Console...</div>;

  const discountRate = member.tier === 'ROYAL' ? 0.2 : member.tier === 'GOLD' ? 0.15 : 0.1;
  const discountedPrice = originalPrice * (1 - discountRate);

  const handleFinalizeAndDeduct = async () => {
    if (originalPrice <= 0) return alert('금액을 입력하세요.');
    
    setIsProcessing(true);
    try {
      // [핵심] 차감 우선 실행
      const newRecord = await dbService.processCareSession({
        memberId: member.id,
        therapistId: selectedTherapistId,
        therapistName: therapists.find(t => t.id === selectedTherapistId)?.name || res.therapistName,
        originalPrice,
        discountRate,
        discountedPrice,
        content: res.serviceType,
        feedback,
        recommendation,
      });

      // 회원이 현장에 있어 서명을 한 경우 즉시 서명 처리
      if (signature) {
        await dbService.signCareRecord(newRecord.id, signature);
      }

      alert('금액 차감 및 관리 전송이 완료되었습니다.');
      navigate(`/admin/care-result/${newRecord.id}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#FBF9F6] min-h-screen font-sans flex flex-col animate-smooth-fade">
      <header className="bg-white px-10 py-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-50">
         <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-black text-xs font-bold uppercase tracking-widest"><ArrowLeft className="w-4 h-4" /> Cancel</button>
         <h1 className="text-xl font-serif font-bold text-hannam-green uppercase tracking-widest">Care Session Finalization</h1>
         <div className="w-20" />
      </header>

      <div className="flex-1 max-w-[95%] mx-auto py-12 grid grid-cols-12 gap-10 w-full">
         <div className="col-span-4 space-y-6">
            <div className="bg-white p-10 rounded-[40px] border border-gray-50 shadow-hannam-soft text-center">
               <div className="w-20 h-20 bg-hannam-green rounded-full mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold">{member.name[0]}</div>
               <h2 className="text-2xl font-serif font-bold text-gray-900 mb-1">{member.name}</h2>
               <p className="text-[10px] font-black text-hannam-gold uppercase tracking-[0.2em] mb-10">{member.tier} Membership</p>
               <div className="bg-[#FBF9F6] p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Available Credit</span>
                    <span className="text-sm font-bold num-data">₩{member.remaining.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Tier Discount</span>
                    <span className="text-sm font-bold text-hannam-gold">{discountRate * 100}% Applied</span>
                  </div>
               </div>
            </div>

            <div className="bg-white p-10 rounded-[40px] border border-gray-50 shadow-hannam-soft">
               <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Instant Signature</h4>
                  <p className="text-[9px] text-gray-300 font-bold uppercase">Optional at this stage</p>
               </div>
               <div className="h-48"><SignaturePad onSave={setSignature} onClear={() => setSignature('')} /></div>
            </div>
         </div>

         <div className="col-span-8 bg-white p-12 rounded-[48px] shadow-hannam-deep border border-gray-50 flex flex-col">
            <div className="grid grid-cols-2 gap-8 mb-10">
               <div className="space-y-3">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Specialist</label>
                  <select value={selectedTherapistId} onChange={e => setSelectedTherapistId(e.target.value)} className="w-full p-5 bg-[#FBF9F6] rounded-2xl font-bold outline-none border border-transparent focus:border-hannam-gold">
                     {therapists.map(t => <option key={t.id} value={t.id}>{t.name} — {t.specialty}</option>)}
                  </select>
               </div>
               <div className="space-y-3">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Session Base Rate (₩)</label>
                  <input type="number" value={originalPrice} onChange={e => setOriginalPrice(Number(e.target.value))} className="w-full p-5 border border-gray-200 rounded-2xl font-black outline-none focus:border-hannam-green text-xl num-data" placeholder="0" />
               </div>
            </div>

            <div className="bg-hannam-green p-10 rounded-[32px] text-white shadow-xl mb-12 flex justify-between items-end relative overflow-hidden">
               <div className="relative z-10">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Final Deduction Amount</p>
                  <h4 className="text-5xl font-serif font-bold tracking-tight text-hannam-gold"><span className="text-xl mr-2">₩</span>{discountedPrice.toLocaleString()}</h4>
               </div>
               <div className="text-right relative z-10">
                  <div className="flex items-center gap-2 justify-end mb-1 text-white/40">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Deduct First Policy</span>
                  </div>
                  <p className="text-[11px] font-bold text-white/60 uppercase">Post-Session Balance: ₩ {(member.remaining - discountedPrice).toLocaleString()}</p>
               </div>
               <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><Send className="w-32 h-32" /></div>
            </div>

            <div className="space-y-8 mb-12 flex-1">
               <div className="space-y-3">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Care Summary Note</label>
                  <textarea rows={4} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="금일 관리 내용의 핵심 피드백을 기록하세요." className="w-full p-6 bg-[#FBF9F6] border border-gray-100 rounded-[24px] font-medium text-sm outline-none focus:bg-white focus:border-hannam-gold" />
               </div>
               <div className="space-y-3">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Next Recommendation Strategy</label>
                  <input value={recommendation} onChange={e => setRecommendation(e.target.value)} placeholder="다음 방문 시 추천할 프로그램을 입력하세요." className="w-full p-5 bg-[#FBF9F6] border border-gray-100 rounded-[20px] text-sm font-bold outline-none focus:bg-white focus:border-hannam-gold" />
               </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleFinalizeAndDeduct} 
                disabled={isProcessing || originalPrice <= 0} 
                className="flex-[2] py-7 bg-hannam-green text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-2xl disabled:opacity-20 hover:bg-black transition-all flex items-center justify-center gap-3"
              >
                 {isProcessing ? 'Processing Transaction...' : 'Confirm Deduction & Notify Member'}
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-6 text-amber-600">
               <AlertCircle className="w-3 h-3" />
               <p className="text-[9px] font-bold uppercase tracking-widest">서명 여부와 관계없이 금액은 즉시 차감되며 알림이 발송됩니다.</p>
            </div>
         </div>
      </div>
    </div>
  );
};
