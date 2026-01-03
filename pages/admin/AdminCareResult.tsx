
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService, generateHannamFilename } from '../../services/dbService';
import { CareRecord, Member, NotificationType } from '../../types';
import { Mail, CheckCircle2, ChevronRight, Download, Send } from 'lucide-react';

export const AdminCareResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<CareRecord | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [notiSent, setNotiSent] = useState(false);

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

  const handleSendNotification = async () => {
    if (!record || !member) return;
    await dbService.sendNotification({
      memberId: member.id,
      type: NotificationType.CARE_DEDUCTION,
      title: '금일 서비스 이용 안내',
      message: `[${record.content}] 이용에 대한 ₩${record.discountedPrice.toLocaleString()} 크레딧 차감이 완료되었습니다. 포털에서 케어 리포트를 확인해 주세요.`,
      relatedEntityId: record.id
    });
    setNotiSent(true);
    alert('회원에게 알림이 전송되었습니다.');
  };

  const handleDownload = () => {
    if (!member || !record) return;
    const filename = generateHannamFilename(member.name, member.id, record.date);
    const content = `THE HANNAM OFFICIAL SESSION RECEIPT\n\nDate: ${record.date}\nMember: ${member.name}\nProgram: ${record.content}\nAmount: ${record.discountedPrice.toLocaleString()} KRW`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!record || !member) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold uppercase tracking-[0.3em]">Finalizing Transaction...</div>;

  return (
    <div className="min-h-screen bg-hannam-bg p-10 animate-smooth-fade">
      <div className="max-w-6xl mx-auto flex justify-end items-center mb-10 gap-6">
         <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-hannam-border shadow-hannam-soft">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-[9px] font-bold text-hannam-muted uppercase tracking-widest">System Sync Active</span>
         </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
           <div className="bg-white rounded-[32px] shadow-hannam-deep p-12 border border-[#F1EFEA] min-h-[600px] flex flex-col">
              <div className="text-center mb-16">
                 <h1 className="text-3xl font-serif font-bold text-hannam-green mb-1 uppercase tracking-widest">THE HANNAM</h1>
                 <p className="text-[9px] font-bold text-hannam-muted uppercase tracking-[0.4em]">Official Digital Receipt</p>
              </div>
              <div className="space-y-8 mb-12 border-t border-[#F5F3EF] pt-12">
                 <div className="flex justify-between items-center px-2">
                    <span className="text-hannam-muted font-bold uppercase tracking-widest text-[9px]">Issued Date</span>
                    <span className="font-bold text-hannam-text text-xs num-data">{record.date}</span>
                 </div>
                 <div className="flex justify-between items-center px-2">
                    <span className="text-hannam-muted font-bold uppercase tracking-widest text-[9px]">Curated Program</span>
                    <span className="font-bold text-hannam-text text-xs">{record.content}</span>
                 </div>
              </div>
              <div className="flex justify-between items-end mb-16 pt-10 border-t border-dashed border-hannam-border px-2">
                 <span className="text-[9px] font-bold text-hannam-muted uppercase tracking-widest mb-2">Deduction</span>
                 <span className="text-4xl font-serif font-bold text-hannam-green num-data">-{record.discountedPrice.toLocaleString()}</span>
              </div>
              <div className="mt-auto flex flex-col items-center py-6 bg-hannam-bg rounded-3xl">
                 <p className="text-[9px] font-bold text-hannam-muted uppercase tracking-widest mb-6">Verification Seal</p>
                 <div className="w-full max-w-[200px] h-28 flex items-center justify-center opacity-60">
                    {record.signature ? <img src={record.signature} alt="Seal" className="max-h-full object-contain mix-blend-multiply" /> : <span className="text-hannam-muted italic font-serif text-xs opacity-30">Pending Seal</span>}
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-7 flex flex-col justify-between">
           <div className="space-y-6">
              <div className="bg-white rounded-[32px] p-10 border border-[#F1EFEA] shadow-hannam-soft">
                 <div className="flex items-center gap-3 mb-10 border-b border-[#F5F3EF] pb-6">
                    <Mail className="w-4 h-4 text-hannam-gold opacity-50" />
                    <h2 className="text-sm font-bold text-hannam-text uppercase tracking-widest">Delivery Status</h2>
                 </div>
                 <div className="space-y-8">
                    <div className="flex justify-between items-center">
                       <span className="text-[11px] font-bold text-gray-500 uppercase">이메일 전송</span>
                       <span className="text-[10px] font-black text-green-600 bg-green-50 px-4 py-1.5 rounded-full flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Sent</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[11px] font-bold text-gray-500 uppercase">회원 포털 알림</span>
                       {notiSent ? (
                         <span className="text-[10px] font-black text-green-600 bg-green-50 px-4 py-1.5 rounded-full flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Delivered</span>
                       ) : (
                         <button onClick={handleSendNotification} className="flex items-center gap-2 px-6 py-2.5 bg-hannam-gold text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                            <Send className="w-3 h-3" /> 알림 보내기
                         </button>
                       )}
                    </div>
                 </div>
              </div>
           </div>
           <div className="space-y-4 pt-10">
              <button onClick={handleDownload} className="w-full py-5 bg-white border border-hannam-border text-hannam-text rounded-[24px] font-bold text-[11px] uppercase tracking-widest hover:bg-hannam-bg transition-all flex items-center justify-center gap-3"><Download className="w-4 h-4" /> Export Receipt</button>
              <button onClick={() => navigate(`/admin/member/${member.id}`)} className="w-full py-6 bg-hannam-green text-white rounded-[24px] font-bold text-[11px] uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all flex items-center justify-center gap-3">Return to Member Details <ChevronRight className="w-4 h-4" /></button>
           </div>
        </div>
      </div>
    </div>
  );
};
