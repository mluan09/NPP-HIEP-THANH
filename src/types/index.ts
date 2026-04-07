export interface InventoryItem {
  id: number;
  name: string;
  unit: string;
  price: number;
  opening_qty: number;
  import_1: number;
  import_2: number;
  import_3: number;
  export_qty: number;
  created_at: string;
  created_by?: string;
}

export interface DailySaleRow {
  id: number;
  seller: string;
  date: string;
  customer: string;
  address: string;
  g8: number;
  abest_tall: number;
  abest_short: number;
  sale_price: number;
  created_at: string;
  created_by?: string;
}

export interface DebtRow {
  id: number;
  customer: string;
  address: string;
  revenue: number;
  collected: number;
  created_at: string;
  created_by?: string;
}

export interface CashbookRow {
  id: number;
  symbol: string;
  date: string;
  description: string;
  income: number;
  expense_purchase: number;
  expense_operation: number;
  expense_other: number;
  note: string;
  created_at: string;
  created_by?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  full_name?: string;
  role: 'owner' | 'ctv';
}

export type UndoActionType = 'add' | 'edit' | 'delete';

export interface UndoData {
  action: UndoActionType;
  tableName: string;
  itemId?: number;
  previousItem?: any;
  currentItemId?: number;
}

export interface LogEntry {
  id: string;
  created_at: string;
  type: string;
  content: string;
  status: 'success' | 'error';
  undo_data?: UndoData;
  undone?: boolean;
  table_name?: string;
  user_id: string;
  profiles?: {
    name: string;
  } | {
    name: string;
  }[];
}
