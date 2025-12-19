
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService, generateHannamFilename } from '../../services/dbService';
import { CareRecord, Member } from '../../types';
import { Mail, Smartphone, CheckCircle2, ChevronRight, Download, Printer, Share2 } from 'lucide-react';

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

  const handleDownload = () => {
    if (!member || !record) return;
    const filename = generateHannamFilename(member.name, member.id, record.date);
    const content = `THE HANNAM OFFICIAL SESSION RECEIPT\n\nDate: ${record.date}\nMember: ${member.name} (${member.id})\nProgram: ${record.content}\nAmount: ${record.discountedPrice.toLocaleString()} KRW\n\nSignature Verified: ${record.signature ? 'YES' : 'NO'}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!record || !member) return <div className="p-20 text-center animate-pulse text-gray-300 font-serif tracking-widest">Generating Official Receipt...</div>;

  const currentTime = new Date(record.createdAt).toLocaleString('ko-KR', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
  });

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-10 font-sans animate-fade-in">
      <div className="max-w-6xl mx-auto flex justify-end items-center mb-8 gap-4">
         <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">System Online</span>
         </div>
         <div className="text-right border-l border-gray-200 pl-4">
            <p className="text-xs font-black text-gray-900 leading-none">The Hannam</p>
            <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Manager</p>
         </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Official Receipt */}
        <div className="lg:col-span-5 flex flex-col">
           <div className="bg-white rounded-xl shadow-xl overflow-hidden relative flex-1 flex flex-col p-10 border border-gray-100 min-h-[650px]">
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
              
              <div className="relative z-10 text-center mb-12">
                 <h1 className="text-3xl font-serif font-bold text-[#1A362E] mb-1 uppercase tracking-wider">The Hannam</h1>
                 <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">Official Receipt</p>
              </div>

              <div className="relative z-10 space-y-6 mb-10 border-t border-gray-50 pt-10 text-center">
                 <button onClick={handleDownload} className="mx-auto mb-6 flex items-center gap-2 text-[10px] font-black uppercase text-hannam-gold tracking-widest hover:text-hannam-green transition-colors">
                    <Download className="w-4 h-4" /> Download PDF Receipt
                 </button>
                 <div className="flex justify-between items-center px-4">
                    <span className="text-gray-300 font-black uppercase tracking-widest text-[8px]">Date</span>
                    <span className="font-bold text-gray-800 text-xs num-clean">{currentTime}</span>
                 </div>
                 <div className="flex justify-between items-center px-4">
                    <span className="text-gray-300 font-black uppercase tracking-widest text-[8px]">Program</span>
                    <span className="font-bold text-gray-800 text-xs">{record.content}</span>
                 </div>
              </div>

              <div className="relative z-10 flex justify-between items-end mb-8 pt-8 border-t border-dashed border-gray-100 px-4">
                 <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-2">Deducted</span>
                 <span className="text-3xl font-serif font-bold text-gray-900 num-clean">-{record.discountedPrice.toLocaleString()}</span>
              </div>

              <div className="relative z-10 flex justify-between items-end mb-12 px-4">
                 <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-2">Remaining</span>
                 <span className="text-2xl font-serif font-bold text-[#C9B08F] num-clean">₩ {member.remaining.toLocaleString()}</span>
              </div>

              <div className="mt-auto relative z-10 flex flex-col items-center">
                 <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-4">Verification Signature</p>
                 <div className="w-full max-w-[240px] h-28 bg-gray-50/30 rounded-xl flex items-center justify-center border border-gray-100 overflow-hidden shadow-inner">
                    {record.signature ? (
                      <img src={record.signature} alt="Signature" className="max-h-full object-contain mix-blend-multiply opacity-70" />
                    ) : (
                      <span className="text-gray-200 italic font-serif text-xs">Unsigned</span>
                    )}
                 </div>
                 <p className="mt-5 text-[8px] font-mono text-gray-200 uppercase tracking-widest num-clean">TID: {record.id.toUpperCase()}</p>
              </div>
           </div>
        </div>

        {/* Right Column: Notification Results */}
        <div className="lg:col-span-7 flex flex-col space-y-5">
           <h2 className="text-lg font-serif font-bold text-[#1A362E] flex items-center gap-3 mb-1 uppercase tracking-widest">
              Notification Status
           </h2>

           <div className="card-minimal flex flex-col overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-[#FBFBFB] border-b border-gray-50 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <Mail className="w-3.5 h-3.5 text-gray-300" />
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Email Delivery</span>
                 </div>
                 <div className="flex items-center gap-1.5 text-green-500 font-black text-[8px] uppercase tracking-widest">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                 </div>
              </div>
              <div className="p-6">
                 <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-tighter">To: {member.email}</p>
                 <h4 className="text-[13px] font-bold text-gray-900 mb-4">[Wellness] {record.content} Receipt Issued</h4>
                 <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-50 text-[10px] leading-relaxed text-gray-500">
                    <div className="space-y-3 font-medium">
                       <p className="text-hannam-gold font-black">발신: help@thehannam.com</p>
                       <p>수신: {member.name} Member</p>
                       <p className="pt-3 border-t border-gray-100">The Hannam Wellness 서비스를 이용해주셔서 감사합니다.</p>
                       <div className="space-y-1 py-2">
                          <p>[Program]: {record.content}</p>
                          <p>[Amount]: -{record.discountedPrice.toLocaleString()} KRW</p>
                          <p>[Balance]: {member.remaining.toLocaleString()} KRW</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="card-minimal overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-[#FBFBFB] border-b border-gray-50 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <Smartphone className="w-3.5 h-3.5 text-gray-300" />
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">SMS Gateway</span>
                 </div>
                 <div className="flex items-center gap-1.5 text-green-500 font-black text-[8px] uppercase tracking-widest">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                 </div>
              </div>
              <div className="p-6">
                 <p className="text-[10px] text-gray-400 font-bold mb-3 uppercase tracking-tighter">To: {member.phone}</p>
                 <div className="bg-gray-50 p-4 rounded-xl text-[11px] font-bold text-gray-700 leading-relaxed max-w-sm border border-gray-100">
                    [The Hannam] {record.content} 이용 완료. -{record.discountedPrice.toLocaleString()}원. 잔액: {member.remaining.toLocaleString()}원.
                 </div>
              </div>
           </div>

           <div className="mt-auto pt-3">
              <button 
                onClick={() => navigate(`/admin/member/${member.id}`)}
                className="w-full py-5 bg-[#1A1A1A] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3"
              >
                Back to Member Profile <ChevronRight className="w-3.5 h-3.5" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
