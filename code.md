Wegesa Event Co — Inventory & Asset Movement System (Frontend‑Only v1)

A complete plan and Cursor-ready instructions to build a hardcoded (in‑memory) inventory & movement tracker for an event rentals company. No backend or database yet — all data lives in React state (lost on refresh). The design uses Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Heroicons, with Zustand for state and Framer Motion for the splash animation. Recharts is used for simple charts on the Reports page.

⸻

1) Scope Summary
	•	Track items (name, brand/type, quantity, store location: Boba or Mikocheni, date of entry, status).
	•	Record movements/rentals from store to event location and returns back to store.
	•	Capture who authorized and who issued an item; customer & event details; expected return date/time.
	•	Show items currently out (not in store).
	•	Role-based UI (mock auth):
	•	Super Admin: everything + user management + assignments + business overview.
	•	Operation: create/approve dispatches, view inventory, generate reports.
	•	Store Keeper: manage stock counts, confirm dispatch/returns.
	•	Reports: weekly, monthly, quarterly, yearly summaries (computed from in-memory transactions) + mock “Email report” button.
	•	Nice-to-haves (frontend mock): toasts, form validation, optimistic tables, search/filter, basic charts.

Important: Since this is frontend-only, the Login page simply sets a role (no real auth). Role checks gate UI actions and route access client-side.

⸻

2) Roles & Permissions Matrix (UI‑level only)

Feature	Super Admin	Operation	Store Keeper
View Dashboard	✅	✅	✅
View Inventory	✅	✅	✅
Add/Edit/Delete Item	✅	➖ (edit qty only)	✅
Create Dispatch/Rental	✅	✅	➖ (prepare only)
Authorize Dispatch	✅	✅	❌
Confirm Issue (hand‑over)	✅	✅	✅
Register Return	✅	✅	✅
Users (create/assign/disable)	✅	❌	❌
View Reports	✅	✅	✅
System Settings	✅	❌	❌

Legend: ✅ full access · ➖ limited · ❌ no access

⸻

3) Domain Model (TypeScript types)

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


⸻

4) UX Flow
	1.	Splash → Login
	•	Minimal animated splash. CTA → Login.
	2.	Login
	•	Choose or enter email + pick role from a Select (Super Admin / Operation / Store Keeper).
	•	“Login” sets currentUser in the global store.
	3.	Dashboard (role‑aware)
	•	KPIs: Items in stock, Items out, Active rentals, Overdue returns.
	•	Quick actions (based on role): New Dispatch, Register Return, Add Item, Invite User.
	4.	Inventory
	•	Table with search/filter by store, type, brand, status.
	•	Add/Edit/Delete item (role-limited).
	5.	Movements
	•	Create Dispatch form (select items with available stock, set quantities, event location, customer, expected return).
	•	View details; status badges (OUT / PARTIAL / RETURNED).
	•	Register Return (full/partial).
	6.	Users (Super Admin only)
	•	Create users, set roles, disable/enable.
	7.	Reports
	•	Aggregated metrics by time window; simple charts with Recharts.
	•	Mock “Send report” → toast.

⸻

5) Project Setup — Commands (Cursor‑ready)

Prereqs: Node 20+, PNPM or NPM. Example uses pnpm; swap to npm/yarn if you prefer.

# 1) Create app
pnpm create next-app wagesa-inventory --ts --eslint --tailwind --src-dir --app --use-pnpm --import-alias "@/*=src/*"
cd wagesa-inventory

# 2) shadcn/ui
pnpm dlx shadcn-ui@latest init -y
# Add needed components (you can add more later)
pnpm dlx shadcn-ui@latest add button card input label select textarea
pnpm dlx shadcn-ui@latest add table badge dropdown-menu dialog sheet tabs toast tooltip avatar breadcrumb separator switch popover calendar form checkbox radio-group sonner

# 3) UI libraries
pnpm add @heroicons/react framer-motion recharts date-fns clsx zustand

# 4) Types & utils (optional)
pnpm add -D @types/node @types/react @types/react-dom

Tailwind is already configured by the Next.js setup above. Ensure src/app/globals.css includes @tailwind base; @tailwind components; @tailwind utilities;.

⸻

6) Directory Layout

src/
  app/
    (public)/
      page.tsx                 # Splash
      login/page.tsx           # Mock login
    (protected)/
      layout.tsx               # Sidebar + topbar layout
      dashboard/page.tsx
      inventory/page.tsx
      movements/
        page.tsx               # list
        new/page.tsx           # create dispatch
        [id]/page.tsx          # movement details + return form
      users/page.tsx           # super admin only
      reports/page.tsx
      settings/page.tsx
  components/
    ui/                        # shadcn components (auto)
    layout/Sidebar.tsx
    layout/Topbar.tsx
    charts/SimpleBar.tsx
    tables/InventoryTable.tsx
    forms/ItemForm.tsx
    forms/DispatchForm.tsx
    forms/ReturnForm.tsx
    users/UserForm.tsx
  lib/
    roles.ts
    routing.ts
    format.ts
  store/
    app-store.ts               # zustand (users, items, movements, returns)


⸻

7) Role Helpers (src/lib/roles.ts)

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OPERATION: 'OPERATION',
  STORE_KEEPER: 'STORE_KEEPER',
} as const;
export type Role = keyof typeof ROLES;

export const can = {
  manageUsers: (role: Role) => role === 'SUPER_ADMIN',
  addItem: (role: Role) => role === 'SUPER_ADMIN' || role === 'STORE_KEEPER',
  editItem: (role: Role) => role !== 'STORE_KEEPER' ? true : true, // keeper can edit qty
  deleteItem: (role: Role) => role === 'SUPER_ADMIN',
  createDispatch: (role: Role) => role === 'SUPER_ADMIN' || role === 'OPERATION',
  authorizeDispatch: (role: Role) => role !== 'STORE_KEEPER',
  confirmReturn: (role: Role) => true,
  viewReports: (_role: Role) => true,
} as const;


⸻

8) Global State (Zustand) — src/store/app-store.ts

This is the heart of the frontend-only app. It contains seed data and all mutations. No persistence (state resets on refresh).

'use client';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { addDays, formatISO } from 'date-fns';

export type Role = 'SUPER_ADMIN'|'OPERATION'|'STORE_KEEPER';
export type StoreId = 'BOBA'|'MIKOCHENI';

export interface User { id: string; name: string; email: string; role: Role; isActive: boolean; }
export interface Item { id: string; name: string; brand?: string; type?: string; quantity: number; inStock: number; store: StoreId; dateOfEntry: string; }
export interface DispatchLine { itemId: string; quantity: number; }
export interface Movement { id: string; createdAt: string; store: StoreId; lines: DispatchLine[]; authorizedByUserId: string; issuedByUserId: string; customerName: string; responsiblePerson: string; useLocation: string; expectedReturnAt: string; status: 'OUT'|'PARTIAL_RETURN'|'RETURNED'; }
export interface ReturnRecord { id: string; movementId: string; returnedAt: string; lines: DispatchLine[]; receivedByUserId: string; }

interface AppState {
  currentUser: User | null;
  users: User[];
  items: Item[];
  movements: Movement[];
  returns: ReturnRecord[];
  // auth
  login: (u: Pick<User,'name'|'email'|'role'>) => void;
  logout: () => void;
  // users
  addUser: (u: Omit<User,'id'>) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  // items
  addItem: (i: Omit<Item,'id'|'inStock'> & {inStock?: number}) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  // movements
  createDispatch: (m: Omit<Movement,'id'|'createdAt'|'status'>) => {id: string};
  registerReturn: (movementId: string, r: Omit<ReturnRecord,'id'|'returnedAt'>) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useApp = create<AppState>()(devtools((set, get) => ({
  currentUser: null,
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

  login: ({ name, email, role }) => set({ currentUser: { id: uid(), name, email, role, isActive: true } }),
  logout: () => set({ currentUser: null }),

  addUser: (u) => set(state => ({ users: [...state.users, { ...u, id: uid() }] })),
  updateUser: (id, patch) => set(state => ({ users: state.users.map(u => u.id===id? { ...u, ...patch }: u) })),

  addItem: (i) => set(state => ({
    items: [...state.items, { ...i, id: uid(), inStock: i.inStock ?? i.quantity }]
  })),
  updateItem: (id, patch) => set(state => ({ items: state.items.map(it => it.id===id? { ...it, ...patch }: it) })),
  deleteItem: (id) => set(state => ({ items: state.items.filter(it => it.id!==id) })),

  createDispatch: (m) => {
    const id = uid();
    const createdAt = formatISO(new Date());
    // Adjust stock
    const afterItems = get().items.map(it => {
      const line = m.lines.find(l => l.itemId === it.id);
      if (!line) return it;
      if (line.quantity > it.inStock) throw new Error(`Not enough stock for ${it.name}`);
      return { ...it, inStock: it.inStock - line.quantity };
    });
    set(state => ({ items: afterItems, movements: [...state.movements, { ...m, id, createdAt, status: 'OUT' }] }));
    return { id };
  },

  registerReturn: (movementId, r) => {
    const id = uid();
    const returnedAt = formatISO(new Date());
    // Increase stock
    const afterItems = get().items.map(it => {
      const line = r.lines.find(l => l.itemId === it.id);
      if (!line) return it;
      return { ...it, inStock: it.inStock + line.quantity };
    });
    // Update movement status
    const movement = get().movements.find(m => m.id === movementId);
    if (!movement) return;
    const totalOut = movement.lines.reduce((a,b)=>a+b.quantity,0);
    const totalReturned = r.lines.reduce((a,b)=>a+b.quantity,0);
    const status = (totalReturned >= totalOut) ? 'RETURNED' : 'PARTIAL_RETURN';

    set(state => ({
      items: afterItems,
      returns: [...state.returns, { ...r, id, movementId, returnedAt }],
      movements: state.movements.map(m => m.id===movementId ? { ...m, status } : m)
    }));
  },
}))); 


⸻

9) Routing Guards (Client‑side)

Create a simple wrapper to protect routes in (protected).

// src/app/(protected)/layout.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useApp } from '@/store/app-store';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  const router = useRouter();

  useEffect(() => { if (!currentUser) router.replace('/login'); }, [currentUser, router]);
  if (!currentUser) return null;

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <Topbar />
        <main className="p-6 bg-muted/30 flex-1">{children}</main>
      </div>
    </div>
  );
}


⸻

10) Splash & Login

Splash (animated)

// src/app/(public)/page.tsx
'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Splash() {
  const router = useRouter();
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <motion.h1 initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="text-4xl font-bold tracking-tight">Wegesa Event Co</motion.h1>
      <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}} className="mt-2 text-muted-foreground">Inventory & Movement Tracker</motion.p>
      <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>router.push('/login')} className="mt-8 rounded-2xl bg-black text-white px-6 py-3">Enter</motion.button>
    </div>
  );
}

Login (mock auth)

// src/app/(public)/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, Role } from '@/store/app-store';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function LoginPage(){
  const [name,setName] = useState('');
  const [email,setEmail] = useState('');
  const [role,setRole] = useState<Role>('OPERATION');
  const login = useApp(s=>s.login);
  const router = useRouter();

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-2xl font-semibold">Sign in</h2>
        <div className="mt-4 space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g., Asha M."/>
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@wagesa.co"/>
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v)=>setRole(v as Role)}>
              <SelectTrigger><SelectValue placeholder="Select role"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="OPERATION">Operation</SelectItem>
                <SelectItem value="STORE_KEEPER">Store Keeper</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full mt-2" onClick={()=>{ login({name,email,role}); router.replace('/dashboard'); }}>Login</Button>
        </div>
      </Card>
    </div>
  );
}


⸻

11) Sidebar & Topbar

// src/components/layout/Sidebar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, Squares2X2Icon, ArrowRightOnRectangleIcon, UserGroupIcon, ArrowPathIcon, ClipboardDocumentListIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useApp } from '@/store/app-store';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/inventory', label: 'Inventory', icon: Squares2X2Icon },
  { href: '/movements', label: 'Movements', icon: ArrowPathIcon },
  { href: '/reports', label: 'Reports', icon: ChartBarIcon },
  { href: '/users', label: 'Users', icon: UserGroupIcon, role: 'SUPER_ADMIN' },
  { href: '/settings', label: 'Settings', icon: Cog6ToothIcon, role: 'SUPER_ADMIN' },
];

export default function Sidebar(){
  const path = usePathname();
  const role = useApp(s=>s.currentUser?.role);
  const logout = useApp(s=>s.logout);
  return (
    <aside className="h-screen border-r bg-white p-4">
      <div className="text-lg font-semibold">Wegesa</div>
      <nav className="mt-6 space-y-1">
        {nav.filter(n=>!n.role || n.role===role).map(({href,label,icon:Icon})=>{
          const active = path.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${active? 'bg-muted text-foreground':'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}>
              <Icon className="w-5 h-5"/>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <button onClick={logout} className="mt-6 flex items-center gap-2 text-sm text-red-600">
        <ArrowRightOnRectangleIcon className="w-5 h-5"/> Logout
      </button>
    </aside>
  );
}

// src/components/layout/Topbar.tsx
'use client';
import { useApp } from '@/store/app-store';

export default function Topbar(){
  const user = useApp(s=>s.currentUser);
  return (
    <header className="h-14 border-b bg-white px-4 flex items-center justify-between">
      <div className="font-medium">Inventory & Movement</div>
      <div className="text-sm text-muted-foreground">{user?.name} · {user?.role?.replace('_',' ')}</div>
    </header>
  );
}


⸻

12) Dashboard KPIs — src/app/(protected)/dashboard/page.tsx

'use client';
import { Card } from '@/components/ui/card';
import { useApp } from '@/store/app-store';

export default function Dashboard(){
  const { items, movements } = useApp();
  const totalItems = items.reduce((a,b)=>a+b.quantity,0);
  const inStock = items.reduce((a,b)=>a+b.inStock,0);
  const out = totalItems - inStock;
  const activeRentals = movements.filter(m=>m.status!=='RETURNED').length;

  const kpi = [
    { label: 'Total Units', value: totalItems },
    { label: 'In Stock', value: inStock },
    { label: 'Out', value: out },
    { label: 'Active Rentals', value: activeRentals },
  ];

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {kpi.map((k)=> (
        <Card key={k.label} className="p-4">
          <div className="text-muted-foreground text-sm">{k.label}</div>
          <div className="text-2xl font-semibold mt-1">{k.value}</div>
        </Card>
      ))}
    </div>
  );
}


⸻

13) Inventory Page (list + add/edit/delete)

Table + Add button

// src/app/(protected)/inventory/page.tsx
'use client';
import { useApp } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ItemForm from '@/components/forms/ItemForm';
import { useState } from 'react';

export default function InventoryPage(){
  const { items, deleteItem, currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Inventory</h2>
        {(currentUser?.role==='SUPER_ADMIN' || currentUser?.role==='STORE_KEEPER') && (
          <Button onClick={()=>{ setEditId(null); setOpen(true); }}>Add Item</Button>
        )}
      </div>

      <Card className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-muted/40">
              <th className="p-3">Name</th>
              <th className="p-3">Brand</th>
              <th className="p-3">Type</th>
              <th className="p-3">Store</th>
              <th className="p-3">Qty</th>
              <th className="p-3">In Stock</th>
              <th className="p-3">Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it=> (
              <tr key={it.id} className="border-b hover:bg-muted/20">
                <td className="p-3">{it.name}</td>
                <td className="p-3">{it.brand}</td>
                <td className="p-3">{it.type}</td>
                <td className="p-3">{it.store}</td>
                <td className="p-3">{it.quantity}</td>
                <td className="p-3">{it.inStock}</td>
                <td className="p-3">{new Date(it.dateOfEntry).toLocaleDateString()}</td>
                <td className="p-3 space-x-2">
                  <Button variant="secondary" size="sm" onClick={()=>{ setEditId(it.id); setOpen(true); }}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={()=>deleteItem(it.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ItemForm open={open} onOpenChange={setOpen} editId={editId}/>
    </div>
  );
}

Item Form (Dialog)

// src/components/forms/ItemForm.tsx
'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useApp, Item } from '@/store/app-store';
import { useEffect, useState } from 'react';

export default function ItemForm({ open, onOpenChange, editId }: { open: boolean; onOpenChange: (b:boolean)=>void; editId: string|null; }){
  const { addItem, updateItem, items } = useApp();
  const editing = items.find(i=>i.id===editId);

  const [form, setForm] = useState<Omit<Item,'id'|'inStock'>>({
    name: '', brand: '', type: '', quantity: 0, store: 'BOBA', dateOfEntry: new Date().toISOString()
  });

  useEffect(()=>{
    if (editing) {
      setForm({ name: editing.name, brand: editing.brand || '', type: editing.type || '', quantity: editing.quantity, store: editing.store, dateOfEntry: editing.dateOfEntry });
    } else {
      setForm({ name: '', brand: '', type: '', quantity: 0, store: 'BOBA', dateOfEntry: new Date().toISOString() });
    }
  }, [editing]);

  const submit = () => {
    if (editing) {
      updateItem(editing.id, { ...editing, ...form });
    } else {
      addItem(form as any);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing? 'Edit Item' : 'Add Item'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          </div>
          <div>
            <Label>Brand</Label>
            <Input value={form.brand} onChange={e=>setForm(f=>({...f,brand:e.target.value}))}/>
          </div>
          <div>
            <Label>Type</Label>
            <Input value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}/>
          </div>
          <div>
            <Label>Store</Label>
            <select className="w-full h-10 border rounded-md px-3" value={form.store} onChange={e=>setForm(f=>({...f,store:e.target.value as any}))}>
              <option value="BOBA">Boba</option>
              <option value="MIKOCHENI">Mikocheni</option>
            </select>
          </div>
          <div>
            <Label>Quantity</Label>
            <Input type="number" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:Number(e.target.value||0)}))}/>
          </div>
          <div>
            <Label>Date of Entry</Label>
            <Input type="date" value={form.dateOfEntry.slice(0,10)} onChange={e=>setForm(f=>({...f,dateOfEntry:new Date(e.target.value).toISOString()}))}/>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={()=>onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>{editing? 'Save Changes':'Add Item'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


⸻

14) Movements (Create Dispatch + List)

List & CTA

// src/app/(protected)/movements/page.tsx
'use client';
import Link from 'next/link';
import { useApp } from '@/store/app-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MovementsList(){
  const { movements } = useApp();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Movements</h2>
        <Button asChild><Link href="/movements/new">New Dispatch</Link></Button>
      </div>
      <Card className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-muted/40">
              <th className="p-3">ID</th>
              <th className="p-3">Store</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Use Location</th>
              <th className="p-3">Expected Return</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {movements.map(m=> (
              <tr key={m.id} className="border-b hover:bg-muted/20">
                <td className="p-3"><Link href={`/movements/${m.id}`} className="underline">{m.id}</Link></td>
                <td className="p-3">{m.store}</td>
                <td className="p-3">{m.customerName}</td>
                <td className="p-3">{m.useLocation}</td>
                <td className="p-3">{new Date(m.expectedReturnAt).toLocaleString()}</td>
                <td className="p-3">{m.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

Create Dispatch Form

// src/app/(protected)/movements/new/page.tsx
'use client';
import DispatchForm from '@/components/forms/DispatchForm';
export default function NewDispatch(){
  return <DispatchForm/>;
}

// src/components/forms/DispatchForm.tsx
'use client';
import { useApp } from '@/store/app-store';
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DispatchForm(){
  const { items, users, createDispatch, currentUser } = useApp();
  const [store, setStore] = useState<'BOBA'|'MIKOCHENI'>('BOBA');
  const [customerName, setCustomerName] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [useLocation, setUseLocation] = useState('');
  const [expectedReturnAt, setExpectedReturnAt] = useState<string>(new Date().toISOString());
  const [lines, setLines] = useState<{ itemId: string; quantity: number }[]>([]);
  const [authorizedByUserId, setAuthorizedByUserId] = useState('');

  const storeItems = useMemo(()=>items.filter(i=>i.store===store && i.inStock>0),[items,store]);

  const addLine = (itemId: string) => {
    if (lines.find(l=>l.itemId===itemId)) return;
    setLines([...lines, { itemId, quantity: 1 }]);
  };

  const setQty = (itemId: string, qty: number) => {
    setLines(ls=>ls.map(l=>l.itemId===itemId? { ...l, quantity: qty }: l));
  };

  const removeLine = (itemId: string) => setLines(ls=>ls.filter(l=>l.itemId!==itemId));

  const submit = () => {
    if (!currentUser) return;
    const issuedByUserId = currentUser.id;
    const { id } = createDispatch({ store, lines, authorizedByUserId, issuedByUserId, customerName, responsiblePerson, useLocation, expectedReturnAt });
    window.location.href = `/movements/${id}`;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">New Dispatch</h2>
      <Card className="p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Store</Label>
            <select className="w-full h-10 border rounded-md px-3" value={store} onChange={e=>setStore(e.target.value as any)}>
              <option value="BOBA">Boba</option>
              <option value="MIKOCHENI">Mikocheni</option>
            </select>
          </div>
          <div>
            <Label>Authorized By</Label>
            <select className="w-full h-10 border rounded-md px-3" value={authorizedByUserId} onChange={e=>setAuthorizedByUserId(e.target.value)}>
              <option value="">Select user</option>
              {users.map(u=> <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <div>
            <Label>Customer</Label>
            <Input value={customerName} onChange={e=>setCustomerName(e.target.value)} placeholder="e.g., Alpha Events"/>
          </div>
          <div>
            <Label>Responsible Person</Label>
            <Input value={responsiblePerson} onChange={e=>setResponsiblePerson(e.target.value)} placeholder="On-site contact"/>
          </div>
          <div className="md:col-span-2">
            <Label>Use Location</Label>
            <Input value={useLocation} onChange={e=>setUseLocation(e.target.value)} placeholder="Venue / address"/>
          </div>
          <div className="md:col-span-2">
            <Label>Expected Return</Label>
            <Input type="datetime-local" value={expectedReturnAt.slice(0,16)} onChange={e=>setExpectedReturnAt(new Date(e.target.value).toISOString())}/>
          </div>
        </div>

        <div>
          <Label className="block mb-2">Pick Items</Label>
          <div className="grid md:grid-cols-3 gap-3">
            {storeItems.map(it => (
              <button key={it.id} onClick={()=>addLine(it.id)} className="rounded-lg border p-3 text-left hover:bg-muted/40">
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-muted-foreground">{it.brand} · In stock: {it.inStock}</div>
              </button>
            ))}
          </div>
        </div>

        {lines.length>0 && (
          <div>
            <Label className="block mb-2">Dispatch Lines</Label>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-muted/40"><th className="p-2">Item</th><th className="p-2">Qty</th><th className="p-2">In Stock</th><th className="p-2"></th></tr>
              </thead>
              <tbody>
                {lines.map(l => {
                  const it = items.find(i=>i.id===l.itemId)!;
                  return (
                    <tr key={l.itemId} className="border-b">
                      <td className="p-2">{it.name}</td>
                      <td className="p-2 w-40">
                        <Input type="number" min={1} max={it.inStock} value={l.quantity} onChange={e=>setQty(l.itemId, Number(e.target.value||1))}/>
                      </td>
                      <td className="p-2">{it.inStock}</td>
                      <td className="p-2 text-right"><Button variant="destructive" size="sm" onClick={()=>removeLine(l.itemId)}>Remove</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={()=>history.back()}>Cancel</Button>
          <Button onClick={submit} disabled={!authorizedByUserId || !customerName || lines.length===0}>Create Dispatch</Button>
        </div>
      </Card>
    </div>
  );
}

Movement Details + Register Return

// src/app/(protected)/movements/[id]/page.tsx
'use client';
import { useParams } from 'next/navigation';
import { useApp } from '@/store/app-store';
import ReturnForm from '@/components/forms/ReturnForm';

export default function MovementDetails(){
  const { id } = useParams<{id:string}>();
  const { movements, items, users } = useApp();
  const m = movements.find(x=>x.id===id);
  if (!m) return <div>Not found</div>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Movement #{m.id}</h2>
        <span className="text-sm px-2 py-1 rounded bg-muted">{m.status}</span>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <div><b>Store:</b> {m.store}</div>
          <div><b>Customer:</b> {m.customerName}</div>
          <div><b>Use Location:</b> {m.useLocation}</div>
          <div><b>Expected Return:</b> {new Date(m.expectedReturnAt).toLocaleString()}</div>
        </div>
        <div className="space-y-1">
          <div><b>Authorized By:</b> {users.find(u=>u.id===m.authorizedByUserId)?.name}</div>
          <div><b>Issued By:</b> {users.find(u=>u.id===m.issuedByUserId)?.name}</div>
          <div><b>Created:</b> {new Date(m.createdAt).toLocaleString()}</div>
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-2">Lines</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/40"><th className="p-2 text-left">Item</th><th className="p-2 text-left">Qty</th></tr></thead>
          <tbody>
            {m.lines.map(l=>{
              const it = items.find(i=>i.id===l.itemId)!;
              return <tr key={l.itemId} className="border-b"><td className="p-2">{it.name}</td><td className="p-2">{l.quantity}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <ReturnForm movementId={m.id} lines={m.lines}/>
    </div>
  );
}

// src/components/forms/ReturnForm.tsx
'use client';
import { useState } from 'react';
import { useApp, DispatchLine } from '@/store/app-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ReturnForm({ movementId, lines }: { movementId: string; lines: DispatchLine[]; }){
  const { users, currentUser, registerReturn } = useApp();
  const [receivedByUserId, setReceivedByUserId] = useState(currentUser?.id ?? '');
  const [ret, setRet] = useState(lines.map(l=>({ itemId: l.itemId, quantity: l.quantity })));

  const submit = () => {
    registerReturn(movementId, { receivedByUserId, lines: ret });
    alert('Return registered. Stock updated.');
    location.reload();
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-medium">Register Return</h3>
      <div>
        <label className="text-sm">Received By</label>
        <select className="w-full h-10 border rounded-md px-3" value={receivedByUserId} onChange={e=>setReceivedByUserId(e.target.value)}>
          {users.map(u=> <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
        </select>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="border-b bg-muted/40"><th className="p-2 text-left">Item</th><th className="p-2 text-left">Qty Returned</th></tr></thead>
        <tbody>
          {ret.map(r=> (
            <tr key={r.itemId} className="border-b">
              <td className="p-2">{r.itemId}</td>
              <td className="p-2 w-40"><Input type="number" min={0} value={r.quantity} onChange={e=>setRet(list=>list.map(x=>x.itemId===r.itemId? {...x, quantity: Number(e.target.value||0)}:x))}/></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end"><Button onClick={submit}>Submit Return</Button></div>
    </Card>
  );
}


⸻

15) Users (Super Admin only)

// src/app/(protected)/users/page.tsx
'use client';
import { useApp } from '@/store/app-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function UsersPage(){
  const { users, addUser, updateUser, currentUser } = useApp();
  if (currentUser?.role!=='SUPER_ADMIN') return <div>Unauthorized</div>;

  const [name,setName] = useState('');
  const [email,setEmail] = useState('');
  const [role,setRole] = useState<'SUPER_ADMIN'|'OPERATION'|'STORE_KEEPER'>('OPERATION');

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Users</h2>
      <Card className="p-4">
        <div className="grid md:grid-cols-4 gap-2">
          <Input placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/>
          <Input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
          <select className="h-10 border rounded-md px-3" value={role} onChange={e=>setRole(e.target.value as any)}>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="OPERATION">Operation</option>
            <option value="STORE_KEEPER">Store Keeper</option>
          </select>
          <Button onClick={()=>{ addUser({ name, email, role, isActive:true }); setName(''); setEmail(''); }}>Invite</Button>
        </div>
      </Card>

      <Card className="overflow-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/40"><th className="p-3 text-left">Name</th><th className="p-3 text-left">Email</th><th className="p-3 text-left">Role</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {users.map(u=> (
              <tr key={u.id} className="border-b">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3 text-center">
                  <Button variant={u.isActive? 'secondary':'default'} size="sm" onClick={()=>updateUser(u.id,{ isActive: !u.isActive })}>{u.isActive? 'Disable':'Enable'}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}


⸻

16) Reports (computed, mock email)

// src/app/(protected)/reports/page.tsx
'use client';
import { useMemo } from 'react';
import { useApp } from '@/store/app-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Reports(){
  const { items, movements } = useApp();
  const totals = useMemo(()=>{
    const total = items.reduce((a,b)=>a+b.quantity,0);
    const inStock = items.reduce((a,b)=>a+b.inStock,0);
    const out = total - inStock;
    return [{ name: 'In Stock', value: inStock }, { name: 'Out', value: out }];
  }, [items]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Stock Snapshot</h3>
          <Button onClick={()=>alert('Report emailed (mock).')}>Email Report</Button>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={totals}>
              <XAxis dataKey="name"/><YAxis/><Tooltip/>
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="font-medium mb-2">Active Rentals</h3>
        <div className="text-3xl font-semibold">{movements.filter(m=>m.status!=='RETURNED').length}</div>
      </Card>
    </div>
  );
}


⸻

17) Settings (placeholder)

Add business info, branding, and default store settings here.

// src/app/(protected)/settings/page.tsx
export default function Settings(){
  return <div>Settings (branding, default store, email templates — mock)</div>;
}


⸻

18) Cursor‑Only Build Instructions (Copy/Paste into Cursor)

You are an AI pair‑programmer. Build a front‑end‑only, in‑memory prototype for "Wegesa Inventory System" using Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Heroicons + Zustand + RHF + Zod + framer‑motion + date‑fns. No backend, no localStorage; all state is volatile and resets on refresh. Implement role‑based UI for: SUPER_ADMIN, OPERATIONS, STORE_KEEPER.

0) Create project & install deps

npx create-next-app@latest wagesa-inventory --ts --eslint --tailwind --app --src-dir --import-alias "@/*"
cd wagesa-inventory
npm i zustand zod react-hook-form framer-motion date-fns @heroicons/react
npx shadcn@latest init -d
npx shadcn@latest add button card input label select dialog table badge tabs dropdown-menu toast sheet alert progress breadcrumb avatar

1) Global scaffolding
	•	Ensure Tailwind is enabled (it is, from create-next-app). Confirm tailwind.config.ts has content: ["./src/**/*.{ts,tsx}"].
	•	Add a /src/styles/globals.css import in app/layout.tsx if missing.
	•	Add a toaster provider for shadcn toasts.

Create files:

src/lib/types.ts

export type Role = 'SUPER_ADMIN' | 'OPERATIONS' | 'STORE_KEEPER';
export type Store = 'Boba' | 'Mikocheni';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'ACTIVE' | 'DISABLED';
  password: string; // mock only
}

export interface Item {
  id: string;
  name: string;
  brand?: string;
  type?: string;
  quantity: number; // current on-hand at its store
  store: Store;
  dateOfEntry: string; // ISO
  notes?: string;
}

export interface RentalLine {
  itemId: string;
  quantity: number;
}

export interface Rental {
  id: string;
  lines: RentalLine[];
  customerName: string;
  locationOfUse: string;
  responsiblePerson: string;
  authorizedByUserId: string;
  dateOut: string; // ISO
  expectedReturn: string; // ISO
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
}

export interface ReturnRecord {
  id: string;
  rentalId: string;
  dateReturned: string; // ISO
  notes?: string;
  lines: { itemId: string; quantityReturned: number }[];
}

export interface Movement {
  id: string;
  itemId: string;
  fromStore: Store;
  toStore: Store;
  quantity: number;
  authorizedByUserId: string;
  date: string; // ISO
}

export type ReportPeriod = 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';

src/lib/seed.ts

import { Item, Store, User } from './types';

export const seedUsers: User[] = [
  { id: 'u-sa', name: 'Sara Super', email: 'sara@wagesa.co', role: 'SUPER_ADMIN', status: 'ACTIVE', password: 'admin123' },
  { id: 'u-op', name: 'Omar Ops', email: 'omar@wagesa.co', role: 'OPERATIONS', status: 'ACTIVE', password: 'ops123' },
  { id: 'u-sk', name: 'Stella Keeper', email: 'stella@wagesa.co', role: 'STORE_KEEPER', status: 'ACTIVE', password: 'store123' },
];

export const seedItems: Item[] = [
  { id: 'i-001', name: 'Stage Light PAR64', brand: 'BeamPro', type: 'Lighting', quantity: 24, store: 'Boba', dateOfEntry: new Date().toISOString() },
  { id: 'i-002', name: 'Wireless Microphone Set', brand: 'SoundMax', type: 'Audio', quantity: 12, store: 'Mikocheni', dateOfEntry: new Date().toISOString() },
  { id: 'i-003', name: 'LED Screen Panel 2m', brand: 'VividWall', type: 'Display', quantity: 6, store: 'Boba', dateOfEntry: new Date().toISOString() },
];

export const STORES: Store[] = ['Boba', 'Mikocheni'];

src/lib/utils.ts

export const uid = (p = '') => p + Math.random().toString(36).slice(2, 10);
export const fmt = (d: string | number | Date) => new Date(d).toLocaleString();
export const csv = (rows: string[][]) => rows.map(r => r.map(v => '"' + (v ?? '').replace(/"/g,'""') + '"').join(',')).join('\n');
export const downloadCsv = (filename: string, rows: string[][]) => {
  const blob = new Blob([csv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

2) Zustand stores (in-memory only)

src/stores/users.ts

'use client';
import { create } from 'zustand';
import { User, Role } from '@/lib/types';
import { seedUsers } from '@/lib/seed';
import { uid } from '@/lib/utils';

type UsersState = {
  users: User[];
  createUser: (u: Omit<User, 'id'>) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  deleteUser: (id: string) => void;
  verify: (email: string, password: string) => User | null;
};

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [...seedUsers],
  createUser: (u) => set(s => ({ users: [...s.users, { ...u, id: uid('u-') }] })),
  updateUser: (id, patch) => set(s => ({ users: s.users.map(u => u.id === id ? { ...u, ...patch } : u) })),
  deleteUser: (id) => set(s => ({ users: s.users.filter(u => u.id !== id) })),
  verify: (email, password) => get().users.find(u => u.email === email && u.password === password && u.status === 'ACTIVE') ?? null,
}));

src/stores/auth.ts

'use client';
import { create } from 'zustand';
import { User } from '@/lib/types';
import { useUsersStore } from './users';

type AuthState = {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  login: async (email, password) => {
    const u = useUsersStore.getState().verify(email, password);
    if (!u) throw new Error('Invalid credentials or inactive user');
    set({ user: u });
    return u;
  },
  logout: () => set({ user: null }),
}));

src/stores/inventory.ts

'use client';
import { create } from 'zustand';
import { Item, Movement, Store } from '@/lib/types';
import { seedItems } from '@/lib/seed';
import { uid } from '@/lib/utils';

type InvState = {
  items: Item[];
  movements: Movement[];
  createItem: (i: Omit<Item, 'id'>) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  transfer: (args: { itemId: string; fromStore: Store; toStore: Store; quantity: number; authorizedByUserId: string; date?: string; }) => void;
  adjustQty: (itemId: string, delta: number) => void; // used by rentals/returns
};

export const useInventory = create<InvState>((set, get) => ({
  items: [...seedItems],
  movements: [],
  createItem: (i) => set(s => ({ items: [...s.items, { ...i, id: uid('i-') }] })),
  updateItem: (id, patch) => set(s => ({ items: s.items.map(it => it.id === id ? { ...it, ...patch } : it) })),
  deleteItem: (id) => set(s => ({ items: s.items.filter(it => it.id !== id) })),
  transfer: ({ itemId, fromStore, toStore, quantity, authorizedByUserId, date }) => set(s => {
    const items = s.items.map(it => {
      if (it.id !== itemId) return it;
      if (it.store === fromStore && it.quantity >= quantity) {
        return { ...it, store: toStore }; // simple move; keep quantity with same item
      }
      return it;
    });
    const mv: Movement = { id: uid('m-'), itemId, fromStore, toStore, quantity, authorizedByUserId, date: date ?? new Date().toISOString() };
    return { items, movements: [mv, ...s.movements] };
  }),
  adjustQty: (itemId, delta) => set(s => ({ items: s.items.map(it => it.id === itemId ? { ...it, quantity: Math.max(0, it.quantity + delta) } : it) })),
}));

src/stores/rentals.ts

'use client';
import { create } from 'zustand';
import { Rental } from '@/lib/types';
import { uid } from '@/lib/utils';
import { useInventory } from './inventory';

interface RentalsState {
  rentals: Rental[];
  createRental: (r: Omit<Rental, 'id' | 'status'>) => void;
  updateRental: (id: string, patch: Partial<Rental>) => void;
  deleteRental: (id: string) => void;
  markReturned: (id: string) => void;
  recomputeOverdues: () => void;
}

export const useRentals = create<RentalsState>((set, get) => ({
  rentals: [],
  createRental: (r) => set(s => {
    r.lines.forEach(l => useInventory.getState().adjustQty(l.itemId, -l.quantity));
    const newR: Rental = { ...r, id: uid('r-'), status: 'ACTIVE' };
    return { rentals: [newR, ...s.rentals] };
  }),
  updateRental: (id, patch) => set(s => ({ rentals: s.rentals.map(x => x.id === id ? { ...x, ...patch } : x) })),
  deleteRental: (id) => set(s => ({ rentals: s.rentals.filter(x => x.id !== id) })),
  markReturned: (id) => set(s => {
    const r = s.rentals.find(x => x.id === id);
    if (!r) return s;
    r.lines.forEach(l => useInventory.getState().adjustQty(l.itemId, +l.quantity));
    return { rentals: s.rentals.map(x => x.id === id ? { ...x, status: 'RETURNED' } : x) };
  }),
  recomputeOverdues: () => set(s => ({
    rentals: s.rentals.map(r => (r.status === 'ACTIVE' && new Date(r.expectedReturn) < new Date()) ? { ...r, status: 'OVERDUE' } : r)
  })),
}));

3) App shell & routing

Create the app structure with a splash → login → dashboard flow and a sidebar for authenticated routes.

src/app/layout.tsx

import './globals.css';
import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

src/app/page.tsx (Splash → CTA to Login)

'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Splash() {
  return (
    <div className="grid place-items-center h-[100svh] p-6">
      <motion.div initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .6 }} className="text-center">
        <motion.h1 className="text-4xl font-bold">Wegesa Inventory</motion.h1>
        <p className="mt-2 text-gray-600">Track materials, rentals & movement between Boba and Mikocheni.</p>
        <Link href="/login" className="inline-flex mt-8 px-6 py-3 rounded-2xl bg-black text-white">Enter</Link>
      </motion.div>
    </div>
  );
}

src/app/login/page.tsx

'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/stores/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({ email: z.string().email(), password: z.string().min(3) });

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const login = useAuth(s => s.login);
  const router = useRouter();

  const onSubmit = async (data: any) => {
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="grid place-items-center h-[100svh] p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4 bg-white p-6 rounded-2xl shadow">
        <h2 className="text-2xl font-semibold">Sign in</h2>
        <div>
          <Input placeholder="Email" {...register('email')} />
          {errors.email && <p className="text-sm text-red-600">{`${errors.email.message}`}</p>}
        </div>
        <div>
          <Input type="password" placeholder="Password" {...register('password')} />
          {errors.password && <p className="text-sm text-red-600">{`${errors.password.message}`}</p>}
        </div>
        <Button type="submit" className="w-full">Login</Button>
        <p className="text-xs text-gray-500">Try: sara@wagesa.co / admin123, omar@wagesa.co / ops123, stella@wagesa.co / store123</p>
      </form>
    </div>
  );
}

src/components/RequireAuth.tsx

'use client';
import { useAuth } from '@/stores/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuth(s => s.user);
  const router = useRouter();
  useEffect(() => { if (!user) router.replace('/login'); }, [user, router]);
  if (!user) return null;
  return <>{children}</>;
}

src/components/RoleGate.tsx

'use client';
import { Role } from '@/lib/types';
import { useAuth } from '@/stores/auth';

export default function RoleGate({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const role = useAuth(s => s.user?.role);
  if (!role || !allow.includes(role)) return null;
  return <>{children}</>;
}

src/components/Sidebar.tsx

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/stores/auth';

const NavItem = ({ href, label }: { href: string; label: string }) => {
  const p = usePathname();
  const active = p === href;
  return <Link href={href} className={`block rounded-xl px-3 py-2 ${active ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}>{label}</Link>;
};

export default function Sidebar() {
  const user = useAuth(s => s.user);
  return (
    <aside className="w-60 shrink-0 p-3 space-y-2">
      <div className="px-3 py-2 font-semibold">Hello, {user?.name}</div>
      <NavItem href="/dashboard" label="Dashboard" />
      <NavItem href="/materials" label="Materials" />
      <NavItem href="/rentals" label="Rentals" />
      <NavItem href="/returns" label="Returns" />
      <NavItem href="/transfers" label="Transfers" />
      <NavItem href="/reports" label="Reports" />
      {user?.role === 'SUPER_ADMIN' && <NavItem href="/users" label="Users" />}
    </aside>
  );
}

src/app/(dash)/layout.tsx

import RequireAuth from '@/components/RequireAuth';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/stores/auth';

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="flex min-h-[100svh]">
        <Sidebar />
        <main className="flex-1 p-6 space-y-6">
          <Header />
          {children}
        </main>
      </div>
    </RequireAuth>
  );
}

function Header() {
  const logout = useAuth(s => s.logout);
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold">Wegesa Inventory</h1>
      <button onClick={logout} className="px-3 py-1 rounded-xl bg-gray-900 text-white">Logout</button>
    </div>
  );
}

Create the following route folders under src/app: (dash)/dashboard, (dash)/materials, (dash)/rentals, (dash)/returns, (dash)/transfers, (dash)/reports, (dash)/users — each with a page.tsx.

4) Pages — minimum viable implementations

src/app/(dash)/dashboard/page.tsx

'use client';
import { useInventory } from '@/stores/inventory';
import { useRentals } from '@/stores/rentals';

export default function DashboardPage() {
  const items = useInventory(s => s.items);
  const rentals = useRentals(s => s.rentals);
  const out = rentals.filter(r => r.status !== 'RETURNED');
  const overdue = rentals.filter(r => r.status === 'OVERDUE');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-4 shadow"><div className="text-sm text-gray-500">Items</div><div className="text-3xl font-bold">{items.length}</div></div>
        <div className="rounded-2xl bg-white p-4 shadow"><div className="text-sm text-gray-500">Active Rentals</div><div className="text-3xl font-bold">{out.length}</div></div>
        <div className="rounded-2xl bg-white p-4 shadow"><div className="text-sm text-gray-500">Overdue</div><div className="text-3xl font-bold text-red-600">{overdue.length}</div></div>
        <div className="rounded-2xl bg-white p-4 shadow"><div className="text-sm text-gray-500">Utilization (mock)</div><div className="text-3xl font-bold">{Math.round((out.length / Math.max(1, items.length)) * 100)}%</div></div>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow">
        <h3 className="font-semibold mb-3">Recent Rentals</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500"><th className="py-2">ID</th><th>Customer</th><th>Status</th><th>Expected Return</th></tr></thead>
          <tbody>
            {rentals.slice(0,5).map(r => (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.id}</td>
                <td>{r.customerName}</td>
                <td>{r.status}</td>
                <td>{new Date(r.expectedReturn).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

src/app/(dash)/materials/page.tsx

'use client';
import { useInventory } from '@/stores/inventory';
import { useForm } from 'react-hook-form';
import { STORES } from '@/lib/seed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useState } from 'react';

export default function MaterialsPage() {
  const { items, createItem, updateItem, deleteItem } = useInventory();
  const [editingId, setEditingId] = useState<string | null>(null);
  const f = useForm({ defaultValues: { name: '', brand: '', type: '', quantity: 1, store: 'Boba', dateOfEntry: new Date().toISOString() } });

  const onSubmit = (v: any) => {
    if (editingId) {
      updateItem(editingId, v); setEditingId(null); f.reset();
    } else {
      createItem(v as any); f.reset();
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-4 shadow">
        <h3 className="font-semibold mb-3">Add / Edit Item</h3>
        <form onSubmit={f.handleSubmit(onSubmit)} className="grid md:grid-cols-6 gap-3">
          <Input placeholder="Name" {...f.register('name', { required: true })} />
          <Input placeholder="Brand" {...f.register('brand')} />
          <Input placeholder="Type" {...f.register('type')} />
          <Input type="number" placeholder="Qty" {...f.register('quantity', { valueAsNumber: true, min: 0 })} />
          <Select onValueChange={(v) => f.setValue('store', v as any)} defaultValue={f.getValues('store')}>
            <SelectTrigger><SelectValue placeholder="Store" /></SelectTrigger>
            <SelectContent>{STORES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Button type="submit" className="md:col-span-1">{editingId ? 'Update' : 'Create'}</Button>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <h3 className="font-semibold mb-3">Materials in Store</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500"><th className="py-2">Name</th><th>Brand</th><th>Type</th><th>Qty</th><th>Store</th><th>Date</th><th></th></tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id} className="border-t">
                <td className="py-2">{it.name}</td>
                <td>{it.brand}</td>
                <td>{it.type}</td>
                <td>{it.quantity}</td>
                <td>{it.store}</td>
                <td>{new Date(it.dateOfEntry).toLocaleDateString()}</td>
                <td className="space-x-2">
                  <Button variant="secondary" onClick={() => { setEditingId(it.id); f.reset({ ...it }); }}>Edit</Button>
                  <Button variant="destructive" onClick={() => deleteItem(it.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

5) Rentals, Returns, Transfers, Users, Reports — implement by pattern

Create these pages using the same CRUD pattern as materials/page.tsx. Specific requirements:
	•	Rentals (/rentals): Form to select multiple items (by name), quantities, customerName, locationOfUse, responsiblePerson, authorizedBy (current user), dateOut (now), expectedReturn (date/time). On create: call useRentals.getState().createRental(...). Table of active rentals with actions: Edit (patch), Mark Returned (calls markReturned), Delete (only show for SUPER_ADMIN). Recompute overdues on mount.
	•	Returns (/returns): Show list of rentals with status ACTIVE|OVERDUE. Action: “Record Full Return” → markReturned. Optional: partial returns (stretch goal; you can skip for now).
	•	Transfers (/transfers): Simple form: choose item, fromStore, toStore, quantity, authorizedBy (current user), date. Call useInventory.getState().transfer(...).
	•	Users (/users, SUPER_ADMIN only): Table of users; Create user (name,email,role,password,status); Edit role/status; Reset password; Delete user.
	•	Reports (/reports): Period tabs (Week/Month/Quarter/Year). KPIs: total rentals in period, items currently out, overdue count, utilization %. Button “Export CSV” → use downloadCsv. Button “Send Email” → simulate with toast + CSV download.

Add a lightweight role gate: Wrap privileged buttons/sections with <RoleGate allow={["SUPER_ADMIN"]}>...</RoleGate> etc.

6) Header actions (logout) & polish
	•	Add a small header bar in (dash)/layout.tsx above main or inside it with: app title, current role, Logout button calling useAuth.getState().logout() and redirect to /login.
	•	Use Heroicons where helpful (e.g., @heroicons/react/24/outline → ArrowRightIcon, TrashIcon, PencilSquareIcon).
	•	Use shadcn <Dialog> for confirming destructive actions.

7) Manual test script
	1.	Login as sara@wagesa.co / admin123 → Confirm Sidebar shows Users.
	2.	Add a new item in Materials; edit and delete it.
	3.	Create a Rental for 2 different items; verify their quantities decrement.
	4.	Mark rental Returned; quantities increment back.
	5.	Create a Transfer Boba → Mikocheni; verify item’s store changes.
	6.	Switch user to omar@wagesa.co / ops123; verify Users nav hidden; try creating rentals/returns.
	7.	Switch user to stella@wagesa.co / store123; verify limited actions (no delete on rentals/users).
	8.	Open Reports; export CSV; confirm file downloads. Use “Send Email” → see toast + CSV download.

8) Non-goals & notes
	•	No persistence whatsoever; do not use localStorage/sessionStorage.
	•	No backend/API routes for now.
	•	All validations can be light (Zod optional for feature forms).
	•	Keep components client-side where they use Zustand/hooks.
	•	Keep UI clean, minimal, and touch-friendly.

Deliverable: A running Next.js app where all above screens function with in‑memory state and role‑based UI, suitable for demo to Wegesa Event Co.


note: colours for project are black and white only 