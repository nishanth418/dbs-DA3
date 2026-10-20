import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BedDouble, Filter, Layers, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../services/api';

export default function RoomsPage({ showToast }) {
  const [rooms, setRooms] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [hostelFilter, setHostelFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deleteRoomId, setDeleteRoomId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    room_number: '',
    hostel_id: '',
    type_id: '',
    floor: 1,
    status: 'Available'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadData();
  }, [hostelFilter, typeFilter, statusFilter]);

  async function loadMeta() {
    try {
      const [hRes, tRes] = await Promise.all([api.getHostels(), api.getRoomTypes()]);
      setHostels(hRes.data);
      setRoomTypes(tRes.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      const res = await api.getRooms({
        hostel_id: hostelFilter,
        type_id: typeFilter,
        status: statusFilter
      });
      setRooms(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingRoom(null);
    setFormData({
      room_number: '',
      hostel_id: hostels[0]?.hostel_id ? String(hostels[0].hostel_id) : '',
      type_id: roomTypes[0]?.type_id ? String(roomTypes[0].type_id) : '',
      floor: 1,
      status: 'Available'
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function openEditModal(r) {
    setEditingRoom(r);
    setFormData({
      room_number: r.room_number || '',
      hostel_id: r.hostel_id ? String(r.hostel_id) : '',
      type_id: r.type_id ? String(r.type_id) : '',
      floor: r.floor || 1,
      status: r.status || 'Available'
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function validate() {
    const errs = {};
    if (!formData.room_number.trim()) errs.room_number = 'Room number is required';
    if (!formData.hostel_id) errs.hostel_id = 'Please select a hostel building';
    if (!formData.type_id) errs.type_id = 'Please select a room type';
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
        floor: Number(formData.floor)
      };

      if (editingRoom) {
        await api.updateRoom(editingRoom.room_id, payload);
        showToast('Room configuration updated', 'success');
      } else {
        await api.createRoom(payload);
        showToast('New room registered in hostel block', 'success');
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
      await api.deleteRoom(deleteRoomId);
      showToast('Room deleted successfully', 'success');
      setDeleteRoomId(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Header */}
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
              <BedDouble size={20} />
            </div>
            <div>
              <h2>Room Allocation & Housing Registry</h2>
              <p>Configure room numbers, floors, air-conditioning specifications, and occupancy status</p>
            </div>
          </div>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add New Room</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        {/* Filters */}
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: 160 }}
              value={hostelFilter}
              onChange={(e) => setHostelFilter(e.target.value)}
            >
              <option value="">All Hostels</option>
              {hostels.map((h) => (
                <option key={h.hostel_id} value={h.hostel_id}>
                  {h.name}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ width: 'auto', minWidth: 160 }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Room Types</option>
              {roomTypes.map((t) => (
                <option key={t.type_id} value={t.type_id}>
                  {t.type_name} ({t.ac_type})
                </option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ width: 'auto', minWidth: 140 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Total: <strong>{rooms.length}</strong> rooms found
          </span>
        </div>

        {/* Data Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room No</th>
                <th>Hostel Building</th>
                <th>Floor</th>
                <th>Room Configuration</th>
                <th>Capacity & Rent</th>
                <th>Availability</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                    <div className="spin-animation" style={{ display: 'inline-block', marginBottom: 8 }}>
                      <BedDouble size={24} color="var(--primary)" />
                    </div>
                    <p>Loading rooms from database...</p>
                  </td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                    No rooms matched the selected filter criteria.
                  </td>
                </tr>
              ) : (
                rooms.map((r) => (
                  <tr key={r.room_id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8', fontSize: '0.92rem' }}>
                        Room {r.room_number}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 600 }}>
                        <Building2 size={15} color="var(--primary)" />
                        <span>{r.hostel_name}</span>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '0.85rem' }}>Floor {r.floor}</span>
                    </td>

                    <td>
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.type_name}</span>
                        <span
                          className={`badge ${r.ac_type === 'AC' ? 'badge-info' : 'badge-warning'}`}
                          style={{ marginLeft: 8 }}
                        >
                          {r.ac_type || 'Non-AC'}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div>
                        <span style={{ fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                          ₹{r.rent ? Number(r.rent).toLocaleString() : '4,500'}/mo
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>
                          Max Capacity: {r.capacity || 2} Students
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          r.status === 'Available'
                            ? 'badge-success'
                            : r.status === 'Occupied'
                            ? 'badge-purple'
                            : 'badge-warning'
                        }`}
                      >
                        {r.status || 'Available'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-icon btn-sm"
                          onClick={() => openEditModal(r)}
                          title="Edit room"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon btn-sm"
                          onClick={() => setDeleteRoomId(r.room_id)}
                          title="Delete room"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? `Edit Room: ${editingRoom.room_number}` : 'Register New Room'}
        maxWidth="540px"
      >
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Room Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 101, 204, 305"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              />
              {errors.room_number && <span className="form-error">{errors.room_number}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Hostel Block *</label>
              <select
                className="form-select"
                value={formData.hostel_id}
                onChange={(e) => setFormData({ ...formData, hostel_id: e.target.value })}
              >
                <option value="">Select Hostel</option>
                {hostels.map((h) => (
                  <option key={h.hostel_id} value={h.hostel_id}>
                    {h.name}
                  </option>
                ))}
              </select>
              {errors.hostel_id && <span className="form-error">{errors.hostel_id}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Room Type *</label>
              <select
                className="form-select"
                value={formData.type_id}
                onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
              >
                <option value="">Select Type</option>
                {roomTypes.map((t) => (
                  <option key={t.type_id} value={t.type_id}>
                    {t.type_name} ({t.ac_type}, Cap: {t.capacity})
                  </option>
                ))}
              </select>
              {errors.type_id && <span className="form-error">{errors.type_id}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Floor Number *</label>
              <input
                type="number"
                min="0"
                max="20"
                className="form-input"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              />
            </div>

            <div className="form-group form-grid-full">
              <label className="form-label">Occupancy Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Available">Available (Vacant)</option>
                <option value="Occupied">Occupied (Residents Active)</option>
                <option value="Maintenance">Under Maintenance</option>
              </select>
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
              {saving ? 'Saving...' : editingRoom ? 'Update Room' : 'Add Room'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteRoomId)}
        onClose={() => setDeleteRoomId(null)}
        onConfirm={handleDelete}
        title="Delete Room Record"
        message="Are you sure you want to delete this room? Any student allocated to this room will become unassigned."
        confirmText="Confirm Delete"
        isLoading={saving}
      />
    </div>
  );
}
