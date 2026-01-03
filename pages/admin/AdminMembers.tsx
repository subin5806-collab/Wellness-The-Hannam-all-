
import React, { useEffect, useState, useRef } from 'react';
import { dbService } from '../../services/dbService';
import { authService } from '../../services/authService';
import { Member } from '../../types';
import { 
  Search, ChevronRight, Download, Filter, Trash2, Users, Eye, 
  AlertTriangle, Calendar, Clock, Database, Upload, FileDown, Plus, X 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type SensitiveAction = 'EXPORT_CSV' | 'BACKUP_DB' | 'BULK_IMPORT';
type ExpiryStatus = 'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';

export const AdminMembers: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [expiryFilter, setExpiryFilter] = useState<ExpiryStatus>('ALL');
  
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<SensitiveAction | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkData, setBulkData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = () => { dbService.getAllMembers().then(setMembers); };

  const triggerSensitiveAction = (action: SensitiveAction) => {
    setActiveAction(action);
    setIsSecurityModalOpen(true);
    setIsOtpSent(false);
    setOtpCode('');
    setErrorMsg('');
  };

  const handleRequestOTP = async () => {
    if (!currentUser?.email) return;
    setIsProcessing(true);
    try {
      await dbService.requestAdminOTP(currentUser.email);
      setIsOtpSent(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!activeAction || !otpCode || !currentUser) return;
    setIsProcessing(true);
    const success = await dbService.verifyAdminOTP(currentUser.email, otpCode);
    if (success) {
      if (activeAction === 'EXPORT_CSV') {
        await dbService.exportMembersToCSV(currentUser.name);
        setIsSecurityModalOpen(false);
      } else if (activeAction === 'BACKUP_DB') {
        await dbService.backupAllData({ name: currentUser.name, email: currentUser.email });
        setIsSecurityModalOpen(false);
      } else if (activeAction === 'BULK_IMPORT') {
        setIsSecurityModalOpen(false);
        setIsBulkModalOpen(true);
      }
    } else {
      setErrorMsg('인증 코드가 일치하지 않습니다.');
    }
    setIsProcessing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = values[i]?.trim();
        });
        return obj;
      }).filter(row => row.name && row.phone);
      setBulkData(rows);
    };
    reader.readAsText(file);
  };

  const executeBulkImport = async () => {
    if (!currentUser || bulkData.length === 0) return;
    setIsProcessing(true);
    try {
      const results = await dbService.bulkRegisterMembers(bulkData, currentUser.name);
      alert(`일괄 등록 완료!\n성공: ${results.success}건\n중복 제외: ${results.skipped}건`);
      setIsBulkModalOpen(false);
      setBulkData([]);
      loadMembers();
    } finally {
      setIsProcessing(false);
    }
  };

  const getExpiryStatus = (expiryDate?: string): ExpiryStatus => {
    if (!expiryDate) return 'ACTIVE';
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'EXPIRED';
    if (diffDays <= 30) return 'EXPIRING_SOON';
    return 'ACTIVE';
  };

  const filteredMembers = members.filter(m => {
    const query = searchTerm.toLowerCase();
    const cleanQuery = query.replace(/[^0-9]/g, '');
    const cleanPhone = m.phone.replace(/[^0-9]/g, '');
    const matchesSearch = m.name.toLowerCase().includes(query) || cleanPhone.includes(cleanQuery) || m.id.includes(cleanQuery);
    const matchesTier = tierFilter === 'ALL' || m.tier === tierFilter;
    const mStatus = getExpiryStatus(m.expiryDate);
    const matchesExpiry = expiryFilter === 'ALL' || mStatus === expiryFilter;
    return matchesSearch && matchesTier && matchesExpiry;
  });

  return (
    <div className="p-10 bg-hannam-bg min-h-screen animate-smooth-fade font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-12 border-b border-hannam-border pb-10">
          <div>
            <h1 className="text-3xl font-serif font-bold text-hannam-green tracking-tight leading-tight uppercase">Registry</h1>
            <p className="text-[10px] font-black text-hannam-gold uppercase tracking-[0.3em] mt-2">Private Member Directory</p>
          </div>
          
          {/* [복구] 핵심 운영 버튼 4종 액션 영역 */}
          <div className="flex gap-3">
             <button 
               onClick={() => triggerSensitiveAction('EXPORT_CSV')} 
               className="bg-white border border-hannam-border text-hannam-muted px-5 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-all hover:bg-hannam-bg hover:text-hannam-green"
             >
                <FileDown className="w-4 h-4" /> CSV 내보내기
             </button>
             <button 
               onClick={() => triggerSensitiveAction('BACKUP_DB')} 
               className="bg-white border border-hannam-border text-hannam-muted px-5 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-all hover:bg-hannam-bg hover:text-hannam-green"
             >
                <Database className="w-4 h-4" /> 전체 백업
             </button>
             <button 
               onClick={() => triggerSensitiveAction('BULK_IMPORT')} 
               className="bg-white border border-hannam-border text-hannam-muted px-5 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-all hover:bg-hannam-bg hover:text-hannam-green"
             >
                <Upload className="w-4 h-4" /> 일괄 등록
             </button>
             <button 
               onClick={() => navigate('/admin/register')} 
               className="bg-hannam-green text-white px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-all hover:bg-black shadow-hannam-deep"
             >
                <Plus className="w-4.5 h-4.5" /> 신규 회원 등록
             </button>
          </div>
        </header>

        {/* 필터 섹션 */}
        <div className="flex flex-col gap-4 mb-10">
           <div className="flex gap-4">
              <div className="flex-1 relative group">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-hannam-muted group-focus-within:text-hannam-gold transition-colors" />
                 <input 
                   type="text" 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   placeholder="이름, 고유 ID, 또는 휴대폰 번호로 검색..." 
                   className="w-full pl-16 pr-8 py-5 bg-white rounded-[24px] text-[13px] font-bold outline-none border border-hannam-border focus:border-hannam-gold shadow-hannam-soft transition-all" 
                 />
              </div>
              <div className="flex items-center gap-4 bg-white px-8 py-2 rounded-[24px] border border-hannam-border shadow-hannam-soft">
                 <span className="text-[10px] font-black text-hannam-muted uppercase tracking-widest whitespace-nowrap">멤버십 상태:</span>
                 <select 
                   value={expiryFilter} 
                   onChange={e => setExpiryFilter(e.target.value as any)} 
                   className="bg-transparent text-[11px] font-black text-hannam-green uppercase outline-none cursor-pointer"
                 >
                    <option value="ALL">전체 상태</option>
                    <option value="ACTIVE">정상 유지</option>
                    <option value="EXPIRING_SOON">만료 임박 (30일)</option>
                    <option value="EXPIRED">기간 만료</option>
                 </select>
              </div>
           </div>
        </div>

        <div className="bg-white border border-hannam-border rounded-[48px] overflow-hidden shadow-hannam-soft">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-hannam-bg/40 text-[9px] font-black text-hannam-muted uppercase tracking-widest border-b border-hannam-border">
                    <th className="px-12 py-6">Client Identity</th>
                    <th className="px-12 py-6">Expiry Info</th>
                    <th className="px-12 py-6 text-center">Tier</th>
                    <th className="px-12 py-6 text-right">Balance</th>
                    <th className="px-12 py-6 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-hannam-border">
                 {filteredMembers.map(member => {
                    const expiryStatus = getExpiryStatus(member.expiryDate);
                    return (
                    <tr key={member.id} className="hover:bg-hannam-bg/30 transition-colors group">
                       <td className="px-12 py-7 cursor-pointer" onClick={() => navigate(`/admin/member/${member.id}`)}>
                          <div className="flex items-center gap-5">
                            <div className="w-11 h-11 bg-hannam-bg border border-hannam-border rounded-full flex items-center justify-center text-hannam-green text-[13px] font-serif font-black">{member.name[0]}</div>
                            <div>
                               <p className="text-[15px] font-bold text-hannam-text group-hover:text-hannam-green transition-colors">{member.name} 님</p>
                               <p className="text-[10px] text-hannam-muted font-bold num-data">{member.phone}</p>
                            </div>
                          </div>
                       </td>
                       <td className="px-12 py-7">
                          <div className="flex items-center gap-2">
                             {expiryStatus === 'EXPIRED' ? (
                               <span className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-tighter">
                                 <AlertTriangle className="w-3 h-3" /> 기간 만료
                               </span>
                             ) : expiryStatus === 'EXPIRING_SOON' ? (
                               <span className="flex items-center gap-1.5 text-[10px] font-black text-hannam-gold uppercase tracking-tighter">
                                 <Clock className="w-3 h-3" /> 만료 임박
                               </span>
                             ) : (
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">정상</span>
                             )}
                             <span className="text-[10px] font-bold text-gray-300 num-data ml-2">~ {member.expiryDate || '무기한'}</span>
                          </div>
                       </td>
                       <td className="px-12 py-7 text-center">
                          <span className={`px-5 py-1.5 rounded-lg text-[9px] font-black tracking-[0.2em] border ${member.tier === 'ROYAL' ? 'bg-hannam-green text-white border-transparent' : 'bg-white text-hannam-muted border-hannam-border'}`}>{member.tier}</span>
                       </td>
                       <td className="px-12 py-7 text-right">
                          <p className={`text-[16px] num-data font-bold ${member.remaining <= 500000 ? 'text-red-500' : 'text-hannam-text'}`}><span className="text-[11px] mr-1 opacity-30">₩</span>{member.remaining.toLocaleString()}</p>
                       </td>
                       <td className="px-12 py-7 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/member/${member.id}`); }} className="px-4 py-2 bg-hannam-bg border border-hannam-border rounded-xl text-[10px] font-bold text-hannam-muted hover:text-hannam-green transition-all">관리</button>
                          </div>
                       </td>
                    </tr>
                 )})}
              </tbody>
           </table>
        </div>
      </div>

      {/* 보안 인증 모달 */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[48px] p-12 shadow-2xl animate-smooth-fade text-center border border-hannam-border">
              <div className="flex justify-between items-center mb-8 border-b border-hannam-border pb-6">
                <h2 className="text-xs font-black text-hannam-green uppercase tracking-[0.2em]">Security Authorization</h2>
                <button onClick={() => setIsSecurityModalOpen(false)}><X className="w-5 h-5 text-gray-300" /></button>
              </div>
              {!isOtpSent ? (
                <div className="space-y-8">
                  <p className="text-[11px] text-hannam-muted leading-relaxed font-bold italic">중요 데이터 제어 권한을 획득하기 위해<br/>관리자 이메일 인증이 필요합니다.</p>
                  <button onClick={handleRequestOTP} disabled={isProcessing} className="w-full py-5 bg-hannam-green text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all">인증 코드 전송</button>
                </div>
              ) : (
                <div className="space-y-8">
                  <input type="text" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full p-5 bg-hannam-bg text-center text-4xl font-black tracking-[0.4em] outline-none border border-hannam-border rounded-2xl text-hannam-green" placeholder="000000" />
                  <button onClick={handleVerifyOTP} disabled={isProcessing} className="w-full py-5 bg-hannam-green text-white rounded-2xl text-[11px] font-black uppercase tracking-widest">인증 완료</button>
                  {errorMsg && <p className="text-[10px] text-red-500 font-bold uppercase mt-4">{errorMsg}</p>}
                </div>
              )}
           </div>
        </div>
      )}

      {/* 일괄 등록 모달 */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[48px] p-12 shadow-2xl animate-smooth-fade border border-hannam-border flex flex-col h-[70vh]">
              <div className="flex justify-between items-center mb-10 border-b border-hannam-border pb-6">
                 <div>
                    <h2 className="text-xl font-serif font-bold text-hannam-green uppercase">Bulk Client Import</h2>
                    <p className="text-[10px] font-black text-hannam-gold uppercase tracking-widest mt-1">외부 데이터 일괄 연동 시스템</p>
                 </div>
                 <button onClick={() => { setIsBulkModalOpen(false); setBulkData([]); }}><X className="w-7 h-7 text-gray-300" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
                 {bulkData.length === 0 ? (
                    <div className="py-20 border-2 border-dashed border-hannam-border rounded-[32px] flex flex-col items-center justify-center gap-6 bg-hannam-bg/20">
                       <FileDown className="w-12 h-12 text-hannam-border opacity-40" />
                       <div className="text-center">
                          <p className="text-xs font-bold text-hannam-muted leading-relaxed">회원 정보가 담긴 CSV 파일을 선택하세요.</p>
                          <p className="text-[9px] text-hannam-gold font-black uppercase tracking-widest mt-2">(필수 헤더: name, phone, email, deposit, tier)</p>
                       </div>
                       <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                       <button onClick={() => fileInputRef.current?.click()} className="px-10 py-4 bg-black text-white rounded-xl text-[11px] font-black uppercase tracking-widest">파일 선택하기</button>
                    </div>
                 ) : (
                    <div className="space-y-6">
                       <div className="flex justify-between items-center px-4">
                          <h4 className="text-[11px] font-black text-hannam-text uppercase tracking-widest">데이터 미리보기 ({bulkData.length}건)</h4>
                          <button onClick={() => setBulkData([])} className="text-[10px] text-red-400 font-bold underline">초기화</button>
                       </div>
                       <div className="bg-hannam-bg/50 border border-hannam-border rounded-2xl overflow-hidden">
                          <table className="w-full text-[10px] text-left">
                             <thead>
                                <tr className="bg-white border-b border-hannam-border text-hannam-muted font-black uppercase">
                                   <th className="px-4 py-3">Name</th>
                                   <th className="px-4 py-3">Phone</th>
                                   <th className="px-4 py-3">Tier</th>
                                   <th className="px-4 py-3">Deposit</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-hannam-border/30">
                                {bulkData.slice(0, 10).map((row, i) => (
                                   <tr key={i} className="hover:bg-white transition-colors">
                                      <td className="px-4 py-3 font-bold">{row.name}</td>
                                      <td className="px-4 py-3 num-data">{row.phone}</td>
                                      <td className="px-4 py-3 font-black text-hannam-gold">{row.tier || 'SILVER'}</td>
                                      <td className="px-4 py-3 font-bold">₩{Number(row.deposit || 0).toLocaleString()}</td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                       {bulkData.length > 10 && <p className="text-center text-[10px] text-hannam-muted font-bold italic">... 외 {bulkData.length - 10}건의 데이터가 더 있습니다.</p>}
                    </div>
                 )}
              </div>

              <div className="mt-10 pt-8 border-t border-hannam-border">
                 <button 
                   onClick={executeBulkImport}
                   disabled={bulkData.length === 0 || isProcessing}
                   className="w-full py-5 bg-hannam-green text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-xl disabled:opacity-20 hover:bg-black transition-all active:scale-95"
                 >
                    {isProcessing ? '데이터 동기화 중...' : '검증 완료 및 일괄 연동 실행'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
