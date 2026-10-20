import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Utensils, Phone, MapPin, Users, Coffee } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../services/api';

export default function MessPage({ showToast }) {
  const [messList, setMessList] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMess, setEditingMess] = useState(null);
  const [deleteMessId, setDeleteMessId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    mess_name: '',
    hostel_id: '',
    capacity: 300,
    type: 'Pure Veg',
    contacts: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [mRes, hRes] = await Promise.all([api.getMess(), api.getHostels()]);
      setMessList(mRes.data);
      setHostels(hRes.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingMess(null);
    setFormData({
      mess_name: '',
      hostel_id: hostels[0]?.hostel_id ? String(hostels[0].hostel_id) : '',
      capacity: 300,
      type: 'Pure Veg',
      contacts: ''
    });
    setErrors({});
    setIsModalOpen(true);
  }

  async function openEditModal(m) {
    try {
      const res = await api.getMessById(m.mess_id);
      const data = res.data;
      setEditingMess(data);
      setFormData({
        mess_name: data.mess_name || data.MessName || '',
        hostel_id: data.hostel_id ? String(data.hostel_id) : '',
        capacity: data.capacity || 300,
        type: data.type || data.MessType || 'Pure Veg',
        contacts: data.contacts ? data.contacts.join(', ') : (data.contact_numbers || '')
      });
      setErrors({});
      setIsModalOpen(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function validate() {
    const errs = {};
    if (!formData.mess_name.trim()) errs.mess_name = 'Mess facility name is required';
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
        contacts: formData.contacts
          ? formData.contacts.split(',').map((c) => c.trim()).filter(Boolean)
          : []
      };

      if (editingMess) {
        await api.updateMess(editingMess.mess_id || editingMess.MessID, payload);
        showToast('Mess facility details updated', 'success');
      } else {
        await api.createMess(payload);
        showToast('New mess facility registered', 'success');
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
      await api.deleteMess(deleteMessId);
      showToast('Mess facility deleted successfully', 'success');
      setDeleteMessId(null);
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
              <Utensils size={20} />
            </div>
            <div>
              <h2>Mess & Dining Facility Management</h2>
              <p>Campus dining halls, daily seating capacity, diet categories, and helpdesk contact details</p>
            </div>
          </div>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Dining Facility</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {messList.map((m) => (
          <div key={m.mess_id} className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span className="badge badge-success">{m.type || m.MessType || 'Dining'}</span>
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  ID: #{m.mess_id}
                </span>
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                {m.mess_name || m.MessName}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={16} color="var(--primary)" />
                  <span>Seating Capacity: <strong style={{ color: 'var(--text-primary)' }}>{m.capacity || 300} Students</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={16} color="#f59e0b" />
                  <span>{m.location || m.Location || 'Campus Food Court'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={16} color="#10b981" />
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{m.contact_numbers || '044-220011'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--bg-card-border)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(m)}>
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setDeleteMessId(m.mess_id)}>
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
        title={editingMess ? `Edit Mess: ${editingMess.mess_name || editingMess.MessName}` : 'Register Dining Facility'}
        maxWidth="540px"
      >
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label className="form-label">Dining Facility Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. North Dining Hall, Executive Mess"
                value={formData.mess_name}
                onChange={(e) => setFormData({ ...formData, mess_name: e.target.value })}
              />
              {errors.mess_name && <span className="form-error">{errors.mess_name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Dietary Category</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Pure Veg">Pure Veg</option>
                <option value="Non-Veg Special">Non-Veg Special</option>
                <option value="Mixed">Mixed (Veg & Non-Veg)</option>
                <option value="Quick Bites">Quick Bites & Snacks</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Seating Capacity</label>
              <input
                type="number"
                min="50"
                max="2000"
                className="form-input"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>

            <div className="form-group form-grid-full">
              <label className="form-label">Contact Numbers (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="044-220011, 044-220012"
                value={formData.contacts}
                onChange={(e) => setFormData({ ...formData, contacts: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--bg-card-border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingMess ? 'Update Mess' : 'Register Mess'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteMessId)}
        onClose={() => setDeleteMessId(null)}
        onConfirm={handleDelete}
        title="Delete Dining Facility"
        message="Are you sure you want to delete this mess? Meals and staff members assigned to this mess will be affected by foreign keys."
        confirmText="Confirm Delete"
        isLoading={saving}
      />
    </div>
  );
}
