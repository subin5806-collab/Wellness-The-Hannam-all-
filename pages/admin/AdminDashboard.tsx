
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { Calendar, Clock, AlertCircle, TrendingDown, ChevronRight, User, Settings, Edit3, Trash2, Plus, X, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ContractTemplate } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const [s, r, t] = await Promise.all([
      dbService.getDashboardStats(),
      dbService.getReservations(),
      dbService.getTemplates()
    ]);
    setStats(s);
    setReservations(r.filter(res => res.status === 'booked'));
    setTemplates(t);
  };

  const handleEditTemplate = (tmpl: ContractTemplate) => {
    setEditingTemplate(tmpl);
    setNewTemplateTitle(tmpl.title);
    setIsSettingModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateTitle) return;

    if (editingTemplate) {
      await dbService.updateTemplate(editingTemplate.id, { title: newTemplateTitle });
      alert('상품 정보가 수정되었습니다.');
    } else {
      // 신규 등록 로직 (간이 등록)
      await dbService.saveTemplate({
        title: newTemplateTitle,
        type: 'MEMBERSHIP',
        pdfName: 'manual_entry.pdf',
        contentBody: '시스템 관리자에 의해 수동 등록된 상품입니다.'
      });
      alert('신규 상품이 등록되었습니다.');
    }
    
    setIsSettingModalOpen(false);
    setEditingTemplate(null);
    setNewTemplateTitle('');
    loadDashboardData();
  };

  const handleDeleteTemplate = async (id: string, title: string) => {
    if (confirm(`'${title}' 상품을 시스템에서 제거하시겠습니까?`)) {
      await dbService.deleteTemplate(id);
      loadDashboardData();
    }
  };

  if (!stats) return (
    <div className="min-h-screen flex items-center justify-center bg-hannam-bg">
      <div className="font-serif text-hannam-gold tracking-[0.4em] uppercase animate-pulse text-[12px]">Hannam Intelligence System Loading...</div>
    </div>
  );

  const statItems = [
    { label: '당일 예약 현황', value: stats.todayReservations || 0, unit: '건', icon: Calendar, path: '/admin/reservations' },
    { label: '서명 대기 세션', value: stats.pendingSignatures || 0, unit: '건', icon: Clock, path: '/admin/members' },
    { label: '신규 문의 사항', value: stats.unprocessedInquiries || 0, unit: '건', icon: AlertCircle, color: (stats.unprocessedInquiries || 0) > 0 ? 'text-red-500' : 'text-hannam-text', path: '/admin/inquiries' },
    { label: '잔액 부족 회원', value: stats.lowBalanceCount || 0, unit: '명', icon: TrendingDown, color: (stats.lowBalanceCount || 0) > 0 ? 'text-red-500' : 'text-hannam-text', path: '/admin/members' },
  ];

  return (
    <div className="p-10 bg-hannam-bg min-h-screen animate-fade-in">
      {/* Dashboard Header */}
      <div className="flex justify-between items-end mb-12 max-w-7xl mx-auto border-b border-hannam-border pb-8">
        <div>
          <h1 className="text-2xl font-serif font-medium text-hannam-green uppercase tracking-wider">Administration Dashboard</h1>
          <p className="text-[10px] font-medium text-hannam-gold uppercase tracking-[0.4em] mt-2">Intelligence Center Management</p>
        </div>
        <div className="flex items-center gap-4 text-[12px] font-medium text-hannam-subtext">
          <Calendar className="w-4 h-4 text-hannam-gold opacity-50" />
          <span className="num-clean">{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          {statItems.map((item, i) => (
            <div 
              key={i} 
              onClick={() => navigate(item.path)}
              className="card-minimal p-6 flex flex-col justify-between h-[140px] cursor-pointer group hover:border-hannam-gold"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-hannam-subtext uppercase tracking-widest">{item.label}</span>
                <item.icon className="w-5 h-5 text-hannam-gold opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className={`text-4xl num-clean ${item.color || 'text-hannam-text'}`}>{item.value}</h3>
                <span className="text-[10px] font-bold text-hannam-subtext uppercase tracking-widest">{item.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8 mb-12">
          {/* Main Content Area - Schedule */}
          <div className="col-span-8 card-minimal p-10">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                 <div className="w-1 h-6 bg-hannam-gold rounded-full" />
                 <h3 className="text-lg font-serif text-hannam-green uppercase tracking-widest">실시간 센터 예약 현황</h3>
              </div>
              <button onClick={() => navigate('/admin/reservations')} className="text-[10px] text-hannam-subtext hover:text-hannam-text font-bold uppercase tracking-widest transition-colors flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="space-y-3">
               {reservations && reservations.length > 0 ? reservations.slice(0, 6).map(res => (
                 <div 
                   key={res.id} 
                   onClick={() => navigate(`/admin/care-session/${res.id}`)}
                   className="flex items-center gap-8 p-5 rounded-xl bg-hannam-gray-bg hover:bg-white hover:border-hannam-gold border border-transparent transition-all cursor-pointer group"
                 >
                   <div className="w-20 text-center border-r border-hannam-border pr-8">
                      <p className="text-[15px] num-clean font-medium text-hannam-text">{res.dateTime?.split('T')[1]?.substring(0, 5) || '--:--'}</p>
                   </div>
                   <div className="flex-1 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-bold text-hannam-text">{res.memberName} 회원님</h4>
                        <p className="text-[11px] text-hannam-subtext mt-1">{res.serviceType}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-medium text-hannam-subtext">
                        <User className="w-3 h-3 opacity-30" /> {res.therapistName}
                      </div>
                   </div>
                   <ChevronRight className="w-4 h-4 text-hannam-border group-hover:text-hannam-gold transition-colors" />
                 </div>
               )) : <div className="py-32 text-center text-hannam-subtext font-serif italic text-sm border border-dashed border-hannam-border rounded-xl">등록된 오늘 일정이 없습니다.</div>}
            </div>
          </div>

          {/* Sidebar Area - Insights */}
          <div className="col-span-4 space-y-8">
             <div className="card-minimal p-8">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-1 h-4 bg-hannam-gold rounded-full" />
                   <h3 className="text-[11px] font-bold text-hannam-green uppercase tracking-widest">잔액 관리 대상</h3>
                </div>
                <div className="space-y-4">
                   {stats.lowBalanceMembers && stats.lowBalanceMembers.slice(0, 5).map((m: any) => (
                      <div key={m.id} onClick={() => navigate(`/admin/member/${m.id}`)} className="flex justify-between items-center group cursor-pointer border-b border-hannam-border pb-4 last:border-0 last:pb-0 hover:border-hannam-gold transition-colors">
                         <div className="flex flex-col">
                            <p className="text-[13px] font-bold text-hannam-text">{m.name}</p>
                            <span className="text-[9px] text-hannam-subtext uppercase tracking-widest">{m.tier} Member</span>
                         </div>
                         <p className="text-[14px] num-clean font-medium text-red-500">₩{m.remaining?.toLocaleString() || '0'}</p>
                      </div>
                   ))}
                   {(!stats.lowBalanceMembers || stats.lowBalanceMembers.length === 0) && (
                     <p className="text-center text-[11px] text-hannam-subtext py-10 italic">관리 대상자가 없습니다.</p>
                   )}
                </div>
             </div>

             <div className="card-minimal p-8">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-1 h-4 bg-hannam-gold rounded-full" />
                   <h3 className="text-[11px] font-bold text-hannam-green uppercase tracking-widest">신규 문의 사항</h3>
                </div>
                <div className="space-y-5">
                   {stats.recentInquiries && stats.recentInquiries.slice(0, 3).map((inq: any) => (
                      <div key={inq.id} className="border-b border-hannam-border pb-5 last:border-0 last:pb-0">
                         <div className="flex justify-between items-center mb-2">
                            <p className="text-[13px] font-bold text-hannam-text">{inq.memberName}</p>
                            <span className="text-[9px] font-bold text-hannam-gold uppercase border border-hannam-gold px-2 py-0.5 rounded">NEW</span>
                         </div>
                         <p className="text-[11px] text-hannam-subtext line-clamp-2 leading-relaxed font-medium">{inq.content}</p>
                      </div>
                   ))}
                   {(!stats.recentInquiries || stats.recentInquiries.length === 0) && (
                     <p className="text-center text-[11px] text-hannam-subtext py-10 italic">새로운 문의가 없습니다.</p>
                   )}
                </div>
             </div>
          </div>
        </div>

        {/* NEW SECTION: System Membership Configuration */}
        <section className="card-minimal p-10 animate-fade-in border-t-4 border-t-hannam-gold">
           <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                 <Settings className="w-5 h-5 text-hannam-gold" />
                 <div>
                    <h3 className="text-lg font-serif text-hannam-green uppercase tracking-widest">System Configuration: Membership Plans</h3>
                    <p className="text-[10px] text-hannam-subtext font-bold uppercase tracking-widest mt-1">센터 운영을 위한 멤버십 상품 및 계약 유형 설정</p>
                 </div>
              </div>
              <button 
                onClick={() => { setEditingTemplate(null); setNewTemplateTitle(''); setIsSettingModalOpen(true); }}
                className="px-6 py-3 bg-hannam-green text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-md"
              >
                 <Plus className="w-4 h-4" /> 신규 상품 등록
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(tmpl => (
                <div key={tmpl.id} className="p-6 bg-hannam-gray-bg rounded-2xl border border-hannam-border flex items-center justify-between group hover:border-hannam-gold transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-hannam-gold shadow-sm">
                         <FileText className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-[13px] font-bold text-hannam-text">{tmpl.title}</p>
                         <p className="text-[9px] text-hannam-subtext uppercase tracking-widest mt-0.5">{tmpl.type}</p>
                      </div>
                   </div>
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditTemplate(tmpl)} className="p-2 text-hannam-subtext hover:text-hannam-green transition-colors"><Edit3 className="w-4 h-4"/></button>
                      <button onClick={() => handleDeleteTemplate(tmpl.id, tmpl.title)} className="p-2 text-hannam-subtext hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                   </div>
                </div>
              ))}
              {templates.length === 0 && (
                <div className="col-span-3 py-20 text-center text-hannam-subtext font-serif italic text-sm border border-dashed border-hannam-border rounded-xl">
                   등록된 멤버십 상품이 없습니다.
                </div>
              )}
           </div>
        </section>
      </div>

      {/* Membership Setting Modal */}
      {isSettingModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleSaveTemplate} className="bg-white w-full max-w-md rounded-[40px] p-12 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-10">
                 <div>
                    <h2 className="text-xl font-serif font-bold text-hannam-green uppercase tracking-wider">
                       {editingTemplate ? 'Edit Membership Plan' : 'Add New Plan'}
                    </h2>
                    <p className="text-[10px] text-hannam-gold font-bold uppercase tracking-widest mt-1">Hannam Intelligence Registry</p>
                 </div>
                 <button type="button" onClick={() => setIsSettingModalOpen(false)}><X className="w-6 h-6 text-gray-300" /></button>
              </div>
              <div className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Plan Name (상품명)</label>
                    <input 
                      type="text" 
                      value={newTemplateTitle} 
                      onChange={e => setNewTemplateTitle(e.target.value)} 
                      placeholder="예: VIP 12개월 골드 멤버십" 
                      className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs outline-none border border-transparent focus:border-hannam-gold transition-all" 
                      required 
                    />
                 </div>
                 <p className="text-[9px] text-gray-300 italic">
                   * 신규 등록 시 기본 계약서 양식이 자동 할당됩니다. 상세 PDF 파일 업로드는 'Contracts > 템플릿 관리' 메뉴에서 가능합니다.
                 </p>
                 <button type="submit" className="w-full py-5 bg-[#1A362E] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">
                    {editingTemplate ? '수정 완료' : '신규 상품 등록'}
                 </button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};
