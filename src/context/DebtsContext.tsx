import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseTable } from '../hooks/useSupabaseTable';
import { DebtRow } from '../types';

interface DebtsContextType {
  debts: DebtRow[];
  loading: boolean;
  addRow: (data: any) => Promise<boolean>;
  updateRow: (id: any, data: any) => Promise<boolean>;
  deleteRow: (id: any) => Promise<boolean>;
}

const DebtsContext = createContext<DebtsContextType | undefined>(undefined);

export const DebtsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: debts, loading, addRow, updateRow, deleteRow } = useSupabaseTable<DebtRow>('debts');
  return (
    <DebtsContext.Provider value={{ debts, loading, addRow, updateRow, deleteRow }}>
      {children}
    </DebtsContext.Provider>
  );
};

export const useDebts = () => {
  const ctx = useContext(DebtsContext);
  if (!ctx) throw new Error('useDebts must be used within DebtsProvider');
  return ctx;
};
