import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Boxes, AlertTriangle, Filter, CheckCircle2, PackageCheck } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../services/api';

const CATEGORIES = ['Food & Provisions', 'Cleaning', 'Furniture', 'Electronics & Lighting', 'Plumbing', 'Bedding', 'Other'];
const UNITS = ['kg', 'litres', 'pieces', 'boxes', 'packets', 'bundles'];

export default function InventoryPage({ showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    item_name: '',
    category: 'Food & Provisions',
    quantity: 100,
    unit: 'kg',
    min_required_quantity: 20
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadInventory();
  }, [categoryFilter, lowStockOnly]);

  async function loadInventory() {
    try {
      setLoading(true);
      const res = await api.getInventory({
        category: categoryFilter,
        low_stock: lowStockOnly ? 'true' : ''
      });
      setItems(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingItem(null);
    setFormData({
      item_name: '',
      category: 'Food & Provisions',
      quantity: 100,
      unit: 'kg',
      min_required_quantity: 20
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function openEditModal(item) {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name || item.ItemName || '',
      category: item.category || item.Category || 'Food & Provisions',
      quantity: item.quantity !== undefined ? item.quantity : 100,
      unit: item.unit || item.Unit || 'kg',
      min_required_quantity: item.min_required_quantity || 20
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function validate() {
    const errs = {};
    if (!formData.item_name.trim()) errs.item_name = 'Item title is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        min_required_quantity: Number(formData.min_required_quantity)
      };

      if (editingItem) {
        await api.updateInventoryItem(editingItem.item_id || editingItem.ItemID, payload);
        showToast('Inventory item updated successfully', 'success');
      } else {
        await api.createInventoryItem(payload);
        showToast('Item logged into campus inventory', 'success');
      }
      setIsModalOpen(false);
      loadInventory();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setSaving(true);
      await api.deleteInventoryItem(deleteItemId);
      showToast('Inventory item deleted', 'success');
      setDeleteItemId(null);
      loadInventory();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <Boxes size={20} />
            </div>
            <div>
              <h2>Campus Inventory & Stock Telemetry</h2>
              <p>Food provisions, maintenance hardware, electricals, and automatic stock reorder indicators</p>
            </div>
          </div>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Inventory Item</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        {/* Filters Toolbar */}
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: 180 }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Stock Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={`btn btn-sm ${lowStockOnly ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => setLowStockOnly(!lowStockOnly)}
            >
              <AlertTriangle size={14} />
              <span>{lowStockOnly ? 'Showing Low Stock Only' : 'Filter Low Stock Items'}</span>
            </button>
          </div>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Total Items: <strong>{items.length}</strong>
          </span>
        </div>

        {/* Data Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Title</th>
                <th>Category</th>
                <th>Available Quantity</th>
                <th>Unit</th>
                <th>Stock Level Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                    <div className="spin-animation" style={{ display: 'inline-block', marginBottom: 8 }}>
                      <Boxes size={24} color="var(--primary)" />
                    </div>
                    <p>Loading inventory balances...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                    No inventory records match the current filter.
                  </td>
                </tr>
              ) : (
                items.map((it) => {
                  const qty = it.quantity !== undefined ? Number(it.quantity) : 100;
                  const isLow = qty <= 30;
                  const isHigh = qty >= 150;

                  return (
                    <tr key={it.item_id || it.ItemID}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        #{it.item_id || it.ItemID}
                      </td>

                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {it.item_name || it.ItemName}
                        </span>
                      </td>

                      <td>
                        <span className="badge badge-info">
                          {it.category || it.Category || 'Provisions'}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '1rem', color: isLow ? '#f87171' : isHigh ? '#38bdf8' : '#34d399' }}>
                            {qty}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{it.unit || it.Unit || 'kg'}</span>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {it.unit || it.Unit || 'kg'}
                        </span>
                      </td>

                      <td>
                        {isLow ? (
                          <span className="badge badge-danger">
                            <AlertTriangle size={11} />
                            LOW STOCK
                          </span>
                        ) : isHigh ? (
                          <span className="badge badge-info">
                            <PackageCheck size={11} />
                            HIGH STOCK
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            <CheckCircle2 size={11} />
                            NORMAL
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-icon btn-sm"
                            onClick={() => openEditModal(it)}
                            title="Edit item"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-danger btn-icon btn-sm"
                            onClick={() => setDeleteItemId(it.item_id || it.ItemID)}
                            title="Delete item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Edit Item: ${editingItem.item_name || editingItem.ItemName}` : 'Add Inventory Item'}
        maxWidth="540px"
      >
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label className="form-label">Item Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Basmati Rice, Detergent Bar, LED Tube Light"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              />
              {errors.item_name && <span className="form-error">{errors.item_name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Inventory Category</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Measurement Unit</label>
              <select
                className="form-select"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Current Stock Balance</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Low Stock Reorder Alert Level</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.min_required_quantity}
                onChange={(e) => setFormData({ ...formData, min_required_quantity: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--bg-card-border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingItem ? 'Update Stock' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteItemId)}
        onClose={() => setDeleteItemId(null)}
        onConfirm={handleDelete}
        title="Delete Inventory Item"
        message="Are you sure you want to delete this inventory item? Any procurement records tracking this item may be impacted."
        confirmText="Confirm Delete"
        isLoading={saving}
      />
    </div>
  );
}
