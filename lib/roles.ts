import { Role } from './types';

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OPERATION: 'OPERATION',
  STORE_KEEPER: 'STORE_KEEPER',
} as const;

export const can = {
  // User management
  manageUsers: (role: Role) => role === 'SUPER_ADMIN',
  
  // Inventory management
  addItem: (role: Role) => role === 'SUPER_ADMIN' || role === 'STORE_KEEPER',
  editItem: (role: Role) => true, // All roles can edit items (but with different permissions)
  deleteItem: (role: Role) => role === 'SUPER_ADMIN',
  
  // Movement management
  createDispatch: (role: Role) => role === 'SUPER_ADMIN' || role === 'OPERATION',
  authorizeDispatch: (role: Role) => role !== 'STORE_KEEPER',
  confirmReturn: (role: Role) => true,
  
  // Reports and settings
  viewReports: (role: Role) => true,
  manageSettings: (role: Role) => role === 'SUPER_ADMIN',
  
  // HR Management
  viewEmployees: (role: Role) => true,
  addEmployee: (role: Role) => role === 'SUPER_ADMIN' || role === 'OPERATION',
  editEmployee: (role: Role) => role === 'SUPER_ADMIN' || role === 'OPERATION',
  deleteEmployee: (role: Role) => role === 'SUPER_ADMIN',
  
  // Finance Management
  viewFinance: (role: Role) => role === 'SUPER_ADMIN' || role === 'OPERATION',
  createInvoice: (role: Role) => role === 'SUPER_ADMIN' || role === 'OPERATION',
  editInvoice: (role: Role) => role === 'SUPER_ADMIN' || role === 'OPERATION',
  deleteInvoice: (role: Role) => role === 'SUPER_ADMIN',
  addTransaction: (role: Role) => role === 'SUPER_ADMIN' || role === 'OPERATION',
  editTransaction: (role: Role) => role === 'SUPER_ADMIN' || role === 'OPERATION',
  deleteTransaction: (role: Role) => role === 'SUPER_ADMIN',
  
  // Booking Management
  viewBookings: (role: Role) => true,
  createBooking: (role: Role) => role === 'SUPER_ADMIN' || role === 'OPERATION',
  editBooking: (role: Role) => role === 'SUPER_ADMIN' || role === 'OPERATION',
  deleteBooking: (role: Role) => role === 'SUPER_ADMIN',
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
