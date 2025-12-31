
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../../services/dbService';
import { Member, CareRecord, CareStatus, Reservation, Contract } from '../../types';
import { ArrowLeft, Edit2, Download, Plus, Clock, FileText, Sparkles, LogOut, Send, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { useAuth } from '../../AuthContext';

export const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<CareRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'membership' | 'history' | 'ai'>('membership');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { loadMemberData(); }, [id]);

  const loadMemberData = async () => {
    if (id) {
      const [m, h] = await Promise.all([dbService.getMemberById(id), dbService.getMemberCareHistory(id)]);
      if (m) setMember(m);
      setHistory(h);
    }
  };

  const handleResendRequest = async (recordId: string) => {
    setIsProcessing(true);
    try {
      await dbService.resendSignatureRequest(recordId);
      alert('서명 재요청 알림이 발송되었습니다.');
      await loadMemberData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!member) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold uppercase tracking-widest">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#FBF9F6] font-sans pb-20 animate-smooth-fade">
      <header className="bg-white border-b border-gray-100 px-10 py-5 flex justify-between items-center sticky top-0 z-[100]">
        <button onClick={() => navigate('/admin/members')} className="flex items-center gap-2 text-gray-400 hover:text-black text-[10px] font-black uppercase tracking-widest transition-colors"><ArrowLeft className="w-4 h-4" /> Member Directory</button>
        <div className="flex items-center gap-6">
           <div className="text-right">
              <p className="text-sm font-black text-gray-900 leading-none">{member.name}</p>
              <p className="text-[9px] font-bold text-hannam-gold uppercase mt-1 tracking-widest">{member.tier} Membership</p>
           </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-10 py-12 grid grid-cols-12 gap-10">
         <div className="col-span-4 space-y-8">
            <div className="bg-white p-10 rounded-[40px] shadow-hannam-soft border border-gray-50 flex flex-col items-center">
               <div className="w-24 h-24 bg-hannam-green rounded-full flex items-center justify-center text-2xl font-bold text-white mb-6 shadow-xl">{member.name[0]}</div>
               <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">{member.name}</h3>
               <p className="text-xs font-bold text-gray-400 num-data mb-10">{member.phone}</p>
               <div className="w-full space-y-4 pt-6 border-t border-gray-50">
                  <div className="flex justify-between text-[11px] font-bold"><span className="text-gray-400 uppercase">Remaining</span><span className="text-hannam-green num-data">₩ {member.remaining.toLocaleString()}</span></div>
                  <div className="flex justify-between text-[11px] font-bold"><span className="text-gray-400 uppercase">Total Used</span><span className="text-gray-900 num-data">₩ {member.used.toLocaleString()}</span></div>
               </div>
            </div>
         </div>

         <div className="col-span-8 space-y-10">
            <div className="flex gap-10 border-b border-gray-100 mb-8">
               {['membership', 'history', 'ai'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-4 text-[11px] font-black uppercase tracking-widest relative transition-all ${activeTab === tab ? 'text-gray-900' : 'text-gray-300'}`}>
                    {tab}
                    {activeTab === tab && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-hannam-green" />}
                 </button>
               ))}
            </div>

            {activeTab === 'history' && (
              <div className="space-y-6">
                 {history.map(record => (
                   <div key={record.id} className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-hannam-soft flex justify-between items-center group transition-all">
                      <div className="flex gap-6 items-center">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${record.status === CareStatus.SIGNED ? 'bg-green-50 text-green-500' : 'bg-amber-50 text-amber-500'}`}>
                            {record.status === CareStatus.SIGNED ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                         </div>
                         <div>
                            <p className="text-sm font-black text-gray-900">{record.content}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{record.date} • {record.therapistName}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-10">
                         <div className="text-right">
                            <p className="text-sm font-black text-gray-900 num-data">₩ {record.discountedPrice.toLocaleString()}</p>
                            <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${record.status === CareStatus.SIGNED ? 'text-green-600' : 'text-amber-600'}`}>
                               {record.status} {record.resendCount > 0 && `(Resent: ${record.resendCount})`}
                            </p>
                         </div>
                         {record.status === CareStatus.REQUESTED && (
                           <button 
                             onClick={() => handleResendRequest(record.id)} 
                             disabled={isProcessing}
                             className="p-3 bg-hannam-gold/10 text-hannam-gold rounded-xl hover:bg-hannam-gold hover:text-white transition-all shadow-sm"
                             title="서명 재요청"
                           >
                              <RotateCcw className="w-4 h-4" />
                           </button>
                         )}
                      </div>
                   </div>
                 ))}
                 {history.length === 0 && <p className="text-center py-20 text-gray-300 font-bold uppercase tracking-widest border border-dashed rounded-[32px]">No care history found.</p>}
              </div>
            )}
         </div>
      </div>
    </div>
  );
};
