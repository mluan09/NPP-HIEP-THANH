import React, { useMemo, useState } from 'react';
import { InventoryItem } from '../types';
import { useInventory } from '../context/InventoryContext';
import { useLog } from '../context/LogContext';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import TablePagination from './TablePagination';
import CustomSelect from './CustomSelect';
import SkeletonRows from './SkeletonRows';

const InventoryTable: React.FC = () => {
  // Improvement #6: dùng InventoryContext thay vì useSupabaseTable riêng
  const { inventory, loading, addRow, updateRow, deleteRow } = useInventory();
  const { addLog } = useLog();
  const { profile } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '', unit: 'Thùng', price: 0,
    opening_qty: 0, import_1: 0, import_2: 0, import_3: 0, export_qty: 0
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, price: rawDigits ? parseInt(rawDigits, 10) : 0 });
  };

  const calculateAmounts = () => {
    const price = formData.price || 0;
    const opening = formData.opening_qty || 0;
    const imports = (formData.import_1 || 0) + (formData.import_2 || 0) + (formData.import_3 || 0);
    const exports = formData.export_qty || 0;
    return {
      openingAmount: opening * price,
      importAmount: imports * price,
      exportAmount: exports * price
    };
  };

  const handleSave = async () => {
    if (!formData.name) return showAlert('Vui lòng nhập tên hàng!');
    if (editingId !== null) {
      const originalItem = inventory.find(i => i.id === editingId);
      const success = await updateRow(editingId, formData);
      if (success && originalItem) {
        addLog('Sửa hàng hoá', `Đã cập nhật thông tin cho "${formData.name}".`, 'success', 'inventory', {
          action: 'edit', tableName: 'inventory', previousItem: originalItem, currentItemId: editingId
        });
        resetForm();
      }
    } else {
      const success = await addRow(formData);
      if (success) {
        addLog('Thêm hàng hoá', `Đã thêm mặt hàng "${formData.name}" vào danh sách.`, 'success', 'inventory');
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', unit: 'Thùng', price: 0, opening_qty: 0, import_1: 0, import_2: 0, import_3: 0, export_qty: 0 });
    setIsFormOpen(false);
  };

  const startEdit = async (item: InventoryItem) => {
    if (profile?.role !== 'owner' && profile?.role !== 'dev') return showAlert('Bạn không có quyền sửa hàng hoá.');
    setEditingId(item.id);
    setFormData(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (profile?.role !== 'owner' && profile?.role !== 'dev') return showAlert('Bạn không có quyền xoá hàng hoá.');
    const itemToDelete = inventory.find(i => i.id === id);
    const confirmed = await showConfirm(`Bạn có chắc chắn muốn xoá mặt hàng "${name}" không?`);
    if (confirmed) {
      const success = await deleteRow(id);
      if (success && itemToDelete) {
        addLog('Xoá hàng hoá', `Đã xoá "${name}" khỏi danh sách.`, 'success', 'inventory', {
          action: 'delete', tableName: 'inventory', previousItem: itemToDelete
        });
      }
    }
  };

  const amounts = calculateAmounts();

  const pagedInventory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return inventory.slice(start, start + pageSize);
  }, [inventory, currentPage]);

  return (
    <div id="inventoryPanel" className="tab-panel active">
      <div className="content-card glass p-6">
        <div className="inline-form-head flex justify-between items-center mb-6">
          <h3>Danh mục hàng hóa</h3>
          {(profile?.role === 'owner' || profile?.role === 'dev') && (
            <button id="showAddInventoryBtn" className="btn btn-primary btn-sm"
              onClick={() => { setIsFormOpen(!isFormOpen); if (!isFormOpen) setEditingId(null); }}>
              {isFormOpen ? 'Đóng biểu mẫu' : '+ Thêm hàng mới'}
            </button>
          )}
        </div>

        <div id="inventoryFormContainer" className={`form-collapse-container ${!isFormOpen ? 'collapsed' : ''}`}>
          <div className="form-collapse-inner">
            <div id="inventoryForm" className="p-6 bg-slate-50/50 rounded-2xl mb-6">
              <h4 id="inventoryFormTitle" className="font-bold mb-4">
                {editingId !== null ? `Đang chỉnh sửa: ${formData.name}` : 'Thêm hàng hoá mới'}
              </h4>
              <div className="grid-form">
                <div className="field">
                  <label>Tên hàng</label>
                  <input type="text" id="itemNameInput" placeholder="Ví dụ: Abest Tall"
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="field">
                  <label>ĐVT</label>
                  <CustomSelect value={formData.unit || ''} options={['Thùng', 'Két', 'Chai']}
                    onChange={(val) => setFormData({ ...formData, unit: val })} />
                </div>
                <div className="field">
                  <label>Đơn giá</label>
                  <input type="text" id="itemPriceInput" placeholder="0đ"
                    value={formData.price ? formatCurrency(formData.price) : ''}
                    onChange={handlePriceInput} />
                </div>
                <div className="field">
                  <label>Tồn đầu</label>
                  <input type="number" id="itemOpeningQtyInput" value={formData.opening_qty}
                    onChange={(e) => setFormData({ ...formData, opening_qty: parseInt(e.target.value, 10) || 0 })} />
                </div>
                <div className="field"><label>Nhập L1</label><input type="number" value={formData.import_1} onChange={(e) => setFormData({ ...formData, import_1: parseInt(e.target.value, 10) || 0 })} /></div>
                <div className="field"><label>Nhập L2</label><input type="number" value={formData.import_2} onChange={(e) => setFormData({ ...formData, import_2: parseInt(e.target.value, 10) || 0 })} /></div>
                <div className="field"><label>Nhập L3</label><input type="number" value={formData.import_3} onChange={(e) => setFormData({ ...formData, import_3: parseInt(e.target.value, 10) || 0 })} /></div>
                <div className="field">
                  <label>Xuất</label>
                  <input type="number" id="itemExportQtyInput" value={formData.export_qty}
                    onChange={(e) => setFormData({ ...formData, export_qty: parseInt(e.target.value, 10) || 0 })} />
                </div>
              </div>
              <div className="grid-meta mt-4 flex gap-4">
                <div className="meta-item"><label>Tiền tồn đầu</label><input type="text" disabled value={formatCurrency(amounts.openingAmount)} /></div>
                <div className="meta-item"><label>Tiền nhập</label><input type="text" disabled value={formatCurrency(amounts.importAmount)} /></div>
                <div className="meta-item"><label>Tiền xuất</label><input type="text" disabled value={formatCurrency(amounts.exportAmount)} /></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button id="cancelEditBtn" className="btn btn-outline" onClick={resetForm}>Huỷ bỏ</button>
                <button id="addInventoryItemBtn" className="btn btn-primary" onClick={handleSave}>
                  {editingId !== null ? 'Cập nhật hàng hoá' : 'Lưu hàng hoá'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table id="inventoryTable" className="report-table">
            <thead>
              <tr>
                <th>STT</th><th>Tên hàng</th><th>ĐVT</th><th>Giá</th><th>Tồn đầu</th><th>Tiền tồn</th>
                <th>L1</th><th>L2</th><th>L3</th><th>Tiền nhập</th><th>Xuất</th><th>Tiền xuất</th>
                <th>Tồn cuối</th><th>Tiền cuối</th><th>Thao tác</th>
              </tr>
            </thead>
            <tbody id="inventoryTableBody" key={currentPage} className="table-animate">
              {/* Improvement #10: Skeleton loading thay vì văn bản "Đang tải..." */}
              {loading ? (
                <SkeletonRows cols={15} rows={5} />
              ) : inventory.length === 0 ? (
                <tr><td colSpan={15} className="text-center p-10">Chưa có dữ liệu hàng hoá.</td></tr>
              ) : (
                pagedInventory.map((item, index) => {
                  const imports = item.import_1 + item.import_2 + item.import_3;
                  const closingQty = item.opening_qty + imports - item.export_qty;
                  return (
                    <tr key={item.id}>
                      <td className="cell-center">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td>{item.name}</td>
                      <td className="cell-center">{item.unit}</td>
                      <td className="cell-right">{new Intl.NumberFormat('vi-VN').format(item.price)}</td>
                      <td className="cell-center">{item.opening_qty || ''}</td>
                      <td className="cell-right">{formatCurrency(item.opening_qty * item.price)}</td>
                      <td className="cell-center">{item.import_1 || ''}</td>
                      <td className="cell-center">{item.import_2 || ''}</td>
                      <td className="cell-center">{item.import_3 || ''}</td>
                      <td className="cell-right">{formatCurrency(imports * item.price)}</td>
                      <td className="cell-center">{item.export_qty || ''}</td>
                      <td className="cell-right">{formatCurrency(item.export_qty * item.price)}</td>
                      <td className="cell-center">{closingQty}</td>
                      <td className="cell-right">{formatCurrency(closingQty * item.price)}</td>
                      <td>
                        {(profile?.role === 'owner' || profile?.role === 'dev' || item.created_by === profile?.id) && (
                          <div className="row-actions">
                            <button className="btn btn-warning btn-xs" onClick={() => startEdit(item)}>Sửa</button>
                            <button className="btn btn-danger btn-xs" onClick={() => handleDelete(item.id, item.name)}>Xoá</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <TablePagination totalItems={inventory.length} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  );
};

export default InventoryTable;
