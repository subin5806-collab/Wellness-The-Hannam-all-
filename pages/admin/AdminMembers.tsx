
import React, { useEffect, useState, useRef } from 'react';
import { dbService } from '../../services/dbService';
import { authService } from '../../services/authService';
import { Member } from '../../types';
import { 
  Search, ChevronRight, Database, Upload, FileDown, Plus, X, 
  AlertTriangle, Clock, Filter, UserCheck, LayoutGrid
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
    } catch (e: any) {
      setErrorMsg(e.message || 'OTP 요청 실패');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!activeAction || !otpCode || !currentUser) return;
    setIsProcessing(true);
    try {
      // 우회 코드 제거됨 (dbService 내부에서 검증)
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
        setErrorMsg('인증 코드가 일치하지 않거나 만료되었습니다.');
      }
    } catch (e: any) {
      setErrorMsg('인증 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
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
    const matchesSearch = m.name.toLowerCase().includes(query) || m.phone.includes(query) || m.id.includes(query);
    const matchesTier = tierFilter === 'ALL' || m.tier === tierFilter;
    const mStatus = getExpiryStatus(m.expiryDate);
    const matchesExpiry = expiryFilter === 'ALL' || mStatus === expiryFilter;
    return matchesSearch && matchesTier && matchesExpiry;
  });

  return (
    <div className="p-10 bg-hannam-bg min-h-screen animate-smooth-fade font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        <header className="flex justify-between items-end border-b border-hannam-border pb-10">
          <div>
            <h1 className="text-3xl font-serif font-bold text-hannam-green tracking-tight uppercase">회원관리</h1>
            <p className="text-[10px] font-black text-hannam-gold uppercase tracking-[0.3em] mt-2">Executive Member Directory</p>
          </div>
          
          <div className="flex gap-3">
             <button onClick={() => triggerSensitiveAction('EXPORT_CSV')} className="flex items-center gap-2 px-6 py-3.5 bg-white border border-hannam-border rounded-xl text-[11px] font-black text-hannam-muted hover:text-hannam-green hover:border-hannam-green transition-all shadow-hannam-soft">
                <FileDown className="w-4.5 h-4.5" /> CSV 추출
             </button>
             <button onClick={() => triggerSensitiveAction('BULK_IMPORT')} className="flex items-center gap-2 px-6 py-3.5 bg-white border border-hannam-border rounded-xl text-[11px] font-black text-hannam-muted hover:text-hannam-green hover:border-hannam-green transition-all shadow-hannam-soft">
                <Upload className="w-4.5 h-4.5" /> 일괄 등록
             </button>
             <button onClick={() => navigate('/admin/register')} className="bg-hannam-green text-white px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black shadow-hannam-deep active:scale-95 transition-all">
                <Plus className="w-4.5 h-4.5 mr-2 inline" /> 신규 회원 등록
             </button>
          </div>
        </header>

        <div className="flex flex-col gap-4">
           <div className="flex gap-4">
              <div className="flex-1 relative">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-hannam-border" />
                 <input 
                   type="text" 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   placeholder="회원 이름 또는 연락처 통합 검색..." 
                   className="w-full pl-14 pr-8 py-5 bg-white rounded-[24px] text-[13px] font-bold outline-none border border-hannam-border focus:border-hannam-gold shadow-hannam-soft transition-all" 
                 />
              </div>
              <div className="flex bg-white p-1.5 rounded-[24px] border border-hannam-border shadow-hannam-soft">
                 {[
                   { id: 'ALL', label: '전체' },
                   { id: 'ACTIVE', label: '정상' },
                   { id: 'EXPIRED', label: '만료' }
                 ].map(st => (
                   <button 
                     key={st.id}
                     onClick={() => setExpiryFilter(st.id as any)}
                     className={`px-8 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${expiryFilter === st.id ? 'bg-hannam-bg text-hannam-green shadow-inner' : 'text-hannam-muted hover:text-hannam-text'}`}
                   >
                     {st.label}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="bg-white border border-hannam-border rounded-[48px] overflow-hidden shadow-hannam-soft">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-hannam-bg/20 text-[10px] font-black text-hannam-muted uppercase tracking-[0.2em] border-b border-hannam-border">
                    <th className="px-12 py-6">Member Identity</th>
                    <th className="px-12 py-6">Status Info</th>
                    <th className="px-12 py-6 text-center">Tier</th>
                    <th className="px-12 py-6 text-right">Balance</th>
                    <th className="px-12 py-6 text-right">Access</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-hannam-border">
                 {filteredMembers.map(member => {
                    const expiryStatus = getExpiryStatus(member.expiryDate);
                    return (
                    <tr key={member.id} className="hover:bg-hannam-bg/20 transition-all group cursor-pointer" onClick={() => navigate(`/admin/member/${member.id}`)}>
                       <td className="px-12 py-7">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-hannam-bg border border-hannam-border rounded-full flex items-center justify-center text-hannam-green text-[14px] font-serif font-black">{member.name[0]}</div>
                            <div>
                               <p className="text-[15px] font-black text-hannam-text group-hover:text-hannam-green transition-colors">{member.name} 님</p>
                               <p className="text-[10px] text-hannam-muted font-bold num-data">{member.phone}</p>
                            </div>
                          </div>
                       </td>
                       <td className="px-12 py-7">
                          <div className="flex items-center gap-3">
                             <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border ${expiryStatus === 'EXPIRED' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                {expiryStatus === 'EXPIRED' ? '만료됨' : '정상회원'}
                             </span>
                             <span className="text-[10px] font-bold text-gray-300 num-data">Exp: {member.expiryDate || 'Unlimited'}</span>
                          </div>
                       </td>
                       <td className="px-12 py-7 text-center">
                          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-widest border ${member.tier === 'ROYAL' ? 'bg-hannam-green text-white border-transparent' : 'bg-white text-hannam-muted border-hannam-border'}`}>{member.tier}</span>
                       </td>
                       <td className="px-12 py-7 text-right">
                          <p className={`text-[17px] num-data font-black ${member.remaining <= 500000 ? 'text-red-500' : 'text-hannam-text'}`}><span className="text-[11px] mr-1 opacity-20">₩</span>{member.remaining.toLocaleString()}</p>
                       </td>
                       <td className="px-12 py-7 text-right">
                          <ChevronRight className="w-5 h-5 text-hannam-border ml-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                       </td>
                    </tr>
                 )})}
              </tbody>
           </table>
           {filteredMembers.length === 0 && (
              <div className="py-40 text-center space-y-4">
                 <LayoutGrid className="w-12 h-12 text-hannam-border mx-auto opacity-30" />
                 <p className="text-[11px] font-black text-hannam-muted uppercase tracking-[0.3em]">검색 결과가 없습니다.</p>
              </div>
           )}
        </div>
      </div>

      {/* 보안 인증 모달 */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-10 shadow-2xl animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-serif font-bold text-hannam-green uppercase tracking-wider">보안 인증</h3>
                <button onClick={() => setIsSecurityModalOpen(false)}><X className="w-6 h-6 text-gray-300" /></button>
             </div>
             <div className="space-y-6">
                {!isOtpSent ? (
                  <div className="text-center py-4 space-y-6">
                     <AlertTriangle className="w-12 h-12 text-hannam-gold mx-auto opacity-50" />
                     <p className="text-xs font-medium text-gray-500 leading-relaxed">
                        민감한 데이터에 접근하기 위해<br/>관리자 이메일({currentUser?.email})로 인증 코드를 전송합니다.
                     </p>
                     <button 
                       onClick={handleRequestOTP} 
                       disabled={isProcessing}
                       className="w-full py-4 bg-hannam-green text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg"
                     >
                        인증 코드 요청
                     </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                     <input 
                       type="text" 
                       maxLength={6} 
                       value={otpCode} 
                       onChange={e => setOtpCode(e.target.value)}
                       className="w-full p-5 bg-hannam-bg border border-hannam-border rounded-xl font-black text-center text-3xl tracking-[0.4em] outline-none" 
                       placeholder="000000" 
                     />
                     {errorMsg && <p className="text-center text-[10px] font-bold text-red-500">{errorMsg}</p>}
                     <button 
                       onClick={handleVerifyOTP} 
                       disabled={isProcessing || otpCode.length < 6}
                       className="w-full py-4 bg-hannam-green text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg"
                     >
                        코드 확인
                     </button>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
