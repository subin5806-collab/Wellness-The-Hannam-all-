
import { User, UserRole, PermissionScope, ROLE_SCOPES } from '../types';

let currentUser: User | null = null;

export const authService = {
  login: async (email: string, role: UserRole, fixedId?: string): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const mockUser: User = {
      id: fixedId || (email === 'guest@example.com' ? 'guest-123' : `user-${Date.now()}`),
      name: email.split('@')[0],
      email,
      role,
    };
    
    currentUser = mockUser;
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    return mockUser;
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
