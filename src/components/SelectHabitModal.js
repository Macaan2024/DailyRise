import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const SelectHabitModal = ({ onClose, onSelect }) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHabits(data || []);
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHabit = (habit) => {
    onSelect(habit);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end overflow-hidden">
      <div className="bg-white w-full max-h-[85vh] rounded-t-3xl overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-heading font-poppins text-dark">Select a Habit</h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : habits.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-body text-gray-500 mb-4">No habits created yet</p>
              <p className="text-body text-gray-400">Create a new habit using the + Add Habit button</p>
            </div>
          ) : (
            <div className="space-y-3">
              {habits.map((habit) => (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => handleSelectHabit(habit)}
                  className="w-full p-4 border border-gray-200 rounded-lg text-left hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-body font-medium text-dark">{habit.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{habit.category} • {habit.frequency}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-4 pb-24">
          <button 
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-lg bg-gray-100 text-gray-600 text-body font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectHabitModal;
