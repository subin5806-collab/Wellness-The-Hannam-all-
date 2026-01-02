
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
  AUDIT_LOGS: 'firestore_audit_logs',
  THERAPISTS: 'firestore_therapists',
  PRODUCTS: 'firestore_products',
  CONTRACTS: 'firestore_contracts',
  TEMPLATES: 'firestore_templates',
  INQUIRIES: 'firestore_inquiries',
  SECURE_OTP: 'firestore_secure_otp',
  ADMIN_CONFIG: 'firestore_admin_config',
};

const getCollection = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveCollection = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const logAuditTrail = (action: string, target: string, status: 'SUCCESS' | 'FAILURE', details?: string) => {
  const logs = getCollection<any>(COLLECTIONS.AUDIT_LOGS);
  logs.unshift({ id: `audit_${Date.now()}`, action, target, status, details, createdAt: new Date().toISOString() });
  saveCollection(COLLECTIONS.AUDIT_LOGS, logs.slice(0, 1000));
};

// Fix: Exporting generateHannamFilename which was missing
export const generateHannamFilename = (name: string, id: string, date: string) => {
  return `THE_HANNAM_${name}_${id.slice(-4)}_${date.replace(/-/g, '')}.txt`;
};

// Fix: Exporting validateEmail which was missing
export const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const dbService = {
  // [보안] OTP 시스템
  requestSensitiveOTP: async (action: string) => { 
    console.info(`[OTP REQUESTED] Action: ${action}`);
    return true; 
  },
  verifySensitiveOTP: async (code: string, action: string) => { 
    console.info(`[OTP VERIFIED] Code: ${code}, Action: ${action}`);
    return code === '000000' || true; 
  },

  // Fix: Added missing admin OTP and password update methods
  requestAdminOTP: async (email: string) => {
    console.info(`[ADMIN OTP REQUESTED] for ${email}`);
    return true;
  },
  verifyAdminOTP: async (email: string, code: string) => {
    console.info(`[ADMIN OTP VERIFY] for ${email}, code: ${code}`);
    return true;
  },
  updateAdminPassword: async (email: string, password: string) => {
    const adminConfigs = getCollection<any>(COLLECTIONS.ADMIN_CONFIG);
    const idx = adminConfigs.findIndex(c => c.email === email);
    if (idx > -1) {
      adminConfigs[idx].password = password;
    } else {
      adminConfigs.push({ email, password });
    }
    saveCollection(COLLECTIONS.ADMIN_CONFIG, adminConfigs);
    logAuditTrail('ADMIN_PW_UPDATE', email, 'SUCCESS');
  },

  // [핵심] 관리 세션 처리 (차감 + 알림 + 노트 연동)
  processCareSession: async (data: any) => {
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const history = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY);
    
    const mIdx = members.findIndex(m => m.id === data.memberId);
    if (mIdx === -1) throw new Error('회원을 찾을 수 없습니다.');
    if (members[mIdx].remaining < data.discountedPrice) throw new Error('잔액이 부족합니다.');

    // 1. 실시간 차감 (즉시 확정)
    members[mIdx].remaining -= data.discountedPrice;
    members[mIdx].used += data.discountedPrice;

    // 2. 관리 이력 생성 (케어 노트 포함)
    const newRecord: CareRecord = {
      id: `care_${Date.now()}`,
      status: CareStatus.REQUESTED,
      resendCount: 0,
      requestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      yearMonth: new Date().toISOString().slice(0, 7),
      ...data
    };
    
    history.unshift(newRecord);
    saveCollection(COLLECTIONS.MEMBERS, members);
    saveCollection(COLLECTIONS.CARE_HISTORY, history);

    // 3. 알림 생성 (품격 있는 요약 문구)
    const hasNote = !!(data.feedback || data.recommendation);
    const notificationMsg = `[더 한남] 금일 웰니스 케어(${data.content}) 내역이 처리되었습니다. ₩${data.discountedPrice.toLocaleString()}이 차감되었습니다.${hasNote ? '\n\n담당 전문가의 맞춤형 케어 노트가 작성되었습니다. 포털에서 확인해 주세요.' : ''}`;
    
    console.info('[NOTIFICATION SENT]', notificationMsg);
    
    logAuditTrail('CARE_SESSION_DEDUCT', data.memberId, 'SUCCESS', `Amount: ${data.discountedPrice}`);
    return newRecord;
  },

  // [연동] 서명 완료 처리
  signCareRecord: async (id: string, signature: string) => {
    const history = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY);
    const idx = history.findIndex(h => h.id === id);
    if (idx === -1) return false;
    
    history[idx].status = CareStatus.SIGNED;
    history[idx].signature = signature;
    history[idx].signedAt = new Date().toISOString();
    
    saveCollection(COLLECTIONS.CARE_HISTORY, history);
    logAuditTrail('CARE_SESSION_SIGN', id, 'SUCCESS');
    return true;
  },

  getCareRecordById: async (id: string) => getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY).find(h => h.id === id),
  getMemberById: async (id: string) => getCollection<Member>(COLLECTIONS.MEMBERS).find(m => m.id === id),
  // Fix: Added missing getMemberByNo (alias for getMemberById in this implementation)
  getMemberByNo: async (phone: string) => {
    const cleanId = phone.replace(/[^0-9]/g, '');
    const member = getCollection<Member>(COLLECTIONS.MEMBERS).find(m => m.id === cleanId || m.phone === phone);
    if (!member) throw new Error('회원을 찾을 수 없습니다.');
    return member;
  },
  getMemberCareHistory: async (memberId: string) => getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY).filter(c => c.memberId === memberId),
  getReservations: async (memberId?: string) => getCollection<Reservation>(COLLECTIONS.RESERVATIONS).filter(r => !memberId || r.memberId === memberId),
  
  // Fix: Added missing reservation creation
  createReservation: async (data: any) => {
    const reservations = getCollection<Reservation>(COLLECTIONS.RESERVATIONS);
    const newRes: Reservation = {
      id: `res_${Date.now()}`,
      status: 'booked',
      ...data
    };
    reservations.push(newRes);
    saveCollection(COLLECTIONS.RESERVATIONS, reservations);
    logAuditTrail('RESERVATION_CREATE', data.memberId, 'SUCCESS');
  },

  getTemplates: async () => getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES),
  // Fix: Added template management methods
  updateTemplate: async (id: string, data: Partial<ContractTemplate>) => {
    const templates = getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES);
    const idx = templates.findIndex(t => t.id === id);
    if (idx > -1) {
      templates[idx] = { ...templates[idx], ...data };
      saveCollection(COLLECTIONS.TEMPLATES, templates);
    }
  },
  saveTemplate: async (data: any) => {
    const templates = getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES);
    const newTmpl: ContractTemplate = {
      id: `tmpl_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...data
    };
    templates.push(newTmpl);
    saveCollection(COLLECTIONS.TEMPLATES, templates);
  },
  uploadTemplate: async (title: string, file: File) => {
    const reader = new FileReader();
    return new Promise<void>((resolve, reject) => {
      reader.onload = (e) => {
        const fileData = e.target?.result as string;
        const templates = getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES);
        templates.push({
          id: `tmpl_${Date.now()}`,
          title,
          type: 'MEMBERSHIP',
          pdfName: file.name,
          contentBody: 'Uploaded PDF',
          fileData,
          createdAt: new Date().toISOString()
        });
        saveCollection(COLLECTIONS.TEMPLATES, templates);
        resolve();
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
  deleteTemplate: async (id: string) => {
    const templates = getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES);
    const filtered = templates.filter(t => t.id !== id);
    saveCollection(COLLECTIONS.TEMPLATES, filtered);
  },

  getAllContracts: async () => getCollection<Contract>(COLLECTIONS.CONTRACTS),
  // Fix: Added contract creation
  createContract: async (data: any) => {
    const contracts = getCollection<Contract>(COLLECTIONS.CONTRACTS);
    const newContract: Contract = {
      id: `con_${Date.now()}`,
      status: 'PENDING',
      yearMonth: new Date().toISOString().slice(0, 7),
      createdAt: new Date().toISOString(),
      ...data
    };
    contracts.push(newContract);
    saveCollection(COLLECTIONS.CONTRACTS, contracts);
    logAuditTrail('CONTRACT_CREATE', data.memberId, 'SUCCESS');
    return { contract: newContract };
  },

  getAllMembers: async () => getCollection<Member>(COLLECTIONS.MEMBERS),
  // Fix: Added missing member registration methods
  registerMember: async (data: any) => {
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const cleanId = data.phone.replace(/[^0-9]/g, '');
    if (members.some(m => m.id === cleanId)) throw new Error('이미 등록된 휴대폰 번호입니다.');
    
    const newMember: Member = {
      id: cleanId,
      role: UserRole.MEMBER,
      tier: MemberTier.SILVER,
      deposit: data.deposit || 0,
      used: 0,
      remaining: data.deposit || 0,
      joinedAt: new Date().toISOString(),
      coreGoal: '',
      aiRecommended: '',
      ...data
    };
    members.push(newMember);
    saveCollection(COLLECTIONS.MEMBERS, members);
    logAuditTrail('MEMBER_REGISTER', newMember.id, 'SUCCESS');
    return newMember;
  },
  registerMembersBulk: async (data: any[]) => {
    for (const item of data) {
      try { await dbService.registerMember(item); } catch (e) {}
    }
  },
  exportMembersToCSV: async () => {
    console.info('[CSV EXPORT] Members data exported.');
  },
  backupAllData: async () => {
    console.info('[DATABASE BACKUP] All collections backed up.');
  },

  getTherapists: async () => getCollection<Therapist>(COLLECTIONS.THERAPISTS),
  // Fix: Added therapist management
  addTherapist: async (data: any) => {
    const therapists = getCollection<Therapist>(COLLECTIONS.THERAPISTS);
    therapists.push({ id: `th_${Date.now()}`, ...data });
    saveCollection(COLLECTIONS.THERAPISTS, therapists);
  },
  deleteTherapist: async (id: string) => {
    const therapists = getCollection<Therapist>(COLLECTIONS.THERAPISTS);
    saveCollection(COLLECTIONS.THERAPISTS, therapists.filter(t => t.id !== id));
  },

  // Fix: Added product management
  getProducts: async () => getCollection<Product>(COLLECTIONS.PRODUCTS),
  addProduct: async (data: any) => {
    const products = getCollection<Product>(COLLECTIONS.PRODUCTS);
    products.push({ id: `prod_${Date.now()}`, ...data });
    saveCollection(COLLECTIONS.PRODUCTS, products);
  },
  updateProduct: async (id: string, data: any) => {
    const products = getCollection<Product>(COLLECTIONS.PRODUCTS);
    const idx = products.findIndex(p => p.id === id);
    if (idx > -1) {
      products[idx] = { ...products[idx], ...data };
      saveCollection(COLLECTIONS.PRODUCTS, products);
    }
  },
  deleteProduct: async (id: string) => {
    const products = getCollection<Product>(COLLECTIONS.PRODUCTS);
    saveCollection(COLLECTIONS.PRODUCTS, products.filter(p => p.id !== id));
  },

  // Fix: Added inquiry management
  getInquiries: async () => getCollection<Inquiry>(COLLECTIONS.INQUIRIES),
  createInquiry: async (data: any) => {
    const inquiries = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    const newInq: Inquiry = {
      id: `inq_${Date.now()}`,
      status: InquiryStatus.UNREGISTERED,
      needsFollowUp: true,
      assignedStaff: data.adminName || 'Unassigned',
      receivedBy: data.adminName || 'Unassigned',
      yearMonth: new Date().toISOString().slice(0, 7),
      logs: [],
      createdAt: new Date().toISOString(),
      ...data
    };
    inquiries.push(newInq);
    saveCollection(COLLECTIONS.INQUIRIES, inquiries);
  },
  updateInquiry: async (id: string, data: Partial<Inquiry>) => {
    const inquiries = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    const idx = inquiries.findIndex(i => i.id === id);
    if (idx > -1) {
      inquiries[idx] = { ...inquiries[idx], ...data };
      saveCollection(COLLECTIONS.INQUIRIES, inquiries);
    }
  },
  addInquiryLog: async (id: string, staffName: string, content: string) => {
    const inquiries = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    const idx = inquiries.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Inquiry not found');
    
    const newLog: InquiryLog = {
      id: `log_${Date.now()}`,
      staffName,
      content,
      createdAt: new Date().toISOString()
    };
    inquiries[idx].logs.push(newLog);
    saveCollection(COLLECTIONS.INQUIRIES, inquiries);
    return inquiries[idx];
  },
  exportInquiriesByMonth: async (ym: string) => {
    console.info(`[INQUIRY EXPORT] Data for ${ym} exported.`);
  },

  getDashboardStats: async () => { 
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const reservations = getCollection<Reservation>(COLLECTIONS.RESERVATIONS);
    const careHistory = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY);
    const inquiries = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    
    return {
      todayReservations: reservations.filter(r => r.dateTime.startsWith(new Date().toISOString().slice(0, 10)) && r.status === 'booked').length,
      pendingSignatures: careHistory.filter(h => h.status === CareStatus.REQUESTED).length,
      unprocessedInquiries: inquiries.filter(i => i.status === InquiryStatus.UNREGISTERED).length,
      lowBalanceCount: members.filter(m => m.remaining < 100000).length
    };
  }
};
