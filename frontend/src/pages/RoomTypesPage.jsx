import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Layers, CheckCircle2, DollarSign, Users } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../services/api';

export default function RoomTypesPage({ showToast }) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [deleteTypeId, setDeleteTypeId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    type_name: 'Single Room',
    ac_type: 'AC',
    capacity: 1,
    rent: 5000
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const res = await api.getRoomTypes();
      setTypes(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingType(null);
    setFormData({
      type_name: 'Single Room',
      ac_type: 'AC',
      capacity: 1,
      rent: 5000
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function openEditModal(t) {
    setEditingType(t);
    setFormData({
      type_name: t.type_name || '',
      ac_type: t.ac_type || 'AC',
      capacity: t.capacity || 1,
      rent: t.rent || 5000
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function validate() {
    const errs = {};
    if (!formData.type_name.trim()) errs.type_name = 'Type name is required';
    if (!formData.capacity || formData.capacity < 1) errs.capacity = 'Capacity must be at least 1';
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
        capacity: Number(formData.capacity),
        rent: Number(formData.rent)
      };

      if (editingType) {
        await api.updateRoomType(editingType.type_id, payload);
        showToast('Room type configuration updated', 'success');
      } else {
        await api.createRoomType(payload);
        showToast('New room type created successfully', 'success');
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
      await api.deleteRoomType(deleteTypeId);
      showToast('Room type deleted successfully', 'success');
      setDeleteTypeId(null);
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
              <Layers size={20} />
            </div>
            <div>
              <h2>Room Type Specifications</h2>
              <p>Standardized room tiers, student capacity limits, air-conditioning options, and base rents</p>
            </div>
          </div>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Create Room Type</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {types.map((t) => (
          <div key={t.type_id} className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span className={`badge ${t.ac_type === 'AC' ? 'badge-info' : 'badge-warning'}`}>
                  {t.ac_type || 'Non-AC'}
                </span>
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  #{t.type_id}
                </span>
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                {t.type_name}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={16} color="var(--primary)" />
                  <span>Max Capacity: <strong style={{ color: 'var(--text-primary)' }}>{t.capacity} Resident(s)</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={16} color="#10b981" />
                  <span>Base Rent: <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>₹{t.rent ? Number(t.rent).toLocaleString() : '5,000'}</strong>/mo</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--bg-card-border)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(t)}>
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setDeleteTypeId(t.type_id)}>
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
        title={editingType ? `Edit Room Type: ${editingType.type_name}` : 'Create Room Type'}
        maxWidth="500px"
      >
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label className="form-label">Type Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Deluxe Single AC, Double Non-AC"
                value={formData.type_name}
                onChange={(e) => setFormData({ ...formData, type_name: e.target.value })}
              />
              {errors.type_name && <span className="form-error">{errors.type_name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">AC Configuration</label>
              <select
                className="form-select"
                value={formData.ac_type}
                onChange={(e) => setFormData({ ...formData, ac_type: e.target.value })}
              >
                <option value="AC">Air Conditioned (AC)</option>
                <option value="Non-AC">Non-AC</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Student Capacity *</label>
              <input
                type="number"
                min="1"
                max="10"
                className="form-input"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>

            <div className="form-group form-grid-full">
              <label className="form-label">Monthly Rent Amount (₹)</label>
              <input
                type="number"
                className="form-input"
                value={formData.rent}
                onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--bg-card-border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingType ? 'Update Type' : 'Save Type'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTypeId)}
        onClose={() => setDeleteTypeId(null)}
        onConfirm={handleDelete}
        title="Delete Room Type"
        message="Are you sure you want to delete this room type? Rooms utilizing this configuration may be affected."
        confirmText="Confirm Delete"
        isLoading={saving}
      />
    </div>
  );
}
