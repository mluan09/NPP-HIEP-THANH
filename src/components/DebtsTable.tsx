import React, { useMemo, useState } from 'react';
import { DebtRow } from '../types';
import { useDebts } from '../context/DebtsContext';
import { useAuth } from '../context/AuthContext';
import { useLog } from '../context/LogContext';
import { useDialog } from '../context/DialogContext';
import TablePagination from './TablePagination';
import SkeletonRows from './SkeletonRows';

const DebtsTable: React.FC = () => {
  // Improvement #6: dùng DebtsContext thay vì hook riêng
  const { debts, loading, addRow, updateRow, deleteRow } = useDebts();
  const { profile } = useAuth();
  const { addLog } = useLog();
  const { showAlert, showConfirm } = useDialog();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [formData, setFormData] = useState<Partial<DebtRow>>({
    customer: '', address: '', revenue: 0, collected: 0
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

  const handleSave = async () => {
    if (!formData.customer) return showAlert('Vui lòng nhập tên khách hàng!');
    if (editingId !== null) {
      const originalItem = debts.find(i => i.id === editingId);
      const success = await updateRow(editingId, formData);
      if (success && originalItem) {
        addLog('Sửa Công nợ', `Đã cập nhật công nợ cho "${formData.customer}".`, 'success', 'debts', {
          action: 'edit', tableName: 'debts', previousItem: originalItem, currentItemId: editingId
        });
        resetForm();
      }
    } else {
      const success = await addRow(formData);
      if (success) {
        addLog('Thêm Công nợ', `Đã thêm công nợ cho "${formData.customer}".`, 'success', 'debts');
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ customer: '', address: '', revenue: 0, collected: 0 });
    setIsFormOpen(false);
  };

  const startEdit = (item: DebtRow) => {
    if (profile?.role !== 'owner' && profile?.role !== 'dev') return showAlert('Bạn không có quyền sửa công nợ.');
    setEditingId(item.id);
    setFormData(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number, customer: string) => {
    if (profile?.role !== 'owner' && profile?.role !== 'dev') return showAlert('Bạn không có quyền xoá công nợ.');
    const itemToDelete = debts.find(i => i.id === id);
    const confirmed = await showConfirm(`Bạn có chắc chắn muốn xoá công nợ của "${customer}" không?`);
    if (confirmed) {
      const success = await deleteRow(id);
      if (success && itemToDelete) {
        addLog('Xoá Công nợ', `Đã xoá công nợ của "${customer}".`, 'success', 'debts', {
          action: 'delete', tableName: 'debts', previousItem: itemToDelete
        });
      }
    }
  };

  const pagedDebts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return debts.slice(start, start + pageSize);
  }, [debts, currentPage]);

  return (
    <div id="debtPanel" className="tab-panel active">
      <div className="content-card glass p-6">
        <div className="inline-form-head flex justify-between items-center mb-6">
          <h3>Công nợ khách hàng</h3>
          {(profile?.role === 'owner' || profile?.role === 'dev') && (
            <button className="btn btn-primary btn-sm"
              onClick={() => { setIsFormOpen(!isFormOpen); if (!isFormOpen) setEditingId(null); }}>
              {isFormOpen ? 'Đóng biểu mẫu' : '+ Thêm dòng mới'}
            </button>
          )}
        </div>

        <div className={`form-collapse-container ${!isFormOpen ? 'collapsed' : ''}`}>
          <div className="form-collapse-inner">
            <div className="p-6 bg-slate-50/50 rounded-2xl mb-6">
              <h4 className="font-bold mb-4">{editingId !== null ? `Đang chỉnh sửa: ${formData.customer}` : 'Thêm công nợ khách hàng mới'}</h4>
              <div className="grid-form">
                <div className="field"><label>Khách hàng</label><input type="text" value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} /></div>
                <div className="field"><label>Địa chỉ</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                <div className="field"><label>Doanh số</label><input type="number" value={formData.revenue} onChange={(e) => setFormData({ ...formData, revenue: parseInt(e.target.value, 10) || 0 })} /></div>
                <div className="field"><label>Thực thu</label><input type="number" value={formData.collected} onChange={(e) => setFormData({ ...formData, collected: parseInt(e.target.value, 10) || 0 })} /></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button className="btn btn-outline" onClick={resetForm}>Huỷ bỏ</button>
                <button className="btn btn-primary" onClick={handleSave}>{editingId !== null ? 'Cập nhật công nợ' : 'Lưu công nợ'}</button>
              </div>
            </div>
          </div>
        </div>

        <div className="table-wrap mt-4">
          <table id="debtTable" className="report-table">
            <thead>
              <tr>
                <th>STT</th><th>Khách hàng</th><th>Địa chỉ</th><th>Doanh số</th><th>Thực thu</th>
                <th>Còn nợ</th><th>Thao tác</th>
              </tr>
            </thead>
            <tbody id="debtTableBody" key={currentPage} className="table-animate">
              {/* Improvement #10: Skeleton loading */}
              {loading ? (
                <SkeletonRows cols={7} rows={5} />
              ) : debts.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-10">Chưa có dữ liệu công nợ.</td></tr>
              ) : (
                pagedDebts.map((row, index) => {
                  const balance = (row.revenue || 0) - (row.collected || 0);
                  return (
                    <tr key={row.id}>
                      <td className="cell-center">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td>{row.customer}</td>
                      <td>{row.address}</td>
                      <td className="cell-right">{formatCurrency(row.revenue)}</td>
                      <td className="cell-right">{formatCurrency(row.collected)}</td>
                      <td className="cell-right text-danger">{formatCurrency(balance)}</td>
                      <td>
                        {(profile?.role === 'owner' || profile?.role === 'dev' || row.created_by === profile?.id) && (
                          <div className="row-actions">
                            <button className="btn btn-warning btn-xs" onClick={() => startEdit(row)}>Sửa</button>
                            <button className="btn btn-danger btn-xs" onClick={() => handleDelete(row.id, row.customer)}>Xoá</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <TablePagination totalItems={debts.length} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  );
};

export default DebtsTable;
