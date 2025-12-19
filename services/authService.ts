
import { User, UserRole, PermissionScope, ROLE_SCOPES, Member } from '../types';

let currentUser: User | null = null;

export const authService = {
  adminLogin: async (email: string, role: UserRole): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const mockUser: User = {
      id: `admin-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role,
    };
    currentUser = mockUser;
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    return mockUser;
  },

  memberLogin: async (memberId: string, password: string): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // 핸드폰 번호에서 숫지만 추출하여 ID 비교
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
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  },

  logout: () => {
    currentUser = null;
    localStorage.removeItem('currentUser');
  },

  getCurrentUser: (): User | null => {
    if (!currentUser) {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        currentUser = JSON.parse(stored);
      }
    }
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
