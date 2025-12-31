
import { User, UserRole, PermissionScope, ROLE_SCOPES, Member } from '../types';

let currentUser: User | null = null;

export const authService = {
  adminLogin: async (email: string, password: string): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const adminConfigsRaw = localStorage.getItem('firestore_admin_config');
    const adminConfigs = adminConfigsRaw ? JSON.parse(adminConfigsRaw) : [];
    const customAdmin = adminConfigs.find((c: any) => c.email === email);

    const validPassword = customAdmin ? customAdmin.password : 'lucete800134';
    const validEmail = 'help@thehannam.com';

    if (email === validEmail && password === validPassword) {
      const mockUser: User = {
        id: 'admin-hannam',
        name: 'Hannam Admin',
        email,
        role: UserRole.SUPER_ADMIN,
      };
      currentUser = mockUser;
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
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
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  },

  logout: () => {
    currentUser = null;
    localStorage.removeItem('currentUser');
  },

  getCurrentUser: (): User | null => {
    return currentUser;
  },

  setCurrentUser: (user: User) => {
    currentUser = user;
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
