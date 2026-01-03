
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { Member, CareRecord, Reservation, CareStatus, Notice, Notification } from '../../types';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Clock, Sparkles, AlertCircle, LogOut, ChevronRight, Bell, X, CheckCircle2, ArrowRight, Megaphone, ImageIcon, Calendar } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useLanguage } from '../../LanguageContext';

export const MemberPortal: React.FC = () => {
  const { logout, user: currentUser } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<CareRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotiPanel, setShowNotiPanel] = useState(false);
  const [activePopup, setActivePopup] = useState<Notice | null>(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'MEMBER') { navigate('/'); return; }
    loadMemberData();
  }, [currentUser]);

  const loadMemberData = async () => {
    if (!currentUser) return;
    const [m, h, r, n, notis, confirmedIds] = await Promise.all([
      dbService.getMemberById(currentUser.id),
      dbService.getMemberCareHistory(currentUser.id),
      dbService.getReservations(currentUser.id),
      dbService.getNotices(true),
      dbService.getNotifications(currentUser.id),
      dbService.getConfirmedNoticeIds(currentUser.id)
    ]);

    if (m) {
      setMember(m);
      setHistory(h);
      setReservations(r);
      setNotices(n);
      setNotifications(notis);

      const pendingPopup = n.find(notice => notice.isPopup && !confirmedIds.includes(notice.id));
      if (pendingPopup) setActivePopup(pendingPopup);
    }
  };

  const handleConfirmNotice = async (noticeId: string) => {
    if (!member) return;
    await dbService.confirmNotice(member.id, noticeId);
    setActivePopup(null);
  };

  const handleReadNoti = async (notiId: string) => {
    await dbService.markNotificationAsRead(notiId);
    setNotifications(prev => prev.map(n => n.id === notiId ? { ...n, isRead: true } : n));
  };

  if (!member) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold uppercase tracking-[0.3em]">{t('portal.common.loading') || 'Connecting...'}</div>;

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const latestNotice = notices[0];
  const pendingRecord = history.find(h => h.status === CareStatus.REQUESTED);

  return (
    <div className="min-h-screen bg-hannam-bg font-sans text-hannam-text pb-48 animate-smooth-fade">
      <header className="px-8 py-6 flex justify-between items-center bg-white/60 backdrop-blur-2xl sticky top-0 z-[150] border-b border-[#F1EFEA]">
        <div className="flex flex-col">
          <h1 className="text-xs font-serif font-bold tracking-widest text-hannam-green uppercase">{t('portal.title')}</h1>
          <p className="text-[9px] text-hannam-gold font-bold uppercase tracking-widest mt-1">{t('portal.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => setShowNotiPanel(true)} className="relative p-2 text-hannam-muted hover:text-hannam-green transition-all">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />}
           </button>
           <div className="flex items-center bg-hannam-bg/80 px-4 py-2 rounded-full border border-hannam-border shadow-sm">
              <button onClick={() => setLang('ko')} className={`text-[10px] font-black px-2 ${lang === 'ko' ? 'text-hannam-green' : 'text-hannam-muted'}`}>KR</button>
              <span className="text-[10px] text-hannam-border opacity-30">|</span>
              <button onClick={() => setLang('en')} className={`text-[10px] font-black px-2 ${lang === 'en' ? 'text-hannam-green' : 'text-hannam-muted'}`}>EN</button>
           </div>
           <button onClick={() => confirm(t('portal.common.logout')) && logout()} className="p-2 text-hannam-muted hover:text-red-500 transition-colors"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      <main className="px-6 py-10 space-y-10 max-w-lg mx-auto">
        
        {/* 인사 섹션 */}
        <div className="px-2">
           <h2 className="text-2xl font-serif font-bold text-hannam-green">{t('portal.home.welcome')} {member.name}</h2>
           <p className="text-[11px] font-bold text-hannam-gold uppercase tracking-widest mt-1">{t('portal.home.tier')}: {member.tier}</p>
        </div>

        {/* 잔액 현황 카드 */}
        <section className="bg-hannam-green rounded-[40px] p-10 text-white shadow-hannam-deep relative overflow-hidden">
           <div className="relative z-10">
              <p className="text-[10px] font-bold text-white/40 mb-3 tracking-widest uppercase">{t('portal.home.remaining')}</p>
              <h3 className="text-4xl font-serif font-medium tracking-tight mb-8"><span className="text-xl mr-2 text-hannam-gold">₩</span><span className="num-data">{member.remaining.toLocaleString()}</span></h3>
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
                 <div><p className="text-[9px] text-white/30 uppercase font-black mb-1.5">{t('portal.home.totalUsage')}</p><p className="text-sm font-bold num-data">₩{member.used.toLocaleString()}</p></div>
                 <div className="text-right"><p className="text-[9px] text-white/30 uppercase font-black mb-1.5">{t('portal.home.expiry')}</p><p className="text-[11px] font-black text-hannam-gold num-data">{member.expiryDate || 'N/A'}</p></div>
              </div>
           </div>
           <LayoutGrid className="absolute -right-10 -bottom-10 w-48 h-48 text-white opacity-[0.03] pointer-events-none" />
        </section>

        {/* 차감 대기 승인 카드 */}
        {pendingRecord && (
          <section 
            onClick={() => navigate(`/contract/${pendingRecord.id}`)}
            className="bg-white rounded-[32px] shadow-hannam-deep border-2 border-hannam-gold/30 p-8 space-y-6 animate-smooth-fade cursor-pointer group hover:bg-hannam-bg/10 transition-all"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-hannam-text">{t('portal.home.pendingTitle')}</h2>
                <p className="text-[10px] font-black text-hannam-gold uppercase tracking-widest">{t('portal.home.pendingSubtitle')}</p>
              </div>
              <div className="w-12 h-12 bg-hannam-bg rounded-2xl flex items-center justify-center text-hannam-gold shadow-inner">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-[11px] font-black text-hannam-green uppercase tracking-widest pt-4 border-t border-hannam-border/30">
               {t('portal.home.authorize')} <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </div>
          </section>
        )}

        {/* 예정된 세션 */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                 <Calendar className="w-4.5 h-4.5 text-hannam-muted" />
                 <h3 className="text-[11px] font-black text-hannam-muted uppercase tracking-widest">{t('portal.home.upcoming')}</h3>
              </div>
              <span className="text-[10px] font-black text-hannam-gold num-data">{reservations.length}</span>
           </div>
           {reservations.length > 0 ? (
             <div className="space-y-3">
                {reservations.slice(0, 2).map(res => (
                   <div key={res.id} className="bg-white p-6 rounded-[28px] border border-[#F1EFEA] flex justify-between items-center group hover:border-hannam-gold transition-all">
                      <div className="flex items-center gap-5">
                         <div className="w-11 h-11 bg-hannam-bg rounded-xl flex items-center justify-center text-hannam-green font-serif font-black">{res.memberName[0]}</div>
                         <div>
                            <p className="text-[13px] font-black text-hannam-text">{res.serviceType}</p>
                            <p className="text-[10px] font-bold text-hannam-muted mt-0.5">{res.dateTime.replace('T', ' ')}</p>
                         </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-200" />
                   </div>
                ))}
             </div>
           ) : (
             <div className="py-12 text-center bg-white/40 rounded-[28px] border border-dashed border-hannam-border">
                <p className="text-gray-300 text-[10px] font-black uppercase tracking-widest">{t('portal.home.noSchedule')}</p>
             </div>
           )}
        </section>

        {/* 웰니스 인사이트 피드 */}
        <section className="space-y-6">
           <div className="flex items-center gap-3 px-2">
              <Sparkles className="w-4.5 h-4.5 text-hannam-gold" />
              <h3 className="text-[11px] font-black text-hannam-muted uppercase tracking-widest">{t('portal.insights.title')}</h3>
           </div>
           {history.filter(h => h.status === CareStatus.SIGNED).length > 0 ? (
             history.filter(h => h.status === CareStatus.SIGNED).slice(0, 3).map(item => (
               <div key={item.id} onClick={() => navigate(`/contract/${item.id}`)} className="bg-white rounded-[32px] p-8 border border-[#F1EFEA] shadow-hannam-soft space-y-5 cursor-pointer hover:shadow-hannam-deep transition-all group">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-[9px] font-black text-gray-300 uppercase mb-1.5 num-data">{item.date}</p>
                        <h4 className="text-[15px] font-black text-hannam-text group-hover:text-hannam-green transition-colors">{item.content}</h4>
                     </div>
                     <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                        <CheckCircle2 className="w-4.5 h-4.5" />
                     </div>
                  </div>
                  <p className="text-[12px] text-gray-500 leading-relaxed font-medium line-clamp-2 italic opacity-80 group-hover:opacity-100">"{item.feedback || t('portal.insights.noData')}"</p>
               </div>
             ))
           ) : (
             <div className="py-20 text-center bg-white/40 rounded-[32px] border border-dashed border-hannam-border">
                <p className="text-gray-300 text-[10px] font-black uppercase tracking-widest">{t('portal.insights.noData')}</p>
             </div>
           )}
        </section>
      </main>

      {/* 알림 센터 패널 */}
      {showNotiPanel && (
        <div className="fixed inset-0 z-[200] flex justify-end">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNotiPanel(false)} />
           <div className="relative w-full max-w-[380px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
              <div className="p-10 border-b border-[#F1EFEA] flex justify-between items-center bg-white sticky top-0">
                 <div>
                    <h2 className="text-lg font-serif font-bold text-hannam-green">{t('portal.home.welcome')}</h2>
                    <p className="text-[9px] font-black text-hannam-gold uppercase tracking-widest mt-1">Notification Center</p>
                 </div>
                 <button onClick={() => setShowNotiPanel(false)} className="p-2 text-hannam-muted hover:text-black transition-colors"><X className="w-7 h-7" /></button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-4 bg-hannam-bg/20">
                 {notifications.map(noti => (
                    <div 
                      key={noti.id} 
                      onClick={() => !noti.isRead && handleReadNoti(noti.id)}
                      className={`p-7 rounded-[32px] border transition-all cursor-pointer ${noti.isRead ? 'bg-hannam-bg/40 border-hannam-border' : 'bg-white border-hannam-gold/20 shadow-hannam-soft'}`}
                    >
                       <div className="flex justify-between items-start mb-4">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${noti.isRead ? 'text-gray-300 border border-gray-100' : 'text-hannam-gold bg-hannam-bg border border-hannam-gold/20'}`}>{noti.type.replace('_', ' ')}</span>
                          <span className="text-[9px] font-bold text-gray-300 num-data">{noti.createdAt.split('T')[0]}</span>
                       </div>
                       <h4 className={`text-[13px] font-black mb-2 ${noti.isRead ? 'text-gray-400' : 'text-hannam-text'}`}>{noti.title}</h4>
                       <p className={`text-[12px] leading-relaxed font-medium ${noti.isRead ? 'text-gray-300' : 'text-gray-500'}`}>{noti.message}</p>
                    </div>
                 ))}
                 {notifications.length === 0 && (
                   <div className="py-40 text-center">
                      <Bell className="w-12 h-12 text-hannam-border mx-auto mb-6 opacity-30" />
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{t('portal.history.noData') || 'No notifications yet'}</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
