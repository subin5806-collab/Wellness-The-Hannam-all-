
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { authService } from '../../services/authService';
import { Member, CareRecord, Reservation, CareStatus, Contract } from '../../types';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, RefreshCw, Clock, ChevronRight, UserCheck, MessageSquare, Sparkles, FileText, Download, X } from 'lucide-react';
import { SignaturePad } from '../../components/SignaturePad';

export const MemberPortal: React.FC = () => {
  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<CareRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [pendingRecord, setPendingRecord] = useState<CareRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'notes'>('home');
  
  const [signature, setSignature] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingContractUrl, setViewingContractUrl] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'MEMBER') { navigate('/'); return; }
    loadMemberData();
  }, [currentUser]);

  const loadMemberData = async () => {
    if (!currentUser) return;
    const [m, h, r, c] = await Promise.all([
      dbService.getMemberById(currentUser.id),
      dbService.getMemberCareHistory(currentUser.id),
      dbService.getReservations(currentUser.id),
      dbService.getMemberContracts(currentUser.id)
    ]);
    if (m) {
      setMember(m);
      setHistory(h);
      setReservations(r);
      setContracts(c);
      const pending = h.find(rec => rec.status === CareStatus.WAITING_SIGNATURE);
      setPendingRecord(pending || null);
    }
  };

  const handleSignComplete = async () => {
    if (!pendingRecord || !signature) return;
    setIsProcessing(true);
    try {
      await dbService.signCareRecord(pendingRecord.id, signature);
      alert('결제 승인이 완료되었습니다.');
      setPendingRecord(null);
      setSignature('');
      await loadMemberData();
    } catch (e) { alert('처리 중 오류가 발생했습니다.'); } finally { setIsProcessing(false); }
  };

  if (!member) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold tracking-widest animate-pulse uppercase text-xs">Authenticating Portal...</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-hannam-text pb-32">
      <header className="px-6 py-5 flex justify-between items-center bg-white sticky top-0 z-[60] border-b border-gray-100 shadow-sm">
        <div className="flex flex-col">
          <h1 className="text-[11px] font-serif font-bold tracking-[0.2em] text-hannam-green uppercase">WELLNESS, THE HANNAM</h1>
          <p className="text-[9px] text-hannam-gold font-bold uppercase tracking-widest">Private Member Console</p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={loadMemberData} className="p-2 text-gray-300 active:scale-95 transition-transform"><RefreshCw className="w-4 h-4" /></button>
           <div className="text-right border-r border-gray-100 pr-3">
              <p className="text-[11px] font-bold text-gray-900 leading-none">{member.name}</p>
              <p className="text-[8px] font-black text-hannam-gold mt-1 uppercase tracking-tighter">ID: {member.phone}</p>
           </div>
           <div className="w-8 h-8 bg-hannam-green rounded-lg flex items-center justify-center text-white text-[11px] font-serif uppercase">{member.name[0]}</div>
        </div>
      </header>

      <main className="px-5 py-6 space-y-8 max-w-lg mx-auto">
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fade-in">
            {pendingRecord && (
              <section className="bg-white rounded-[32px] shadow-2xl border border-red-50 p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-black text-red-600 leading-tight">결제 승인 대기</h2>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Authorization Required</p>
                  </div>
                  <span className="bg-red-500 text-white text-[8px] font-black uppercase px-2.5 py-1 rounded">URGENT</span>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5 flex justify-between items-center border border-gray-100">
                  <p className="text-xs font-bold text-slate-900">{pendingRecord.content}</p>
                  <p className="text-base font-black text-red-600 num-clean">-₩{pendingRecord.discountedPrice.toLocaleString()}</p>
                </div>
                <div className="h-48 bg-white rounded-2xl border border-gray-200 overflow-hidden relative shadow-inner">
                  <SignaturePad onSave={setSignature} onClear={() => setSignature('')} />
                </div>
                <button onClick={handleSignComplete} disabled={!signature || isProcessing} className={`w-full py-5 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all ${signature ? 'bg-hannam-green text-white shadow-xl hover:bg-black' : 'bg-gray-100 text-gray-300'}`}>
                  {isProcessing ? 'Processing...' : '서명 후 결제 승인'}
                </button>
              </section>
            )}

            <section className="bg-hannam-green rounded-[32px] p-10 text-white min-h-[220px] flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mb-16" />
                <div>
                  <p className="text-[12px] font-medium text-white/70 mb-4 tracking-tight">{member.name}님 멤버십 잔액</p>
                  <h3 className="text-5xl font-serif font-medium tracking-tight"><span className="text-3xl mr-1">₩</span>{member.remaining.toLocaleString()}</h3>
                </div>
                <div className="flex gap-12 pt-6 border-t border-white/10 mt-8">
                  <div><p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Deposit</p><p className="text-[15px] font-medium num-clean">₩{member.deposit.toLocaleString()}</p></div>
                  <div><p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Usage</p><p className="text-[15px] font-medium num-clean text-red-400">₩{member.used.toLocaleString()}</p></div>
                </div>
            </section>

            <section className="space-y-4">
               <div className="flex justify-between items-end px-1">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Recent Care Recap</h3>
               </div>
               {history.filter(h => h.status === CareStatus.COMPLETED).slice(0, 2).map(note => (
                  <div key={note.id} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                     <div className="flex justify-between items-start mb-3">
                        <span className="text-[11px] font-black text-gray-900">{note.content}</span>
                        <span className="text-[9px] font-bold text-gray-300 num-clean">{note.date}</span>
                     </div>
                     <p className="text-[11px] text-gray-500 leading-relaxed font-medium italic">"{note.feedback || '세션이 안전하게 완료되었습니다.'}"</p>
                  </div>
               ))}
               {history.filter(h => h.status === CareStatus.COMPLETED).length === 0 && (
                  <div className="p-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-100 text-[10px] text-gray-300 font-bold uppercase italic">No recent history</div>
               )}
            </section>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 animate-fade-in">
             <h3 className="text-lg font-serif font-bold text-hannam-green border-b border-gray-100 pb-3 uppercase tracking-wider">Session History</h3>
             <div className="space-y-4">
                {history.map(item => (
                   <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm">
                      <div className="space-y-1">
                         <p className="text-xs font-bold text-slate-900">{item.content}</p>
                         <p className="text-[10px] text-gray-400 font-medium">{item.date} • {item.therapistName}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-slate-900 num-clean">₩{item.discountedPrice.toLocaleString()}</p>
                         <span className={`text-[8px] font-black uppercase tracking-widest ${item.status === CareStatus.COMPLETED ? 'text-hannam-green' : 'text-amber-500'}`}>{item.status}</span>
                      </div>
                   </div>
                ))}
                {history.length === 0 && <p className="text-center py-20 text-gray-300 font-bold uppercase italic text-xs">No records available</p>}
             </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-8 animate-fade-in">
             <div>
                <h3 className="text-lg font-serif font-bold text-hannam-green border-b border-gray-100 pb-3 uppercase tracking-wider mb-6">Expert Insights</h3>
                <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 shadow-xl border-t-4 border-t-hannam-gold mb-10">
                   <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-hannam-gold" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Personal Recommendation</span>
                   </div>
                   <p className="text-xs font-bold text-gray-900 leading-relaxed italic border-l-2 border-hannam-gold/20 pl-4">{member.aiRecommended}</p>
                   <p className="text-right text-[8px] font-black text-gray-300 uppercase tracking-widest">- HANNAM SPECIALIST CURATION</p>
                </div>
             </div>

             <div>
                <h3 className="text-lg font-serif font-bold text-hannam-green border-b border-gray-100 pb-3 uppercase tracking-wider mb-6">Digital Documents</h3>
                <div className="space-y-4">
                   {contracts.map(contract => (
                      <div key={contract.id} className="bg-white p-6 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm group hover:border-hannam-gold transition-colors">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 group-hover:bg-hannam-green group-hover:text-white transition-all">
                               <FileText className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="text-xs font-bold text-gray-900">{contract.typeName}</p>
                               <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{contract.createdAt.split('T')[0]}</p>
                            </div>
                         </div>
                         <button 
                            onClick={() => contract.pdfUrl && setViewingContractUrl(contract.pdfUrl)}
                            className="p-3 bg-[#FBF9F6] rounded-xl text-hannam-gold hover:bg-hannam-gold hover:text-white transition-all"
                         >
                            <Download className="w-4 h-4" />
                         </button>
                      </div>
                   ))}
                   {contracts.length === 0 && <p className="text-center py-10 text-gray-300 font-bold uppercase italic text-[10px]">No signed documents yet</p>}
                </div>
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-hannam-green text-white px-8 py-5 rounded-[24px] shadow-2xl flex justify-between items-center z-[100] backdrop-blur-md bg-opacity-95 border border-white/5">
         {[
           { id: 'home', icon: LayoutGrid, label: 'Home' },
           { id: 'history', icon: Clock, label: 'History' },
           { id: 'notes', icon: Sparkles, label: 'Insights' }
         ].map(item => (
           <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-2 transition-all active:scale-90 ${activeTab === item.id ? 'text-hannam-gold' : 'text-white/30'}`}>
              <item.icon className="w-5 h-5" /><span className="text-[8px] font-bold uppercase tracking-widest">{item.label}</span>
           </button>
         ))}
      </nav>

      {/* Contract PDF Preview Modal */}
      {viewingContractUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-lg rounded-[40px] p-12 shadow-2xl flex flex-col relative animate-fade-in">
              <button onClick={() => setViewingContractUrl(null)} className="absolute top-6 right-6 p-2 text-gray-300 hover:text-black">
                 <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-serif font-bold text-hannam-green mb-8 uppercase tracking-widest text-center border-b border-gray-50 pb-6">Digital Certificate</h2>
              <iframe src={viewingContractUrl} className="w-full h-[400px] border-0 rounded-2xl bg-gray-50 p-8 font-mono text-[11px] leading-relaxed shadow-inner" />
              <button onClick={() => setViewingContractUrl(null)} className="w-full py-5 bg-hannam-green text-white rounded-2xl font-black text-[11px] uppercase tracking-widest mt-8">Close Viewer</button>
           </div>
        </div>
      )}
    </div>
  );
};
