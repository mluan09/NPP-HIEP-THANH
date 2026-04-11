import React, { useMemo, useState } from 'react';
import { CashbookRow } from '../types';
import { useCashbook } from '../context/CashbookContext';
import { useAuth } from '../context/AuthContext';
import { useLog } from '../context/LogContext';
import { useDialog } from '../context/DialogContext';
import TablePagination from './TablePagination';
import SkeletonRows from './SkeletonRows';

const CashbookTable: React.FC = () => {
  // Improvement #6: dùng CashbookContext thay vì hook riêng
  const { cashbook, loading, addRow, updateRow, deleteRow } = useCashbook();
  const { profile } = useAuth();
  const { addLog } = useLog();
  const { showAlert, showConfirm } = useDialog();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Improvement #7: date filter cho sổ quỹ
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [formData, setFormData] = useState<Partial<CashbookRow>>({
    symbol: '', date: new Date().toISOString().split('T')[0],
    description: '', income: 0, expense_purchase: 0,
    expense_operation: 0, expense_other: 0, note: ''
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

  // Improvement #7: lọc theo ngày
  const filteredCashbook = useMemo(() => {
    let result = [...cashbook].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.id - b.id;
    });
    if (dateFrom) result = result.filter(r => r.date >= dateFrom);
    if (dateTo) result = result.filter(r => r.date <= dateTo);
    return result;
  }, [cashbook, dateFrom, dateTo]);

  // Improvement #9: Tính số dư tích luỹ (running balance) trên toàn bộ dữ liệu đã lọc
  const cashbookWithBalance = useMemo(() => {
    let runningBalance = 0;
    return filteredCashbook.map(row => {
      const expense = (row.expense_purchase || 0) + (row.expense_operation || 0) + (row.expense_other || 0);
      runningBalance += (row.income || 0) - expense;
      return { ...row, _balance: runningBalance };
    });
  }, [filteredCashbook]);

  const handleSave = async () => {
    if (!formData.description) return showAlert('Vui lòng nhập nội dung thu chi!');
    if (editingId !== null) {
      const originalItem = cashbook.find(i => i.id === editingId);
      const success = await updateRow(editingId, formData);
      if (success && originalItem) {
        addLog('Sửa Nhật Ký Thu Chi', `Đã cập nhật mục "${formData.description}".`, 'success', 'cashbook', {
          action: 'edit', tableName: 'cashbook', previousItem: originalItem, currentItemId: editingId
        });
        resetForm();
      }
    } else {
      const success = await addRow(formData);
      if (success) {
        addLog('Thêm Nhật Ký Thu Chi', `Đã thêm mục "${formData.description}".`, 'success', 'cashbook');
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ symbol: '', date: new Date().toISOString().split('T')[0], description: '', income: 0, expense_purchase: 0, expense_operation: 0, expense_other: 0, note: '' });
    setIsFormOpen(false);
  };

  const startEdit = (item: CashbookRow) => {
    if (profile?.role !== 'owner' && profile?.role !== 'dev' && item.created_by !== profile?.id) {
      return showAlert('Bạn không có quyền sửa mục này.');
    }
    setEditingId(item.id);
    setFormData(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number, description: string) => {
    const itemToDelete = cashbook.find(i => i.id === id);
    if (profile?.role !== 'owner' && profile?.role !== 'dev' && itemToDelete?.created_by !== profile?.id) {
      return showAlert('Bạn không có quyền xoá mục này.');
    }
    const confirmed = await showConfirm(`Bạn có chắc chắn muốn xoá mục "${description}" không?`);
    if (confirmed) {
      const success = await deleteRow(id);
      if (success && itemToDelete) {
        addLog('Xoá Nhật Ký Thu Chi', `Đã xoá mục "${description}".`, 'success', 'cashbook', {
          action: 'delete', tableName: 'cashbook', previousItem: itemToDelete
        });
      }
    }
  };

  const pagedCashbook = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return cashbookWithBalance.slice(start, start + pageSize);
  }, [cashbookWithBalance, currentPage]);

  // Tổng tích luỹ cuối của dữ liệu đã lọc
  const totalBalance = cashbookWithBalance.length > 0
    ? cashbookWithBalance[cashbookWithBalance.length - 1]._balance
    : 0;

  return (
    <div id="cashbookPanel" className="tab-panel active">
      <div className="content-card glass p-6">
        <div className="inline-form-head flex justify-between items-center mb-6">
          <h3>Nhật ký thu chi tiền mặt</h3>
          <button className="btn btn-primary btn-sm"
            onClick={() => { setIsFormOpen(!isFormOpen); if (!isFormOpen) setEditingId(null); }}>
            {isFormOpen ? 'Đóng biểu mẫu' : '+ Thêm dòng mới'}
          </button>
        </div>

        <div className={`form-collapse-container ${!isFormOpen ? 'collapsed' : ''}`}>
          <div className="form-collapse-inner">
            <div className="p-6 bg-slate-50/50 rounded-2xl mb-6">
              <h4 className="font-bold mb-4">{editingId !== null ? `Đang chỉnh sửa: ${formData.description}` : 'Thêm nhật ký thu chi mới'}</h4>
              <div className="grid-form">
                <div className="field"><label>Ký hiệu</label><input type="text" value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} /></div>
                <div className="field"><label>Ngày</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
                <div className="field"><label>Nội dung</label><input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                <div className="field"><label>Thu (VND)</label><input type="number" value={formData.income} onChange={(e) => setFormData({ ...formData, income: parseInt(e.target.value, 10) || 0 })} /></div>
                <div className="field"><label>Chi nhập hàng</label><input type="number" value={formData.expense_purchase} onChange={(e) => setFormData({ ...formData, expense_purchase: parseInt(e.target.value, 10) || 0 })} /></div>
                <div className="field"><label>Chi phí vận hành</label><input type="number" value={formData.expense_operation} onChange={(e) => setFormData({ ...formData, expense_operation: parseInt(e.target.value, 10) || 0 })} /></div>
                <div className="field"><label>Chi phí khác</label><input type="number" value={formData.expense_other} onChange={(e) => setFormData({ ...formData, expense_other: parseInt(e.target.value, 10) || 0 })} /></div>
                <div className="field"><label>Ghi chú</label><input type="text" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button className="btn btn-outline" onClick={resetForm}>Huỷ bỏ</button>
                <button className="btn btn-primary" onClick={handleSave}>{editingId !== null ? 'Cập nhật mục' : 'Lưu mục'}</button>
              </div>
            </div>
          </div>
        </div>

        {/* Improvement #7: Date range filter */}
        <div className="date-filter-bar">
          <div className="date-filter-group">
            <label>Từ ngày</label>
            <input type="date" className="date-filter-input" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }} />
          </div>
          <div className="date-filter-group">
            <label>Đến ngày</label>
            <input type="date" className="date-filter-input" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }} />
          </div>
          {(dateFrom || dateTo) && (
            <button className="btn btn-outline btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); setCurrentPage(1); }}>Xoá lọc</button>
          )}
          {/* Improvement #9: Hiển thị tổng số dư trong khoảng ngày đã lọc */}
          <div className="date-filter-balance">
            <span className="balance-label">Số dư:</span>
            <span className={`balance-value ${totalBalance >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(totalBalance)}
            </span>
          </div>
        </div>

        <div className="table-wrap mt-4">
          <table id="cashbookTable" className="report-table">
            <thead>
              <tr>
                <th>Ký hiệu</th><th>Ngày</th><th>Nội dung</th><th>Thu</th><th>Chi</th>
                {/* Improvement #9: Cột số dư tích luỹ */}
                <th>Số dư</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody id="cashbookTableBody" key={currentPage} className="table-animate">
              {/* Improvement #10: Skeleton loading */}
              {loading ? (
                <SkeletonRows cols={7} rows={5} />
              ) : filteredCashbook.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-10">
                  {(dateFrom || dateTo) ? 'Không có dữ liệu trong khoảng ngày đã chọn.' : 'Chưa có dữ liệu sổ quỹ.'}
                </td></tr>
              ) : (
                pagedCashbook.map((row) => {
                  const totalExpense = (row.expense_purchase || 0) + (row.expense_operation || 0) + (row.expense_other || 0);
                  return (
                    <tr key={row.id}>
                      <td className="cell-center">{row.symbol}</td>
                      <td className="cell-center">{row.date}</td>
                      <td>{row.description}</td>
                      <td className="cell-right text-success">{row.income ? formatCurrency(row.income) : ''}</td>
                      <td className="cell-right text-danger">{totalExpense ? formatCurrency(totalExpense) : ''}</td>
                      {/* Improvement #9: Số dư tích luỹ */}
                      <td className={`cell-right font-bold ${row._balance >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatCurrency(row._balance)}
                      </td>
                      <td>
                        {(profile?.role === 'owner' || profile?.role === 'dev' || row.created_by === profile?.id) && (
                          <div className="row-actions">
                            <button className="btn btn-warning btn-xs" onClick={() => startEdit(row)}>Sửa</button>
                            <button className="btn btn-danger btn-xs" onClick={() => handleDelete(row.id, row.description)}>Xoá</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <TablePagination totalItems={filteredCashbook.length} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  );
};

export default CashbookTable;
