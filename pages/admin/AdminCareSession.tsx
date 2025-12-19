
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../../services/dbService';
import { Member, Reservation, Therapist } from '../../types';
import { ArrowLeft } from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';

export const AdminCareSession: React.FC = () => {
  const { resId } = useParams<{ resId: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [res, setRes] = useState<Reservation | null>(null);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [selectedTherapistId, setSelectedTherapistId] = useState('');
  
  const [originalPrice, setOriginalPrice] = useState(0);
  const [comment, setComment] = useState('');
  const [rec, setRec] = useState('');
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

  if (!member || !res) return <div className="p-20 text-center animate-pulse">Loading Session...</div>;

  const discountRate = member.tier === 'ROYAL' ? 0.2 : member.tier === 'GOLD' ? 0.15 : 0.1;
  const discountedPrice = originalPrice * (1 - discountRate);

  const handleProcess = async () => {
    if (originalPrice <= 0) return alert('금액을 입력하세요.');
    if (!signature) return alert('회원 싸인이 필요합니다.');
    
    setIsProcessing(true);
    const therapist = therapists.find(t => t.id === selectedTherapistId);
    try {
      const newRecord = await dbService.processCareSession({
        memberId: member.id,
        therapistId: selectedTherapistId,
        therapist: therapist?.name || res.therapistName,
        originalPrice,
        discountedPrice,
        content: res.serviceType,
        comment,
        recommendation: rec,
      });
      await dbService.signCareRecord(newRecord.id, signature);
      navigate(`/admin/care-result/${newRecord.id}`);
    } catch (e) {
      alert('오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#FBF9F6] min-h-screen font-sans flex flex-col animate-fade-in">
      <header className="bg-white px-10 py-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-50">
         <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-black text-xs font-bold uppercase tracking-widest"><ArrowLeft className="w-4 h-4" /> Back</button>
         <h1 className="text-xl font-serif font-bold">Session Finalization</h1>
         <div className="w-20" />
      </header>

      <div className="flex-1 max-w-[95%] mx-auto py-12 grid grid-cols-12 gap-10 w-full">
         <div className="col-span-4 space-y-6">
            <div className="bg-white p-10 rounded-[32px] border border-gray-50 shadow-sm text-center">
               <div className="w-20 h-20 bg-gray-900 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold">{member.name[0]}</div>
               <h2 className="text-2xl font-serif font-bold text-gray-900 mb-1">{member.name}</h2>
               <p className="text-[10px] font-black text-[#C9B08F] uppercase tracking-[0.2em] mb-10">{member.tier} Membership</p>
               <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-left space-y-3">
                  <div className="flex justify-between text-xs font-bold"><span className="text-gray-400">잔액</span><span>₩{member.remaining.toLocaleString()}</span></div>
                  <div className="flex justify-between text-xs font-bold"><span className="text-gray-400">할인율</span><span className="text-hannam-gold">{discountRate * 100}%</span></div>
               </div>
            </div>
            <div className="bg-white p-10 rounded-[32px] border border-gray-50 shadow-sm">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 text-center">현장 서명 (Client Signature)</h4>
               <div className="h-48"><SignaturePad onSave={setSignature} onClear={() => setSignature('')} /></div>
            </div>
         </div>

         <div className="col-span-8 bg-white p-12 rounded-[40px] shadow-sm border border-gray-50">
            <div className="grid grid-cols-2 gap-8 mb-10">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Therapist Selection</label>
                  <select value={selectedTherapistId} onChange={e => setSelectedTherapistId(e.target.value)} className="w-full p-5 bg-[#FBF9F6] rounded-2xl font-bold outline-none">
                     <option value="">담당 테라피스트 선택</option>
                     {therapists.map(t => <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>)}
                  </select>
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Service Amount (₩)</label>
                  <input type="number" value={originalPrice} onChange={e => setOriginalPrice(Number(e.target.value))} className="w-full p-5 border border-gray-200 rounded-2xl font-black outline-none focus:border-black" placeholder="정가 입력" />
               </div>
            </div>

            <div className="bg-hannam-green p-10 rounded-[32px] text-white shadow-2xl mb-12 flex justify-between items-end">
               <div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Total Deduction</p>
                  <h4 className="text-4xl font-serif font-bold">₩ {discountedPrice.toLocaleString()}</h4>
               </div>
               <p className="text-[9px] font-black text-white/30 uppercase">Final Balance: ₩ {(member.remaining - discountedPrice).toLocaleString()}</p>
            </div>

            <div className="space-y-8 mb-12">
               <textarea rows={4} value={comment} onChange={e => setComment(e.target.value)} placeholder="차감 전 고객 코멘트를 입력하세요." className="w-full p-6 bg-white border border-gray-200 rounded-2xl font-medium text-sm outline-none" />
               <input value={rec} onChange={e => setRec(e.target.value)} placeholder="다음 추천 테라피" className="w-full p-5 border border-gray-100 rounded-xl text-sm font-medium outline-none" />
            </div>

            <button onClick={handleProcess} disabled={isProcessing || !signature || originalPrice <= 0} className="w-full py-7 bg-black text-white rounded-[24px] text-sm font-black uppercase tracking-widest shadow-2xl disabled:opacity-30">
               정산 완료 및 싸인 확인
            </button>
         </div>
      </div>
    </div>
  );
};
