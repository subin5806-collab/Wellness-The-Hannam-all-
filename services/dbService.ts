
import { Member, CareRecord, CareStatus, Reservation, UserRole, MemberTier, Contract, ContractTemplate, Therapist, Product, Inquiry, InquiryStatus, InquiryLog } from '../types';
import emailjs from '@emailjs/browser';

const EMAILJS_CONFIG = {
  PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY', 
  SERVICE_ID: process.env.EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID', 
  TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID', 
};

const COLLECTIONS = {
  MEMBERS: 'firestore_members',
  CARE_HISTORY: 'firestore_careHistory',
  RESERVATIONS: 'firestore_reservations',
  SYSTEM_LOGS: 'firestore_system_logs',
  THERAPISTS: 'firestore_therapists',
  PRODUCTS: 'firestore_products',
  CONTRACTS: 'firestore_contracts',
  TEMPLATES: 'firestore_templates',
  INQUIRIES: 'firestore_inquiries',
};

const getCollection = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveCollection = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const logSystemEvent = (type: 'ERROR' | 'INFO', message: string, data?: any) => {
  const logs = getCollection<any>(COLLECTIONS.SYSTEM_LOGS);
  logs.unshift({ id: Date.now(), type, message, data, createdAt: new Date().toISOString() });
  saveCollection(COLLECTIONS.SYSTEM_LOGS, logs.slice(0, 100));
};

const sendHannamEmail = async (to: string, subject: string, body: string) => {
  if (!to || EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
    console.info('[SIMULATED EMAIL]', { to, subject, body });
    return;
  }
  try {
    await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID, { to_email: to, subject, message: body }, EMAILJS_CONFIG.PUBLIC_KEY);
  } catch (e) {
    logSystemEvent('ERROR', `Email failed to ${to}`, e);
  }
};

export const generateHannamFilename = (name: string, id: string, date: string) => {
  const cleanDate = date.split('T')[0].replace(/-/g, '');
  return `HANNAM_${cleanDate}_${name}_${id.slice(-4)}.pdf`;
};

export const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const dbService = {
  getMemberByNo: async (memberNo: string) => {
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const found = members.find(m => m.id === memberNo.replace(/[^0-9]/g, ''));
    if (!found) throw new Error('회원번호를 확인해주세요.');
    return found;
  },

  createContract: async (data: any) => {
    const cs = getCollection<Contract>(COLLECTIONS.CONTRACTS);
    
    // [PO 개선] 수기 입력 시 휴대폰 번호를 정규화하여 ID 매칭 포인트로 활용
    // 추후 회원이 동일 번호로 가입할 때 이 계약 내역이 자동으로 매칭됩니다.
    const normalizedPhone = data.memberPhone.replace(/[^0-9]/g, '');
    
    const newC: Contract = {
      id: `con_${Date.now()}`,
      memberId: data.memberId || normalizedPhone, // 휴대폰 번호를 ID 매핑 키로 활용
      memberName: data.memberName,
      memberEmail: data.memberEmail,
      memberPhone: data.memberPhone,
      memberJoinedAt: data.memberJoinedAt || '미등록(수기입력)',
      type: data.type || 'MEMBERSHIP',
      typeName: data.typeName,
      amount: data.amount,
      status: 'COMPLETED',
      signature: data.signature,
      yearMonth: new Date().toISOString().slice(0, 7),
      createdAt: new Date().toISOString(),
    };
    
    cs.unshift(newC);
    saveCollection(COLLECTIONS.CONTRACTS, cs);

    await sendHannamEmail(
      newC.memberEmail,
      `[더 한남] 디지털 계약 체결 안내`,
      `${newC.memberName}님, 요청하신 '${newC.typeName}' 계약이 완료되었습니다. 자세한 내용은 앱에서 확인하실 수 있습니다.`
    );
    
    return { contract: newC };
  },

  processCareSession: async (data: any) => {
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const history = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY);
    const memberIdx = members.findIndex(m => m.id === data.memberId);
    
    if (memberIdx === -1) throw new Error('회원을 찾을 수 없습니다.');
    const member = members[memberIdx];
    
    if (member.remaining < data.discountedPrice) throw new Error('회원의 잔여 크레딧이 부족합니다.');
    member.remaining -= data.discountedPrice;
    member.used += data.discountedPrice;
    
    const newRecord: CareRecord = {
      id: `care_${Date.now()}`,
      memberId: data.memberId,
      therapistId: data.therapistId,
      therapistName: data.therapistName,
      date: new Date().toISOString().split('T')[0],
      yearMonth: new Date().toISOString().slice(0, 7),
      content: data.content,
      originalPrice: data.originalPrice,
      discountRate: data.discountRate,
      discountedPrice: data.discountedPrice,
      feedback: data.feedback,
      recommendation: data.recommendation,
      status: CareStatus.REQUESTED,
      resendCount: 0,
      requestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    
    history.unshift(newRecord);
    saveCollection(COLLECTIONS.MEMBERS, members);
    saveCollection(COLLECTIONS.CARE_HISTORY, history);
    
    await sendHannamEmail(member.email, `[더 한남] 이용 금액 차감 안내`, `${member.name}님, 금일 이용하신 서비스에 대해 ₩${data.discountedPrice.toLocaleString()}이 차감되었습니다. 서명을 부탁드립니다.`);
    return newRecord;
  },

  signCareRecord: async (id: string, signature: string) => {
    const history = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY);
    const idx = history.findIndex(h => h.id === id);
    if (idx !== -1 && history[idx].status === CareStatus.REQUESTED) {
      history[idx].status = CareStatus.SIGNED;
      history[idx].signature = signature;
      history[idx].signedAt = new Date().toISOString();
      saveCollection(COLLECTIONS.CARE_HISTORY, history);
      return true;
    }
    return false;
  },

  resendSignatureRequest: async (id: string) => {
    const history = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY);
    const idx = history.findIndex(h => h.id === id);
    if (idx === -1) throw new Error('기록을 찾을 수 없습니다.');
    history[idx].resendCount += 1;
    history[idx].requestedAt = new Date().toISOString();
    saveCollection(COLLECTIONS.CARE_HISTORY, history);
    return true;
  },

  getMemberCareHistory: async (memberId: string) => getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY).filter(c => c.memberId === memberId),
  getMemberById: async (id: string) => getCollection<Member>(COLLECTIONS.MEMBERS).find(m => m.id === id),
  getCareRecordById: async (id: string) => getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY).find(c => c.id === id),
  getReservations: async (memberId?: string) => {
    const res = getCollection<Reservation>(COLLECTIONS.RESERVATIONS);
    return memberId ? res.filter(r => r.memberId === memberId) : res;
  },
  getTherapists: async () => getCollection<Therapist>(COLLECTIONS.THERAPISTS),
  getProducts: async () => getCollection<Product>(COLLECTIONS.PRODUCTS),
  getTemplates: async () => getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES),
  getAllContracts: async () => getCollection<Contract>(COLLECTIONS.CONTRACTS),
  getAllMembers: async () => getCollection<Member>(COLLECTIONS.MEMBERS),
  registerMember: async (data: any) => {
    const ms = getCollection<Member>(COLLECTIONS.MEMBERS);
    const id = data.phone.replace(/[^0-9]/g, '');
    const newM: Member = {
      id, ...data, role: UserRole.MEMBER, tier: data.tier || MemberTier.SILVER,
      deposit: data.deposit || 0, used: 0, remaining: data.deposit || 0, joinedAt: new Date().toISOString()
    };
    ms.push(newM);
    saveCollection(COLLECTIONS.MEMBERS, ms);
    return newM;
  },
  getDashboardStats: async () => {
    const rs = getCollection<Reservation>(COLLECTIONS.RESERVATIONS);
    const hs = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY);
    const is = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    const ms = getCollection<Member>(COLLECTIONS.MEMBERS);
    const today = new Date().toISOString().split('T')[0];
    return {
      todayReservations: rs.filter(r => r.dateTime.startsWith(today) && r.status === 'booked').length,
      pendingSignatures: hs.filter(h => h.status === CareStatus.REQUESTED).length,
      unprocessedInquiries: is.filter(i => i.status === InquiryStatus.UNREGISTERED).length,
      lowBalanceCount: ms.filter(m => m.remaining <= 500000).length,
    };
  },
  getInquiries: async () => getCollection<Inquiry>(COLLECTIONS.INQUIRIES),
  createInquiry: async (data: any) => {
    const inqs = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    const newI: Inquiry = {
      id: `inq_${Date.now()}`, status: InquiryStatus.UNREGISTERED, needsFollowUp: false,
      receivedBy: data.adminName || 'Staff', assignedStaff: data.adminName || 'Staff',
      yearMonth: new Date().toISOString().slice(0, 7), logs: [],
      createdAt: new Date().toISOString().replace('T', ' ').split('.')[0], ...data
    };
    inqs.unshift(newI);
    saveCollection(COLLECTIONS.INQUIRIES, inqs);
    return newI;
  },
  updateInquiry: async (id: string, updates: any) => {
    const inqs = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    const idx = inqs.findIndex(i => i.id === id);
    if (idx !== -1) {
      inqs[idx] = { ...inqs[idx], ...updates };
      saveCollection(COLLECTIONS.INQUIRIES, inqs);
      return inqs[idx];
    }
    throw new Error('Inquiry not found');
  },
  addInquiryLog: async (id: string, staffName: string, content: string) => {
    const inqs = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    const idx = inqs.findIndex(i => i.id === id);
    if (idx !== -1) {
      const log: InquiryLog = { id: `log_${Date.now()}`, staffName, content, createdAt: new Date().toISOString().replace('T', ' ').split('.')[0] };
      inqs[idx].logs.push(log);
      saveCollection(COLLECTIONS.INQUIRIES, inqs);
      return inqs[idx];
    }
    throw new Error('Inquiry not found');
  },
  updateTemplate: async (id: string, updates: any) => {},
  saveTemplate: async (data: any) => {},
  requestAdminOTP: async (email: string) => true,
  verifyAdminOTP: async (email: string, code: string) => true,
  updateAdminPassword: async (email: string, pw: string) => true,
  resendEmail: async (type: string, id: string) => {},
  exportMembersToCSV: () => {},
  backupAllData: () => {},
  deleteTemplate: async (id: string) => {},
  uploadTemplate: async (title: string, file: File) => {},
  addTherapist: async (data: any) => {},
  deleteTherapist: async (id: string) => {},
  addProduct: async (data: any) => {},
  updateProduct: async (id: string, updates: any) => {},
  deleteProduct: async (id: string) => {},
  registerMembersBulk: async (data: any[]) => {},
  createReservation: async (data: any) => {},
  exportInquiriesByMonth: async (ym: string) => {}
};
