
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../../services/dbService';
import { Member, CareRecord, CareStatus, Reservation, Contract } from '../../types';
import { 
  ArrowLeft, Mail, Phone, Calendar, User, CreditCard, 
  FileText, CheckCircle2, AlertCircle, History, 
  Download, Clock, ClipboardList, ShieldCheck, 
  Settings, ChevronRight, MessageSquare, ListFilter,
  UserCheck, Zap
} from 'lucide-react';

export const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<CareRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activeTab, setActiveTab] = useState<'financial' | 'contracts' | 'care' | 'notes' | 'logs'>('financial');

  useEffect(() => { loadAllMemberData(); }, [id]);

  const loadAllMemberData = async () => {
    if (!id) return;
    const [m, h, r, c] = await Promise.all([
      dbService.getMemberById(id),
      dbService.getMemberCareHistory(id),
      dbService.getReservations(id),
      dbService.getAllContracts()
    ]);
    if (m) setMember(m);
    setHistory(h);
    setReservations(r);
    setContracts(c.filter(con => con.memberId === id || con.memberPhone === m?.phone));
  };

  if (!member) return <div className="min-h-screen flex items-center justify-center font-serif text-hannam-gold uppercase tracking-widest">데이터 로딩 중...</div>;

  return (
    <div className="min-h-screen bg-[#FBF9F6] font-sans pb-24 animate-smooth-fade">
      
      {/* [1] 상단 영역 – 회원 상태 요약 (고정 바) */}
      <header className="bg-white border-b border-gray-100 px-10 py-5 sticky top-0 z-[100] shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/admin/members')} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-12">
              <div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5">회원 정보</p>
                <h2 className="text-xl font-bold text-gray-900">{member.name} <span className="text-gray-300 ml-1 font-medium text-sm">#{member.id}</span></h2>
              </div>
              <div className="w-[1px] h-10 bg-gray-100" />
              <div className="flex gap-10">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-300" />
                  <span className="text-sm font-bold text-gray-700 num-data">{member.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-300" />
                  <span className="text-sm font-bold text-gray-700">{member.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-hannam-green" />
                  <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black rounded-full uppercase">정상 회원</span>
                </div>
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-[11px] font-bold hover:bg-black transition-all shadow-lg shadow-black/10">
            <Settings className="w-3.5 h-3.5" /> 정보 수정
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-10 py-10">
        
        {/* [2] 핵심 지표 카드 영역 (Dashboard Style) */}
        <div className="grid grid-cols-12 gap-8 mb-10">
          {/* 강조 카드: 현재 잔여 금액 */}
          <div className="col-span-5 bg-hannam-green p-10 rounded-[40px] text-white shadow-hannam-deep relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">현재 잔여 금액 (Remaining Balance)</p>
              <h3 className="text-5xl font-serif font-medium tracking-tight mb-10">
                <span className="text-2xl mr-2 text-hannam-gold">₩</span>
                <span className="num-data">{member.remaining.toLocaleString()}</span>
              </h3>
              <div className="flex gap-8 pt-8 border-t border-white/10">
                <div>
                  <p className="text-[9px] font-black text-white/30 uppercase mb-1">총 예치금</p>
                  <p className="text-sm font-bold num-data">₩ {(member.deposit + member.used).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-white/30 uppercase mb-1">누적 사용액</p>
                  <p className="text-sm font-bold num-data text-hannam-gold">₩ {member.used.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <ShieldCheck className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          </div>

          {/* 서브 정보 영역 */}
          <div className="col-span-7 grid grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-hannam-soft flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">가입 일자</p>
                <h4 className="text-xl font-bold text-gray-900 num-data">{member.joinedAt.split('T')[0]}</h4>
              </div>
              <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase">가입 경로</span>
                <span className="text-xs font-bold text-gray-900">현장 방문 등록</span>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-hannam-soft flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">멤버십 등급</p>
                <h4 className="text-xl font-serif font-bold text-hannam-gold uppercase tracking-widest">{member.tier} Tier</h4>
              </div>
              <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase">만료 예정</span>
                <span className="text-xs font-bold text-red-500 num-data">{member.expiryDate || '2025-12-31'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* [3] 중단 영역 – 최근 차감 및 활동 요약 */}
        <div className="grid grid-cols-12 gap-8 mb-12">
          <div className="col-span-12 bg-white p-10 rounded-[40px] border border-gray-50 shadow-hannam-soft flex items-center justify-between">
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-hannam-bg rounded-2xl flex items-center justify-center text-hannam-gold">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5 tracking-widest">최근 관리 차감일</p>
                  <p className="text-base font-bold text-gray-900 num-data">{history[0]?.date || '이력 없음'}</p>
                </div>
              </div>
              <div className="w-[1px] h-12 bg-gray-50" />
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-widest">최근 차감 항목</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">{history[0]?.content || '최근 차감 내역이 존재하지 않습니다.'}</span>
                  {history[0] && <span className="text-xs font-black text-red-500 num-data">(- ₩{history[0].discountedPrice.toLocaleString()})</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-300 uppercase mb-1 tracking-widest">차감 증빙 상태</p>
                <div className="flex items-center gap-2 justify-end">
                   {history[0]?.status === 'SIGNED' ? (
                     <span className="flex items-center gap-1 text-[10px] font-black text-green-600 uppercase"><CheckCircle2 className="w-3 h-3"/> 서명 완료</span>
                   ) : (
                     <span className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase"><Clock className="w-3 h-3"/> 서명 대기</span>
                   )}
                </div>
              </div>
              <div className="w-[1px] h-10 bg-gray-50 mx-2" />
              <div className="flex items-center">
                <span className="text-[10px] font-black text-hannam-green bg-hannam-bg px-4 py-2 rounded-xl uppercase tracking-widest">관리자 승인 처리됨</span>
              </div>
            </div>
          </div>
        </div>

        {/* [4] 하단 영역 – 상세 이력 (5단계 탭 구조) */}
        <div className="space-y-10">
          <div className="flex gap-12 border-b border-gray-100 sticky top-24 bg-[#FBF9F6] z-50 py-2">
             {[
               { id: 'financial', label: '① 금액 및 차감 내역' },
               { id: 'contracts', label: '② 계약 및 멤버십' },
               { id: 'care', label: '③ 예약 및 관리 이력' },
               { id: 'notes', label: '④ 케어 노트' },
               { id: 'logs', label: '⑤ 시스템 로그' }
             ].map(tab => (
               <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`pb-4 text-[11px] font-black uppercase tracking-[0.15em] relative transition-all ${activeTab === tab.id ? 'text-gray-900' : 'text-gray-300 hover:text-gray-500'}`}
               >
                  {tab.label}
                  {activeTab === tab.id && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-gray-900 animate-in fade-in slide-in-from-left-2" />}
               </button>
             ))}
          </div>

          <div className="min-h-[500px] animate-smooth-fade">
            {/* 탭 1: 금액 및 차감 내역 */}
            {activeTab === 'financial' && (
              <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-hannam-soft">
                <div className="px-10 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Financial Ledger (Credit History)</h4>
                  <button className="flex items-center gap-2 text-[10px] font-black text-hannam-gold uppercase tracking-widest hover:text-hannam-green transition-colors">
                    <Download className="w-3.5 h-3.5" /> CSV 데이터 추출
                  </button>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50 bg-white">
                      <th className="px-10 py-5">차감 일시</th>
                      <th className="px-10 py-5">이용 항목 / 서비스명</th>
                      <th className="px-10 py-5">차감 금액</th>
                      <th className="px-10 py-5 text-right">처리 상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {history.map(record => (
                      <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-10 py-7 text-xs text-gray-500 num-data">{record.date} <span className="text-[10px] opacity-40 ml-2">{record.createdAt.split('T')[1].slice(0, 5)}</span></td>
                        <td className="px-10 py-7 text-sm font-bold text-gray-900">{record.content}</td>
                        <td className="px-10 py-7 text-sm font-black text-red-500 num-data">- ₩{record.discountedPrice.toLocaleString()}</td>
                        <td className="px-10 py-7 text-right">
                          <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[9px] font-black rounded-lg uppercase tracking-widest">Deducted</span>
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && <tr><td colSpan={4} className="py-32 text-center text-gray-300 italic text-sm">기록된 차감 데이터가 없습니다.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {/* 탭 2: 계약 및 멤버십 */}
            {activeTab === 'contracts' && (
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-8 bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-hannam-soft">
                  <div className="px-10 py-6 border-b border-gray-50 bg-gray-50/20 flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Archive: PDF Contracts</h4>
                    <button className="text-[10px] font-black text-hannam-gold uppercase tracking-widest">전체 다운로드</button>
                  </div>
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-gray-50">
                      {contracts.map(con => (
                        <tr key={con.id} className="hover:bg-gray-50/50">
                          <td className="px-10 py-8">
                            <p className="text-sm font-bold text-gray-900">{con.typeName}</p>
                            <p className="text-[9px] text-gray-400 mt-1 num-data">Document ID: {con.id}</p>
                          </td>
                          <td className="px-10 py-8 text-xs text-gray-500 num-data">{con.createdAt.split('T')[0]}</td>
                          <td className="px-10 py-8 text-right">
                            <button className="p-3 bg-hannam-bg text-gray-400 rounded-xl hover:text-black transition-all">
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {contracts.length === 0 && <tr><td className="py-32 text-center text-gray-300 italic text-sm">체결된 전자 계약서가 없습니다.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="col-span-4 space-y-6">
                  <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-hannam-soft">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-6">멤버십 등급 전환 이력</p>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                        <span className="text-xs font-bold text-gray-900">ROYAL (Current)</span>
                        <span className="text-[10px] font-bold text-gray-300 num-data">2024.01.01</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-400">
                        <span className="text-xs font-medium">GOLD (Original)</span>
                        <span className="text-[10px] font-medium num-data">2023.01.01</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 탭 3: 예약 및 관리 이력 */}
            {activeTab === 'care' && (
              <div className="space-y-12">
                <section>
                  <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-6 ml-2">예정된 예약 (Upcoming)</h5>
                  <div className="grid grid-cols-2 gap-6">
                    {reservations.filter(r => r.status === 'booked').map(res => (
                      <div key={res.id} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-hannam-soft flex justify-between items-center">
                        <div className="flex gap-6 items-center">
                          <div className="w-12 h-12 bg-hannam-bg rounded-2xl flex flex-col items-center justify-center">
                            <span className="text-[8px] font-black text-hannam-gold uppercase">{new Date(res.dateTime).toLocaleString('en', {month:'short'})}</span>
                            <span className="text-lg font-black text-hannam-green num-data">{new Date(res.dateTime).getDate()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{res.serviceType}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">
                              {new Date(res.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} • 담당: {res.therapistName}
                            </p>
                          </div>
                        </div>
                        <button className="p-3 bg-gray-50 text-gray-300 rounded-xl hover:text-black transition-all">
                           <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-6 ml-2">진행 완료된 관리 (Archive)</h5>
                  <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-hannam-soft">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50 bg-gray-50/10">
                          <th className="px-10 py-5">관리일</th>
                          <th className="px-10 py-5">담당 전문가</th>
                          <th className="px-10 py-5">프로그램명</th>
                          <th className="px-10 py-5 text-right">고객 서명</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {history.map(record => (
                          <tr key={record.id} className="hover:bg-gray-50/50">
                            <td className="px-10 py-7 text-xs text-gray-500 num-data">{record.date}</td>
                            <td className="px-10 py-7 text-xs font-bold text-gray-700">{record.therapistName}</td>
                            <td className="px-10 py-7 text-sm font-bold text-gray-900">{record.content}</td>
                            <td className="px-10 py-7 text-right">
                               <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${record.status === 'SIGNED' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                 {record.status === 'SIGNED' ? '서명 확인됨' : '서명 미확인'}
                               </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {/* 탭 4: 케어 노트 */}
            {activeTab === 'notes' && (
              <div className="space-y-8">
                {history.map(record => (
                  <div key={record.id} className="bg-white p-12 rounded-[48px] border border-gray-100 shadow-hannam-soft group transition-all hover:border-hannam-gold/20">
                    <div className="flex justify-between items-start mb-10 border-b border-gray-50 pb-8">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-hannam-bg rounded-[20px] flex items-center justify-center text-hannam-gold shadow-inner">
                          <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{record.content}</h4>
                          <p className="text-[10px] font-black text-gray-400 uppercase mt-1.5 tracking-widest">
                            {record.date} • {record.therapistName} 전문가 기록
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Session Reference</p>
                         <span className="text-[10px] font-black text-hannam-gold bg-hannam-bg px-4 py-1.5 rounded-full uppercase">Ref: {record.id.slice(-6)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-16">
                      <div className="space-y-5">
                         <div className="flex items-center gap-2">
                           <Zap className="w-3.5 h-3.5 text-hannam-gold" />
                           <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">관리 피드백 및 개선 사항</p>
                         </div>
                         <p className="text-sm text-gray-700 leading-relaxed font-medium italic">"{record.feedback || '기록된 피드백 내용이 없습니다.'}"</p>
                      </div>
                      <div className="space-y-5">
                         <div className="flex items-center gap-2">
                           <ShieldCheck className="w-3.5 h-3.5 text-hannam-green" />
                           <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">다음 회차 추천 프로그램</p>
                         </div>
                         <p className="text-sm text-hannam-green font-bold leading-relaxed">{record.recommendation || '추천된 관리 계획이 없습니다.'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {history.length === 0 && <div className="py-40 text-center text-gray-300 italic text-sm border-2 border-dashed border-gray-50 rounded-[48px]">기록된 케어 노트가 없습니다.</div>}
              </div>
            )}

            {/* 탭 5: 시스템 로그 */}
            {activeTab === 'logs' && (
              <div className="bg-white p-12 rounded-[48px] border border-gray-100 shadow-hannam-soft">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-gray-900 rounded-[20px] flex items-center justify-center text-white">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Audit Trail & Notification Logs</h4>
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">회원별 시스템 발생 이벤트 기록</p>
                  </div>
                </div>
                <div className="space-y-2">
                   {[
                     { time: '2024-12-14 14:22:10', event: '관리 완료 이메일 발송 성공 (EmailJS API)', status: 'Success' },
                     { time: '2024-12-14 14:21:45', event: '관리자 액션에 의한 크레딧 차감: ₩120,000 (Trigger: Admin)', status: 'Debit' },
                     { time: '2024-12-14 14:20:00', event: '회원 상세 마스터 레지스트리 데이터 조회', status: 'Audit' },
                     { time: '2024-12-10 09:15:33', event: '전자 서명 재요청 알림 발송 (Push Notification)', status: 'Notice' }
                   ].map((log, i) => (
                     <div key={i} className="flex justify-between items-center py-5 border-b border-gray-50 last:border-0 hover:bg-gray-50/30 px-4 rounded-xl transition-colors">
                        <div className="flex items-center gap-10">
                           <span className="text-[10px] font-mono text-gray-300 num-data w-32">{log.time}</span>
                           <span className="text-xs font-bold text-gray-600">{log.event}</span>
                        </div>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${log.status === 'Success' ? 'bg-green-50 text-green-500' : log.status === 'Debit' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>{log.status}</span>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
