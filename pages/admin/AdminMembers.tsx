
import React, { useEffect, useState, useRef } from 'react';
import { dbService } from '../../services/dbService';
import { Member } from '../../types';
import { Search, ChevronRight, UserPlus, Upload, X, Save, Download, Filter, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_UI } from '../../constants/adminLocale';

type SensitiveAction = 'EXPORT_CSV' | 'BACKUP_DB';

export const AdminMembers: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  
  // 보안 관련 상태
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<SensitiveAction | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = () => { dbService.getAllMembers().then(setMembers); };

  const triggerSensitiveAction = (action: SensitiveAction) => {
    setActiveAction(action);
    setIsSecurityModalOpen(true);
    setIsOtpSent(false);
    setOtpCode('');
  };

  const handleRequestOTP = async () => {
    if (!activeAction) return;
    setIsProcessing(true);
    try {
      await dbService.requestSensitiveOTP(activeAction);
      setIsOtpSent(true);
      alert('인증 코드가 이메일로 발송되었습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!activeAction || !otpCode) return;
    setIsProcessing(true);
    try {
      const success = await dbService.verifySensitiveOTP(otpCode, activeAction);
      if (success) {
        // 실제 작업 실행
        if (activeAction === 'EXPORT_CSV') await dbService.exportMembersToCSV();
        else if (activeAction === 'BACKUP_DB') await dbService.backupAllData();
        
        setIsSecurityModalOpen(false);
        setActiveAction(null);
        alert('작업이 완료되었습니다.');
      } else {
        alert('인증 코드가 일치하지 않거나 만료되었습니다.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredMembers = members.filter(m => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      m.name.toLowerCase().includes(query) || 
      m.phone.includes(query) || 
      m.email.toLowerCase().includes(query) ||
      m.id.includes(query);
    const matchesTier = tierFilter === 'ALL' || m.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).filter(l => l.trim()).map(l => {
        const v = l.split(',').map(v => v.trim());
        const entry: any = {};
        headers.forEach((h, i) => entry[h] = v[i]);
        return entry;
      });
      await dbService.registerMembersBulk(data);
      alert(`일괄 등록이 완료되었습니다.`);
      loadMembers();
      setIsBulkModalOpen(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-10 bg-hannam-bg min-h-screen animate-fade-up">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-12 border-b border-hannam-border pb-10">
          <div>
            <h1 className="text-3xl font-serif font-bold text-hannam-green tracking-tight">{ADMIN_UI.members.title}</h1>
            <p className="text-[10px] font-bold text-hannam-gold uppercase tracking-luxury mt-2">{ADMIN_UI.members.subtitle}</p>
          </div>
          <div className="flex gap-3">
             <button onClick={() => triggerSensitiveAction('EXPORT_CSV')} className="bg-white border border-hannam-border text-hannam-muted px-6 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-hannam-bg transition-all">
                <Download className="w-4 h-4" /> {ADMIN_UI.members.actions.csv}
             </button>
             <button onClick={() => triggerSensitiveAction('BACKUP_DB')} className="bg-white border border-hannam-border text-hannam-muted px-6 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-hannam-bg transition-all">
                <Save className="w-4 h-4" /> {ADMIN_UI.members.actions.backup}
             </button>
             <button onClick={() => setIsBulkModalOpen(true)} className="bg-white border border-hannam-border text-hannam-muted px-6 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-hannam-bg transition-all">
                <Upload className="w-4 h-4" /> {ADMIN_UI.members.actions.bulk}
             </button>
             <button onClick={() => navigate('/admin/register')} className="btn-hannam-primary px-8 py-3.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg">
                <UserPlus className="w-4 h-4" /> {ADMIN_UI.members.actions.register}
             </button>
          </div>
        </header>

        <div className="flex gap-4 mb-8">
           <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-hannam-muted opacity-50" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={ADMIN_UI.members.filters.searchPlaceholder} 
                className="w-full pl-14 pr-8 py-4 bg-white rounded-2xl text-sm font-medium outline-none border border-hannam-border shadow-hannam-soft focus:border-hannam-gold transition-all" 
              />
           </div>
           
           <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-2xl border border-hannam-border shadow-hannam-soft">
              <Filter className="w-3.5 h-3.5 text-hannam-muted" />
              <select 
                value={tierFilter} 
                onChange={e => setTierFilter(e.target.value)}
                className="bg-transparent text-[10px] font-bold text-hannam-muted uppercase tracking-widest outline-none cursor-pointer"
              >
                 <option value="ALL">{ADMIN_UI.members.filters.allTiers}</option>
                 <option value="ROYAL">ROYAL</option>
                 <option value="GOLD">GOLD</option>
                 <option value="SILVER">SILVER</option>
              </select>
           </div>
        </div>

        <div className="card-premium overflow-hidden">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-hannam-bg/50 text-[9px] font-bold text-hannam-muted uppercase tracking-widest border-b border-hannam-border">
                    <th className="px-10 py-6">{ADMIN_UI.members.table.identity}</th>
                    <th className="px-10 py-6">{ADMIN_UI.members.table.contact}</th>
                    <th className="px-10 py-6 text-center">{ADMIN_UI.members.table.membership}</th>
                    <th className="px-10 py-6 text-right">{ADMIN_UI.members.table.balance}</th>
                    <th className="px-10 py-6 text-right"></th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-hannam-border">
                 {filteredMembers.map(member => (
                    <tr key={member.id} onClick={() => navigate(`/admin/member/${member.id}`)} className="group hover:bg-hannam-bg cursor-pointer transition-colors">
                       <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-hannam-green rounded-xl flex items-center justify-center text-white text-[11px] font-serif shadow-sm">
                              {member.name[0]}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-hannam-text group-hover:text-hannam-green transition-colors">{member.name}</p>
                               <p className="text-[9px] text-hannam-muted font-bold tracking-luxury uppercase mt-0.5">#{member.id.slice(-6)}</p>
                            </div>
                          </div>
                       </td>
                       <td className="px-10 py-6 text-xs text-hannam-muted font-medium num-data">{member.phone}</td>
                       <td className="px-10 py-6 text-center">
                          <span className={`px-4 py-1 rounded-lg text-[9px] font-bold border transition-all ${member.tier === 'ROYAL' ? 'bg-hannam-green text-white border-transparent' : 'bg-white text-hannam-muted border-hannam-border'}`}>{member.tier}</span>
                       </td>
                       <td className="px-10 py-6 text-right">
                          <p className={`text-sm num-data font-bold ${member.remaining <= 500000 ? 'text-red-500' : 'text-hannam-text'}`}>₩ {member.remaining.toLocaleString()}</p>
                       </td>
                       <td className="px-10 py-6 text-right">
                          <ChevronRight className="w-4 h-4 text-hannam-border group-hover:text-hannam-gold transition-colors inline" />
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>

      {/* 보안 인증 모달 */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-md p-8 shadow-2xl border border-gray-200 animate-smooth-fade">
              <div className="flex justify-between items-center mb-8">
                 <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-hannam-gold" />
                    <h2 className="text-sm font-bold text-gray-900 uppercase">보안 설정</h2>
                 </div>
                 <button onClick={() => setIsSecurityModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              {!isOtpSent ? (
                <div className="space-y-6 text-center">
                   <p className="text-xs text-gray-500 leading-relaxed">
                      본인 확인을 위해 이메일로 인증 코드가 발송됩니다.<br/>
                      <span className="font-bold text-gray-900">help@thehannam.com</span>
                   </p>
                   <button onClick={handleRequestOTP} disabled={isProcessing} className="w-full py-3.5 bg-gray-900 text-white rounded-md text-[11px] font-bold uppercase tracking-widest shadow-lg">
                      {isProcessing ? '인증 코드 요청 중...' : '인증 코드 요청'}
                   </button>
                </div>
              ) : (
                <div className="space-y-6 text-center">
                   <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-900">인증 코드 입력</p>
                      <p className="text-[10px] text-gray-400">발송된 6자리 코드를 입력하세요.</p>
                   </div>
                   <input 
                     type="text" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value)} 
                     className="w-full p-4 bg-gray-50 border border-gray-200 rounded-md font-bold text-center text-2xl tracking-[0.4em] outline-none focus:border-hannam-gold"
                     placeholder="000000"
                   />
                   <div className="flex gap-2">
                      <button onClick={() => setIsOtpSent(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-md text-[10px] font-bold uppercase">이전</button>
                      <button onClick={handleVerifyOTP} disabled={otpCode.length !== 6 || isProcessing} className="flex-[2] py-3 bg-gray-900 text-white rounded-md text-[10px] font-bold uppercase disabled:opacity-30">코드 확인</button>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

      {/* 일괄 등록 모달 */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-hannam-text/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[40px] p-16 animate-fade-up shadow-hannam-deep">
              <div className="flex justify-between items-center mb-12">
                 <h2 className="text-2xl font-serif font-bold text-hannam-green uppercase tracking-wide">일괄 등록</h2>
                 <button onClick={() => setIsBulkModalOpen(false)}><X className="w-6 h-6 text-hannam-border" /></button>
              </div>
              <div className="p-16 border-2 border-dashed border-hannam-border rounded-[32px] flex flex-col items-center group hover:border-hannam-gold transition-colors">
                 <Upload className="w-10 h-10 text-hannam-border mb-8 group-hover:text-hannam-gold transition-colors" />
                 <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                 <button onClick={() => fileInputRef.current?.click()} className="btn-hannam-primary px-12 py-4 text-[10px] font-bold uppercase tracking-widest shadow-lg">CSV 파일 선택</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
