import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Coffee, DollarSign, Utensils, Clock, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../services/api';

export default function MealsPage({ showToast }) {
  const [meals, setMeals] = useState([]);
  const [messList, setMessList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [deleteMealId, setDeleteMealId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    meal_name: '',
    mess_id: '',
    description: '',
    cost: 80,
    timing: 'Breakfast (7:30 AM - 9:30 AM)'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [mlRes, msRes] = await Promise.all([api.getMeals(), api.getMess()]);
      setMeals(mlRes.data);
      setMessList(msRes.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingMeal(null);
    setFormData({
      meal_name: '',
      mess_id: messList[0]?.mess_id ? String(messList[0].mess_id) : '',
      description: '',
      cost: 80,
      timing: 'Breakfast (7:30 AM - 9:30 AM)'
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function openEditModal(m) {
    setEditingMeal(m);
    setFormData({
      meal_name: m.meal_name || m.MealName || '',
      mess_id: m.mess_id ? String(m.mess_id) : '',
      description: m.description || m.Description || '',
      cost: m.cost !== undefined ? m.cost : 80,
      timing: m.timing || 'Breakfast (7:30 AM - 9:30 AM)'
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function validate() {
    const errs = {};
    if (!formData.meal_name.trim()) errs.meal_name = 'Meal item title is required';
    if (!formData.mess_id) errs.mess_id = 'Please assign a dining facility';
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
        cost: Number(formData.cost)
      };

      if (editingMeal) {
        await api.updateMeal(editingMeal.meal_id || editingMeal.MealID, payload);
        showToast('Meal schedule updated successfully', 'success');
      } else {
        await api.createMeal(payload);
        showToast('Meal menu item added successfully', 'success');
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
      await api.deleteMeal(deleteMealId);
      showToast('Meal deleted successfully', 'success');
      setDeleteMealId(null);
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
              <Coffee size={20} />
            </div>
            <div>
              <h2>Meal Schedules & Daily Menus</h2>
              <p>Breakfast, lunch, evening tea, and dinner offerings across dining halls</p>
            </div>
          </div>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {meals.map((m) => (
          <div key={m.meal_id} className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span className="badge badge-info">{m.mess_name || 'Campus Dining'}</span>
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  #{m.meal_id}
                </span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                {m.meal_name || m.MealName}
              </h3>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: 14 }}>
                {m.description || m.Description || 'Standard nutritious daily menu for residents.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--bg-card-border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Per Serving:</span>
                <span style={{ fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}>
                  ₹{m.cost || 80}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--bg-card-border)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(m)}>
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setDeleteMealId(m.meal_id)}>
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
        title={editingMeal ? `Edit Meal: ${editingMeal.meal_name || editingMeal.MealName}` : 'Add Menu Item'}
        maxWidth="520px"
      >
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label className="form-label">Meal Item Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. South Indian Thali, Continental Breakfast"
                value={formData.meal_name}
                onChange={(e) => setFormData({ ...formData, meal_name: e.target.value })}
              />
              {errors.meal_name && <span className="form-error">{errors.meal_name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Mess Facility *</label>
              <select
                className="form-select"
                value={formData.mess_id}
                onChange={(e) => setFormData({ ...formData, mess_id: e.target.value })}
              >
                <option value="">Select Mess</option>
                {messList.map((ms) => (
                  <option key={ms.mess_id} value={ms.mess_id}>
                    {ms.mess_name || ms.MessName}
                  </option>
                ))}
              </select>
              {errors.mess_id && <span className="form-error">{errors.mess_id}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Unit Cost (₹)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>

            <div className="form-group form-grid-full">
              <label className="form-label">Menu Description & Ingredients</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="Served with steamed rice, sambar, seasonal vegetable..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--bg-card-border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingMeal ? 'Update Menu' : 'Add Menu Item'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteMealId)}
        onClose={() => setDeleteMealId(null)}
        onConfirm={handleDelete}
        title="Delete Menu Item"
        message="Are you sure you want to remove this meal from the campus dining schedule?"
        confirmText="Confirm Delete"
        isLoading={saving}
      />
    </div>
  );
}
