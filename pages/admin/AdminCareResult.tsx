
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../../services/dbService';
import { CareRecord, Member } from '../../types';
import { Mail, Smartphone, CheckCircle2, ChevronRight, Printer, Share2 } from 'lucide-react';

export const AdminCareResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<CareRecord | null>(null);
  const [member, setMember] = useState<Member | null>(null);

  useEffect(() => {
    if (id) {
      dbService.getCareRecordById(id).then(async (rec) => {
        if (rec) {
          setRecord(rec);
          const m = await dbService.getMemberById(rec.memberId);
          setMember(m || null);
        }
      });
    }
  }, [id]);

  if (!record || !member) return <div className="p-20 text-center animate-pulse text-gray-400 font-serif">Generating Official Receipt...</div>;

  const currentTime = new Date(record.createdAt).toLocaleString('ko-KR', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
  });

  return (
    <div className="min-h-screen bg-[#F4F7F6] p-4 md:p-12 font-sans animate-fade-in">
      {/* System Status & Admin Profile */}
      <div className="max-w-7xl mx-auto flex justify-end items-center mb-8 gap-4">
         <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">System: Online</span>
         </div>
         <div className="text-right border-l border-gray-200 pl-4">
            <p className="text-xs font-black text-gray-900 leading-none">Wellness, The Hannam</p>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Administrator</p>
         </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        
        {/* Left Column: Official Receipt (이미지의 좌측 영수증 부분) */}
        <div className="lg:col-span-5 flex flex-col">
           <div className="bg-white rounded-xl shadow-2xl overflow-hidden relative flex-1 flex flex-col p-12 md:p-16 border border-gray-100 min-h-[750px]">
              {/* Receipt Background Texture */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
              
              <div className="relative z-10 text-center mb-16">
                 <h1 className="text-4xl font-serif font-bold text-[#1A362E] mb-2">Wellness, The Hannam</h1>
                 <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Official Receipt</p>
              </div>

              <div className="relative z-10 space-y-8 mb-12 border-t border-gray-50 pt-12">
                 <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Date</span>
                    <span className="font-bold text-gray-800 text-sm">{currentTime}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Program</span>
                    <span className="font-bold text-gray-800 text-sm">{record.content}</span>
                 </div>
              </div>

              <div className="relative z-10 flex justify-between items-end mb-10 pt-8 border-t border-dashed border-gray-100">
                 <span className="text-sm font-black text-gray-400 uppercase tracking-widest text-[10px] mb-2">Deducted Amount</span>
                 <span className="text-4xl font-serif font-bold text-gray-900 tracking-tighter">-{record.discountedPrice.toLocaleString()}</span>
              </div>

              <div className="relative z-10 flex justify-between items-end mb-16">
                 <span className="text-sm font-black text-gray-400 uppercase tracking-widest text-[10px] mb-2">Remaining Balance</span>
                 <span className="text-3xl font-serif font-bold text-[#C9B08F]">₩ {member.remaining.toLocaleString()}</span>
              </div>

              {/* Signature Section */}
              <div className="mt-auto relative z-10 flex flex-col items-center">
                 <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-6">Member Signature</p>
                 <div className="w-full max-w-[280px] h-32 bg-gray-50/50 rounded-2xl flex items-center justify-center border border-gray-100 overflow-hidden shadow-inner">
                    {record.signature ? (
                      <img src={record.signature} alt="Signature" className="max-h-full object-contain mix-blend-multiply opacity-80" />
                    ) : (
                      <span className="text-gray-200 italic font-serif">Awaiting Signature</span>
                    )}
                 </div>
                 <p className="mt-6 text-[9px] font-mono text-gray-200 uppercase tracking-widest">TID: {record.id.toUpperCase()}</p>
              </div>

              {/* Decorative Bottom Zigzag */}
              <div className="absolute bottom-0 left-0 w-full h-3 bg-[url('https://img.freepik.com/free-vector/zigzag-seamless-pattern-background_1017-15228.jpg')] opacity-10 bg-repeat-x bg-contain" />
           </div>
        </div>

        {/* Right Column: Notification Results (이미지의 우측 알림 결과 부분) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
           <h2 className="text-2xl font-serif font-bold text-[#1A362E] flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-[#C9B08F] rounded-full" /> 알림 전송 결과
           </h2>

           {/* Email Card */}
           <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="px-8 py-5 bg-[#FBFBFB] border-b border-gray-50 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</span>
                 </div>
                 <div className="flex items-center gap-2 text-green-500 font-black text-[9px] uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" /> Sent Successfully
                 </div>
              </div>
              <div className="p-8">
                 <p className="text-[11px] text-gray-400 font-bold mb-1">To: {member.email}</p>
                 <h4 className="text-base font-bold text-gray-900 mb-6">[Wellness] {record.content} 이용 내역 안내</h4>
                 <div className="bg-gray-50/80 p-8 rounded-2xl border border-gray-100 text-[11px] leading-relaxed text-gray-500">
                    <div className="space-y-4 font-medium">
                       <p>발신: help@thehannam.com</p>
                       <p>수신: {member.name} 님</p>
                       <p className="pt-4 border-t border-gray-200/50">Wellness, The Hannam을 이용해주셔서 감사합니다.</p>
                       <div className="space-y-1.5 py-4">
                          <p>[이용 내역]</p>
                          <p>프로그램: {record.content}</p>
                          <p>차감 금액: -{record.discountedPrice.toLocaleString()}원</p>
                          <p>잔여 금액: {member.remaining.toLocaleString()}원</p>
                       </div>
                       <p>이용 일시: {currentTime}</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* SMS Card */}
           <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-8 py-5 bg-[#FBFBFB] border-b border-gray-50 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-gray-400" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SMS Message</span>
                 </div>
                 <div className="flex items-center gap-2 text-green-500 font-black text-[9px] uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" /> Sent
                 </div>
              </div>
              <div className="p-8">
                 <p className="text-[11px] text-gray-400 font-bold mb-4">To: {member.phone}</p>
                 <div className="bg-gray-100 p-6 rounded-2xl text-[11px] font-bold text-gray-700 leading-relaxed max-w-md border border-gray-200/50">
                    [Wellness] {record.content} 이용. 차감액: {record.discountedPrice.toLocaleString()}원. 잔액: {member.remaining.toLocaleString()}원.
                 </div>
              </div>
           </div>

           {/* Confirmation Action */}
           <div className="mt-auto pt-4">
              <button 
                onClick={() => navigate(`/admin/member/${member.id}`)}
                className="w-full py-6 bg-[#1A1A1A] text-white rounded-[20px] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                확인 (회원 프로필로 돌아가기) <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
