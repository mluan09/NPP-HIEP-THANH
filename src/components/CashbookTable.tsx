import React, { useMemo, useState } from 'react';
import { useSupabaseTable } from '../hooks/useSupabaseTable';
import { CashbookRow } from '../types';
import TablePagination from './TablePagination';
import { useAuth } from '../context/AuthContext';
import { useLog } from '../context/LogContext';
import { useDialog } from '../context/DialogContext';

const CashbookTable: React.FC = () => {
  const { data: cashbook, loading, addRow, updateRow, deleteRow } = useSupabaseTable<CashbookRow>('cashbook');
  const { profile } = useAuth();
  const { addLog } = useLog();
  const { showAlert, showConfirm } = useDialog();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const [formData, setFormData] = useState<Partial<CashbookRow>>({
    symbol: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    income: 0,
    expense_purchase: 0,
    expense_operation: 0,
    expense_other: 0,
    note: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const handleSave = async () => {
    if (!formData.description) return showAlert('Vui lòng nhập nội dung thu chi!');
    
    if (editingId) {
      const originalItem = cashbook.find(i => i.id === editingId);
      const success = await updateRow(editingId, formData);
      if (success && originalItem) {
        addLog('Sửa Nhật Ký Thu Chi', `Đã cập nhật mục "${formData.description}".`, 'success', 'cashbook', {
          action: 'edit',
          tableName: 'cashbook',
          previousItem: originalItem,
          currentItemId: editingId
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
    setFormData({
      symbol: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      income: 0,
      expense_purchase: 0,
      expense_operation: 0,
      expense_other: 0,
      note: ''
    });
    setIsFormOpen(false);
  };

  const startEdit = (item: CashbookRow) => {
    setEditingId(item.id);
    setFormData(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number, description: string) => {
    const itemToDelete = cashbook.find(i => i.id === id);
    const confirmed = await showConfirm(`Bạn có chắc chắn muốn xoá mục "${description}" không?`);
    if (confirmed) {
      const success = await deleteRow(id);
      if (success && itemToDelete) {
        addLog('Xoá Nhật Ký Thu Chi', `Đã xoá mục "${description}".`, 'success', 'cashbook', {
          action: 'delete',
          tableName: 'cashbook',
          previousItem: itemToDelete
        });
      }
    }
  };

  const pagedCashbook = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return cashbook.slice(start, end);
  }, [cashbook, currentPage]);

  return (
    <div id="cashbookPanel" className="tab-panel active">
      <div className="content-card glass p-6">
        <div className="inline-form-head flex justify-between items-center mb-6">
          <h3>Nhật ký thu chi tiền mặt</h3>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => { setIsFormOpen(!isFormOpen); if(!isFormOpen) setEditingId(null); }}
          >
            {isFormOpen ? 'Đóng biểu mẫu' : '+ Thêm dòng mới'}
          </button>
        </div>

        <div className={`form-collapse-container ${!isFormOpen ? 'collapsed' : ''}`}>
          <div className="form-collapse-inner">
            <div className="p-6 bg-slate-50/50 rounded-2xl mb-6">
              <h4 className="font-bold mb-4">{editingId ? `Đang chỉnh sửa: ${formData.description}` : 'Thêm nhật ký thu chi mới'}</h4>
              <div className="grid-form">
                <div className="field">
                  <label>Ký hiệu</label>
                  <input type="text" value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} />
                </div>
                <div className="field">
                  <label>Ngày</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div className="field">
                  <label>Nội dung</label>
                  <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="field">
                  <label>Thu (VND)</label>
                  <input type="number" value={formData.income} onChange={(e) => setFormData({ ...formData, income: parseInt(e.target.value, 10) || 0 })} />
                </div>
                <div className="field">
                  <label>Chi nhập hàng</label>
                  <input type="number" value={formData.expense_purchase} onChange={(e) => setFormData({ ...formData, expense_purchase: parseInt(e.target.value, 10) || 0 })} />
                </div>
                <div className="field">
                  <label>Chi phí vận hành</label>
                  <input type="number" value={formData.expense_operation} onChange={(e) => setFormData({ ...formData, expense_operation: parseInt(e.target.value, 10) || 0 })} />
                </div>
                <div className="field">
                  <label>Chi phí khác</label>
                  <input type="number" value={formData.expense_other} onChange={(e) => setFormData({ ...formData, expense_other: parseInt(e.target.value, 10) || 0 })} />
                </div>
                <div className="field">
                  <label>Ghi chú</label>
                  <input type="text" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button className="btn btn-outline" onClick={resetForm}>Huỷ bỏ</button>
                <button className="btn btn-primary" onClick={handleSave}>
                  {editingId ? 'Cập nhật mục' : 'Lưu mục'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="table-wrap mt-4">
          <table id="cashbookTable" className="report-table">
            <thead>
              <tr><th>Ký hiệu</th><th>Ngày</th><th>Nội dung</th><th>Thu</th><th>Chi</th><th>Thao tác</th></tr>
            </thead>
            <tbody id="cashbookTableBody" key={currentPage} className="table-animate">
              {loading ? (
                <tr><td colSpan={6} className="text-center p-10">Đang tải dữ liệu...</td></tr>
              ) : cashbook.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-10">Chưa có dữ liệu sổ quỹ.</td></tr>
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
                      <td>
                        {(profile?.role === 'owner' || row.created_by === profile?.id) && (
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
          <TablePagination
            totalItems={cashbook.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default CashbookTable;
