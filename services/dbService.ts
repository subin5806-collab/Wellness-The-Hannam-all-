
import { Member, CareRecord, Reservation, CareStatus, MemberTier, UserRole, Contract, Inquiry, ContractTemplate, Therapist, InquiryStatus, InquiryPath, InquiryLog } from '../types';
import { geminiService } from './geminiService';

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
  const year = String(d.getFullYear()).slice(-2);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const cleanId = id.replace(/[^0-9]/g, '');
  return `${year}년도 ${month}월 ${day}일 ${name}, ${cleanId}.pdf`;
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
    const newItem: ContractTemplate = { id: `tmpl_${Date.now()}`, title, type: 'MEMBERSHIP', pdfName: file.name, contentBody: 'PDF Template', createdAt: new Date().toISOString() };
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
      memberId: member.id, 
      memberName: member.name, 
      memberEmail: member.email, 
      memberPhone: member.phone, 
      memberJoinedAt: member.joinedAt, 
      type: data.type, 
      typeName: data.typeName, 
      amount: data.amount, 
      status: 'COMPLETED', 
      signature: data.signature, // 서명 데이터 저장
      yearMonth: new Date().toISOString().slice(0, 7), 
      createdAt: new Date().toISOString() 
    };
    
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
      }
    }
  },
  getCareRecordById: async (id: string) => { await delay(); return getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY).find(c => c.id === id); },
  registerMembersBulk: async (list: any[]) => { await delay(800); const members = getCollection<Member>(COLLECTIONS.MEMBERS); let success = 0; for (const data of list) { const id = String(data.phone || '').replace(/[^0-9]/g, ''); if (!id || members.find(m => m.id === id)) continue; members.push({ id, password: String(data.password || '1234'), name: data.name, phone: data.phone, email: data.email, gender: data.gender === '남성' ? '남성' : '여성', role: UserRole.MEMBER, tier: (Number(data.deposit) || 0) >= 10000000 ? MemberTier.ROYAL : (Number(data.deposit) || 0) >= 5000000 ? MemberTier.GOLD : MemberTier.SILVER, deposit: Number(data.deposit) || 0, used: 0, remaining: Number(data.deposit) || 0, coreGoal: data.coreGoal || '데이터 일괄 반입', aiRecommended: '테라피 제안 대기', joinedAt: new Date().toISOString().split('T')[0], expiryDate: data.expiryDate || '', lastModifiedBy: 'Bulk-Import', lastModifiedAt: new Date().toISOString() }); success++; } saveCollection(COLLECTIONS.MEMBERS, members); return { successCount: success, skipCount: list.length - success }; },
  
  resendEmail: async (type: 'care' | 'contract' | 'membership', id: string) => {
    await delay(500);
    console.log(`Resending ${type} email for ID: ${id}`);
    return true;
  },
};
