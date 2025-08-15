import { Role } from './types';

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OPERATION: 'OPERATION',
  STORE_KEEPER: 'STORE_KEEPER',
} as const;

export const can = {
  manageUsers: (role: Role) => role === 'SUPER_ADMIN',
  addItem: (role: Role) => role === 'SUPER_ADMIN' || role === 'STORE_KEEPER',
  editItem: (role: Role) => true, // All roles can edit items (but with different permissions)
  deleteItem: (role: Role) => role === 'SUPER_ADMIN',
  createDispatch: (role: Role) => role === 'SUPER_ADMIN' || role === 'OPERATION',
  authorizeDispatch: (role: Role) => role !== 'STORE_KEEPER',
  confirmReturn: (role: Role) => true,
  viewReports: (role: Role) => true,
  manageSettings: (role: Role) => role === 'SUPER_ADMIN',
} as const;

export const getRoleDisplayName = (role: Role): string => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'OPERATION':
      return 'Operation';
    case 'STORE_KEEPER':
      return 'Store Keeper';
    default:
      return role;
  }
};

export const getStoreDisplayName = (store: string): string => {
  switch (store) {
    case 'BOBA':
      return 'Boba';
    case 'MIKOCHENI':
      return 'Mikocheni';
    default:
      return store;
  }
};
