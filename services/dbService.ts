
import { Member, CareRecord, Reservation, CareStatus, MemberTier, UserRole, Contract, Inquiry, ContractTemplate } from '../types';

const COLLECTIONS = {
  MEMBERS: 'firestore_members',
  CARE_HISTORY: 'firestore_careHistory',
  RESERVATIONS: 'firestore_reservations',
  CONTRACTS: 'firestore_contracts',
  TEMPLATES: 'firestore_templates',
  INQUIRIES: 'firestore_inquiries',
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

// Added missing helper function for contract filename generation to match usage in ContractDashboard
export const generateHannamFilename = (name: string, id: string, joinedAt: string, typeName: string): string => {
  const cleanDate = joinedAt.replace(/-/g, '');
  // Format: [THE_HANNAM]_[JOIN_DATE]_[NAME]_[TYPE].pdf
  return `[THE_HANNAM]_${cleanDate}_${name}_${typeName}.pdf`;
};

export const dbService = {
  getDashboardStats: async () => {
    await delay();
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const reservations = getCollection<Reservation>(COLLECTIONS.RESERVATIONS);
    const inquiries = getCollection<Inquiry>(COLLECTIONS.INQUIRIES);
    const history = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY);
    
    return {
      todayReservations: reservations.length,
      pendingSignatures: history.filter(h => h.status === CareStatus.WAITING_SIGNATURE).length,
      unprocessedInquiries: inquiries.filter(i => i.status === 'new').length,
      lowBalanceCount: members.filter(m => m.remaining <= 500000).length,
      lowBalanceMembers: members.filter(m => m.remaining <= 500000),
      recentInquiries: inquiries.slice(0, 5)
    };
  },

  getAllMembers: async () => { await delay(); return getCollection<Member>(COLLECTIONS.MEMBERS); },
  getMemberById: async (id: string) => { await delay(); return getCollection<Member>(COLLECTIONS.MEMBERS).find(m => m.id === id); },
  
  registerMember: async (data: any) => {
    await delay(500);
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const newMember: Member = {
      id: `user_${Date.now()}`,
      name: data.name,
      phone: data.phone,
      email: data.email,
      gender: data.gender,
      role: UserRole.MEMBER,
      tier: MemberTier.SILVER,
      deposit: data.deposit || 0,
      used: 0,
      remaining: data.deposit || 0,
      coreGoal: 'Stress Care & Sleep Quality',
      aiRecommended: 'Meditation & Yoga Therapy',
      joinedAt: new Date().toISOString().split('T')[0],
      address: data.address,
      adminNote: data.adminNote,
    };
    members.push(newMember);
    saveCollection(COLLECTIONS.MEMBERS, members);
    return newMember;
  },

  getTemplates: async () => { await delay(); return getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES); },
  
  saveTemplate: async (data: any) => {
    await delay();
    const templates = getCollection<ContractTemplate>(COLLECTIONS.TEMPLATES);
    const newTemplate: ContractTemplate = {
      id: `tmpl_${Date.now()}`,
      title: data.title,
      type: data.type,
      pdfName: data.pdfName || `${data.title}.pdf`,
      contentBody: data.contentBody,
      createdAt: new Date().toISOString()
    };
    templates.push(newTemplate);
    saveCollection(COLLECTIONS.TEMPLATES, templates);
    return newTemplate;
  },

  getAllContracts: async () => { await delay(); return getCollection<Contract>(COLLECTIONS.CONTRACTS); },
  
  createContract: async (data: any) => {
    await delay(1000);
    const contracts = getCollection<Contract>(COLLECTIONS.CONTRACTS);
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    
    let member = members.find(m => m.name === data.memberName && m.phone === data.memberPhone);
    
    if (!member) {
      member = {
        id: `user_${Date.now()}`,
        name: data.memberName,
        phone: data.memberPhone,
        email: data.memberEmail,
        gender: '여성',
        role: UserRole.MEMBER,
        tier: data.amount >= 10000000 ? MemberTier.ROYAL : data.amount >= 5000000 ? MemberTier.GOLD : MemberTier.SILVER,
        deposit: data.amount,
        used: 0,
        remaining: data.amount,
        coreGoal: 'Physical Recovery',
        aiRecommended: 'Evening Meditation',
        joinedAt: new Date().toISOString().split('T')[0],
      };
      members.push(member);
    } else {
      member.deposit += data.amount;
      member.remaining += data.amount;
      if (member.deposit >= 10000000) member.tier = MemberTier.ROYAL;
      else if (member.deposit >= 5000000) member.tier = MemberTier.GOLD;
    }
    saveCollection(COLLECTIONS.MEMBERS, members);

    const now = new Date();
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
      yearMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      createdAt: now.toISOString()
    };
    
    contracts.push(newContract);
    saveCollection(COLLECTIONS.CONTRACTS, contracts);
    
    return { contract: newContract, member };
  },

  getMemberContracts: async (memberId: string) => { 
    await delay(); 
    return getCollection<Contract>(COLLECTIONS.CONTRACTS).filter(c => c.memberId === memberId);
  },

  processCareSession: async (data: any) => {
    await delay(800);
    const history = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY);
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // 서명 전에는 차감하지 않음 (대기 상태로 생성)
    const newRecord: CareRecord = {
      id: `care_${Date.now()}`,
      memberId: data.memberId,
      therapistId: 'staff_1',
      therapistName: data.therapist,
      date: now.toISOString().split('T')[0],
      yearMonth,
      content: data.content,
      originalPrice: data.originalPrice,
      discountedPrice: data.discountedPrice,
      discountRate: data.originalPrice > 0 ? (data.originalPrice - data.discountedPrice) / data.originalPrice : 0,
      feedback: data.comment,
      recommendation: data.recommendation,
      status: CareStatus.WAITING_SIGNATURE,
      createdAt: now.toISOString()
    };
    history.unshift(newRecord);
    saveCollection(COLLECTIONS.CARE_HISTORY, history);
    return newRecord;
  },

  signCareRecord: async (id: string, signature: string) => {
    await delay(500);
    const history = getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY);
    const members = getCollection<Member>(COLLECTIONS.MEMBERS);
    const idx = history.findIndex(h => h.id === id);
    
    if (idx !== -1 && history[idx].status !== CareStatus.COMPLETED) {
      const record = history[idx];
      const member = members.find(m => m.id === record.memberId);
      
      if (member) {
        // 실제 서명 시점에 잔액 차감 발생
        member.remaining -= record.discountedPrice;
        member.used += record.discountedPrice;
        saveCollection(COLLECTIONS.MEMBERS, members);
      }

      history[idx].status = CareStatus.COMPLETED;
      history[idx].signature = signature;
      history[idx].signedAt = new Date().toISOString();
      saveCollection(COLLECTIONS.CARE_HISTORY, history);
    }
  },

  getReservations: async (memberId?: string) => { 
    await delay(); 
    const res = getCollection<Reservation>(COLLECTIONS.RESERVATIONS);
    return memberId ? res.filter(r => r.memberId === memberId) : res;
  },
  getInquiries: async () => { await delay(); return getCollection<Inquiry>(COLLECTIONS.INQUIRIES); },
  getMemberCareHistory: async (memberId: string) => {
    await delay();
    return getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY).filter(c => c.memberId === memberId);
  },
  getCareRecordById: async (id: string) => { await delay(); return getCollection<CareRecord>(COLLECTIONS.CARE_HISTORY).find(c => c.id === id); },
  deleteContract: async (id: string) => {
    await delay(500);
    const contracts = getCollection<Contract>(COLLECTIONS.CONTRACTS);
    const filtered = contracts.filter(c => c.id !== id);
    saveCollection(COLLECTIONS.CONTRACTS, filtered);
  }
};
