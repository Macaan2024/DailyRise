import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';

const Goals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', target_date: '', habit_id: '' });
  const [editingGoal, setEditingGoal] = useState(null);

  const goalTitleExamples = [
    'Run 5km without stopping',
    'Read 50 pages',
    'Meditate for 30 minutes',
    'Drink 8 glasses of water',
    'Complete full workout',
    'Learn a new skill',
    'Practice gratitude',
    'Walk 10,000 steps',
    'Sleep 8 hours',
    'No sugar for a week',
    'Finish project',
    'Journal for 15 minutes'
  ];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: habitsData } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('target_date', { ascending: true });

      setHabits(habitsData || []);
      setGoals(goalsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async () => {
    if (!formData.title || !formData.target_date || !formData.habit_id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please fill in all fields',
        confirmButtonColor: '#043915',
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(formData.target_date);
    
    if (selectedDate < today) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Date',
        text: 'Target date must be today or in the future',
        confirmButtonColor: '#043915',
      });
      return;
    }

    try {
      if (editingGoal) {
        // Update existing goal
        const { error } = await supabase
          .from('goals')
          .update({
            title: formData.title,
            target_date: formData.target_date,
            habit_id: parseInt(formData.habit_id),
          })
          .eq('id', editingGoal.id);

        if (error) throw error;

        setGoals(goals.map(g => g.id === editingGoal.id ? {
          ...g,
          title: formData.title,
          target_date: formData.target_date,
          habit_id: parseInt(formData.habit_id),
        } : g));

        Swal.fire({
          icon: 'success',
          title: 'Updated',
          text: 'Goal updated successfully!',
          confirmButtonColor: '#043915',
        });
      } else {
        // Create new goal
        const { data, error } = await supabase
          .from('goals')
          .insert([{
            title: formData.title,
            target_date: formData.target_date,
            habit_id: parseInt(formData.habit_id),
            user_id: user.id,
            is_achieve: false,
          }])
          .select();

        if (error) throw error;

        setGoals([...goals, data[0]]);

        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Goal created successfully!',
          confirmButtonColor: '#043915',
        });
      }

      setFormData({ title: '', target_date: '', habit_id: '' });
      setEditingGoal(null);
      setShowAddModal(false);
    } catch (error) {
      console.error('Add/update goal error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to save goal',
        confirmButtonColor: '#043915',
      });
    }
  };

  const startEditGoal = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      target_date: goal.target_date,
      habit_id: goal.habit_id,
    });
    setShowAddModal(true);
  };

  const toggleGoal = async (goalId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ is_achieve: !currentStatus })
        .eq('id', goalId);

      if (error) throw error;

      setGoals(goals.map(g => g.id === goalId ? { ...g, is_achieve: !currentStatus } : g));
      
      Swal.fire({
        icon: 'success',
        title: 'Updated',
        text: !currentStatus ? 'Goal marked as achieved!' : 'Goal marked as pending',
        timer: 1500,
        confirmButtonColor: '#043915',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update goal',
        confirmButtonColor: '#043915',
      });
    }
  };

  const deleteGoal = async (goalId) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Goal?',
      text: 'This action cannot be undone',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      setGoals(goals.filter(g => g.id !== goalId));
      Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'Goal deleted successfully',
        timer: 1500,
        confirmButtonColor: '#043915',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete goal',
        confirmButtonColor: '#043915',
      });
    }
  };

  const getHabitName = (habitId) => {
    return habits.find(h => h.id === habitId)?.name || 'Unknown Habit';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Layout>
      <Header title="Goals" />
      
      <div className="px-4 py-4 pb-32">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-subheading font-poppins text-dark">My Goals</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-body text-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Goal
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-body text-gray-500 mb-4">No goals yet. Set one to stay motivated!</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Set Your First Goal
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className={`card ${goal.is_achieve ? 'bg-green-50 border border-green-200' : ''}`}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleGoal(goal.id, goal.is_achieve)}
                    className="mt-1 flex-shrink-0"
                  >
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                      goal.is_achieve ? 'bg-primary border-primary' : 'border-gray-300'
                    }`}>
                      {goal.is_achieve && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                  <div className="flex-1">
                    <h3 className={`text-subheading font-poppins ${goal.is_achieve ? 'line-through text-gray-500' : 'text-dark'}`}>
                      {goal.title}
                    </h3>
                    <p className="text-body text-gray-500 mt-1">{getHabitName(goal.habit_id)}</p>
                    <p className="text-xs text-gray-400 mt-1">Target: {formatDate(goal.target_date)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditGoal(goal)}
                      className="p-2 text-gray-400 hover:text-primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end overflow-hidden">
          <div className="bg-white w-full max-h-[85vh] rounded-t-3xl overflow-hidden flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-heading font-poppins text-dark">{editingGoal ? 'Edit Goal' : 'Add Goal'}</h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingGoal(null);
                  setFormData({ title: '', target_date: '', habit_id: '' });
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                <div>
                  <label className="block text-body text-gray-600 mb-3 font-medium">Goal Title</label>
                  <select
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="">Select a goal type...</option>
                    {goalTitleExamples.map((title) => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-body text-gray-600 mb-3 font-medium">Select Habit</label>
                  <select
                    value={formData.habit_id}
                    onChange={(e) => setFormData({ ...formData, habit_id: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="">Choose a habit...</option>
                    {habits.map((habit) => (
                      <option key={habit.id} value={habit.id}>{habit.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-body text-gray-600 mb-3 font-medium">Target Date</label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 bg-white border-t border-gray-100 px-6 py-4 space-y-3 pb-24">
              <button
                onClick={addGoal}
                className="btn-primary w-full py-3 rounded-lg font-medium text-white"
              >
                Create Goal
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full py-3 rounded-lg bg-gray-100 text-gray-600 text-body font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Goals;
