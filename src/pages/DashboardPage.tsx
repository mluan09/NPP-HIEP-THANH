import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import TopNavbar from '../components/TopNavbar';
import SummaryCards from '../components/SummaryCards';
import InventoryTable from '../components/InventoryTable';
import SalesTable from '../components/SalesTable';
import DebtsTable from '../components/DebtsTable';
import CashbookTable from '../components/CashbookTable';
import ActionLog from '../components/ActionLog';
import { Tabs, TabsContent } from '@/components/animate-ui/components/radix/tabs';
import OrientationLock from '../components/OrientationLock';
import { InventoryProvider, useInventory } from '../context/InventoryContext';
import { SalesProvider, useSales } from '../context/SalesContext';
import { DebtsProvider, useDebts } from '../context/DebtsContext';
import { CashbookProvider, useCashbook } from '../context/CashbookContext';
import { useProductCosts } from '../hooks/useProductCosts';

const tabOrder = ['inventory', 'sales', 'debt', 'cashbook'] as const;
type TabId = (typeof tabOrder)[number];

/**
 * Inner component có quyền truy cập tất cả data contexts.
 * Tách riêng để 4 provider bọc bên ngoài.
 */
const DashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('inventory');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Improvement #6: Lấy dữ liệu từ contexts, không fetch riêng nữa
  const { inventory } = useInventory();
  const { sales } = useSales();
  const { debts } = useDebts();
  const { cashbook } = useCashbook();
  // Improvement #3: giá vốn từ bảng kho thay vì hardcode
  const costs = useProductCosts();

  const summary = useMemo(() => {
    const revenue = sales.reduce((acc, row) => {
      const qty = (row.g8 || 0) + (row.abest_tall || 0) + (row.abest_short || 0);
      return acc + qty * row.sale_price;
    }, 0);

    // Improvement #3: Dùng costs từ inventory thay vì hardcode
    const cost = sales.reduce((acc, row) => {
      return acc + (row.g8 || 0) * costs.g8 + (row.abest_tall || 0) * costs.abest_tall + (row.abest_short || 0) * costs.abest_short;
    }, 0);

    const debt = debts.reduce((acc, row) => acc + ((row.revenue || 0) - (row.collected || 0)), 0);

    return { revenue, cost, profit: revenue - cost, debt };
  }, [sales, debts, costs]);

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'inventory': return 'Quản Lý Kho Hàng';
      case 'sales': return 'Báo Cáo Bán Hàng';
      case 'debt': return 'Công Nợ Khách Hàng';
      case 'cashbook': return 'Nhật Ký Thu Chi';
      default: return 'Bảng Điều Khiển';
    }
  };

  // Improvement #1: Xuất tệp Excel cho từng tab đang active
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    let wsData: any[] = [];
    let sheetName = '';
    let fileName = '';

    switch (activeTab) {
      case 'inventory': {
        sheetName = 'Kho Hàng';
        fileName = `kho_hang_${dateStr}`;
        wsData = inventory.map((item, i) => {
          const imports = item.import_1 + item.import_2 + item.import_3;
          const closing = item.opening_qty + imports - item.export_qty;
          return {
            'STT': i + 1, 'Tên hàng': item.name, 'ĐVT': item.unit, 'Đơn giá': item.price,
            'Tồn đầu': item.opening_qty, 'Tiền tồn đầu': item.opening_qty * item.price,
            'Nhập L1': item.import_1, 'Nhập L2': item.import_2, 'Nhập L3': item.import_3,
            'Tổng nhập': imports, 'Tiền nhập': imports * item.price,
            'Xuất': item.export_qty, 'Tiền xuất': item.export_qty * item.price,
            'Tồn cuối': closing, 'Tiền cuối': closing * item.price,
          };
        });
        break;
      }
      case 'sales': {
        sheetName = 'Báo Cáo Bán Hàng';
        fileName = `ban_hang_${dateStr}`;
        wsData = sales.map((row, i) => {
          const qty = (row.g8 || 0) + (row.abest_tall || 0) + (row.abest_short || 0);
          const revenue = qty * row.sale_price;
          const cost = (row.g8 || 0) * costs.g8 + (row.abest_tall || 0) * costs.abest_tall + (row.abest_short || 0) * costs.abest_short;
          return {
            'STT': i + 1, 'Người bán': row.seller, 'Ngày': row.date,
            'Khách hàng': row.customer, 'Địa chỉ': row.address,
            'G8 Chill': row.g8, 'Abest Cao': row.abest_tall, 'Abest Lùn': row.abest_short,
            'Giá lẻ': row.sale_price, 'Doanh số': revenue, 'Giá vốn': cost, 'Lợi nhuận': revenue - cost,
          };
        });
        break;
      }
      case 'debt': {
        sheetName = 'Công Nợ';
        fileName = `cong_no_${dateStr}`;
        wsData = debts.map((row, i) => ({
          'STT': i + 1, 'Khách hàng': row.customer, 'Địa chỉ': row.address,
          'Doanh số': row.revenue, 'Thực thu': row.collected,
          'Còn nợ': (row.revenue || 0) - (row.collected || 0),
        }));
        break;
      }
      case 'cashbook': {
        sheetName = 'Sổ Quỹ';
        fileName = `so_quy_${dateStr}`;
        let runningBalance = 0;
        wsData = cashbook
          .slice()
          .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
          .map(row => {
            const expense = (row.expense_purchase || 0) + (row.expense_operation || 0) + (row.expense_other || 0);
            runningBalance += (row.income || 0) - expense;
            return {
              'Ký hiệu': row.symbol, 'Ngày': row.date, 'Nội dung': row.description,
              'Thu': row.income || 0, 'Chi nhập hàng': row.expense_purchase || 0,
              'Chi vận hành': row.expense_operation || 0, 'Chi khác': row.expense_other || 0,
              'Tổng chi': expense, 'Số dư': runningBalance, 'Ghi chú': row.note,
            };
          });
        break;
      }
    }

    if (wsData.length === 0) {
      return;
    }

    const ws = XLSX.utils.json_to_sheet(wsData);
    // Tự động điều chỉnh độ rộng cột
    const colWidths = Object.keys(wsData[0]).map(key => ({ wch: Math.max(key.length, 12) }));
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
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
            {/* Improvement #1: Nút xuất Excel đã được kết nối */}
            <button id="exportExcelBtn" className="btn btn-primary shadow-sm flex items-center gap-2" onClick={handleExportExcel}>
              <span>Xuất tệp Excel</span>
            </button>
          </div>
        </header>

        <SummaryCards {...summary} />

        <div className="tab-content-animate">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)}>
            <TabsContent value="inventory">
              <InventoryTable />
              <ActionLog tableName="inventory" />
            </TabsContent>
            <TabsContent value="sales" transition={{ duration: 0.5, ease: 'easeInOut' }}>
              <SalesTable />
              <ActionLog tableName="sales" />
            </TabsContent>
            <TabsContent value="debt" transition={{ duration: 0.5, ease: 'easeInOut' }}>
              <DebtsTable />
              <ActionLog tableName="debts" />
            </TabsContent>
            <TabsContent value="cashbook" transition={{ duration: 0.5, ease: 'easeInOut' }}>
              <CashbookTable />
              <ActionLog tableName="cashbook" />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

/**
 * DashboardPage bọc 4 data providers trước khi render DashboardContent.
 * Providers chỉ mount khi user đã authenticated (App chỉ render Dashboard khi có user).
 */
const DashboardPage: React.FC = () => (
  <InventoryProvider>
    <SalesProvider>
      <DebtsProvider>
        <CashbookProvider>
          <DashboardContent />
        </CashbookProvider>
      </DebtsProvider>
    </SalesProvider>
  </InventoryProvider>
);

export default DashboardPage;
