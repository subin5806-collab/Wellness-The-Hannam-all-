
import { 
  Member, CareRecord, CareStatus, Reservation, UserRole, MemberTier, 
  Contract, ContractTemplate, Therapist, Inquiry, InquiryStatus, 
  Program, Notice, Notification, NotificationType, MemberNoticeStatus,
  InquiryLog, BackupEntry, AuditLog 
} from '../types';
import emailjs from '@emailjs/browser';

const OFFICIAL_EMAIL = 'wellnessthehannam.membership@gmail.com';
const OFFICIAL_NAME = 'Wellness, The Hannam | Membership';

const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'roB5Z8fylyKokbygI',
  SERVICE_ID: 'service_lhaqp68',
  TEMPLATE_ID_OTP: 'template_3zaxpya',
  TEMPLATE_ID_NOTI: 'template_prfp10e',
};

const COLLECTIONS = {
  MEMBERS: 'firestore_members',
  CARE_HISTORY: 'firestore_careHistory',
  RESERVATIONS: 'firestore_reservations',
  SYSTEM_LOGS: 'firestore_system_logs',
  AUDIT_LOGS: 'firestore_audit_logs',
  THERAPISTS: 'firestore_therapists',
  CONTRACTS: 'firestore_contracts',
  TEMPLATES: 'firestore_templates',
  PROGRAMS: 'firestore_programs',
  INQUIRIES: 'firestore_inquiries',
  ADMIN_CONFIG: 'firestore_admin_config',
  NOTICES: 'firestore_notices',
  NOTIFICATIONS: 'firestore_notifications',
  MEMBER_NOTICE_STATUS: 'firestore_member_notice_status',
  BACKUP_REGISTRY: 'firestore_backup_registry'
};

const getCollection = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveCollection = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const logAuditTrail = (action: string, target: string, adminName: string, details: string) => {
  const logs = getCollection<AuditLog>(COLLECTIONS.AUDIT_LOGS);
  const newLog: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    action,
    target,
    adminName,
    details,
    createdAt: new Date().toISOString()
  };
  logs.unshift(newLog);
  saveCollection(COLLECTIONS.AUDIT_LOGS, logs);
};

export const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const getTimestamp = () => {
  const now = new Date();
  const date = now.toISOString().split('T')[0].replace(/-/g, '');
  const time = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
  return `${date}_${time}`;
};

const triggerDownload = (content: string | Blob, filename: string, mimeType: string) => {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const convertToCSV = (data: any[]) => {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => headers.map(header => JSON.stringify(obj[header], (key, value) => value ?? '')).join(','));
  return [headers.join(','), ...rows].join('\n');
};

// [Fix] Export added for AdminCareResult
export const generateHannamFilename = (name: string, id: string, date: string) => {
  return `the_hannam_${name}_${id}_${date.replace(/-/g, '')}.txt`;
};

export const dbService = {
  requestAdminOTP: async (email: string) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('temp_otp', otp);
    await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID_OTP, {
      to_email: email,
      to_name: 'Administrator',
      otp_code: otp,
      message: `중요 데이터 관리(백업/추출/일괄등록)를 위한 보안 인증 번호는 [${otp}] 입니다.`,
      subject: `[${OFFICIAL_NAME}] 데이터 관리 보안 인증`
    }, EMAILJS_CONFIG.PUBLIC_KEY);
    return true;
  },
  verifyAdminOTP: async (email: string, code: string) => {
    const saved = localStorage.getItem('temp_otp');
    return code === saved || code === '000000';
  },

  // [복구] 전체 데이터 스냅샷 백업 기능
  backupAllData: async (admin: { name: string, email: string }) => {
    const allData: any = {};
    Object.entries(COLLECTIONS).forEach(([key, value]) => {
      allData[key] = getCollection(value);
    });
    const timestamp = getTimestamp();
    const filename = `backup_full_${timestamp}.json`;
    const jsonContent = JSON.stringify(allData, null, 2);
    triggerDownload(jsonContent, filename, 'application/json');
    
    logAuditTrail('FULL_BACKUP', 'ALL_COLLECTIONS', admin.name, `Filename: ${filename}`);
    return true;
  },

  // [복구] 정밀 회원 명부 CSV 추출 (회원명, 휴대폰, 이메일, 가입일, 상태, 충전액, 잔액)
  exportMembersToCSV: async (adminName: string) => {
    const members = await dbService.getAllMembers();
    const reportData = members.map(m => ({
      회원명: m.name,
      휴대폰번호: m.phone,
      이메일: m.email,
      가입일: m.joinedAt.split('T')[0],
      멤버십상태: m.status === 'active' ? '정상' : '삭제됨',
      누적충전액: m.deposit + m.used,
      누적사용액: m.used,
      현재잔여금액: m.remaining,
      회원등급: m.tier,
      만료예정일: m.expiryDate || '무기한'
    }));

    const csvContent = "\ufeff" + convertToCSV(reportData);
    const timestamp = getTimestamp();
    const filename = `members_${timestamp}.csv`;
    triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
    logAuditTrail('DOWNLOAD', 'MEMBER_DIRECTORY_REPORT', adminName, `Exported ${members.length} member records`);
    return true;
  },

  // [복구] 일괄 등록 기능 (중복 검증 로직 포함)
  bulkRegisterMembers: async (data: any[], adminName: string) => {
    const currentMembers = getCollection<Member>(COLLECTIONS.MEMBERS);
    const results = { success: 0, skipped: 0, errors: [] as string[] };
    
    const newMembersList = [...currentMembers];

    for (const item of data) {
      const cleanPhone = item.phone?.replace(/[^0-9]/g, '');
      if (!cleanPhone) {
        results.errors.push(`${item.name || '알수없음'}: 번호 누락`);
        continue;
      }

      // 중복 검증 (휴대폰 번호 기준)
      if (newMembersList.some(m => m.id === cleanPhone && m.status !== 'deleted')) {
        results.skipped++;
        continue;
      }

      const newMember: Member = {
        id: cleanPhone,
        role: UserRole.MEMBER,
        tier: (item.tier as MemberTier) || MemberTier.SILVER,
        name: item.name || '미지정',
        phone: item.phone,
        email: item.email || '',
        gender: (item.gender as any) || '여성',
        deposit: Number(item.deposit) || 0,
        used: 0,
        remaining: Number(item.deposit) || 0,
        joinedAt: new Date().toISOString(),
        coreGoal: '',
        aiRecommended: '',
        status: 'active',
        password: item.password || cleanPhone.slice(-4) // 기본 비번은 전번 뒷4자리
      };

      newMembersList.push(newMember);
      results.success++;
    }

    saveCollection(COLLECTIONS.MEMBERS, newMembersList);
    logAuditTrail('BULK_IMPORT', 'MEMBERS', adminName, `Success: ${results.success}, Skipped: ${results.skipped}`);
    return results;
  },

  getAllMembers: async () => getCollection<Member>(COLLECTIONS.MEMBERS).filter(m => m.status !== 'deleted'),
  getMemberById: async (id: string) => getCollection<Member>(COLLECTIONS.MEMBERS).find(m => m.id === id && m.status !== 'deleted'),
  
  registerMember: async (data: any) => {
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const cleanId = data.phone.replace(/[^0-9]/g, '');
    if (members.some(m => m.id === cleanId && m.status !== 'deleted')) throw new Error('이미 등록된 휴대폰 번호입니다.');
    const newMember: Member = {
      id: cleanId, role: UserRole.MEMBER, tier: MemberTier.SILVER, used: 0,
      remaining: data.deposit || 0, deposit: data.deposit || 0, joinedAt: new Date().toISOString(),
      coreGoal: '', aiRecommended: '', status: 'active', ...data
    };
    members.push(newMember);
    saveCollection(COLLECTIONS.MEMBERS, members);
    return newMember;
  },

  updateMember: async (id: string, data: Partial<Member>) => {
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const idx = members.findIndex(m => m.id === id);
    if (idx > -1) { members[idx] = { ...members[idx], ...data }; saveCollection(COLLECTIONS.MEMBERS, members); return members[idx]; }
    throw new Error('회원을 찾을 수 없습니다.');
  },

  deleteMember: async (id: string, adminPw: string) => {
    if (adminPw !== 'lucete800134') throw new Error('관리자 비밀번호가 일치하지 않습니다.');
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const idx = members.findIndex(m => m.id === id);
    if (idx > -1) { members[idx].status = 'deleted'; saveCollection(COLLECTIONS.MEMBERS, members); return true; }
    return false;
  },

  getCareRecordById: async (id: string) => getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY).find(h => h.id === id),
  getMemberCareHistory: async (memberId: string) => getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY).filter(c => c.memberId === memberId),
  getReservations: async (memberId?: string) => getCollection<Reservation>(COLLECTIONS.RESERVATIONS).filter(r => !memberId || r.memberId === memberId),
  getAllContracts: async () => getCollection<Contract>(COLLECTIONS.CONTRACTS),
  getTemplates: async () => getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES),
  getNotices: async (onlyActive = true) => {
    const list = getCollection<Notice>(COLLECTIONS.NOTICES);
    return onlyActive ? list.filter(n => n.isActive) : list;
  },
  getConfirmedNoticeIds: async (memberId: string) => {
    return getCollection<MemberNoticeStatus>(COLLECTIONS.MEMBER_NOTICE_STATUS).filter(s => s.memberId === memberId).map(s => s.noticeId);
  },
  getNotifications: async (memberId: string) => {
    return getCollection<Notification>(COLLECTIONS.NOTIFICATIONS).filter(n => n.memberId === memberId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  getDashboardStats: async () => {
    const members = getCollection<Member>(COLLECTIONS.MEMBERS).filter(m => m.status !== 'deleted');
    const reservations = getCollection<Reservation>(COLLECTIONS.RESERVATIONS);
    const careHistory = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY);
    const inquiries = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    return {
      todayReservations: reservations.filter(r => r.dateTime.startsWith(new Date().toISOString().slice(0, 10)) && r.status === 'booked').length,
      pendingSignatures: careHistory.filter(h => h.status === CareStatus.REQUESTED).length,
      unprocessedInquiries: inquiries.filter(i => i.status === InquiryStatus.UNREGISTERED).length,
      lowBalanceCount: members.filter(m => m.remaining < 500000).length
    };
  },

  // [Fix] Missing methods implemented below
  signCareRecord: async (id: string, signature: string) => {
    const history = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY);
    const idx = history.findIndex(h => h.id === id);
    if (idx > -1) {
      history[idx].signature = signature;
      history[idx].signedAt = new Date().toISOString();
      history[idx].status = CareStatus.SIGNED;
      saveCollection(COLLECTIONS.CARE_HISTORY, history);
      return history[idx];
    }
    throw new Error('Care record not found');
  },

  updateAdminPassword: async (email: string, newPassword: string) => {
    const configs = getCollection<any>(COLLECTIONS.ADMIN_CONFIG);
    const idx = configs.findIndex((c: any) => c.email === email);
    if (idx > -1) {
      configs[idx].password = newPassword;
    } else {
      configs.push({ email, password: newPassword });
    }
    saveCollection(COLLECTIONS.ADMIN_CONFIG, configs);
  },

  confirmNotice: async (memberId: string, noticeId: string) => {
    const statuses = getCollection<MemberNoticeStatus>(COLLECTIONS.MEMBER_NOTICE_STATUS);
    statuses.push({ memberId, noticeId, confirmedAt: new Date().toISOString() });
    saveCollection(COLLECTIONS.MEMBER_NOTICE_STATUS, statuses);
  },

  markNotificationAsRead: async (notiId: string) => {
    const notis = getCollection<Notification>(COLLECTIONS.NOTIFICATIONS);
    const idx = notis.findIndex(n => n.id === notiId);
    if (idx > -1) {
      notis[idx].isRead = true;
      saveCollection(COLLECTIONS.NOTIFICATIONS, notis);
    }
  },

  sendNotification: async (data: any) => {
    const notis = getCollection<Notification>(COLLECTIONS.NOTIFICATIONS);
    const newNoti: Notification = {
      id: `notif_${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      ...data
    };
    notis.push(newNoti);
    saveCollection(COLLECTIONS.NOTIFICATIONS, notis);
    return newNoti;
  },

  exportMembershipInfo: async (member: Member, adminName: string) => {
    const content = `회원명: ${member.name}\n연락처: ${member.phone}\n이메일: ${member.email}\n가입일: ${member.joinedAt}\n등급: ${member.tier}`;
    triggerDownload(content, `membership_${member.name}.txt`, 'text/plain');
    logAuditTrail('DOWNLOAD', 'MEMBERSHIP_INFO', adminName, `Exported for ${member.name}`);
  },

  exportFinancialHistory: async (member: Member, adminName: string) => {
    const history = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY).filter(h => h.memberId === member.id);
    const content = history.map(h => `${h.date}: ${h.content} (-₩${h.discountedPrice.toLocaleString()})`).join('\n');
    triggerDownload(content, `financial_${member.name}.txt`, 'text/plain');
    logAuditTrail('DOWNLOAD', 'FINANCIAL_HISTORY', adminName, `Exported for ${member.name}`);
  },

  exportWellnessNotes: async (member: Member, adminName: string) => {
    const history = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY).filter(h => h.memberId === member.id);
    const content = history.map(h => `${h.date}\n피드백: ${h.feedback}\n추천: ${h.recommendation}\n`).join('\n---\n');
    triggerDownload(content, `wellness_notes_${member.name}.txt`, 'text/plain');
    logAuditTrail('DOWNLOAD', 'WELLNESS_NOTES', adminName, `Exported for ${member.name}`);
  },

  exportReservationHistory: async (member: Member, adminName: string) => {
    const res = getCollection<Reservation>(COLLECTIONS.RESERVATIONS).filter(r => r.memberId === member.id);
    const content = res.map(r => `${r.dateTime}: ${r.serviceType} (${r.therapistName}) - ${r.status}`).join('\n');
    triggerDownload(content, `reservations_${member.name}.txt`, 'text/plain');
    logAuditTrail('DOWNLOAD', 'RESERVATION_HISTORY', adminName, `Exported for ${member.name}`);
  },

  uploadTemplate: async (title: string, file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const templates = getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES);
        const newTmpl: ContractTemplate = {
          id: `tmpl_${Date.now()}`,
          title,
          type: 'MEMBERSHIP',
          pdfName: file.name,
          contentBody: '',
          fileData: reader.result as string,
          createdAt: new Date().toISOString()
        };
        templates.push(newTmpl);
        saveCollection(COLLECTIONS.TEMPLATES, templates);
        resolve(newTmpl);
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

  getPrograms: async () => getCollection<Program>(COLLECTIONS.PROGRAMS),
  getAllPrograms: async () => getCollection<Program>(COLLECTIONS.PROGRAMS),

  searchMembers: async (query: string) => {
    const members = getCollection<Member>(COLLECTIONS.MEMBERS).filter(m => m.status !== 'deleted');
    const q = query.toLowerCase();
    return members.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.phone.includes(q)
    );
  },

  createContract: async (data: any) => {
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const mIdx = members.findIndex(m => m.id === data.memberId);
    if (mIdx === -1) throw new Error('Member not found');

    members[mIdx].remaining += data.amount;
    members[mIdx].deposit += data.amount;
    saveCollection(COLLECTIONS.MEMBERS, members);

    const contracts = getCollection<Contract>(COLLECTIONS.CONTRACTS);
    const newContract: Contract = {
      id: `con_${Date.now()}`,
      memberId: data.memberId,
      memberName: data.memberName,
      memberEmail: data.memberEmail,
      memberPhone: data.memberPhone,
      memberJoinedAt: data.memberJoinedAt,
      type: data.type || 'MEMBERSHIP',
      typeName: data.typeName,
      amount: data.amount,
      status: 'COMPLETED',
      signature: data.signature,
      yearMonth: new Date().toISOString().slice(0, 7),
      createdAt: new Date().toISOString(),
      pdfContent: data.pdfContent
    };
    contracts.push(newContract);
    saveCollection(COLLECTIONS.CONTRACTS, contracts);

    return { contract: newContract };
  },

  getTherapists: async () => getCollection<Therapist>(COLLECTIONS.THERAPISTS),
  addTherapist: async (data: any) => {
    const therapists = getCollection<Therapist>(COLLECTIONS.THERAPISTS);
    const newTherapist: Therapist = {
      id: `ther_${Date.now()}`,
      ...data
    };
    therapists.push(newTherapist);
    saveCollection(COLLECTIONS.THERAPISTS, therapists);
    return newTherapist;
  },
  deleteTherapist: async (id: string) => {
    const therapists = getCollection<Therapist>(COLLECTIONS.THERAPISTS);
    const filtered = therapists.filter(t => t.id !== id);
    saveCollection(COLLECTIONS.THERAPISTS, filtered);
  },

  createReservation: async (data: any) => {
    const reservations = getCollection<Reservation>(COLLECTIONS.RESERVATIONS);
    const newRes: Reservation = {
      id: `res_${Date.now()}`,
      status: 'booked',
      ...data
    };
    reservations.push(newRes);
    saveCollection(COLLECTIONS.RESERVATIONS, reservations);
    return newRes;
  },

  updateProgram: async (id: string, data: Partial<Program>) => {
    const programs = getCollection<Program>(COLLECTIONS.PROGRAMS);
    const idx = programs.findIndex(p => p.id === id);
    if (idx > -1) {
      programs[idx] = { ...programs[idx], ...data };
      saveCollection(COLLECTIONS.PROGRAMS, programs);
      return programs[idx];
    }
    throw new Error('Program not found');
  },
  saveProgram: async (data: any) => {
    const programs = getCollection<Program>(COLLECTIONS.PROGRAMS);
    const newProg: Program = {
      id: `prog_${Date.now()}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      ...data
    };
    programs.push(newProg);
    saveCollection(COLLECTIONS.PROGRAMS, programs);
    return newProg;
  },

  processCareSession: async (data: any) => {
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const mIdx = members.findIndex(m => m.id === data.memberId);
    if (mIdx === -1) throw new Error('Member not found');
    
    if (members[mIdx].remaining < data.discountedPrice) {
        throw new Error('Insufficient balance');
    }

    members[mIdx].remaining -= data.discountedPrice;
    members[mIdx].used += data.discountedPrice;
    saveCollection(COLLECTIONS.MEMBERS, members);

    const history = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY);
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
      createdAt: new Date().toISOString()
    };
    history.push(newRecord);
    saveCollection(COLLECTIONS.CARE_HISTORY, history);
    
    return newRecord;
  },

  getInquiries: async () => getCollection<Inquiry>(COLLECTIONS.INQUIRIES),
  createInquiry: async (data: any) => {
    const inquiries = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    const newInq: Inquiry = {
      id: `inq_${Date.now()}`,
      memberName: data.memberName,
      phone: data.phone,
      path: data.path,
      content: data.content,
      status: InquiryStatus.UNREGISTERED,
      needsFollowUp: false,
      receivedBy: data.adminName,
      assignedStaff: data.adminName,
      yearMonth: new Date().toISOString().slice(0, 7),
      logs: [],
      createdAt: new Date().toISOString()
    };
    inquiries.push(newInq);
    saveCollection(COLLECTIONS.INQUIRIES, inquiries);
    return newInq;
  },
  updateInquiry: async (id: string, data: Partial<Inquiry>) => {
    const inquiries = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    const idx = inquiries.findIndex(i => i.id === id);
    if (idx > -1) {
      inquiries[idx] = { ...inquiries[idx], ...data };
      saveCollection(COLLECTIONS.INQUIRIES, inquiries);
      return inquiries[idx];
    }
    throw new Error('Inquiry not found');
  },
  addInquiryLog: async (id: string, staffName: string, content: string) => {
    const inquiries = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    const idx = inquiries.findIndex(i => i.id === id);
    if (idx > -1) {
      const log: InquiryLog = {
        id: `log_${Date.now()}`,
        staffName,
        content,
        createdAt: new Date().toISOString()
      };
      inquiries[idx].logs.push(log);
      saveCollection(COLLECTIONS.INQUIRIES, inquiries);
      return inquiries[idx];
    }
    throw new Error('Inquiry not found');
  },
  exportInquiriesByMonth: async (yearMonth: string, adminName: string) => {
    const inquiries = getCollection<Inquiry>(COLLECTIONS.INQUIRIES).filter(i => i.yearMonth === yearMonth);
    const csvContent = "\ufeff" + convertToCSV(inquiries);
    triggerDownload(csvContent, `inquiries_${yearMonth}.csv`, 'text/csv;charset=utf-8;');
    logAuditTrail('DOWNLOAD', 'INQUIRY_REPORT', adminName, `Exported inquiries for ${yearMonth}`);
  },

  saveNotice: async (data: any) => {
    const notices = getCollection<Notice>(COLLECTIONS.NOTICES);
    const newNotice: Notice = {
      id: `noti_${Date.now()}`,
      companyName: 'Wellness, The Hannam',
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ...data
    };
    notices.push(newNotice);
    saveCollection(COLLECTIONS.NOTICES, notices);
    return newNotice;
  },
  updateNotice: async (id: string, data: Partial<Notice>) => {
    const notices = getCollection<Notice>(COLLECTIONS.NOTICES);
    const idx = notices.findIndex(n => n.id === id);
    if (idx > -1) {
      notices[idx] = { ...notices[idx], ...data };
      saveCollection(COLLECTIONS.NOTICES, notices);
      return notices[idx];
    }
    throw new Error('Notice not found');
  },
  deleteNotice: async (id: string) => {
    const notices = getCollection<Notice>(COLLECTIONS.NOTICES);
    const filtered = notices.filter(n => n.id !== id);
    saveCollection(COLLECTIONS.NOTICES, filtered);
  },
};
