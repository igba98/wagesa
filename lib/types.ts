export type Role = 'SUPER_ADMIN' | 'OPERATION' | 'STORE_KEEPER';
export type StoreId = 'BOBA' | 'MIKOCHENI';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface Item {
  id: string;
  name: string;        // e.g., "Plastic Chairs"
  brand?: string;      // e.g., "Chiavari"
  type?: string;       // e.g., "Audio", "Lighting"
  quantity: number;    // total owned
  inStock: number;     // currently in store (quantity - out)
  store: StoreId;      // BOBA | MIKOCHENI
  dateOfEntry: string; // ISO date
}

export interface DispatchLine {
  itemId: string;
  quantity: number;
}

export interface Movement { // Rental/Dispatch
  id: string;
  createdAt: string;        // ISO
  store: StoreId;           // where taken from
  lines: DispatchLine[];    // items and qty moved out
  authorizedByUserId: string; // who approved
  issuedByUserId: string;     // who handed out
  customerName: string;
  responsiblePerson: string; // on-site contact
  useLocation: string;       // event location
  expectedReturnAt: string;  // ISO
  status: 'OUT' | 'PARTIAL_RETURN' | 'RETURNED';
}

export interface ReturnRecord {
  id: string;
  movementId: string;
  returnedAt: string;        // ISO
  lines: DispatchLine[];     // items returned
  receivedByUserId: string;  // who received back
}

export type ReportPeriod = 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';

export interface DashboardStats {
  totalItems: number;
  itemsInStock: number;
  itemsOut: number;
  activeRentals: number;
  overdueReturns: number;
}
