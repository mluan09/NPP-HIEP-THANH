// Supabase is currently disabled by user request
// import { supabase } from "./supabaseClient";

export type Role = "owner" | "ctv";

export interface Account {
  email: string;
  password: string;
  role: Role;
  name: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  unit: string;
  price: number;
  openingQty: number;
  import1: number;
  import2: number;
  import3: number;
  exportQty: number;
}

export interface DailySaleRow {
  id?: number;
  seller: string;
  date: string;
  customer: string;
  address: string;
  g8: number;
  abestTall: number;
  abestShort: number;
  salePrice: number;
}

export interface DebtRow {
  id?: number;
  stt: number;
  date: string;
  customer: string;
  address: string;
  revenue: number;
  collected: number;
}

export interface CashbookRow {
  id?: number;
  symbol: string;
  date: string;
  description: string;
  income: number;
  expensePurchase: number;
  expenseOperation: number;
  expenseOther: number;
  note: string;
}

export const accounts: Account[] = [
  {
    email: "chu@example.com",
    password: "123456",
    role: "owner",
    name: "Chủ cửa hàng",
  },
  {
    email: "ctv@example.com",
    password: "123456",
    role: "ctv",
    name: "CTV bán hàng",
  },
];

export const inventorySeed: InventoryItem[] = [
  {
    id: 1,
    name: "Bia G8 chill",
    unit: "Thùng",
    price: 157000,
    openingQty: 0,
    import1: 700,
    import2: 719,
    import3: 0,
    exportQty: 1278,
  },
  {
    id: 2,
    name: "Bia Abest (lon cao)",
    unit: "Thùng",
    price: 163000,
    openingQty: 0,
    import1: 800,
    import2: 0,
    import3: 0,
    exportQty: 230,
  },
  {
    id: 3,
    name: "Bia Abest (lon lùn)",
    unit: "Thùng",
    price: 153000,
    openingQty: 0,
    import1: 200,
    import2: 0,
    import3: 0,
    exportQty: 70,
  },
];

// --- Supabase Helpers ---

// Supabase migration is currently disabled
/*
async function migrateData() {
  ...
}
*/

export async function deleteInventory(id: number): Promise<void> {
  const inventory = await loadInventory();
  const filtered = inventory.filter(i => i.id !== id);
  localStorage.setItem("inventory_v3", JSON.stringify(filtered));
}

// --- Public Data Functions ---

export async function loadInventory(): Promise<InventoryItem[]> {
  const localData = localStorage.getItem("inventory_v3");
  if (localData) {
    return JSON.parse(localData);
  }
  return [...inventorySeed];
}

export async function saveInventory(data: InventoryItem[]): Promise<void> {
  localStorage.setItem("inventory_v3", JSON.stringify(data));
}

export const salesSeed: DailySaleRow[] = [
  {
    seller: "Tới CTV",
    date: "16-Thg3",
    customer: "Bích Trâm",
    address: "U Minh",
    g8: 100,
    abestTall: 0,
    abestShort: 0,
    salePrice: 170000,
  },
  {
    seller: "Tới CTV",
    date: "16-Thg3",
    customer: "Công Danh",
    address: "Cái Rắn",
    g8: 100,
    abestTall: 0,
    abestShort: 0,
    salePrice: 170000,
  },
];

export const debtSeed: DebtRow[] = [
  {
    stt: 17,
    date: "Mượn TM 35,5tr",
    customer: "Chị Mận",
    address: "Sào lưới - Đá Bạc",
    revenue: 5190000,
    collected: 0,
  },
];

export const cashbookSeed: CashbookRow[] = [
  {
    symbol: "TM",
    date: "10-Thg3",
    description: "Anh Khắc góp vốn ban đầu",
    income: 200000000,
    expensePurchase: 0,
    expenseOperation: 0,
    expenseOther: 0,
    note: "",
  },
];

export async function loadSales(): Promise<DailySaleRow[]> {
  const localData = localStorage.getItem("sales_v3");
  if (localData) {
    return JSON.parse(localData);
  }
  return [...salesSeed];
}

export async function saveSale(row: DailySaleRow): Promise<void> {
  const sales = await loadSales();
  sales.unshift({ ...row, id: Date.now() });
  localStorage.setItem("sales_v3", JSON.stringify(sales));
}

export async function loadDebts(): Promise<DebtRow[]> {
  const localData = localStorage.getItem("debts_v3");
  if (localData) {
    return JSON.parse(localData);
  }
  return [...debtSeed];
}

export async function saveDebt(row: DebtRow): Promise<void> {
  const debts = await loadDebts();
  const idx = debts.findIndex(d => d.stt === row.stt);
  if (idx !== -1) {
    debts[idx] = row;
  } else {
    debts.push(row);
  }
  localStorage.setItem("debts_v3", JSON.stringify(debts));
}

export async function loadCashbook(): Promise<CashbookRow[]> {
  const localData = localStorage.getItem("cashbook_v3");
  if (localData) {
    return JSON.parse(localData);
  }
  return [...cashbookSeed];
}

export async function saveCashbook(row: CashbookRow): Promise<void> {
  const { error } = await supabase.from('cashbook').insert([{
    symbol: row.symbol,
    date: row.date,
    description: row.description,
    income: row.income,
    expense_purchase: row.expensePurchase,
    expense_operation: row.expenseOperation,
    expense_other: row.expenseOther,
    note: row.note
  }]);
  if (error) console.error("Error saving cashbook:", error);
}