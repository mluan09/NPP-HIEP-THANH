import React, { useMemo, useState } from 'react';
import TopNavbar from '../components/TopNavbar';
import SummaryCards from '../components/SummaryCards';
import InventoryTable from '../components/InventoryTable';
import SalesTable from '../components/SalesTable';
import DebtsTable from '../components/DebtsTable';
import CashbookTable from '../components/CashbookTable';
import ActionLog from '../components/ActionLog';
import { useSupabaseTable } from '../hooks/useSupabaseTable';
import { DailySaleRow, DebtRow } from '../types';
import { Tabs, TabsContent } from '@/components/animate-ui/components/radix/tabs';
import Footer from '../components/Footer';
import OrientationLock from '../components/OrientationLock';

const tabOrder = ['inventory', 'sales', 'debt', 'cashbook'] as const;
type TabId = (typeof tabOrder)[number];

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('inventory');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Animate UI controls the panel transition when `activeTab` changes.

  // Fetch data for summary cards only (inventory is managed inside InventoryTable)
  const { data: sales, loading: salesLoading } = useSupabaseTable<DailySaleRow>('sales');
  const { data: debts, loading: debtsLoading } = useSupabaseTable<DebtRow>('debts');

  const summary = useMemo(() => {
    const revenue = sales.reduce((acc, row) => {
      const qty = (row.g8 || 0) + (row.abest_tall || 0) + (row.abest_short || 0);
      return acc + qty * row.sale_price;
    }, 0);

    const cost = sales.reduce((acc, row) => {
      return acc + (row.g8 || 0) * 157000 + (row.abest_tall || 0) * 163000 + (row.abest_short || 0) * 153000;
    }, 0);

    const debt = debts.reduce((acc, row) => acc + ((row.revenue || 0) - (row.collected || 0)), 0);

    return { revenue, cost, profit: revenue - cost, debt };
  }, [sales, debts]);

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'inventory': return 'Quản Lý Kho Hàng';
      case 'sales': return 'Báo Cáo Bán Hàng';
      case 'debt': return 'Công Nợ Khách Hàng';
      case 'cashbook': return 'Nhật Ký Thu Chi';
      default: return 'Bảng Điều Khiển';
    }
  };

  return (
    <div id="dashboard" className="dashboard">
      <OrientationLock />
      <TopNavbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />

      <main className="main-content">
        <header className="topbar glass p-4 rounded-xl flex justify-between items-center">
          <div className="topbar-left">
            <div className="page-kicker">Hệ thống quản lý</div>
            <h1 id="headerTitle">{getHeaderTitle()}</h1>
          </div>
          <div className="topbar-right">
            <button id="exportExcelBtn" className="btn btn-primary shadow-sm flex items-center gap-2">
              <span>Xuất tệp Excel</span>
            </button>
          </div>
        </header>

        <SummaryCards {...summary} />

        <div className="tab-content-animate">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabId)}
          >
            <TabsContent value="inventory">
              <InventoryTable />
              <ActionLog tableName="inventory" />
            </TabsContent>
            <TabsContent value="sales" transition={{ duration: 0.5, ease: 'easeInOut' }}>
              <SalesTable data={sales} loading={salesLoading} />
              <ActionLog tableName="sales" />
            </TabsContent>
            <TabsContent value="debt" transition={{ duration: 0.5, ease: 'easeInOut' }}>
              <DebtsTable data={debts} loading={debtsLoading} />
              <ActionLog tableName="debts" />
            </TabsContent>
            <TabsContent value="cashbook" transition={{ duration: 0.5, ease: 'easeInOut' }}>
              <CashbookTable />
              <ActionLog tableName="cashbook" />
            </TabsContent>
          </Tabs>
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default DashboardPage;
