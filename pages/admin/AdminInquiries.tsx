
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { authService } from '../../services/authService';
import { Inquiry, InquiryStatus, InquiryPath, InquiryLog } from '../../types';
import { Search, Plus, X, Phone, User as UserIcon, MessageSquare, Clock, Filter, UserCheck, MoreHorizontal, Download, History, Send, AlertCircle } from 'lucide-react';

export const AdminInquiries: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [newLogText, setNewLogText] = useState('');
  const [exportMonth, setExportMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  
  const currentUser = authService.getCurrentUser();

  const [formData, setFormData] = useState({
    memberName: '',
    phone: '',
    path: 'PHONE' as InquiryPath,
    content: ''
  });

  useEffect(() => { loadInquiries(); }, []);

  const loadInquiries = () => { dbService.getInquiries().then(inqs => setInquiries(inqs.sort((a,b) => b.id.localeCompare(a.id)))); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberName || !formData.phone) return alert('성함과 연락처는 필수입니다.');
    await dbService.createInquiry({ ...formData, adminName: currentUser?.name || 'Staff' });
    setIsModalOpen(false);
    setFormData({ memberName: '', phone: '', path: 'PHONE', content: '' });
    loadInquiries();
  };

  const handleStatusUpdate = async (id: string, newStatus: InquiryStatus) => {
    await dbService.updateInquiry(id, { status: newStatus });
    loadInquiries();
  };

  const handleAddLog = async () => {
    if (!selectedInquiry || !newLogText.trim()) return;
    const updated = await dbService.addInquiryLog(selectedInquiry.id, currentUser?.name || 'Staff', newLogText);
    setSelectedInquiry(updated);
    setNewLogText('');
    loadInquiries();
  };

  const toggleFollowUp = async (id: string, current: boolean) => {
    await dbService.updateInquiry(id, { needsFollowUp: !current });
    loadInquiries();
  };

  const getStatusLabel = (status: InquiryStatus) => {
    switch (status) {
      case 'UNREGISTERED': return '미등록';
      case 'IN_PROGRESS': return '상담중';
      case 'REGISTERED': return '등록완료';
      case 'COMPLETED': return '종결';
    }
  };

  const getStatusColor = (status: InquiryStatus) => {
    switch (status) {
      case 'UNREGISTERED': return 'text-gray-400 bg-gray-50';
      case 'IN_PROGRESS': return 'text-blue-500 bg-blue-50';
      case 'REGISTERED': return 'text-green-600 bg-green-50';
      case 'COMPLETED': return 'text-gray-900 bg-gray-100';
    }
  };

  const filteredInquiries = inquiries.filter(i => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = i.memberName.includes(searchTerm) || i.phone.includes(searchTerm) || i.content.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 이번달 전환율 계산
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const thisMonthInqs = inquiries.filter(i => i.yearMonth === currentMonth);
  const registeredCount = thisMonthInqs.filter(i => i.status === 'REGISTERED').length;
  const conversionRate = thisMonthInqs.length > 0 ? Math.round((registeredCount / thisMonthInqs.length) * 100) : 0;

  return (
    <div className="p-8 bg-[#FBF9F6] min-h-screen font-sans animate-fade-in flex flex-col gap-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        
        {/* Header Section */}
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 mb-1 uppercase tracking-wider">Leads & Inquiries</h1>
            <p className="text-[10px] font-black text-[#C9B08F] uppercase tracking-[0.4em]">Integrated Customer Acquisition Console</p>
          </div>
          <div className="flex gap-3">
             <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
                <select value={exportMonth} onChange={e => setExportMonth(e.target.value)} className="bg-transparent text-[10px] font-black uppercase outline-none">
                   {[...Array(12)].map((_, i) => {
                     const d = new Date();
                     d.setMonth(d.getMonth() - i);
                     const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                     return <option key={ym} value={ym}>{ym}</option>;
                   })}
                </select>
                <button onClick={() => dbService.exportInquiriesByMonth(exportMonth)} className="text-hannam-gold hover:text-black transition-colors">
                   <Download className="w-4 h-4" />
                </button>
             </div>
             <button onClick={() => setIsModalOpen(true)} className="bg-[#1A362E] text-white px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all">
                <Plus className="w-4 h-4" /> 신규 문의 접수
             </button>
          </div>
        </header>

        {/* Status Dashboard Area */}
        <div className="grid grid-cols-4 gap-4">
           {[
             { label: '이번달 전환율', value: `${conversionRate}%`, color: 'text-hannam-gold', sub: `${registeredCount}/${thisMonthInqs.length}건 등록` },
             { label: '재컨택 대상', value: inquiries.filter(i => i.needsFollowUp).length, color: 'text-red-500', sub: '상담 누락 방지' },
             { label: '상담중 리드', value: inquiries.filter(i => i.status === 'IN_PROGRESS').length, color: 'text-blue-500', sub: '현재 진행 중' },
             { label: '미등록 고객', value: inquiries.filter(i => i.status === 'UNREGISTERED').length, color: 'text-gray-400', sub: '초동 상담 필요' },
           ].map((stat, idx) => (
             <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                   <h3 className={`text-2xl font-serif font-bold ${stat.color}`}>{stat.value}</h3>
                   <span className="text-[9px] font-bold text-gray-400">{stat.sub}</span>
                </div>
             </div>
           ))}
        </div>

        {/* Filter & Search */}
        <div className="flex gap-3">
           <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="고객명, 연락처, 상담 내용 통합 검색..." 
                className="w-full pl-11 pr-6 py-3 bg-white rounded-xl text-xs font-bold outline-none border border-gray-50 shadow-sm" 
              />
           </div>
           <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-50 shadow-sm">
              <Filter className="w-3 h-3 text-gray-300" />
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent text-[9px] font-black text-gray-400 uppercase tracking-widest outline-none"
              >
                 <option value="ALL">전체 상태</option>
                 <option value="UNREGISTERED">미등록</option>
                 <option value="IN_PROGRESS">상담중</option>
                 <option value="REGISTERED">등록완료</option>
                 <option value="COMPLETED">종결</option>
              </select>
           </div>
        </div>

        {/* Condensed List View */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-[#FBFBFB] text-[8px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                       <th className="px-6 py-4 w-12 text-center">F/U</th>
                       <th className="px-6 py-4">Identity / Path</th>
                       <th className="px-6 py-4">Status & Staff</th>
                       <th className="px-6 py-4">Latest Memo</th>
                       <th className="px-6 py-4 text-right">Date</th>
                       <th className="px-6 py-4 text-right">Logs</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {filteredInquiries.map(inq => (
                       <tr 
                         key={inq.id} 
                         className={`hover:bg-gray-50/50 cursor-pointer transition-all ${inq.needsFollowUp ? 'bg-red-50/30' : ''}`}
                         onClick={() => setSelectedInquiry(inq)}
                       >
                          <td className="px-6 py-3 text-center" onClick={(e) => { e.stopPropagation(); toggleFollowUp(inq.id, inq.needsFollowUp); }}>
                             <AlertCircle className={`w-4 h-4 mx-auto transition-colors ${inq.needsFollowUp ? 'text-red-500 fill-red-50' : 'text-gray-100 hover:text-gray-300'}`} />
                          </td>
                          <td className="px-6 py-3">
                             <div className="flex items-center gap-3">
                                <div className="text-[11px] font-black text-gray-900">{inq.memberName}</div>
                                <div className="text-[9px] font-bold text-gray-400 num-clean">{inq.phone}</div>
                                <span className="text-[8px] px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded-md font-black uppercase">{inq.path}</span>
                             </div>
                          </td>
                          <td className="px-6 py-3">
                             <div className="flex items-center gap-3">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border border-transparent ${getStatusColor(inq.status)}`}>
                                   {getStatusLabel(inq.status)}
                                </span>
                                <span className="text-[9px] text-gray-300 font-bold">담당: {inq.assignedStaff}</span>
                             </div>
                          </td>
                          <td className="px-6 py-3">
                             <p className="text-[10px] text-gray-500 font-medium truncate max-w-sm">
                                {inq.logs.length > 0 ? inq.logs[inq.logs.length - 1].content : inq.content}
                             </p>
                          </td>
                          <td className="px-6 py-3 text-right">
                             <span className="text-[9px] font-bold text-gray-300 num-clean uppercase">{inq.createdAt.split(' ')[0]}</span>
                          </td>
                          <td className="px-6 py-3 text-right">
                             <div className="flex items-center justify-end gap-1.5 text-hannam-gold">
                                <History className="w-3 h-3" />
                                <span className="text-[10px] font-black">{inq.logs.length}</span>
                             </div>
                          </td>
                       </tr>
                    ))}
                    {filteredInquiries.length === 0 && (
                      <tr><td colSpan={6} className="py-32 text-center text-[11px] text-gray-300 italic font-bold">No entries found.</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>

      {/* Inquiry Details & Logs Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-4xl rounded-[40px] flex h-[80vh] overflow-hidden shadow-2xl animate-in zoom-in-95">
              {/* Sidebar: Details */}
              <div className="w-[320px] bg-[#FBF9F6] p-10 flex flex-col border-r border-gray-100">
                 <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-serif font-bold text-[#1A362E] uppercase">Consultation</h2>
                    <button onClick={() => setSelectedInquiry(null)}><X className="w-6 h-6 text-gray-300 hover:text-black" /></button>
                 </div>
                 
                 <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
                    <div>
                       <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Lead Identity</p>
                       <p className="text-xl font-black text-gray-900 leading-tight">{selectedInquiry.memberName}</p>
                       <p className="text-xs font-bold text-gray-400 mt-1 num-clean">{selectedInquiry.phone}</p>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                       <div className="flex justify-between">
                          <span className="text-[9px] font-black text-gray-300 uppercase">Status</span>
                          <select 
                            value={selectedInquiry.status} 
                            onChange={(e) => handleStatusUpdate(selectedInquiry.id, e.target.value as InquiryStatus)}
                            className="bg-transparent text-[10px] font-black text-hannam-gold uppercase focus:outline-none"
                          >
                             <option value="UNREGISTERED">미등록</option>
                             <option value="IN_PROGRESS">상담중</option>
                             <option value="REGISTERED">등록완료</option>
                             <option value="COMPLETED">종결</option>
                          </select>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-[9px] font-black text-gray-300 uppercase">Path</span>
                          <span className="text-[10px] font-black text-gray-900">{selectedInquiry.path}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-[9px] font-black text-gray-300 uppercase">Follow-up</span>
                          <button onClick={() => toggleFollowUp(selectedInquiry.id, selectedInquiry.needsFollowUp)}>
                             <AlertCircle className={`w-4 h-4 ${selectedInquiry.needsFollowUp ? 'text-red-500' : 'text-gray-200'}`} />
                          </button>
                       </div>
                    </div>
                    <div className="pt-6">
                       <p className="text-[9px] font-black text-gray-300 uppercase mb-2">Original Inquiry</p>
                       <p className="text-xs font-medium text-gray-600 leading-relaxed italic bg-white p-4 rounded-xl border border-gray-100">"{selectedInquiry.content}"</p>
                    </div>
                 </div>
                 <div className="pt-6 border-t border-gray-200">
                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">접수: {selectedInquiry.receivedBy} | {selectedInquiry.createdAt}</p>
                 </div>
              </div>

              {/* Main Content: Logs Timeline */}
              <div className="flex-1 p-10 flex flex-col bg-white">
                 <div className="flex items-center gap-3 mb-10 border-b border-gray-50 pb-6">
                    <History className="w-5 h-5 text-hannam-gold" />
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Consultation Log Timeline</h3>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto pr-2 space-y-6 no-scrollbar">
                    {selectedInquiry.logs.map((log, idx) => (
                       <div key={log.id} className="relative pl-8">
                          {/* Timeline dot */}
                          <div className="absolute left-0 top-1 w-2.5 h-2.5 bg-hannam-gold rounded-full border-4 border-white shadow-sm z-10" />
                          {idx !== selectedInquiry.logs.length - 1 && <div className="absolute left-1 top-2 w-[1px] h-[calc(100%+24px)] bg-gray-100" />}
                          
                          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-50">
                             <div className="flex justify-between mb-2">
                                <span className="text-[10px] font-black text-gray-900">{log.staffName}</span>
                                <span className="text-[9px] text-gray-300 font-bold num-clean">{log.createdAt}</span>
                             </div>
                             <p className="text-xs font-medium text-gray-600 leading-relaxed">{log.content}</p>
                          </div>
                       </div>
                    ))}
                    {selectedInquiry.logs.length === 0 && (
                      <div className="py-20 text-center">
                         <MessageSquare className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                         <p className="text-xs text-gray-300 font-bold uppercase tracking-widest">No previous logs. Start recording now.</p>
                      </div>
                    )}
                 </div>

                 <div className="mt-8 pt-8 border-t border-gray-100 flex gap-4">
                    <div className="flex-1 relative">
                       <input 
                         type="text" 
                         value={newLogText}
                         onChange={e => setNewLogText(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && handleAddLog()}
                         placeholder="새로운 상담 내용을 기록하세요..." 
                         className="w-full pl-6 pr-12 py-4 bg-gray-50 rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-hannam-gold transition-all"
                       />
                       <button onClick={handleAddLog} className="absolute right-4 top-1/2 -translate-y-1/2 text-hannam-gold hover:text-black">
                          <Send className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* New Inquiry Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleCreate} className="bg-white w-full max-w-lg rounded-[40px] p-12 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-10">
                 <div>
                    <h2 className="text-2xl font-serif font-bold text-gray-900 uppercase tracking-wider">New Lead Entry</h2>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1">Reception Counter</p>
                 </div>
                 <button type="button" onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-300" /></button>
              </div>
              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Client Name *</label>
                       <input type="text" value={formData.memberName} onChange={e => setFormData({...formData, memberName: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs outline-none focus:bg-white focus:ring-1 focus:ring-black transition-all" placeholder="성함" required />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number *</label>
                       <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs outline-none focus:bg-white focus:ring-1 focus:ring-black transition-all num-clean" placeholder="010-0000-0000" required />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Inquiry Path</label>
                    <select value={formData.path} onChange={e => setFormData({...formData, path: e.target.value as InquiryPath})} className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs outline-none">
                       <option value="PHONE">유선 전화 (Phone)</option>
                       <option value="VISIT">직접 방문 (Visit)</option>
                       <option value="WEB">공식 웹사이트 (Web)</option>
                       <option value="SNS">인스타그램 / 블로그 (SNS)</option>
                       <option value="ETC">지인 추천 / 기타 (Etc)</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Consultation Details</label>
                    <textarea rows={4} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs outline-none focus:bg-white focus:ring-1 focus:ring-black transition-all" placeholder="최초 문의 경로 및 상세 상담 내용을 기록하세요." />
                 </div>
                 <div className="pt-4">
                    <button type="submit" className="w-full py-5 bg-[#1A362E] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">
                       문의사항 등록 및 저장
                    </button>
                 </div>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};
