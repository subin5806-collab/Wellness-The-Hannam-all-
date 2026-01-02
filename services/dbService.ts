
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
  AUDIT_LOGS: 'firestore_audit_logs', // 추가: 보안 감사 로그 전용
  THERAPISTS: 'firestore_therapists',
  PRODUCTS: 'firestore_products',
  CONTRACTS: 'firestore_contracts',
  TEMPLATES: 'firestore_templates',
  INQUIRIES: 'firestore_inquiries',
};

// 임시 OTP 저장소 (서버 세션 대용)
let tempOTP: { code: string; expiry: number; action: string } | null = null;

const getCollection = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveCollection = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const logAuditTrail = (action: string, target: string, status: 'SUCCESS' | 'FAILURE', details?: string) => {
  const logs = getCollection<any>(COLLECTIONS.AUDIT_LOGS);
  logs.unshift({
    id: `audit_${Date.now()}`,
    action,
    target,
    status,
    details,
    ip: '121.133.***.***', // 관리자 전용 IP 시뮬레이션
    createdAt: new Date().toISOString()
  });
  saveCollection(COLLECTIONS.AUDIT_LOGS, logs.slice(0, 500)); // 감사 로그는 더 길게 보관
};

const logSystemEvent = (type: 'ERROR' | 'INFO', message: string, data?: any) => {
  const logs = getCollection<any>(COLLECTIONS.SYSTEM_LOGS);
  logs.unshift({ id: Date.now(), type, message, data, createdAt: new Date().toISOString() });
  saveCollection(COLLECTIONS.SYSTEM_LOGS, logs.slice(0, 100));
};

const sendHannamEmail = async (to: string, subject: string, body: string) => {
  if (!to || EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
    console.info('[SECURITY OTP SENT]', { to, subject, body });
    return;
  }
  try {
    await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID, { to_email: to, subject, message: body }, EMAILJS_CONFIG.PUBLIC_KEY);
  } catch (e) {
    logSystemEvent('ERROR', `Email failed to ${to}`, e);
  }
};

// [FIX] Added missing named export validateEmail
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// [FIX] Added missing named export generateHannamFilename
export const generateHannamFilename = (name: string, id: string, date: string): string => {
  const cleanDate = date.split('T')[0].replace(/-/g, '');
  return `HANNAM_${name}_${id.slice(-4)}_${cleanDate}.pdf`;
};

export const dbService = {
  // [보안] OTP 요청
  requestSensitiveOTP: async (action: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    tempOTP = {
      code,
      expiry: Date.now() + 5 * 60 * 1000, // 5분
      action
    };
    await sendHannamEmail('help@thehannam.com', '[더 한남] 보안 인증 코드', `요청하신 작업(${action})에 대한 보안 인증 코드는 [${code}] 입니다.`);
    return true;
  },

  // [보안] OTP 검증
  verifySensitiveOTP: async (code: string, action: string) => {
    if (!tempOTP || tempOTP.action !== action) {
      logAuditTrail(action, 'SECURITY', 'FAILURE', '세션 불일치');
      return false;
    }
    if (Date.now() > tempOTP.expiry) {
      logAuditTrail(action, 'SECURITY', 'FAILURE', '코드 만료');
      tempOTP = null;
      return false;
    }
    if (tempOTP.code === code) {
      logAuditTrail(action, 'SECURITY', 'SUCCESS', '인증 성공');
      tempOTP = null;
      return true;
    }
    logAuditTrail(action, 'SECURITY', 'FAILURE', '코드 불일치');
    return false;
  },

  getMemberByNo: async (memberNo: string) => {
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const found = members.find(m => m.id === memberNo.replace(/[^0-9]/g, ''));
    if (!found) throw new Error('회원번호를 확인해주세요.');
    return found;
  },

  createContract: async (data: any) => {
    const cs = getCollection<Contract>(COLLECTIONS.CONTRACTS);
    const normalizedPhone = data.memberPhone.replace(/[^0-9]/g, '');
    const newC: Contract = {
      id: `con_${Date.now()}`,
      memberId: data.memberId || normalizedPhone,
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
    await sendHannamEmail(newC.memberEmail, `[더 한남] 디지털 계약 체결 안내`, `${newC.memberName}님, 요청하신 '${newC.typeName}' 계약이 완료되었습니다.`);
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
    await sendHannamEmail(member.email, `[더 한남] 이용 금액 차감 안내`, `${member.name}님, ₩${data.discountedPrice.toLocaleString()}이 차감되었습니다.`);
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
    if (ms.some(m => m.id === id)) throw new Error('이미 등록된 휴대폰 번호입니다.');
    const newM: Member = {
      id, ...data, role: UserRole.MEMBER, tier: data.tier || MemberTier.SILVER,
      deposit: data.deposit || 0, used: 0, remaining: data.deposit || 0, joinedAt: new Date().toISOString()
    };
    ms.push(newM);
    saveCollection(COLLECTIONS.MEMBERS, ms);
    return newM;
  },

  // [FIX] Added missing saveTemplate method
  saveTemplate: async (data: any): Promise<ContractTemplate> => {
    const ts = getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES);
    const newT: ContractTemplate = { 
      id: `tmpl_${Date.now()}`, 
      createdAt: new Date().toISOString(), 
      title: data.title || 'Untitled Template',
      type: data.type || 'MEMBERSHIP',
      pdfName: data.pdfName || 'manual_entry.pdf',
      contentBody: data.contentBody || 'System Generated',
      ...data 
    };
    ts.push(newT);
    saveCollection(COLLECTIONS.TEMPLATES, ts);
    return newT;
  },

  updateTemplate: async (id: string, updates: any) => {
    const ts = getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES);
    const idx = ts.findIndex(t => t.id === id);
    if (idx !== -1) {
      ts[idx] = { ...ts[idx], ...updates };
      saveCollection(COLLECTIONS.TEMPLATES, ts);
      return ts[idx];
    }
    throw new Error('템플릿을 찾을 수 없습니다.');
  },

  deleteTemplate: async (id: string) => {
    const ts = getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES);
    const filtered = ts.filter(t => t.id !== id);
    saveCollection(COLLECTIONS.TEMPLATES, filtered);
  },

  // [FIX] Added missing uploadTemplate method
  uploadTemplate: async (title: string, file: File): Promise<ContractTemplate> => {
    return new Promise<ContractTemplate>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const ts = getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES);
        const newT: ContractTemplate = {
          id: `tmpl_${Date.now()}`,
          title,
          type: 'MEMBERSHIP',
          pdfName: file.name,
          contentBody: 'Uploaded PDF Content',
          fileData: base64,
          createdAt: new Date().toISOString(),
        };
        ts.push(newT);
        saveCollection(COLLECTIONS.TEMPLATES, ts);
        resolve(newT);
      };
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsDataURL(file);
    });
  },

  addTherapist: async (data: any) => {
    const ts = getCollection<Therapist>(COLLECTIONS.THERAPISTS);
    const newT = { id: `stf_${Date.now()}`, ...data };
    ts.push(newT);
    saveCollection(COLLECTIONS.THERAPISTS, ts);
    return newT;
  },

  deleteTherapist: async (id: string) => {
    const ts = getCollection<Therapist>(COLLECTIONS.THERAPISTS);
    saveCollection(COLLECTIONS.THERAPISTS, ts.filter(t => t.id !== id));
  },

  addProduct: async (data: any) => {
    const ps = getCollection<Product>(COLLECTIONS.PRODUCTS);
    const newP = { id: `prd_${Date.now()}`, ...data };
    ps.push(newP);
    saveCollection(COLLECTIONS.PRODUCTS, ps);
    return newP;
  },

  updateProduct: async (id: string, updates: any) => {
    const ps = getCollection<Product>(COLLECTIONS.PRODUCTS);
    const idx = ps.findIndex(p => p.id === id);
    if (idx !== -1) {
      ps[idx] = { ...ps[idx], ...updates };
      saveCollection(COLLECTIONS.PRODUCTS, ps);
      return ps[idx];
    }
  },

  deleteProduct: async (id: string) => {
    const ps = getCollection<Product>(COLLECTIONS.PRODUCTS);
    saveCollection(COLLECTIONS.PRODUCTS, ps.filter(p => p.id !== id));
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

  requestAdminOTP: async (email: string) => {
    return dbService.requestSensitiveOTP('ADMIN_ACCESS');
  },
  verifyAdminOTP: async (email: string, code: string) => {
    return dbService.verifySensitiveOTP(code, 'ADMIN_ACCESS');
  },
  updateAdminPassword: async (email: string, pw: string) => {
    const configs = getCollection<any>('firestore_admin_config');
    const idx = configs.findIndex((c: any) => c.email === email);
    if (idx !== -1) {
      configs[idx].password = pw;
    } else {
      configs.push({ email, password: pw });
    }
    saveCollection('firestore_admin_config', configs);
    logAuditTrail('PASSWORD_CHANGE', email, 'SUCCESS');
    return true;
  },
  
  exportMembersToCSV: async () => {
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const csv = [
      ['ID', '이름', '연락처', '이메일', '등급', '잔액'].join(','),
      ...members.map(m => [m.id, m.name, m.phone, m.email, m.tier, m.remaining].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `members_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logAuditTrail('EXPORT_MEMBERS', 'CSV', 'SUCCESS');
  },

  backupAllData: async () => {
    const data = {
      members: getCollection(COLLECTIONS.MEMBERS),
      care: getCollection(COLLECTIONS.CARE_HISTORY),
      contracts: getCollection(COLLECTIONS.CONTRACTS),
      inquiries: getCollection(COLLECTIONS.INQUIRIES)
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hannam_backup_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logAuditTrail('BACKUP_DATABASE', 'JSON', 'SUCCESS');
  },

  registerMembersBulk: async (data: any[]) => {
    const ms = getCollection<Member>(COLLECTIONS.MEMBERS);
    data.forEach(d => {
      const id = d.연락처?.replace(/[^0-9]/g, '') || `bulk_${Date.now()}_${Math.random()}`;
      if (!ms.find(m => m.id === id)) {
        ms.push({
          id, name: d.이름, phone: d.연락처, email: d.이메일, 
          role: UserRole.MEMBER, tier: MemberTier.SILVER,
          deposit: Number(d.예치금) || 0, used: 0, remaining: Number(d.예치금) || 0,
          joinedAt: new Date().toISOString(), gender: '여성', coreGoal: '', aiRecommended: ''
        });
      }
    });
    saveCollection(COLLECTIONS.MEMBERS, ms);
  },

  createReservation: async (data: any) => {
    const rs = getCollection<Reservation>(COLLECTIONS.RESERVATIONS);
    const newR = { id: `res_${Date.now()}`, status: 'booked', ...data };
    rs.push(newR);
    saveCollection(COLLECTIONS.RESERVATIONS, rs);
    return newR;
  },

  exportInquiriesByMonth: async (ym: string) => {
    const inqs = getCollection<Inquiry>(COLLECTIONS.INQUIRIES).filter(i => i.yearMonth === ym);
    const csv = [
      ['ID', '고객명', '연락처', '경로', '상태', '등록일'].join(','),
      ...inqs.map(i => [i.id, i.memberName, i.phone, i.path, i.status, i.createdAt].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inquiries_${ym}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logAuditTrail('EXPORT_INQUIRIES', ym, 'SUCCESS');
  },

  // [FIX] Added missing resendEmail method
  resendEmail: async (type: string, id: string): Promise<boolean> => {
    console.info(`[RESEND EMAIL] type: ${type}, id: ${id}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }
};
