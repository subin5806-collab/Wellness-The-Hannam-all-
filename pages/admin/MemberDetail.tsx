
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../../services/dbService';
import { Member, CareRecord, CareStatus, Reservation } from '../../types';
import { ArrowLeft, Edit2, Download, Plus, Clock, FileText, LayoutGrid, Sparkles, MessageCircle, Check, Calendar, User } from 'lucide-react';

export const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<CareRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<'membership' | 'history' | 'notes' | 'schedule' | 'ai'>('membership');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([
        dbService.getMemberById(id),
        dbService.getMemberCareHistory(id),
        dbService.getReservations(id)
      ]).then(([m, h, r]) => {
        if (m) setMember(m);
        setHistory(h);
        setReservations(r);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
      <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!member) return <div className="p-20 text-center text-gray-400">회원을 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-screen bg-[#F7F7F7] font-sans animate-fade-in pb-20">
      {/* Admin Header Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50 px-8 py-4 flex justify-between items-center shadow-sm">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-400 text-xs font-black uppercase tracking-widest hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" /> 회원 검색
        </button>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 bg-[#F9F9F9] px-4 py-2 rounded-full border border-gray-100">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Administrator Mode</span>
          </div>
          <div className="text-right">
             <p className="text-xs font-black text-gray-900 leading-none">{member.name}</p>
             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">UID: {member.id}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Profile Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-50 flex flex-col items-center">
              <div className="w-28 h-28 bg-[#F3F3F3] rounded-full flex items-center justify-center text-3xl font-bold text-gray-300 mb-6 border-4 border-white shadow-lg">
                {member.name[0]}
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-1">{member.name}</h2>
              <p className="text-gray-400 font-bold mb-8">{member.phone}</p>

              <div className="w-full space-y-4 px-2">
                 {[
                   { label: '성별', value: member.gender },
                   { label: '가입일', value: member.joinedAt },
                   { label: '이메일', value: member.email },
                   { label: '티어', value: member.tier },
                 ].map((item, idx) => (
                   <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                     <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</span>
                     <span className="text-[11px] font-black text-gray-900">{item.value}</span>
                   </div>
                 ))}
              </div>

              <div className="w-full mt-10 bg-[#F9F9F9] rounded-[24px] p-6 border border-gray-100">
                 <div className="flex justify-between items-center mb-3">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Admin Notes</span>
                   <Edit2 className="w-3 h-3 text-gray-300 hover:text-black cursor-pointer" />
                 </div>
                 <p className="text-xs font-medium text-gray-600 italic">"{member.adminNote || '특이사항 없음'}"</p>
              </div>

              <button className="w-full mt-8 py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center justify-center gap-3 hover:bg-gray-50 transition-all shadow-sm">
                <Download className="w-4 h-4" /> Download Profile (PDF)
              </button>
           </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8">
           {/* Tab Navigation */}
           <div className="flex gap-8 border-b border-gray-100 mb-12 overflow-x-auto no-scrollbar">
              {[
                { id: 'membership', label: 'Membership', icon: LayoutGrid },
                { id: 'history', label: 'History', icon: FileText },
                { id: 'notes', label: 'Care Notes', icon: MessageCircle },
                { id: 'schedule', label: 'Schedule', icon: Calendar },
                { id: 'ai', label: 'AI Insight', icon: Sparkles },
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={`pb-5 text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap relative ${
                    activeTab === tab.id ? 'text-gray-900' : 'text-gray-300 hover:text-gray-500'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-black' : 'text-gray-200'}`} />
                  {tab.label}
                  {activeTab === tab.id && <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-black rounded-full" />}
                </button>
              ))}
           </div>

           {/* Tab Contents */}
           <div className="animate-fade-in">
             {activeTab === 'membership' && (
               <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-black text-white p-10 rounded-[40px] shadow-xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-10"><LayoutGrid className="w-20 h-20" /></div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Remaining Balance</p>
                       <h3 className="text-4xl font-serif font-bold mb-8">₩ {member.remaining.toLocaleString()}</h3>
                       <div className="flex gap-8 border-t border-white/10 pt-6">
                          <div>
                            <p className="text-[9px] text-gray-500 uppercase font-black">Deposit</p>
                            <p className="text-sm font-bold">₩ {member.deposit.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 uppercase font-black">Used</p>
                            <p className="text-sm font-bold">₩ {member.used.toLocaleString()}</p>
                          </div>
                       </div>
                    </div>
                    <div className="bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm flex flex-col justify-between">
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Current Status</p>
                          <h4 className="text-2xl font-serif font-bold text-gray-900">{member.tier} Plan</h4>
                       </div>
                       <button onClick={() => navigate('/admin/contract/new')} className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                         Renew / Upgrade Membership
                       </button>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-[40px] p-10 border border-gray-50 shadow-sm">
                     <div className="flex justify-between items-center mb-8">
                        <h4 className="text-xl font-serif font-bold">Active Benefits</h4>
                        <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest">Active</span>
                     </div>
                     <p className="text-sm text-gray-500 leading-relaxed">
                        This member is currently on a 15% discount tier. Next upgrade requires an additional deposit of ₩ 3,000,000 to reach 20% tier.
                     </p>
                  </div>
               </div>
             )}

             {activeTab === 'history' && (
               <div className="space-y-6">
                 {history.length === 0 ? (
                    <div className="p-24 text-center border border-dashed rounded-[40px] text-gray-300 font-bold">No history available.</div>
                 ) : (
                    history.map(item => (
                      <div key={item.id} className="bg-white p-8 rounded-[32px] border border-gray-50 flex items-center justify-between group hover:shadow-lg transition-all">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                             <FileText className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="text-lg font-black text-gray-900">{item.content}</p>
                              <p className="text-xs font-bold text-gray-300 uppercase">{item.date} — {item.therapistName}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xl font-black text-gray-900">₩ {item.discountedPrice.toLocaleString()}</p>
                           <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${item.status === CareStatus.COMPLETED ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                             {item.status}
                           </span>
                        </div>
                      </div>
                    ))
                 )}
               </div>
             )}

             {activeTab === 'notes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {history.map(note => (
                    <div key={note.id} className="bg-white p-10 rounded-[32px] border border-gray-50 shadow-sm flex flex-col relative group">
                       <button className="absolute top-8 right-8 text-gray-200 hover:text-black transition-colors opacity-0 group-hover:opacity-100"><Edit2 className="w-4 h-4"/></button>
                       <div className="flex justify-between items-center mb-8">
                         <span className="px-4 py-1.5 bg-[#F9F9F9] rounded-full text-[9px] font-black text-gray-400 uppercase tracking-widest">{note.date}</span>
                       </div>
                       <p className="text-lg font-serif italic text-gray-900 leading-relaxed mb-8 flex-1">"{note.feedback}"</p>
                       <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                             <Check className="w-3 h-3 text-hannam-gold" />
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recommendation</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{note.recommendation}</p>
                       </div>
                    </div>
                  ))}
                </div>
             )}

             {activeTab === 'schedule' && (
                <div className="space-y-6">
                   {reservations.map(res => (
                      <div key={res.id} className="bg-white p-8 rounded-[32px] border border-gray-50 flex items-center gap-8 shadow-sm">
                         <div className="w-20 flex flex-col items-center justify-center border-r border-gray-100 pr-8">
                            <p className="text-xs font-black text-gray-400 uppercase">{new Date(res.dateTime).toLocaleDateString('en-US', {month:'short'})}</p>
                            <p className="text-2xl font-black text-gray-900">{new Date(res.dateTime).getDate()}</p>
                         </div>
                         <div className="flex-1">
                            <h5 className="text-lg font-black text-gray-900 mb-1">{res.serviceType}</h5>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{new Date(res.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} — {res.therapistName}</p>
                         </div>
                         <div className="flex gap-3">
                            <button className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-black transition-colors"><Edit2 className="w-4 h-4"/></button>
                            <button className="p-3 bg-red-50 rounded-xl text-red-300 hover:text-red-500 transition-colors"><Plus className="w-4 h-4 rotate-45"/></button>
                         </div>
                      </div>
                   ))}
                   <button className="w-full py-8 border-2 border-dashed border-gray-100 rounded-[32px] text-gray-300 hover:border-black hover:text-black transition-all flex flex-col items-center gap-3">
                      <Plus className="w-6 h-6" />
                      <span className="text-xs font-black uppercase tracking-widest">Schedule New Session</span>
                   </button>
                </div>
             )}

             {activeTab === 'ai' && (
                <div className="bg-white rounded-[40px] p-12 border border-gray-50 shadow-sm text-center">
                   <div className="w-20 h-20 bg-black rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-black/20">
                      <Sparkles className="w-10 h-10 text-white" />
                   </div>
                   <h4 className="text-2xl font-serif font-bold mb-4">Admin AI Insight</h4>
                   <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto mb-10">
                      Based on current activity, this member shows high potential for premium meditation sessions. Core muscle recovery is at 82%.
                   </p>
                   <div className="grid grid-cols-2 gap-6 text-left">
                      <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Member Preference</p>
                         <p className="text-sm font-bold">Deep relaxation, evening slots</p>
                      </div>
                      <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Churn Risk</p>
                         <p className="text-sm font-bold text-green-500">Very Low (3%)</p>
                      </div>
                   </div>
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};
