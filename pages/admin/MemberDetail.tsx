
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService, generateHannamFilename } from '../../services/dbService';
import { authService } from '../../services/authService';
import { Member, CareRecord, CareStatus, Reservation, Therapist, Contract } from '../../types';
import { ArrowLeft, Edit2, Download, Plus, Clock, FileText, LayoutGrid, Sparkles, MessageCircle, Check, Calendar, Mail, X, Save, ShieldCheck, Eye, PlusCircle, Printer } from 'lucide-react';

export const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  
  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<CareRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [activeTab, setActiveTab] = useState<'membership' | 'history' | 'notes' | 'schedule' | 'ai'>('membership');
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isResModalOpen, setIsResModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);

  // Form States
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState('');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('');
  const [depositAmount, setDepositAmount] = useState<number>(0);

  const [newRes, setNewRes] = useState({
    therapistId: '',
    dateTime: '',
    serviceType: ''
  });

  useEffect(() => {
    loadMemberData();
  }, [id]);

  const loadMemberData = async () => {
    if (id) {
      setLoading(true);
      const [m, h, r, th, c] = await Promise.all([
        dbService.getMemberById(id),
        dbService.getMemberCareHistory(id),
        dbService.getReservations(id),
        dbService.getTherapists(),
        dbService.getMemberContracts(id)
      ]);
      if (m) {
        setMember(m);
        setTempNote(m.adminNote || '');
        setTempGoal(m.coreGoal || '');
      }
      setHistory(h);
      setReservations(r);
      setTherapists(th);
      setContracts(c);
      setLoading(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!member || !currentUser) return;
    try {
      const updated = await dbService.updateMember(member.id, { adminNote: tempNote }, currentUser.name);
      setMember(updated);
      setIsEditingNote(false);
    } catch (e) { alert('수정 중 오류가 발생했습니다.'); }
  };

  const handleUpdateGoal = async () => {
    if (!member || !currentUser) return;
    try {
      const updated = await dbService.updateMember(member.id, { coreGoal: tempGoal }, currentUser.name);
      setMember(updated);
      setIsEditingGoal(false);
    } catch (e) { alert('수정 중 오류가 발생했습니다.'); }
  };

  const handleQuickDeposit = async () => {
    if (!member || depositAmount <= 0) return alert('추가할 금액을 입력하세요.');
    try {
      const updated = await dbService.updateMember(member.id, {
        deposit: member.deposit + depositAmount,
        remaining: member.remaining + depositAmount
      }, currentUser?.name || 'Admin');
      setMember(updated);
      setIsDepositModalOpen(false);
      setDepositAmount(0);
      alert(`${depositAmount.toLocaleString()}원이 충전되었습니다.`);
    } catch (e) { alert('처리 중 오류가 발생했습니다.'); }
  };

  const handleDownloadContract = (c: Contract) => {
    const filename = generateHannamFilename(c.memberName, c.memberId, c.createdAt);
    const content = `
==================================================
        THE HANNAM OFFICIAL DIGITAL CONTRACT
==================================================

1. DOCUMENT INFORMATION
- Document ID: ${c.id.toUpperCase()}
- Issued Date: ${new Date(c.createdAt).toLocaleString('ko-KR')}
- Contract Type: ${c.typeName}

2. MEMBER INFORMATION
- Member Name: ${c.memberName}
- Member Phone: ${c.memberPhone}
- Member Email: ${c.memberEmail}
- Member Since: ${c.memberJoinedAt}

3. FINANCIAL SUMMARY
- Total Transaction Amount: ₩${c.amount.toLocaleString()}
- Status: COMPLETED & VERIFIED

4. LEGAL DECLARATION
- This document serves as an official receipt and membership agreement 
  for Wellness The Hannam. 
- All digital signatures associated with this document are legally binding 
  under the Electronic Transactions Act.

--------------------------------------------------
THE HANNAM WELLNESS REGISTRY CENTER
HANNAM-DONG, SEOUL, KOREA
==================================================
    `;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResendCare = async (rec: CareRecord) => {
    await dbService.resendEmail('care', rec.id);
    alert(`${member?.name} 회원님께 차감 내역 영수증이 재발송되었습니다.`);
  };

  const handleCreateReservation = async () => {
    if (!member || !newRes.therapistId || !newRes.dateTime || !newRes.serviceType) return alert('모든 항목을 입력하세요.');
    const therapist = therapists.find(t => t.id === newRes.therapistId);
    await dbService.createReservation({
      memberId: member.id,
      memberName: member.name,
      therapistId: newRes.therapistId,
      therapistName: therapist?.name || 'Unknown',
      dateTime: newRes.dateTime,
      serviceType: newRes.serviceType
    });
    alert('예약이 성공적으로 등록되었습니다.');
    setIsResModalOpen(false);
    dbService.getReservations(member.id).then(setReservations);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7] font-serif text-hannam-gold uppercase tracking-widest">Loading Member Data...</div>;
  if (!member) return <div className="p-20 text-center text-gray-400">회원을 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-screen bg-[#F7F7F7] font-sans animate-fade-in pb-20">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50 px-8 py-4 flex justify-between items-center shadow-sm">
        <button onClick={() => navigate('/admin/members')} className="flex items-center gap-2 text-gray-400 text-xs font-black uppercase tracking-widest hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" /> 회원 목록
        </button>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-[#F9F9F9] px-4 py-2 rounded-full border border-gray-100">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Manager Console</span>
          </div>
          <div className="text-right">
             <p className="text-xs font-black text-gray-900 leading-none">{member.name}</p>
             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">ID: {member.id}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-50 flex flex-col items-center">
              <div className="w-28 h-28 bg-[#1A362E] rounded-full flex items-center justify-center text-3xl font-serif font-bold text-hannam-gold mb-6 border-4 border-white shadow-lg overflow-hidden">
                {member.name[0]}
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-1">{member.name}</h2>
              <p className="text-gray-400 font-bold mb-8 num-clean">{member.phone}</p>
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
              
              <div className="w-full mt-10 bg-[#F9F9F6] rounded-[24px] p-6 border border-hannam-gold/20 relative shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                   <div className="flex items-center gap-2">
                     <ShieldCheck className="w-3.5 h-3.5 text-hannam-gold" />
                     <span className="text-[10px] font-black text-hannam-gold uppercase tracking-widest">Admin Private Memo</span>
                   </div>
                   {isEditingNote ? (
                     <button onClick={handleUpdateNote} className="text-hannam-green hover:scale-110 transition-transform"><Save className="w-4 h-4" /></button>
                   ) : (
                     <button onClick={() => setIsEditingNote(true)} className="text-gray-300 hover:text-black transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                   )}
                 </div>
                 {isEditingNote ? (
                   <textarea 
                    value={tempNote} 
                    onChange={e => setTempNote(e.target.value)} 
                    className="w-full bg-white p-4 text-xs rounded-xl border border-gray-100 outline-none shadow-inner focus:border-hannam-gold transition-all" 
                    rows={4} 
                    placeholder="관리자만 볼 수 있는 특이사항을 기록하세요."
                   />
                 ) : (
                   <div className="min-h-[60px]">
                     <p className="text-xs font-medium text-gray-600 leading-relaxed">
                        {member.adminNote ? `"${member.adminNote}"` : '기록된 내부 메모가 없습니다.'}
                     </p>
                   </div>
                 )}
              </div>
           </div>
        </div>

        <div className="lg:col-span-8">
           <div className="flex gap-8 border-b border-gray-100 mb-12 overflow-x-auto no-scrollbar">
              {[
                { id: 'membership', label: 'Membership', icon: LayoutGrid },
                { id: 'history', label: 'Care History', icon: FileText },
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
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-hannam-gold' : 'text-gray-200'}`} />
                  {tab.label}
                  {activeTab === tab.id && <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-[#1A362E] rounded-full" />}
                </button>
              ))}
           </div>

           <div className="animate-fade-in">
             {activeTab === 'membership' && (
               <div className="space-y-12">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="bg-[#1A362E] text-white p-10 rounded-[40px] shadow-xl relative overflow-hidden">
                       <div className="flex justify-between items-start mb-4">
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Remaining Balance</p>
                          <button onClick={() => setIsDepositModalOpen(true)} className="flex items-center gap-1.5 text-hannam-gold hover:text-white transition-colors">
                             <PlusCircle className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Quick Add</span>
                          </button>
                       </div>
                       <h3 className="text-4xl font-serif font-bold mb-8 text-hannam-gold">₩ {member.remaining.toLocaleString()}</h3>
                       <div className="flex gap-8 border-t border-white/10 pt-6">
                          <div>
                            <p className="text-[9px] text-white/30 uppercase font-black">Total Deposit</p>
                            <p className="text-sm font-bold num-clean">₩ {member.deposit.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-white/30 uppercase font-black">Total Used</p>
                            <p className="text-sm font-bold num-clean">₩ {member.used.toLocaleString()}</p>
                          </div>
                       </div>
                    </div>
                    <div className="bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm flex flex-col justify-between">
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Current Status</p>
                          <h4 className="text-2xl font-serif font-bold text-gray-900">{member.tier} Tier</h4>
                       </div>
                       <button onClick={() => navigate('/admin/contract/new')} className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1A362E] hover:text-white transition-all shadow-sm">
                         Renew / Upgrade Membership
                       </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <FileText className="w-4 h-4 text-hannam-gold" /> Authorized Digital Agreements
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                       {contracts.map(c => (
                         <div key={c.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between group hover:border-hannam-gold transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 group-hover:bg-hannam-green group-hover:text-white transition-all">
                                  <FileText className="w-5 h-5" />
                               </div>
                               <div>
                                  <p className="text-xs font-bold text-gray-900">{c.typeName}</p>
                                  <p className="text-[9px] font-black text-gray-300 uppercase">{c.createdAt.split('T')[0]}</p>
                               </div>
                            </div>
                            <div className="flex gap-2">
                               <button 
                                  onClick={() => setViewingContract(c)}
                                  className="p-2.5 bg-[#FBF9F6] text-hannam-gold rounded-lg hover:bg-hannam-gold hover:text-white transition-all"
                                  title="이미지로 보기"
                               >
                                  <Eye className="w-4 h-4" />
                               </button>
                               <button 
                                  onClick={() => handleDownloadContract(c)}
                                  className="p-2.5 bg-[#FBF9F6] text-gray-400 rounded-lg hover:bg-black hover:text-white transition-all"
                                  title="상세 다운로드"
                               >
                                  <Download className="w-4 h-4" />
                               </button>
                            </div>
                         </div>
                       ))}
                       {contracts.length === 0 && <div className="col-span-2 py-10 text-center border border-dashed rounded-3xl text-gray-300 text-xs font-bold uppercase italic">No contracts recorded</div>}
                    </div>
                  </div>
               </div>
             )}

             {activeTab === 'ai' && (
                <div className="space-y-8">
                   <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-8">
                         <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-hannam-gold" />
                            <h3 className="text-xl font-serif font-bold uppercase tracking-widest">Personal Care Strategy</h3>
                         </div>
                         {isEditingGoal ? (
                           <button onClick={handleUpdateGoal} className="text-hannam-green"><Save className="w-5 h-5" /></button>
                         ) : (
                           <button onClick={() => setIsEditingGoal(true)} className="text-gray-300 hover:text-black"><Edit2 className="w-4 h-4" /></button>
                         )}
                      </div>
                      <div className="space-y-6">
                         <div className="bg-[#FBF9F6] p-8 rounded-3xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Core Goal</p>
                            {isEditingGoal ? (
                              <input value={tempGoal} onChange={e => setTempGoal(e.target.value)} className="w-full bg-white p-3 rounded-xl border font-bold text-sm outline-none focus:border-hannam-gold" />
                            ) : (
                              <p className="text-base font-bold text-gray-900">{member.coreGoal || '목표가 설정되지 않았습니다.'}</p>
                            )}
                         </div>
                         <div className="bg-white p-8 rounded-3xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Manager Recommendation</p>
                            <p className="text-sm font-bold text-hannam-green leading-relaxed">{member.aiRecommended}</p>
                         </div>
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'history' && (
               <div className="space-y-6">
                 {history.length === 0 ? (
                    <div className="p-24 text-center border border-dashed rounded-[40px] text-gray-300 font-bold">No history available.</div>
                 ) : (
                    history.map(item => (
                      <div key={item.id} className="bg-white p-8 rounded-[32px] border border-gray-50 flex items-center justify-between group hover:shadow-lg transition-all shadow-sm">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                             <FileText className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="text-lg font-black text-gray-900">{item.content}</p>
                              <p className="text-xs font-bold text-gray-300 uppercase">{item.date} — {item.therapistName}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="text-right">
                              <p className="text-xl font-black text-gray-900 num-clean">₩ {item.discountedPrice.toLocaleString()}</p>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${item.status === CareStatus.COMPLETED ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                {item.status}
                              </span>
                           </div>
                           <button 
                             onClick={() => handleResendCare(item)}
                             className="p-3 bg-[#E7F0FF] text-[#4A90E2] rounded-xl hover:bg-[#4A90E2] hover:text-white transition-all shadow-sm"
                             title="영수증 재발송"
                           >
                             <Mail className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    ))
                 )}
               </div>
             )}

             {activeTab === 'schedule' && (
                <div className="space-y-6">
                   <div className="flex justify-end mb-4">
                      <button 
                        onClick={() => setIsResModalOpen(true)}
                        className="bg-[#1A362E] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:opacity-90 transition-all"
                      >
                         <Plus className="w-4 h-4" /> New Reservation
                      </button>
                   </div>
                   {reservations.length === 0 ? (
                      <p className="text-center py-20 text-gray-300 italic">No scheduled reservations.</p>
                   ) : reservations.map(res => (
                      <div key={res.id} className="bg-white p-8 rounded-[32px] border border-gray-50 flex items-center gap-8 shadow-sm">
                         <div className="w-20 flex flex-col items-center justify-center border-r border-gray-100 pr-8">
                            <p className="text-xs font-black text-gray-400 uppercase">{new Date(res.dateTime).toLocaleDateString('en-US', {month:'short'})}</p>
                            <p className="text-2xl font-black text-gray-900 num-clean">{new Date(res.dateTime).getDate()}</p>
                         </div>
                         <div className="flex-1">
                            <h5 className="text-lg font-black text-gray-900 mb-1">{res.serviceType}</h5>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest num-clean">{new Date(res.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} — {res.therapistName}</p>
                         </div>
                      </div>
                   ))}
                </div>
             )}
           </div>
        </div>
      </div>

      {/* Contract Visual Preview Modal */}
      {viewingContract && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-8 overflow-y-auto">
           <div className="bg-white w-full max-w-4xl min-h-[90vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 relative">
              <div className="absolute top-6 right-6 z-50 flex gap-4 print:hidden">
                 <button onClick={() => window.print()} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-black transition-colors shadow-sm">
                    <Printer className="w-5 h-5" />
                 </button>
                 <button onClick={() => setViewingContract(null)} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex-1 p-16 md:p-24 overflow-y-auto print:p-0 flex justify-center">
                 <div className="w-full max-w-2xl border-2 border-gray-100 p-16 shadow-2xl relative bg-white aspect-[1/1.414] flex flex-col justify-between">
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                       <h2 className="text-[120px] font-serif font-bold -rotate-45">THE HANNAM</h2>
                    </div>

                    <header className="text-center mb-16 border-b border-gray-100 pb-12">
                       <h2 className="text-3xl font-serif font-bold text-hannam-green tracking-widest uppercase mb-2">Service Membership Agreement</h2>
                       <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">Official Digital Reference</p>
                    </header>

                    <section className="space-y-10 relative z-10">
                       <div className="grid grid-cols-2 gap-12">
                          <div className="space-y-4">
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50 pb-2">Client Information</p>
                             <div className="space-y-2">
                                <p className="text-sm font-bold text-gray-900">{viewingContract.memberName}</p>
                                <p className="text-xs font-medium text-gray-500 num-clean">{viewingContract.memberPhone}</p>
                                <p className="text-xs font-medium text-gray-500">{viewingContract.memberEmail}</p>
                             </div>
                          </div>
                          <div className="space-y-4 text-right">
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50 pb-2 text-right">Registry Reference</p>
                             <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-900 num-clean">{viewingContract.id.toUpperCase()}</p>
                                <p className="text-[10px] font-black text-hannam-gold uppercase tracking-widest">{viewingContract.createdAt.split('T')[0]}</p>
                             </div>
                          </div>
                       </div>

                       <div className="bg-[#FBF9F6] p-10 rounded-2xl border border-gray-50">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Service Execution</h4>
                          <div className="flex justify-between items-end">
                             <div>
                                <h3 className="text-2xl font-serif font-bold text-gray-900">{viewingContract.typeName}</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Plan Activation Guaranteed</p>
                             </div>
                             <div className="text-right">
                                <p className="text-3xl font-black text-hannam-green num-clean">₩{viewingContract.amount.toLocaleString()}</p>
                             </div>
                          </div>
                       </div>

                       <div className="pt-20 flex justify-between items-end">
                          <div className="flex items-center gap-3">
                             <ShieldCheck className="w-10 h-10 text-hannam-gold opacity-30" />
                             <div>
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Authorized By</p>
                                <p className="text-xs font-bold text-gray-900 italic">Hannam Registry Center</p>
                             </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-3">
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Client Digital Seal</p>
                             <div className="w-48 h-24 bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden flex items-center justify-center p-2 shadow-inner">
                                {viewingContract.signature ? (
                                   <img src={viewingContract.signature} alt="Client Signature" className="max-h-full object-contain mix-blend-multiply opacity-80 scale-125" />
                                ) : (
                                   <span className="text-[10px] text-gray-300 italic">No Digital Signature</span>
                                )}
                             </div>
                          </div>
                       </div>
                    </section>

                    <footer className="mt-24 pt-8 border-t border-gray-100 text-center">
                       <p className="text-[9px] font-serif font-bold text-gray-300 uppercase tracking-[0.5em]">Wellness Heritage, The Hannam — Unified Database Record</p>
                    </footer>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Quick Deposit Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[40px] p-12 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-serif font-bold text-gray-900 uppercase tracking-wider">Quick Add Credit</h2>
                 <button onClick={() => setIsDepositModalOpen(false)}><X className="w-6 h-6 text-gray-300" /></button>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Amount to Add (₩)</label>
                    <input 
                      type="number" 
                      value={depositAmount} 
                      onChange={e => setDepositAmount(Number(e.target.value))} 
                      className="w-full p-6 bg-gray-50 rounded-[24px] font-black outline-none border border-transparent focus:border-hannam-gold transition-all text-xl num-clean" 
                      placeholder="금액 입력"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    {[100000, 500000, 1000000, 5000000].map(amt => (
                      <button 
                        key={amt} 
                        onClick={() => setDepositAmount(amt)}
                        className="py-3 bg-[#FBF9F6] border border-gray-100 rounded-xl text-[10px] font-black text-gray-400 hover:text-hannam-gold hover:border-hannam-gold transition-all"
                      >
                        + ₩{amt.toLocaleString()}
                      </button>
                    ))}
                 </div>
                 <button 
                   onClick={handleQuickDeposit}
                   className="w-full py-6 bg-[#1A362E] text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-xl mt-6 hover:scale-[1.02] active:scale-[0.98] transition-all"
                 >
                    Confirm Deposit
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Reservation Modal */}
      {isResModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[40px] p-12 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-serif font-bold text-gray-900 uppercase tracking-wider">Schedule Session</h2>
                 <button onClick={() => setIsResModalOpen(false)}><X className="w-6 h-6 text-gray-300" /></button>
              </div>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Specialist</label>
                    <select 
                      value={newRes.therapistId} 
                      onChange={e => setNewRes({...newRes, therapistId: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-xl font-bold outline-none border border-transparent focus:border-hannam-gold"
                    >
                       <option value="">담당 테라피스트 선택</option>
                       {therapists.map(t => <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</label>
                    <input 
                      type="datetime-local" 
                      value={newRes.dateTime} 
                      onChange={e => setNewRes({...newRes, dateTime: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-xl font-bold outline-none border border-transparent focus:border-hannam-gold" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Program Type</label>
                    <input 
                      type="text" 
                      placeholder="예: VIP Hydro Therapy" 
                      value={newRes.serviceType} 
                      onChange={e => setNewRes({...newRes, serviceType: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-xl font-bold outline-none border border-transparent focus:border-hannam-gold" 
                    />
                 </div>
                 <button 
                   onClick={handleCreateReservation}
                   className="w-full py-5 bg-[#1A362E] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl mt-6"
                 >
                    Confirm Reservation
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
