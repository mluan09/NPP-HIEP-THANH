import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseTable } from '../hooks/useSupabaseTable';
import { CashbookRow } from '../types';

interface CashbookContextType {
  cashbook: CashbookRow[];
  loading: boolean;
  addRow: (data: any) => Promise<boolean>;
  updateRow: (id: any, data: any) => Promise<boolean>;
  deleteRow: (id: any) => Promise<boolean>;
}

const CashbookContext = createContext<CashbookContextType | undefined>(undefined);

export const CashbookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: cashbook, loading, addRow, updateRow, deleteRow } = useSupabaseTable<CashbookRow>('cashbook');
  return (
    <CashbookContext.Provider value={{ cashbook, loading, addRow, updateRow, deleteRow }}>
      {children}
    </CashbookContext.Provider>
  );
};

export const useCashbook = () => {
  const ctx = useContext(CashbookContext);
  if (!ctx) throw new Error('useCashbook must be used within CashbookProvider');
  return ctx;
};
