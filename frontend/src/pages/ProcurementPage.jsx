import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShoppingBag, Truck, Boxes, DollarSign, Calendar } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../services/api';

export default function ProcurementPage({ showToast }) {
  const [procurements, setProcurements] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [supplierFilter, setSupplierFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteProcureTarget, setDeleteProcureTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    supplier_id: '',
    item_id: '',
    mess_id: 'M1',
    quantity: 50
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadProcurements();
  }, [supplierFilter]);

  async function loadMeta() {
    try {
      const [sRes, iRes] = await Promise.all([api.getSuppliers(), api.getInventory()]);
      setSuppliers(sRes.data);
      setItems(iRes.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadProcurements() {
    try {
      setLoading(true);
      const res = await api.getProcurements({
        supplier_id: supplierFilter
      });
      setProcurements(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setFormData({
      supplier_id: suppliers[0]?.supplier_id || suppliers[0]?.SupplierID || '',
      item_id: items[0]?.item_id || items[0]?.ItemID || '',
      mess_id: 'M1',
      quantity: 50
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function validate() {
    const errs = {};
    if (!formData.supplier_id) errs.supplier_id = 'Please choose a vendor';
    if (!formData.item_id) errs.item_id = 'Please select an item';
    if (!formData.quantity || formData.quantity <= 0) errs.quantity = 'Quantity must be greater than zero';
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
        quantity: Number(formData.quantity)
      };

      await api.createProcurement(payload);
      showToast('Procurement order logged successfully', 'success');
      setIsModalOpen(false);
      loadProcurements();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteProcureTarget) return;
    try {
      setSaving(true);
      // The backend procurement delete uses composite query params: MessID, SupplierID, ItemID
      await api.deleteProcurement(deleteProcureTarget);
      showToast('Procurement record deleted', 'success');
      setDeleteProcureTarget(null);
      loadProcurements();
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
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2>Procurement Records & Supply Orders</h2>
              <p>Institutional purchase orders between dining halls, certified suppliers, and inventory stock</p>
            </div>
          </div>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Record Procurement</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        {/* Filters */}
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: 200 }}
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
            >
              <option value="">All Certified Suppliers</option>
              {suppliers.map((s) => {
                const id = s.supplier_id || s.SupplierID;
                const name = s.name || s.SupplierName;
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing <strong>{procurements.length}</strong> purchase records
          </span>
        </div>

        {/* Data Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Dining Facility</th>
                <th>Supplier Partner</th>
                <th>Procured Item</th>
                <th>Purchased Quantity</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                    <div className="spin-animation" style={{ display: 'inline-block', marginBottom: 8 }}>
                      <ShoppingBag size={24} color="var(--primary)" />
                    </div>
                    <p>Loading procurement ledger...</p>
                  </td>
                </tr>
              ) : procurements.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                    No procurement records logged for this filter.
                  </td>
                </tr>
              ) : (
                procurements.map((p, idx) => (
                  <tr key={idx}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {p.mess_name || p.MessName || p.mess_id || p.MessID || 'North Dining Hall (M1)'}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Truck size={14} color="#38bdf8" />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {p.supplier_name || p.SupplierName || p.supplier_id || p.SupplierID}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Boxes size={14} color="#f59e0b" />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {p.item_name || p.ItemName || p.item_id || p.ItemID}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '0.98rem', color: '#10b981' }}>
                        {p.quantity || p.Quantity} {p.unit || p.Unit || 'Units'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-danger btn-icon btn-sm"
                        onClick={() =>
                          setDeleteProcureTarget({
                            MessID: p.mess_id || p.MessID,
                            SupplierID: p.supplier_id || p.SupplierID,
                            ItemID: p.item_id || p.ItemID
                          })
                        }
                        title="Delete procurement record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Institutional Procurement"
        maxWidth="500px"
      >
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label className="form-label">Procuring Dining Facility *</label>
              <select
                className="form-select"
                value={formData.mess_id}
                onChange={(e) => setFormData({ ...formData, mess_id: e.target.value })}
              >
                <option value="M1">North Dining Hall (M1)</option>
                <option value="M2">South Dining Hall (M2)</option>
                <option value="M3">Central Mess (M3)</option>
                <option value="M4">Executive Dining (M4)</option>
                <option value="M5">Fast Food & Snacks (M5)</option>
              </select>
            </div>

            <div className="form-group form-grid-full">
              <label className="form-label">Contracted Supplier *</label>
              <select
                className="form-select"
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => {
                  const id = s.supplier_id || s.SupplierID;
                  const name = s.name || s.SupplierName;
                  return (
                    <option key={id} value={id}>
                      {name} (#{id})
                    </option>
                  );
                })}
              </select>
              {errors.supplier_id && <span className="form-error">{errors.supplier_id}</span>}
            </div>

            <div className="form-group form-grid-full">
              <label className="form-label">Inventory Item *</label>
              <select
                className="form-select"
                value={formData.item_id}
                onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
              >
                <option value="">Select Item</option>
                {items.map((it) => {
                  const id = it.item_id || it.ItemID;
                  const name = it.item_name || it.ItemName;
                  return (
                    <option key={id} value={id}>
                      {name} (#{id})
                    </option>
                  );
                })}
              </select>
              {errors.item_id && <span className="form-error">{errors.item_id}</span>}
            </div>

            <div className="form-group form-grid-full">
              <label className="form-label">Purchased Quantity *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
              {errors.quantity && <span className="form-error">{errors.quantity}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--bg-card-border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Logging...' : 'Save Procurement'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteProcureTarget)}
        onClose={() => setDeleteProcureTarget(null)}
        onConfirm={handleDelete}
        title="Delete Procurement Entry"
        message="Are you sure you want to delete this procurement record from the database ledger?"
        confirmText="Confirm Delete"
        isLoading={saving}
      />
    </div>
  );
}
