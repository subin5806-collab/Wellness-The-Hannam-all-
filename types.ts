
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  MEMBER = 'MEMBER',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Therapist {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  createdAt: string;
}

export enum PermissionScope {
  CARE_WRITE = 'care:write',
  CARE_READ = 'care:read',
  MEMBER_READ = 'member:read',
  MEMBER_WRITE = 'member:write',
  RESERVATION_MANAGE = 'reservation:manage',
  SIGNATURE_SIGN = 'signature:sign',
}

export enum CareStatus {
  WAITING_SIGNATURE = 'waiting-signature',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
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
  address?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
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
  createdAt: string;
}

export interface Reservation {
  id: string;
  memberId: string;
  memberName: string;
  therapistId: string;
  therapistName: string;
  dateTime: string;
  serviceType: string;
  status: 'booked' | 'cancelled' | 'attended';
}

export interface ContractTemplate {
  id: string;
  title: string;
  type: 'MEMBERSHIP' | 'WAIVER' | 'PT_AGREEMENT';
  pdfName: string;
  fileData?: string; // 실제 PDF/이미지 파일 바이너리(Base64)
  contentBody: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  templateId?: string;
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
  pdfName?: string;
  pdfUrl?: string; 
  yearMonth: string;
  createdAt: string;
}

export type InquiryStatus = 'UNREGISTERED' | 'IN_PROGRESS' | 'REGISTERED' | 'COMPLETED';
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
  logs: InquiryLog[]; 
  status: InquiryStatus;
  needsFollowUp: boolean; 
  receivedBy: string; 
  assignedStaff: string; 
  createdAt: string; 
  yearMonth: string; 
  updatedAt: string;
}

export const ROLE_SCOPES: Record<UserRole, PermissionScope[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(PermissionScope) as PermissionScope[],
  [UserRole.ADMIN]: Object.values(PermissionScope) as PermissionScope[],
  [UserRole.STAFF]: [PermissionScope.CARE_WRITE, PermissionScope.CARE_READ, PermissionScope.MEMBER_READ, PermissionScope.RESERVATION_MANAGE],
  [UserRole.MEMBER]: [PermissionScope.CARE_READ, PermissionScope.SIGNATURE_SIGN],
};
