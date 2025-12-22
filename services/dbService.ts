
import { Member, CareRecord, Reservation, CareStatus, MemberTier, UserRole, Contract, Inquiry, ContractTemplate, Therapist, InquiryStatus, InquiryPath, InquiryLog } from '../types';
import { geminiService } from './geminiService';
import emailjs from '@emailjs/browser';

/**
 * EMAILJS 설정 정보
 * 아래 정보는 EmailJS 대시보드(https://dashboard.emailjs.com/)에서 확인 가능합니다.
 */
const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'YOUR_PUBLIC_KEY', // EmailJS Public Key를 입력하세요
  SERVICE_ID: 'YOUR_SERVICE_ID', // EmailJS Service ID를 입력하세요
  TEMPLATE_ID: 'YOUR_TEMPLATE_ID', // EmailJS Template ID를 입력하세요
};

const COLLECTIONS = {
  MEMBERS: 'firestore_members',
  CARE_HISTORY: 'firestore_careHistory',
  RESERVATIONS: 'firestore_reservations',
  CONTRACTS: 'firestore_contracts',
  TEMPLATES: 'firestore_templates',
  INQUIRIES: 'firestore_inquiries',
  THERAPISTS: 'firestore_therapists',
};

const delay = (ms = 300) => new Promise(res => setTimeout(res, ms));

const getCollection = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`Failed to parse collection ${key}`, e);
    return [];
  }
};

const saveCollection = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const seedInitialData = () => {
  const members = getCollection<Member>(COLLECTIONS.MEMBERS);
  const hongId = '01012345678';
  if (!members.find(m => m.id === hongId)) {
    const hong: Member = {
      id: hongId,
      password: '1111',
      name: '홍길동',
      phone: '010-1234-5678',
      email: 'hong@thehannam.com',
      gender: '남성',
      role: UserRole.MEMBER,
      tier: MemberTier.SILVER,
      deposit: 0,
      used: 0,
      remaining: 0,
      coreGoal: '기본 건강 관리',
      aiRecommended: '신규 회원 상담',
      joinedAt: new Date().toISOString().split('T')[0],
      lastModifiedBy: 'System',
      lastModifiedAt: new Date().toISOString(),
    };
    members.push(hong);
    saveCollection(COLLECTIONS.MEMBERS, members);
  }
};

seedInitialData();

export const generateHannamFilename = (name: string, id: string, dateStr: string): string => {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const cleanId = id.replace(/[^0-9]/g, '');
  return `${year}-${month}-${day} ${name}, ${cleanId}.pdf`;
};

/**
 * [REAL] EmailJS를 통한 이메일 발송 함수
 * 발신자: help@thehannam.com 고정
 */
const sendHannamEmail = async (to: string, subject: string, body: string) => {
  // Public Key가 설정되지 않은 경우 콘솔로만 출력 (초기 설정 유도)
  if (EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
    console.warn('[EMAILJS NOT CONFIGURED] 실제 발송을 위해 dbService.ts에서 PUBLIC_KEY를 설정하세요.');
    console.info(`[SIMULATED EMAIL] FROM: help@thehannam.com TO: ${to} SUBJECT: ${subject}`);
    return;
  }

  try {
    const templateParams = {
      to_email: to,
      from_name: '더 한남 (The Hannam)',
      reply_to: 'help@thehannam.com',
      subject: subject,
      message: body,
    };

    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );
    console.info(`[EMAIL SUCCESS] ${to}님께 이메일 발송 완료`);
  } catch (error) {
    console.error('[EMAIL ERROR] 이메일 발송 실패:', error);
  }
};

export const simulatePDFGeneration = (contract: any): string => {
  const content = `
[THE HANNAM OFFICIAL DIGITAL CONTRACT]
--------------------------------------------------
DOCUMENT ID: ${contract.id.toUpperCase()}
DATE OF ISSUE: ${new Date(contract.createdAt).toLocaleString()}
--------------------------------------------------

1. CLIENT INFORMATION
- Name: ${contract.memberName}
- Contact: ${contract.memberPhone}
- Email: ${contract.memberEmail}
- ID Ref: ${contract.memberId}

2. AGREEMENT DETAILS
- Contract Type: ${contract.typeName}
- Total Amount: KRW ${contract.amount.toLocaleString()}
- Status: COMPLETED & LEGALLY BINDING

3. TERMS & CONDITIONS (SUMMARY)
- This contract grants access to exclusive services at Wellness The Hannam.
- All credits are non-transferable and valid for the specified period.
- Digital signature below confirms agreement to all internal policies.

4. DIGITAL AUTHORIZATION
- Signed at: ${new Date(contract.createdAt).toISOString()}
- Authorization Hash: HANNAM-AUTH-${contract.id.slice(-6)}

--------------------------------------------------
THE HANNAM WELLNESS REGISTRY CENTER
  `;
  return `data:text/plain;base64,${btoa(unescape(encodeURIComponent(content)))}`;
};

export const validateEmail = (email: string) => {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return re.test(String(email).toLowerCase());
};

export const dbService = {
  backupAllData: () => {
    const backup: Record<string, any> = {};
    Object.values(COLLECTIONS).forEach(key => {
      backup[key] = getCollection(key);
    });
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date();
    a.href = url;
    a.download = `WELLNESS_HANNAM_BACKUP_${d.getFullYear()}${d.getMonth()+1}${d.getDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  exportMembersToCSV: () => {
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const headers = ['회원번호(ID)', '성함', '연락처', '이메일', '티어', '총입금액', '잔액', '가입일', '만료일', '메모'];
    const rows = members.map(m => [
      m.id, m.name, m.phone, m.email, m.tier, m.deposit, m.remaining, m.joinedAt, m.expiryDate || '', m.adminNote || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date();
    a.href = url;
    a.download = `THE_HANNAM_MEMBERS_${d.getFullYear()}${d.getMonth()+1}${d.getDate()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  getTherapists: async () => { await delay(); return getCollection<Therapist>(COLLECTIONS.THERAPISTS); },
  addTherapist: async (data: Omit<Therapist, 'id' | 'createdAt'>) => {
    await delay();
    const list = getCollection<Therapist>(COLLECTIONS.THERAPISTS);
    const newItem: Therapist = { ...data, id: `th_${Date.now()}`, createdAt: new Date().toISOString() };
    list.push(newItem);
    saveCollection(COLLECTIONS.THERAPISTS, list);
    return newItem;
  },
  deleteTherapist: async (id: string) => {
    await delay();
    const list = getCollection<Therapist>(COLLECTIONS.THERAPISTS);
    const filtered = list.filter(t => t.id !== id);
    saveCollection(COLLECTIONS.THERAPISTS, filtered);
  },

  getDashboardStats: async () => {
    await delay();
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const reservations = getCollection<Reservation>(COLLECTIONS.RESERVATIONS);
    const history = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY);
    const inquiries = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    return {
      todayReservations: reservations.length || 0,
      pendingSignatures: history.filter(h => h.status === CareStatus.WAITING_SIGNATURE).length || 0,
      unprocessedInquiries: inquiries.filter(i => i.status === 'UNREGISTERED' || i.status === 'IN_PROGRESS').length || 0,
      lowBalanceCount: members.filter(m => m.remaining <= 500000).length || 0,
      lowBalanceMembers: members.filter(m => m.remaining <= 500000) || [],
      recentInquiries: inquiries.filter(i => i.status !== 'COMPLETED').slice(0, 5) || []
    };
  },

  getAllMembers: async () => { await delay(); return getCollection<Member>(COLLECTIONS.MEMBERS); },
  getMemberById: async (id: string) => { await delay(); return getCollection<Member>(COLLECTIONS.MEMBERS).find(m => m.id === id); },
  
  registerMember: async (data: any) => {
    if (!validateEmail(data.email)) throw new Error('유효하지 않은 이메일 형식입니다.');
    await delay(500);
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const memberId = data.phone.replace(/[^0-9]/g, '');
    const existing = members.find(m => m.id === memberId);
    if (existing) throw new Error('이미 등록된 핸드폰 번호입니다.');
    
    const depositAmount = Number(data.deposit) || 0;
    const tier = depositAmount >= 10000000 ? MemberTier.ROYAL : depositAmount >= 5000000 ? MemberTier.GOLD : MemberTier.SILVER;
    const aiRecommended = await geminiService.getRecommendation(data.coreGoal || '웰니스 라이프', []);

    const newMember: Member = {
      id: memberId, 
      password: data.password || '1234', 
      name: data.name, 
      phone: data.phone, 
      email: data.email, 
      gender: data.gender, 
      role: UserRole.MEMBER,
      tier,
      deposit: depositAmount, 
      used: 0, 
      remaining: depositAmount, 
      coreGoal: data.coreGoal || '웰니스 라이프', 
      aiRecommended,
      joinedAt: new Date().toISOString().split('T')[0], 
      expiryDate: data.expiryDate || '', 
      adminNote: data.adminNote || '', 
      address: data.address || '',
      lastModifiedBy: data.adminName || 'System',
      lastModifiedAt: new Date().toISOString(),
    };
    members.push(newMember);
    saveCollection(COLLECTIONS.MEMBERS, members);

    // [NOTIFICATION] 회원가입 환영 이메일
    sendHannamEmail(
      newMember.email,
      `[더 한남] ${newMember.name}님, 멤버십 가입을 환영합니다.`,
      `안녕하세요 ${newMember.name}님, 더 한남 웰니스 센터의 회원이 되신 것을 축하드립니다.\n로그인 아이디: ${newMember.id}\n초기 충전 금액: ₩${newMember.deposit.toLocaleString()}`
    );

    return newMember;
  },

  updateMember: async (id: string, updates: Partial<Member>, adminName: string) => {
    await delay();
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const idx = members.findIndex(m => m.id === id);
    if (idx !== -1) {
      members[idx] = { ...members[idx], ...updates, lastModifiedBy: adminName, lastModifiedAt: new Date().toISOString() };
      saveCollection(COLLECTIONS.MEMBERS, members);
      return members[idx];
    }
    throw new Error('회원을 찾을 수 없습니다.');
  },

  getInquiries: async () => { await delay(); return getCollection<Inquiry>(COLLECTIONS.INQUIRIES); },
  
  createInquiry: async (data: any) => {
    await delay();
    const list = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const newInq: Inquiry = {
      id: `inq_${Date.now()}`,
      memberName: data.memberName,
      phone: data.phone,
      path: data.path,
      content: data.content,
      logs: [],
      status: 'UNREGISTERED',
      needsFollowUp: false,
      receivedBy: data.adminName,
      assignedStaff: data.adminName,
      createdAt: now.toLocaleString(),
      yearMonth: yearMonth,
      updatedAt: now.toLocaleString(),
    };
    list.push(newInq);
    saveCollection(COLLECTIONS.INQUIRIES, list);
    return newInq;
  },

  updateInquiry: async (id: string, updates: Partial<Inquiry>) => {
    await delay();
    const list = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    const idx = list.findIndex(i => i.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toLocaleString() };
      saveCollection(COLLECTIONS.INQUIRIES, list);
      return list[idx];
    }
    throw new Error('Inquiry not found');
  },

  addInquiryLog: async (id: string, staffName: string, content: string) => {
    await delay();
    const list = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    const idx = list.findIndex(i => i.id === id);
    if (idx !== -1) {
      const newLog: InquiryLog = {
        id: `log_${Date.now()}`,
        staffName,
        content,
        createdAt: new Date().toLocaleString()
      };
      list[idx].logs.push(newLog);
      list[idx].updatedAt = new Date().toLocaleString();
      saveCollection(COLLECTIONS.INQUIRIES, list);
      return list[idx];
    }
    throw new Error('Inquiry not found');
  },

  exportInquiriesByMonth: (yearMonth: string) => {
    const list = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    const filtered = list.filter(i => i.yearMonth === yearMonth);
    if (filtered.length === 0) {
      alert('해당 월의 데이터가 없습니다.');
      return;
    }
    const headers = ['ID', '고객명', '연락처', '문의경로', '상태', '최초내용', '상담로그수', '접수자', '생성일'];
    const rows = filtered.map(i => [
      i.id, i.memberName, i.phone, i.path, i.status, i.content.replace(/,/g, ' '), i.logs.length, i.receivedBy, i.createdAt
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date();
    a.href = url;
    a.download = `THE_HANNAM_INQUIRY_${yearMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  getAllContracts: async () => { await delay(); return getCollection<Contract>(COLLECTIONS.CONTRACTS); },
  getMemberContracts: async (memberId: string) => {
    await delay();
    return getCollection<Contract>(COLLECTIONS.CONTRACTS).filter(c => c.memberId === memberId);
  },
  getTemplates: async () => { await delay(); return getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES); },
  
  uploadTemplate: async (title: string, file: File) => {
    await delay();
    const list = getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES);
    
    // 파일을 Data URL로 변환하여 저장
    const fileData = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    const newItem: ContractTemplate = { 
      id: `tmpl_${Date.now()}`, 
      title, 
      type: 'MEMBERSHIP', 
      pdfName: file.name, 
      fileData, 
      contentBody: 'Digital Form', 
      createdAt: new Date().toISOString() 
    };
    list.push(newItem);
    saveCollection(COLLECTIONS.TEMPLATES, list);
    return newItem;
  },
  
  saveTemplate: async (data: Omit<ContractTemplate, 'id' | 'createdAt'>) => {
    await delay();
    const list = getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES);
    const newItem: ContractTemplate = { 
      ...data, 
      id: `tmpl_${Date.now()}`, 
      createdAt: new Date().toISOString() 
    };
    list.push(newItem);
    saveCollection(COLLECTIONS.TEMPLATES, list);
    return newItem;
  },
  updateTemplate: async (id: string, updates: Partial<ContractTemplate>) => {
    await delay();
    const list = getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES);
    const idx = list.findIndex(t => t.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      saveCollection(COLLECTIONS.TEMPLATES, list);
      return list[idx];
    }
    throw new Error('Template not found');
  },
  deleteTemplate: async (id: string) => {
    await delay();
    const list = getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES);
    const filtered = list.filter(t => t.id !== id);
    saveCollection(COLLECTIONS.TEMPLATES, filtered);
  },
  createContract: async (data: any) => {
    await delay(500);
    const contracts = getCollection<Contract>(COLLECTIONS.CONTRACTS);
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const memberId = data.memberPhone.replace(/[^0-9]/g, '');
    let member = members.find(m => m.id === memberId);
    
    if (!member) {
      member = await dbService.registerMember({ ...data, phone: data.memberPhone, name: data.memberName, email: data.memberEmail, deposit: data.amount });
    } else {
      member.deposit += data.amount;
      member.remaining += data.amount;
      member.lastModifiedBy = data.adminName || 'Admin';
      member.lastModifiedAt = new Date().toISOString();
      saveCollection(COLLECTIONS.MEMBERS, members);
    }

    const newContract: Contract = { 
      id: `cont_${Date.now()}`, 
      templateId: data.templateId,
      memberId: member.id, 
      memberName: member.name, 
      memberEmail: member.email, 
      memberPhone: member.phone, 
      memberJoinedAt: member.joinedAt, 
      type: data.type, 
      typeName: data.typeName, 
      amount: data.amount, 
      status: 'COMPLETED', 
      signature: data.signature,
      yearMonth: new Date().toISOString().slice(0, 7), 
      createdAt: new Date().toISOString() 
    };
    
    newContract.pdfUrl = simulatePDFGeneration(newContract);
    newContract.pdfName = generateHannamFilename(member.name, member.id, newContract.createdAt);

    // [NOTIFICATION] 계약 완료 이메일 발송
    sendHannamEmail(
      newContract.memberEmail, 
      `[더 한남] ${newContract.typeName} 계약 체결 안내`, 
      `안녕하세요 ${newContract.memberName}님, 요청하신 계약이 성공적으로 체결되었습니다.\n결제 금액: ₩${newContract.amount.toLocaleString()}\n체결 일시: ${new Date(newContract.createdAt).toLocaleString()}\n\n디지털 보관함에서 상세 내용을 확인하실 수 있습니다.`
    );

    contracts.push(newContract);
    saveCollection(COLLECTIONS.CONTRACTS, contracts);
    return { contract: newContract, member };
  },
  getReservations: async (memberId?: string) => { await delay(); const res = getCollection<Reservation>(COLLECTIONS.RESERVATIONS); return memberId ? res.filter(r => r.memberId === memberId) : res; },
  createReservation: async (data: any) => {
    await delay();
    const list = getCollection<Reservation>(COLLECTIONS.RESERVATIONS);
    const newRes: Reservation = { id: `res_${Date.now()}`, memberId: data.memberId, memberName: data.memberName, therapistId: data.therapistId, therapistName: data.therapistName, dateTime: data.dateTime, serviceType: data.serviceType, status: 'booked' };
    list.push(newRes);
    saveCollection(COLLECTIONS.RESERVATIONS, list);
    return newRes;
  },
  getMemberCareHistory: async (memberId: string) => { await delay(); return getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY).filter(c => c.memberId === memberId); },
  processCareSession: async (data: any) => {
    await delay();
    const history = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY);
    const newRecord: CareRecord = { id: `care_${Date.now()}`, memberId: data.memberId, therapistId: data.therapistId || 'staff_1', therapistName: data.therapist, date: new Date().toISOString().split('T')[0], yearMonth: new Date().toISOString().slice(0, 7), content: data.content, originalPrice: data.originalPrice, discountedPrice: data.discountedPrice, discountRate: data.originalPrice > 0 ? (data.originalPrice - data.discountedPrice) / data.originalPrice : 0, feedback: data.comment, recommendation: data.recommendation, status: CareStatus.WAITING_SIGNATURE, createdAt: new Date().toISOString() };
    history.unshift(newRecord);
    saveCollection(COLLECTIONS.CARE_HISTORY, history);
    return newRecord;
  },
  signCareRecord: async (id: string, signature: string) => {
    await delay();
    const history = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY);
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const idx = history.findIndex(h => h.id === id);
    if (idx !== -1 && history[idx].status !== CareStatus.COMPLETED) {
      const record = history[idx];
      const member = members.find(m => m.id === record.memberId);
      if (member) {
        member.remaining -= record.discountedPrice;
        member.used += record.discountedPrice;
        member.lastModifiedBy = 'Auto-Billing';
        member.lastModifiedAt = new Date().toISOString();
        const memberHistory = history.filter(h => h.memberId === member.id && h.status === CareStatus.COMPLETED).map(h => h.content);
        member.aiRecommended = await geminiService.getRecommendation(member.coreGoal, memberHistory);
        saveCollection(COLLECTIONS.MEMBERS, members);
        history[idx].status = CareStatus.COMPLETED;
        history[idx].signature = signature;
        history[idx].signedAt = new Date().toISOString();
        saveCollection(COLLECTIONS.CARE_HISTORY, history);

        // [NOTIFICATION] 차감 완료 이메일 발송
        sendHannamEmail(
          member.email,
          `[더 한남] 서비스 이용 및 영수증 안내`,
          `안녕하세요 ${member.name}님, 더 한남 웰니스 이용 내역입니다.\n프로그램: ${record.content}\n차감 금액: ₩${record.discountedPrice.toLocaleString()}\n최종 잔액: ₩${member.remaining.toLocaleString()}\n이용 일시: ${new Date(record.signedAt || '').toLocaleString()}`
        );
      }
    }
  },
  getCareRecordById: async (id: string) => { await delay(); return getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY).find(c => c.id === id); },
  registerMembersBulk: async (list: any[]) => { await delay(800); const members = getCollection<Member>(COLLECTIONS.MEMBERS); let success = 0; for (const data of list) { const id = String(data.phone || '').replace(/[^0-9]/g, ''); if (!id || members.find(m => m.id === id)) continue; members.push({ id, password: String(data.password || '1234'), name: data.name, phone: data.phone, email: data.email, gender: data.gender === '남성' ? '남성' : '여성', role: UserRole.MEMBER, tier: (Number(data.deposit) || 0) >= 10000000 ? MemberTier.ROYAL : (Number(data.deposit) || 0) >= 5000000 ? MemberTier.GOLD : MemberTier.SILVER, deposit: Number(data.deposit) || 0, used: 0, remaining: Number(data.deposit) || 0, coreGoal: data.coreGoal || '데이터 일괄 반입', aiRecommended: '테라피 제안 대기', joinedAt: new Date().toISOString().split('T')[0], expiryDate: data.expiryDate || '', lastModifiedBy: 'Bulk-Import', lastModifiedAt: new Date().toISOString() }); success++; } saveCollection(COLLECTIONS.MEMBERS, members); return { successCount: success, skipCount: list.length - success }; },
  
  resendEmail: async (type: 'care' | 'contract' | 'membership', id: string) => {
    await delay(500);
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    if (type === 'care') {
      const records = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY);
      const rec = records.find(r => r.id === id);
      const m = members.find(mem => mem.id === rec?.memberId);
      if (m && rec) {
        sendHannamEmail(m.email, `[재발송] ${rec.content} 영수증`, `${m.name}님, 요청하신 이용 내역을 재발송 드립니다.`);
      }
    } else if (type === 'contract') {
      const contracts = getCollection<Contract>(COLLECTIONS.CONTRACTS);
      const c = contracts.find(con => con.id === id);
      if (c) {
        sendHannamEmail(c.memberEmail, `[재발송] ${c.typeName} 계약서`, `${c.memberName}님, 요청하신 계약서 사본을 재발송 드립니다.`);
      }
    }
    return true;
  },
};
