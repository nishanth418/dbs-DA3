import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2, Eye, ShieldCheck, Layers, MapPin } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../services/api';

export default function HostelsPage({ showToast }) {
  const [hostels, setHostels] = useState([]);
  const [wardens, setWardens] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState(null);
  const [deleteHostelId, setDeleteHostelId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Boys',
    total_floors: 3,
    warden_id: '',
    address: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [hRes, wRes] = await Promise.all([api.getHostels(), api.getWardens()]);
      setHostels(hRes.data);
      setWardens(wRes.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingHostel(null);
    setFormData({
      name: '',
      type: 'Boys',
      total_floors: 3,
      warden_id: wardens[0]?.warden_id ? String(wardens[0].warden_id) : '',
      address: ''
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function openEditModal(h) {
    setEditingHostel(h);
    setFormData({
      name: h.name || '',
      type: h.type || 'Boys',
      total_floors: h.total_floors || 3,
      warden_id: h.warden_id ? String(h.warden_id) : '',
      address: h.address || ''
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function validate() {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Hostel name is required';
    if (!formData.total_floors || formData.total_floors < 1) errs.total_floors = 'Valid floor count required';
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
        total_floors: Number(formData.total_floors),
        warden_id: formData.warden_id || null
      };

      if (editingHostel) {
        await api.updateHostel(editingHostel.hostel_id, payload);
        showToast('Hostel updated successfully', 'success');
      } else {
        await api.createHostel(payload);
        showToast('New hostel block created successfully', 'success');
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
      await api.deleteHostel(deleteHostelId);
      showToast('Hostel removed successfully', 'success');
      setDeleteHostelId(null);
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
              <Building2 size={20} />
            </div>
            <div>
              <h2>Hostel Blocks & Housing Management</h2>
              <p>Residential towers, floor infrastructure, and chief warden oversight</p>
            </div>
          </div>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Hostel Block</span>
          </button>
        </div>
      </div>

      {/* Hostel Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 28 }}>
        {hostels.map((h) => (
          <div
            key={h.hostel_id}
            className="panel"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span className="badge badge-info">{h.type || 'Campus Block'}</span>
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  ID: #{h.hostel_id}
                </span>
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                {h.name}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={15} color="var(--primary)" />
                  <span><strong>{h.total_floors}</strong> Total Floors ({h.room_count || 5} Rooms)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={15} color="#10b981" />
                  <span>Warden: <strong style={{ color: 'var(--text-primary)' }}>{h.warden_name || 'Assigned'}</strong></span>
                </div>
                {h.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={15} color="#f59e0b" />
                    <span>{h.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--bg-card-border)' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => openEditModal(h)}
              >
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setDeleteHostelId(h.hostel_id)}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Hostel Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingHostel ? `Edit Hostel: ${editingHostel.name}` : 'Create New Hostel Block'}
        maxWidth="540px"
      >
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label className="form-label">Hostel Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Cauvery Boys Hostel"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Housing Type</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Boys">Boys Hostel</option>
                <option value="Girls">Girls Hostel</option>
                <option value="PG / Scholars">PG / Scholars</option>
                <option value="Co-ed">Co-ed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Total Floors *</label>
              <input
                type="number"
                min="1"
                max="20"
                className="form-input"
                value={formData.total_floors}
                onChange={(e) => setFormData({ ...formData, total_floors: e.target.value })}
              />
              {errors.total_floors && <span className="form-error">{errors.total_floors}</span>}
            </div>

            <div className="form-group form-grid-full">
              <label className="form-label">Assign Warden</label>
              <select
                className="form-select"
                value={formData.warden_id}
                onChange={(e) => setFormData({ ...formData, warden_id: e.target.value })}
              >
                <option value="">No Warden Assigned</option>
                {wardens.map((w) => (
                  <option key={w.warden_id} value={w.warden_id}>
                    {w.name} ({w.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group form-grid-full">
              <label className="form-label">Campus Location / Address</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="North Campus Block A..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--bg-card-border)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingHostel ? 'Update Hostel' : 'Create Hostel'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteHostelId)}
        onClose={() => setDeleteHostelId(null)}
        onConfirm={handleDelete}
        title="Delete Hostel Block"
        message="Are you sure you want to delete this hostel? All room records and resident allocations linked to this building will be impacted by foreign key constraints."
        confirmText="Confirm Delete"
        isLoading={saving}
      />
    </div>
  );
}
