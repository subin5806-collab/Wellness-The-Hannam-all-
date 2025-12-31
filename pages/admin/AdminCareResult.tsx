
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService, generateHannamFilename } from '../../services/dbService';
import { CareRecord, Member } from '../../types';
import { Mail, Smartphone, CheckCircle2, ChevronRight, Download } from 'lucide-react';

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

  if (!record || !member) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold uppercase tracking-[0.3em]">Finalizing Transaction...</div>;

  const currentTime = new Date(record.createdAt).toLocaleString('ko-KR', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hour12: true
  });

  return (
    <div className="min-h-screen bg-hannam-bg p-10 animate-smooth-fade">
      <div className="max-w-6xl mx-auto flex justify-end items-center mb-10 gap-6">
         <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-hannam-border shadow-hannam-soft">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-[9px] font-bold text-hannam-muted uppercase tracking-widest">System Sync Active</span>
         </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        
        {/* Receipt Section */}
        <div className="lg:col-span-5">
           <div className="bg-white rounded-[32px] shadow-hannam-deep p-12 border border-[#F1EFEA] min-h-[680px] flex flex-col">
              <div className="text-center mb-16">
                 <h1 className="text-3xl font-serif font-bold text-hannam-green mb-1 uppercase tracking-widest">THE HANNAM</h1>
                 <p className="text-[9px] font-bold text-hannam-muted uppercase tracking-[0.4em]">Official Digital Receipt</p>
              </div>

              <div className="space-y-8 mb-12 border-t border-[#F5F3EF] pt-12">
                 <div className="flex justify-between items-center px-2">
                    <span className="text-hannam-muted font-bold uppercase tracking-widest text-[9px]">Issued Date</span>
                    <span className="font-bold text-hannam-text text-xs num-data">{currentTime}</span>
                 </div>
                 <div className="flex justify-between items-center px-2">
                    <span className="text-hannam-muted font-bold uppercase tracking-widest text-[9px]">Curated Program</span>
                    <span className="font-bold text-hannam-text text-xs">{record.content}</span>
                 </div>
              </div>

              <div className="flex justify-between items-end mb-8 pt-10 border-t border-dashed border-hannam-border px-2">
                 <span className="text-[9px] font-bold text-hannam-muted uppercase tracking-widest mb-2">Deduction</span>
                 <span className="text-4xl font-serif font-bold text-hannam-green num-data">-{record.discountedPrice.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-end mb-16 px-2">
                 <span className="text-[9px] font-bold text-hannam-muted uppercase tracking-widest mb-2">Updated Balance</span>
                 <span className="text-2xl font-serif font-bold text-hannam-gold num-data">₩ {member.remaining.toLocaleString()}</span>
              </div>

              <div className="mt-auto flex flex-col items-center py-6 bg-hannam-bg rounded-3xl">
                 <p className="text-[9px] font-bold text-hannam-muted uppercase tracking-widest mb-6">Verification Seal</p>
                 <div className="w-full max-w-[200px] h-28 flex items-center justify-center overflow-hidden">
                    {record.signature ? (
                      <img src={record.signature} alt="Seal" className="max-h-full object-contain mix-blend-multiply opacity-60" />
                    ) : (
                      <span className="text-hannam-muted italic font-serif text-xs opacity-30">Pending Seal</span>
                    )}
                 </div>
                 <p className="mt-6 text-[8px] font-mono text-hannam-muted opacity-40 uppercase tracking-widest num-data">TID: {record.id.toUpperCase()}</p>
              </div>
           </div>
        </div>

        {/* Status Section */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
           <div className="bg-white rounded-[32px] p-10 border border-[#F1EFEA] shadow-hannam-soft">
              <div className="flex items-center gap-3 mb-10 border-b border-[#F5F3EF] pb-6">
                 <Mail className="w-4 h-4 text-hannam-gold opacity-50" />
                 <h2 className="text-sm font-bold text-hannam-text uppercase tracking-widest">Delivery Report</h2>
              </div>
              <div className="space-y-10">
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="text-[9px] font-bold text-hannam-muted uppercase tracking-widest mb-1.5">Email Delivery</p>
                       <p className="text-xs font-bold text-hannam-text">{member.email}</p>
                    </div>
                    <span className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /> Sent</span>
                 </div>
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="text-[9px] font-bold text-hannam-muted uppercase tracking-widest mb-1.5">Mobile Gateway</p>
                       <p className="text-xs font-bold text-hannam-text num-data">{member.phone}</p>
                    </div>
                    <span className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /> Delivered</span>
                 </div>
              </div>
           </div>

           <div className="mt-auto space-y-4">
              <button 
                onClick={handleDownload}
                className="w-full py-5 bg-white border border-hannam-border text-hannam-text rounded-[24px] font-bold text-[11px] uppercase tracking-widest hover:bg-hannam-bg transition-all flex items-center justify-center gap-3"
              >
                <Download className="w-4 h-4" /> Export Document Archive
              </button>
              <button 
                onClick={() => navigate(`/admin/member/${member.id}`)}
                className="w-full py-6 bg-hannam-green text-white rounded-[24px] font-bold text-[11px] uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all flex items-center justify-center gap-3"
              >
                Return to Registry <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
