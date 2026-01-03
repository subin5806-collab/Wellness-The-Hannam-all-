
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  MEMBER = 'MEMBER',
}

export enum PermissionScope {
  DASHBOARD_VIEW = 'DASHBOARD_VIEW',
  MEMBER_MANAGE = 'MEMBER_MANAGE',
  CARE_MANAGE = 'CARE_MANAGE',
  CONTRACT_MANAGE = 'CONTRACT_MANAGE',
  INQUIRY_MANAGE = 'INQUIRY_MANAGE',
  NOTICE_MANAGE = 'NOTICE_MANAGE',
}

export const ROLE_SCOPES: Record<UserRole, PermissionScope[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(PermissionScope),
  [UserRole.ADMIN]: [
    PermissionScope.DASHBOARD_VIEW,
    PermissionScope.MEMBER_MANAGE,
    PermissionScope.CARE_MANAGE,
    PermissionScope.CONTRACT_MANAGE,
    PermissionScope.INQUIRY_MANAGE,
    PermissionScope.NOTICE_MANAGE,
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
  REQUESTED = 'REQUESTED',
  SIGNED = 'SIGNED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
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
  resendCount: number;
  requestedAt: string;
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
  status: 'active' | 'deleted';
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
  memberJoinedAt: string;
  type: 'MEMBERSHIP' | 'WAIVER' | 'PT_AGREEMENT';
  typeName: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING';
  signature?: string;
  yearMonth: string;
  createdAt: string;
  pdfContent?: string;
}

export interface ContractTemplate {
  id: string;
  title: string;
  type: string;
  pdfName: string;
  contentBody: string;
  fileData?: string;
  createdAt: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
}

export interface Therapist {
  id: string;
  name: string;
  specialty: string;
  phone: string;
}

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

export interface Notice {
  id: string;
  companyName: string;
  title: string;
  content: string;
  imageUrl?: string;
  isPopup: boolean;
  isActive: boolean;
  publishedAt: string;
  createdAt: string;
}

export enum NotificationType {
  CARE_DEDUCTION = 'CARE_DEDUCTION',
  SIGN_REQUEST = 'SIGN_REQUEST',
  CONTRACT_CONFIRM = 'CONTRACT_CONFIRM',
  GENERAL = 'GENERAL'
}

export interface Notification {
  id: string;
  memberId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: string;
  sentAt: string;
}

export interface MemberNoticeStatus {
  memberId: string;
  noticeId: string;
  confirmedAt: string;
}

// --- 백업 및 보안 로그 추가 ---
export interface BackupEntry {
  id: string;
  filename: string;
  adminName: string;
  adminEmail: string;
  fileSize: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string; // 'DOWNLOAD', 'DELETE_MEMBER', 'BACKUP'
  target: string;
  adminName: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}
