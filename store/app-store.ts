'use client';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { addDays, formatISO } from 'date-fns';
import { Role, StoreId, User, Item, DispatchLine, Movement, ReturnRecord } from '@/lib/types';

interface AppState {
  currentUser: User | null;
  users: User[];
  items: Item[];
  movements: Movement[];
  returns: ReturnRecord[];
  
  // Theme state
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // Auth methods
  login: (u: Pick<User, 'name' | 'email' | 'role'>) => void;
  logout: () => void;
  
  // User management
  addUser: (u: Omit<User, 'id'>) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  // Item management
  addItem: (i: Omit<Item, 'id' | 'inStock'> & { inStock?: number }) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  
  // Movement management
  createDispatch: (m: Omit<Movement, 'id' | 'createdAt' | 'status'>) => { id: string };
  registerReturn: (movementId: string, r: Omit<ReturnRecord, 'id' | 'returnedAt'>) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useApp = create<AppState>()(
  devtools((set, get) => ({
    currentUser: null,
    isDarkMode: false,
    
    // Seed data
    users: [
      { id: 'u1', name: 'Asha M.', email: 'asha@wagesa.co', role: 'SUPER_ADMIN', isActive: true },
      { id: 'u2', name: 'Jonas K.', email: 'jonas@wagesa.co', role: 'OPERATION', isActive: true },
      { id: 'u3', name: 'Neema D.', email: 'neema@wagesa.co', role: 'STORE_KEEPER', isActive: true },
    ],
    
    items: [
      { id: 'i1', name: 'Plastic Chairs', brand: 'Generic', type: 'Seating', quantity: 500, inStock: 500, store: 'BOBA', dateOfEntry: formatISO(new Date()) },
      { id: 'i2', name: 'Banquet Tables', brand: 'Classic', type: 'Tables', quantity: 50, inStock: 50, store: 'MIKOCHENI', dateOfEntry: formatISO(new Date()) },
      { id: 'i3', name: '15" Speakers', brand: 'Yamaha', type: 'Audio', quantity: 12, inStock: 12, store: 'BOBA', dateOfEntry: formatISO(new Date()) },
      { id: 'i4', name: 'LED Par Lights', brand: 'Chauvet', type: 'Lighting', quantity: 30, inStock: 30, store: 'MIKOCHENI', dateOfEntry: formatISO(new Date()) },
      { id: 'i5', name: 'Generators 5kVA', brand: 'Honda', type: 'Power', quantity: 4, inStock: 4, store: 'BOBA', dateOfEntry: formatISO(new Date()) },
    ],
    
    movements: [],
    returns: [],

    // Theme methods
    toggleDarkMode: () => set(state => ({ isDarkMode: !state.isDarkMode })),

    // Auth methods
    login: ({ name, email, role }) => set({ 
      currentUser: { id: uid(), name, email, role, isActive: true } 
    }),
    
    logout: () => set({ currentUser: null }),

    // User management
    addUser: (u) => set(state => ({ 
      users: [...state.users, { ...u, id: uid() }] 
    })),
    
    updateUser: (id, patch) => set(state => ({ 
      users: state.users.map(u => u.id === id ? { ...u, ...patch } : u) 
    })),
    
    deleteUser: (id) => set(state => ({ 
      users: state.users.filter(u => u.id !== id) 
    })),

    // Item management
    addItem: (i) => set(state => ({
      items: [...state.items, { 
        ...i, 
        id: uid(), 
        inStock: i.inStock ?? i.quantity 
      }]
    })),
    
    updateItem: (id, patch) => set(state => ({ 
      items: state.items.map(it => it.id === id ? { ...it, ...patch } : it) 
    })),
    
    deleteItem: (id) => set(state => ({ 
      items: state.items.filter(it => it.id !== id) 
    })),

    // Movement management
    createDispatch: (m) => {
      const id = uid();
      const createdAt = formatISO(new Date());
      
      // Adjust stock levels
      const afterItems = get().items.map(it => {
        const line = m.lines.find(l => l.itemId === it.id);
        if (!line) return it;
        if (line.quantity > it.inStock) {
          throw new Error(`Not enough stock for ${it.name}. Available: ${it.inStock}, Requested: ${line.quantity}`);
        }
        return { ...it, inStock: it.inStock - line.quantity };
      });
      
      set(state => ({ 
        items: afterItems, 
        movements: [...state.movements, { ...m, id, createdAt, status: 'OUT' }] 
      }));
      
      return { id };
    },

    registerReturn: (movementId, r) => {
      const id = uid();
      const returnedAt = formatISO(new Date());
      
      // Increase stock levels
      const afterItems = get().items.map(it => {
        const line = r.lines.find(l => l.itemId === it.id);
        if (!line) return it;
        return { ...it, inStock: it.inStock + line.quantity };
      });
      
      // Update movement status
      const movement = get().movements.find(m => m.id === movementId);
      if (!movement) return;
      
      const totalOut = movement.lines.reduce((a, b) => a + b.quantity, 0);
      const totalReturned = r.lines.reduce((a, b) => a + b.quantity, 0);
      const status = (totalReturned >= totalOut) ? 'RETURNED' : 'PARTIAL_RETURN';

      set(state => ({
        items: afterItems,
        returns: [...state.returns, { ...r, id, movementId, returnedAt }],
        movements: state.movements.map(m => 
          m.id === movementId ? { ...m, status } : m
        )
      }));
    },
  }))
);
