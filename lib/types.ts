export type Role = 'SUPER_ADMIN' | 'OPERATION' | 'STORE_KEEPER';
export type StoreId = 'BOBA' | 'MIKOCHENI';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type EventType = 'WEDDING' | 'SENDOFF' | 'CORPORATE' | 'RENTALS' | 'OTHER';
export type TransactionType = 'INCOME' | 'EXPENSE';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

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

// ========== NEW FEATURES ==========

// 1. Human Resource
export interface Employee {
  id: string;
  fullName: string;
  dateOfBirth: string;      // ISO date
  gender: Gender;
  position: string;
  mobileContact: string;
  photoUrl?: string;        // base64 or URL
  contractStartDate: string; // ISO date
  contractEndDate: string;   // ISO date
  isActive: boolean;
  createdAt: string;        // ISO date
  updatedAt: string;        // ISO date
}

// 2. Finance
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;    // e.g., "WGS-2025-001"
  customerId?: string;      // link to customer if needed
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;          // percentage (e.g., 18 for 18%)
  taxAmount: number;
  total: number;
  currency: string;         // e.g., "TZS"
  status: InvoiceStatus;
  issueDate: string;        // ISO date
  dueDate: string;          // ISO date
  paidDate?: string;        // ISO date
  notes?: string;
  createdBy: string;        // user id
  createdAt: string;        // ISO date
  updatedAt: string;        // ISO date
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  currency: string;         // e.g., "TZS"
  date: string;             // ISO date
  category?: string;        // e.g., "Salary", "Equipment", "Client Payment"
  reference?: string;       // invoice number or receipt number
  createdBy: string;        // user id
  createdAt: string;        // ISO date
}

// 3. Booking Events
export interface BookedEvent {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  eventDate: string;        // ISO date
  eventType: EventType;
  venue: string;
  amount: number;
  currency: string;         // e.g., "TZS"
  isPaid: boolean;
  notes?: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  createdBy: string;        // user id
  createdAt: string;        // ISO date
  updatedAt: string;        // ISO date
}
