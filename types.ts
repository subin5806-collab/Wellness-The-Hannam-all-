
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  MEMBER = 'MEMBER',
}

// Added PermissionScope for authorization logic
export enum PermissionScope {
  DASHBOARD_VIEW = 'DASHBOARD_VIEW',
  MEMBER_MANAGE = 'MEMBER_MANAGE',
  CARE_MANAGE = 'CARE_MANAGE',
  CONTRACT_MANAGE = 'CONTRACT_MANAGE',
  INQUIRY_MANAGE = 'INQUIRY_MANAGE',
}

// Added ROLE_SCOPES mapping
export const ROLE_SCOPES: Record<UserRole, PermissionScope[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(PermissionScope),
  [UserRole.ADMIN]: [
    PermissionScope.DASHBOARD_VIEW,
    PermissionScope.MEMBER_MANAGE,
    PermissionScope.CARE_MANAGE,
    PermissionScope.CONTRACT_MANAGE,
    PermissionScope.INQUIRY_MANAGE,
  ],
  [UserRole.STAFF]: [
    PermissionScope.DASHBOARD_VIEW,
    PermissionScope.MEMBER_MANAGE,
    PermissionScope.CARE_MANAGE,
  ],
  [UserRole.MEMBER]: [],
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export enum CareStatus {
  REQUESTED = 'REQUESTED', // 차감 완료, 서명 요청됨
  SIGNED = 'SIGNED',       // 서명 완료
  EXPIRED = 'EXPIRED',     // 서명 미진행 (차감은 유지)
  CANCELLED = 'CANCELLED', // 결제 취소 및 환불됨
}

export interface CareRecord {
  id: string;
  memberId: string;
  therapistId: string;
  therapistName: string;
  date: string;
  yearMonth: string;
  content: string;
  originalPrice: number;
  discountRate: number;
  discountedPrice: number;
  feedback: string;
  recommendation: string;
  status: CareStatus;
  signature?: string;
  signedAt?: string;
  resendCount: number;      // 서명 재요청 횟수
  requestedAt: string;     // 최초/최근 요청 시각
  createdAt: string;
}

export enum MemberTier {
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  ROYAL = 'ROYAL',
}

export interface Member {
  id: string; 
  password?: string;
  name: string;
  phone: string;
  email: string;
  gender: '남성' | '여성';
  role: UserRole;
  tier: MemberTier;
  deposit: number;   
  used: number;      
  remaining: number; 
  coreGoal: string;
  aiRecommended: string;
  joinedAt: string;
  expiryDate?: string; 
  adminNote?: string;
}

export interface Reservation {
  id: string;
  memberId: string;
  memberName: string;
  therapistId: string;
  therapistName: string;
  dateTime: string;
  serviceType: string;
  price?: number;
  status: 'booked' | 'cancelled' | 'attended';
}

export interface Contract {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  memberJoinedAt: string; // Added missing field
  type: 'MEMBERSHIP' | 'WAIVER' | 'PT_AGREEMENT';
  typeName: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING';
  signature?: string;
  yearMonth: string;
  createdAt: string;
}

// Added missing ContractTemplate interface
export interface ContractTemplate {
  id: string;
  title: string;
  type: string;
  pdfName: string;
  contentBody: string;
  fileData?: string;
  createdAt: string;
}

// Added missing Therapist interface
export interface Therapist {
  id: string;
  name: string;
  specialty: string;
  phone: string;
}

// Added missing Product interface
export interface Product {
  id: string;
  name: string;
  price: number;
}

// Added Inquiry related types
export enum InquiryStatus {
  UNREGISTERED = 'UNREGISTERED',
  IN_PROGRESS = 'IN_PROGRESS',
  REGISTERED = 'REGISTERED',
  COMPLETED = 'COMPLETED',
}

export type InquiryPath = 'PHONE' | 'VISIT' | 'WEB' | 'SNS' | 'ETC';

export interface InquiryLog {
  id: string;
  staffName: string;
  content: string;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  memberName: string;
  phone: string;
  path: InquiryPath;
  content: string;
  status: InquiryStatus;
  needsFollowUp: boolean;
  receivedBy: string;
  assignedStaff: string;
  yearMonth: string;
  logs: InquiryLog[];
  createdAt: string;
}
