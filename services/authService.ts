
import { User, UserRole, PermissionScope, ROLE_SCOPES, Member } from '../types';

// 메모리에만 사용자 정보를 유지 (새로고침 시 초기화됨)
let currentUser: User | null = null;

export const authService = {
  adminLogin: async (email: string, password: string): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    if (email === 'help@thehannam.com' && password === 'lucete800134') {
      const mockUser: User = {
        id: 'admin-hannam',
        name: 'Hannam Admin',
        email,
        role: UserRole.SUPER_ADMIN,
      };
      currentUser = mockUser;
      // localStorage.setItem 제거: 보안을 위해 브라우저에 저장하지 않음
      return mockUser;
    } else {
      throw new Error('관리자 이메일 또는 비밀번호가 일치하지 않습니다.');
    }
  },

  memberLogin: async (memberId: string, password: string): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const cleanId = memberId.replace(/[^0-9]/g, '');
    const membersRaw = localStorage.getItem('firestore_members');
    const members: Member[] = membersRaw ? JSON.parse(membersRaw) : [];
    
    const member = members.find(m => m.id === cleanId && m.password === password);
    
    if (!member) {
      throw new Error('핸드폰 번호 또는 비밀번호가 일치하지 않습니다.');
    }

    const user: User = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: UserRole.MEMBER,
    };
    
    currentUser = user;
    // localStorage.setItem 제거: 보안을 위해 브라우저에 저장하지 않음
    return user;
  },

  logout: () => {
    currentUser = null;
    // localStorage.removeItem은 더 이상 필요 없으나 안전을 위해 기존 데이터가 있다면 삭제
    localStorage.removeItem('currentUser');
  },

  getCurrentUser: (): User | null => {
    return currentUser;
  },

  hasPermission: (scope: PermissionScope): boolean => {
    const user = authService.getCurrentUser();
    if (!user) return false;
    
    const scopes = ROLE_SCOPES[user.role];
    return scopes.includes(scope);
  },

  canAccessPortal: (portal: 'admin' | 'member' | 'contract') => {
    const user = authService.getCurrentUser();
    if (!user) return false;

    if (portal === 'admin') {
      return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF].includes(user.role);
    }
    if (portal === 'member') {
      return [UserRole.MEMBER].includes(user.role);
    }
    return true; 
  }
};
