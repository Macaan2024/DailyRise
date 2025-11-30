import React, { useState, useEffect } from 'react';

const categories = [
  { id: 'health', name: 'Health', icon: '🏃' },
  { id: 'fitness', name: 'Fitness', icon: '💪' },
  { id: 'mindfulness', name: 'Mindfulness', icon: '🧘' },
  { id: 'learning', name: 'Learning', icon: '📚' },
  { id: 'productivity', name: 'Productivity', icon: '⚡' },
  { id: 'social', name: 'Social', icon: '👥' },
  { id: 'finance', name: 'Finance', icon: '💰' },
  { id: 'creativity', name: 'Creativity', icon: '🎨' },
  { id: 'other', name: 'Other', icon: '✨' },
];

const frequencies = ['daily', 'weekly', 'weekdays', 'weekends'];

const AddHabitModal = ({ habit, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    frequency: 'daily',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (habit) {
      setFormData({
        name: habit.name || '',
        category: habit.category || 'other',
        frequency: habit.frequency || 'daily',
      });
    }
  }, [habit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up">
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-heading font-poppins">{habit ? 'Edit Habit' : 'Add New Habit'}</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-6">
            <div>
              <label className="block text-body text-gray-600 mb-2">Habit Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Drink 8 glasses of water"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-body text-gray-600 mb-2">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      formData.category === cat.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg block mb-1">{cat.icon}</span>
                    <span className="text-small">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-body text-gray-600 mb-2">Frequency</label>
              <div className="flex flex-wrap gap-2">
                {frequencies.map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFormData({ ...formData, frequency: freq })}
                    className={`px-4 py-2 rounded-full text-body capitalize transition-all ${
                      formData.frequency === freq
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 bg-white border-t border-gray-100 p-4 space-y-3 safe-bottom">
          <button 
            type="button"
            onClick={handleSubmit} 
            className="btn-primary w-full py-3"
          >
            {habit ? 'Update Habit' : 'Add Habit'}
          </button>

          {habit && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className={`w-full py-3 rounded-lg text-body font-medium transition-all ${
                showDeleteConfirm
                  ? 'bg-red-500 text-white'
                  : 'bg-red-50 text-red-500 hover:bg-red-100'
              }`}
            >
              {showDeleteConfirm ? 'Confirm Delete' : 'Delete Habit'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddHabitModal;
