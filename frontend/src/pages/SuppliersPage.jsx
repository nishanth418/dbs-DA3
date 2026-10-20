import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Truck, Phone, Building2 } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../services/api';

export default function SuppliersPage({ showToast }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteSupplierId, setDeleteSupplierId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phones: '',
    address: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const res = await api.getSuppliers();
      setSuppliers(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phones: '',
      address: ''
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function openEditModal(s) {
    setEditingSupplier(s);
    setFormData({
      name: s.name || s.SupplierName || '',
      contact_person: s.contact_person || '',
      email: s.email || '',
      phones: s.phones ? s.phones.join(', ') : (s.phone_numbers || ''),
      address: s.address || ''
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function validate() {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Supplier / Vendor title is required';
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
        phones: formData.phones
          ? formData.phones.split(',').map((p) => p.trim()).filter(Boolean)
          : []
      };

      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.supplier_id || editingSupplier.SupplierID, payload);
        showToast('Supplier contract updated successfully', 'success');
      } else {
        await api.createSupplier(payload);
        showToast('New vendor contract registered', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setSaving(true);
      await api.deleteSupplier(deleteSupplierId);
      showToast('Supplier removed successfully', 'success');
      setDeleteSupplierId(null);
      loadData();
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
              <Truck size={20} />
            </div>
            <div>
              <h2>Suppliers & Campus Vendor Contracts</h2>
              <p>Provisions distributors, electrical suppliers, and institutional procurement partners</p>
            </div>
          </div>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {suppliers.map((s) => (
          <div key={s.supplier_id || s.SupplierID} className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span className="badge badge-info">Verified Partner</span>
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  ID: #{s.supplier_id || s.SupplierID}
                </span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                {s.name || s.SupplierName}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={15} color="#10b981" />
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{s.phone_numbers || '9876543210'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={15} color="var(--primary)" />
                  <span>Institutional Procurement Approved</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--bg-card-border)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(s)}>
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setDeleteSupplierId(s.supplier_id || s.SupplierID)}>
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? `Edit Supplier: ${editingSupplier.name || editingSupplier.SupplierName}` : 'Register Supplier Partner'}
        maxWidth="520px"
      >
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label className="form-label">Vendor / Company Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Annapurna Agro, Delta Dairy, Supreme Linen"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group form-grid-full">
              <label className="form-label">Contact Phone Numbers (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="9876500001, 9876500002"
                value={formData.phones}
                onChange={(e) => setFormData({ ...formData, phones: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--bg-card-border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingSupplier ? 'Update Vendor' : 'Register Vendor'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteSupplierId)}
        onClose={() => setDeleteSupplierId(null)}
        onConfirm={handleDelete}
        title="Delete Supplier Partner"
        message="Are you sure you want to delete this supplier? Any procurement records referencing this supplier may be affected."
        confirmText="Confirm Delete"
        isLoading={saving}
      />
    </div>
  );
}
