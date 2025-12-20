
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

  useEffect(() => { loadDashboardData(); }, []);

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
    } else {
      await dbService.saveTemplate({ title: newTemplateTitle, type: 'MEMBERSHIP', pdfName: 'manual_entry.pdf', contentBody: 'System Generated' });
    }
    setIsSettingModalOpen(false);
    loadDashboardData();
  };

  if (!stats) return <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD] font-serif text-hannam-gold tracking-[0.4em] uppercase animate-pulse">Hannam Admin Loading...</div>;

  const statItems = [
    { label: '당일 예약', value: stats.todayReservations || 0, unit: '건', icon: Calendar, path: '/admin/reservations' },
    { label: '서명 대기', value: stats.pendingSignatures || 0, unit: '건', icon: Clock, path: '/admin/members' },
    { label: '신규 문의', value: stats.unprocessedInquiries || 0, unit: '건', icon: AlertCircle, color: 'text-red-500', path: '/admin/inquiries' },
    { label: '잔액 부족', value: stats.lowBalanceCount || 0, unit: '명', icon: TrendingDown, color: 'text-hannam-gold', path: '/admin/members' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
      <div className="max-w-7xl mx-auto border-b border-hannam-border pb-12 mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold text-hannam-green uppercase tracking-wider">Intelligence Dashboard</h1>
          <p className="text-[10px] font-black text-hannam-gold uppercase tracking-[0.4em] mt-2">Hannam Registry Center</p>
        </div>
        <div className="num-clean text-sm font-bold text-gray-400">{new Date().toLocaleDateString('ko-KR', { month:'long', day:'numeric', weekday:'short' })}</div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-4 gap-8 mb-16">
        {statItems.map((item, i) => (
          <div key={i} onClick={() => navigate(item.path)} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:border-hannam-gold transition-all cursor-pointer flex flex-col justify-between h-40">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
              <item.icon className="w-5 h-5 text-hannam-gold opacity-50" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className={`text-5xl font-serif ${item.color || 'text-hannam-green'}`}>{item.value}</h3>
              <span className="text-xs font-bold text-gray-300 uppercase">{item.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
        <div className="col-span-8 bg-white p-12 rounded-[40px] border border-gray-50 shadow-sm">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-serif font-bold text-hannam-green uppercase tracking-widest">Today's Appointments</h3>
              <button onClick={() => navigate('/admin/reservations')} className="text-[10px] font-black text-hannam-gold uppercase flex items-center gap-1">View All <ChevronRight className="w-3 h-3"/></button>
           </div>
           <div className="space-y-4">
              {reservations.slice(0, 5).map(res => (
                <div key={res.id} onClick={() => navigate(`/admin/care-session/${res.id}`)} className="p-6 bg-gray-50 rounded-2xl border border-transparent hover:border-hannam-gold transition-all cursor-pointer flex justify-between items-center">
                   <div className="w-20 border-r border-gray-200"><span className="text-lg font-serif font-bold text-hannam-green">{res.dateTime?.split('T')[1]?.substring(0, 5)}</span></div>
                   <div className="flex-1 px-8">
                      <p className="text-sm font-black text-gray-900">{res.memberName} 회원님</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{res.serviceType}</p>
                   </div>
                   <ChevronRight className="w-4 h-4 text-gray-200" />
                </div>
              ))}
           </div>
        </div>

        <div className="col-span-4 space-y-8">
           <div className="bg-hannam-green p-10 rounded-[40px] text-white shadow-xl">
              <h3 className="text-[11px] font-black text-hannam-gold uppercase tracking-[0.2em] mb-8">Plan Configuration</h3>
              <div className="space-y-4">
                {templates.map(tmpl => (
                  <div key={tmpl.id} className="flex justify-between items-center border-b border-white/10 pb-4 group">
                    <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">{tmpl.title}</span>
                    <button onClick={() => handleEditTemplate(tmpl)} className="text-hannam-gold opacity-50 hover:opacity-100"><Edit3 className="w-3.5 h-3.5"/></button>
                  </div>
                ))}
                <button onClick={() => setIsSettingModalOpen(true)} className="w-full py-4 mt-6 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"><Plus className="w-4 h-4"/> Add New Plan</button>
              </div>
           </div>
        </div>
      </div>

      {isSettingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleSaveTemplate} className="bg-white w-full max-w-md rounded-[40px] p-12 shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-xl font-serif font-bold text-hannam-green uppercase tracking-wider">{editingTemplate ? 'Edit Plan' : 'Add New Plan'}</h2>
                 <button type="button" onClick={() => setIsSettingModalOpen(false)}><X className="w-6 h-6 text-gray-300" /></button>
              </div>
              <input type="text" value={newTemplateTitle} onChange={e => setNewTemplateTitle(e.target.value)} placeholder="상품명 입력" className="w-full p-5 bg-gray-50 rounded-xl font-bold mb-8 outline-none border border-transparent focus:border-hannam-gold" required />
              <button type="submit" className="w-full py-5 bg-[#1A362E] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl">Confirm & Save</button>
           </form>
        </div>
      )}
    </div>
  );
};
