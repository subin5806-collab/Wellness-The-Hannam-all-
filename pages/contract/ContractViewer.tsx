
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CareRecord, CareStatus } from '../../types';
import { dbService } from '../../services/dbService';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';

export const ContractViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<CareRecord | null>(null);
  const [signature, setSignature] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    if (id) dbService.getCareRecordById(id).then(setRecord);
  }, [id]);

  const handleSign = async () => {
    if (!record || !signature) return;
    setIsSigning(true);
    try {
      await dbService.signCareRecord(record.id, signature);
      alert('서명이 완료되었습니다.');
      navigate('/member');
    } catch (e) {
      alert('서명 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSigning(false);
    }
  };

  if (!record) return <div className="p-20 text-center font-serif text-2xl text-hannam-green">Loading Session Details...</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-10 md:p-24 font-sans animate-fade-in flex flex-col items-center">
      <div className="w-full max-w-5xl bg-white rounded-[32px] shadow-2xl p-12 md:p-20 border border-gray-50">
        
        <div className="flex justify-between items-center mb-16 px-2">
           <h2 className="text-4xl font-serif font-bold text-hannam-green tracking-tight">Care Session Confirmation</h2>
           <span className="bg-[#FFF1F0] text-[#FF4D4D] text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full border border-[#FFE5E3]">Awaiting Signature</span>
        </div>

        <div className="bg-[#F4F9FF] rounded-2xl p-8 flex items-center gap-8 mb-16 border border-[#EBF2FF]">
           <div className="w-14 h-14 bg-[#4A90E2] rounded-full flex items-center justify-center shadow-lg shadow-[#4A90E2]/20">
             <CheckCircle className="w-8 h-8 text-white" />
           </div>
           <div className="flex flex-col gap-1">
             <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{record.content}</h3>
             <p className="text-lg font-bold text-[#4A90E2]">차감액: ₩{record.discountedPrice.toLocaleString()}</p>
           </div>
        </div>

        <div className="mb-16">
           <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-black text-gray-900">본인 확인 서명</h4>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sign below to confirm session</p>
           </div>
           <div className="h-[400px]">
              <SignaturePad 
                onSave={(dataUrl) => setSignature(dataUrl)} 
                onClear={() => setSignature('')} 
              />
           </div>
           <p className="mt-6 text-[11px] text-gray-300 text-center font-semibold leading-relaxed px-10 italic">
            * 본 서명은 전자문서 및 전자거래 기본법에 따라 법적 효력을 가지며, 서비스 이용 내역에 대한 동의를 의미합니다.
          </p>
        </div>

        <button 
          onClick={handleSign}
          disabled={!signature || isSigning}
          className={`w-full py-8 rounded-2xl text-xl font-black tracking-tight transition-all shadow-2xl mb-12 ${
            signature 
              ? 'bg-[#1A362E] text-white hover:scale-[1.01] active:scale-[0.99] shadow-hannam-green/20' 
              : 'bg-[#F5F5F5] text-[#D0D0D0] cursor-not-allowed border border-gray-100'
          }`}
        >
          {isSigning ? '처리 중...' : '세션 확인 및 서명 완료'}
        </button>

        <button onClick={() => navigate(-1)} className="flex items-center gap-3 text-gray-400 text-sm font-bold hover:text-hannam-green transition-colors mx-auto uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    </div>
  );
};
