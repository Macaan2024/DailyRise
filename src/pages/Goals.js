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
  const [formData, setFormData] = useState({ title: '', target_date: '', habit_id: '', time: '09:00' });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // --- REUSABLE FUNCTION: AWARD POINTS ---
  const awardPoints = async (amount = 10) => {
    if (!user) return;
    
    try {
      const { data: pointsRecords, error: fetchError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      if (pointsRecords && pointsRecords.length > 0) {
        for (const record of pointsRecords) {
          await supabase
            .from('user_points')
            .update({ 
              total_points: (record.total_points || 0) + amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', record.id);
        }
      }

      // Update Local Storage for immediate UI feedback
      const currentLocal = parseInt(localStorage.getItem(`user_points_${user.id}`) || '0');
      const newLocal = currentLocal + amount;
      localStorage.setItem(`user_points_${user.id}`, newLocal.toString());
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: `user_points_${user.id}`,
        newValue: newLocal.toString(),
      }));

    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  // --- GOAL ACTIONS ---
  const markGoalAsDone = async (goalId) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ is_achieve: true })
        .eq('id', goalId);

      if (error) throw error;

      setGoals(goals.map(g => g.id === goalId ? { ...g, is_achieve: true } : g));
      await awardPoints(10);

      Swal.fire({
        icon: 'success',
        title: '+10 Points!',
        text: 'Goal completed successfully.',
        timer: 1500,
        showConfirmButton: false,
        confirmButtonColor: '#043915',
      });
    } catch (error) {
      console.error('Error updating goal:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Could not update goal status.',
      });
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

        // --- Automatically Create Alarm/Reminder ---
        const habit = habits.find(h => h.id === parseInt(formData.habit_id));
        if (habit) {
          try {
            const storedReminders = localStorage.getItem(`reminders_${user.id}`);
            const currentReminders = storedReminders ? JSON.parse(storedReminders) : [];

            const newReminder = {
              id: Date.now() + Math.random(),
              habitId: parseInt(formData.habit_id),
              habitName: habit.name,
              time: formData.time || '09:00',
              alarmSound: 'beep',
              enabled: true,
            };

            const updatedReminders = [...currentReminders, newReminder];
            localStorage.setItem(`reminders_${user.id}`, JSON.stringify(updatedReminders));

            Swal.fire({
              icon: 'success',
              title: 'Goal & Alarm Set!',
              text: `Goal created and a daily reminder set for ${formData.time || '09:00'}`,
              confirmButtonColor: '#043915',
            });
            
            setFormData({ title: '', target_date: '', habit_id: '', time: '09:00' });
            setEditingGoal(null);
            setShowAddModal(false);
            return;
          } catch (storageError) {
            console.error("Error setting automatic alarm:", storageError);
          }
        }

        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Goal created successfully!',
          confirmButtonColor: '#043915',
        });
      }

      setFormData({ title: '', target_date: '', habit_id: '', time: '09:00' });
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
      time: '09:00'
    });
    setShowAddModal(true);
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

  // --- DATE HELPERS ---
  const getDateStatus = (dateStr) => {
    if (!dateStr) return 'future';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0); 
    
    if (target.getTime() === today.getTime()) return 'today';
    if (target < today) return 'past';
    return 'future';
  };

  return (
    <Layout>
      <Header title="Goals" />
      
      <div className="px-4 py-4 pb-32">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[14px] font-medium font-[Poppins] text-primary-dark">My Goals</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full shadow-md hover:bg-primary-dark transition-all active:scale-95 text-[11px] font-medium font-[Roboto]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Goal
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-primary/5">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🎯
            </div>
            <h3 className="text-[14px] font-medium font-[Poppins] text-dark mb-2">No Goals Yet</h3>
            <p className="text-[11px] font-[Roboto] text-gray-500 mb-6 max-w-xs mx-auto">Set a specific goal for your habits to stay motivated and track your progress!</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-white px-6 py-2 rounded-lg text-[11px] font-medium font-[Roboto]"
            >
              Set Your First Goal
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const dateStatus = getDateStatus(goal.target_date);
              const isAchieved = goal.is_achieve === true || goal.is_achieve === 'true';

              // Dynamic Styling Logic
              let cardClasses = "bg-white border-primary/20"; // Default (Future)
              let statusBadge = null;

              if (isAchieved) {
                cardClasses = "bg-green-50 border-green-200";
                statusBadge = (
                  <span className="flex items-center gap-1 text-green-700 bg-white px-3 py-1 rounded-full text-[11px] font-medium font-[Roboto] shadow-sm border border-green-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    COMPLETED
                  </span>
                );
              } else if (dateStatus === 'past') {
                cardClasses = "bg-red-50 border-red-200";
                statusBadge = (
                  <span className="text-red-600 bg-white px-3 py-1 rounded-full text-[11px] font-medium font-[Roboto] shadow-sm border border-red-100 opacity-80">
                    MISSED
                  </span>
                );
              } else if (dateStatus === 'today') {
                cardClasses = "bg-white border-primary border-2 shadow-lg scale-[1.02]";
                statusBadge = (
                  <button 
                    onClick={() => markGoalAsDone(goal.id)}
                    className="flex items-center gap-1 bg-primary text-white hover:bg-primary-dark active:scale-95 transition-all px-4 py-1.5 rounded-full text-[11px] font-medium font-[Roboto] shadow-md animate-pulse-slow"
                  >
                    MARK DONE (+10 PTS)
                  </button>
                );
              } else {
                 statusBadge = (
                    <span className="text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full text-[11px] font-medium font-[Roboto]">
                      UPCOMING
                    </span>
                 );
              }

              return (
                <div key={goal.id} className={`card p-5 border rounded-2xl transition-all ${cardClasses}`}>
                  <div className="flex items-start gap-3 justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-medium font-[Roboto] uppercase tracking-wider text-primary/70">
                            {getHabitName(goal.habit_id)}
                          </span>
                          {/* Top right Edit/Delete for standard view */}
                          <div className="flex gap-2">
                             <button onClick={() => startEditGoal(goal)} className="text-gray-400 hover:text-primary transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                             </button>
                             <button onClick={() => deleteGoal(goal.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                             </button>
                          </div>
                      </div>
                      
                      <h3 className={`text-[14px] font-medium font-[Poppins] mb-2 ${isAchieved ? 'line-through text-gray-400' : 'text-dark'}`}>
                        {goal.title}
                      </h3>
                      
                      <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-1 text-[11px] font-[Roboto] text-gray-600 bg-white/50 px-2 py-1 rounded-md">
                             <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                             </svg>
                             {formatDate(goal.target_date)}
                          </div>
                          <div>
                             {statusBadge}
                          </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end overflow-hidden">
          <div className="bg-white w-full max-h-[85vh] rounded-t-3xl overflow-hidden flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-[14px] font-medium font-[Poppins] text-dark">{editingGoal ? 'Edit Goal' : 'Add Goal'}</h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingGoal(null);
                  setFormData({ title: '', target_date: '', habit_id: '', time: '09:00' });
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
                  <label className="block text-[11px] font-medium font-[Roboto] text-gray-600 mb-3">Goal Title</label>
                  <select
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field w-full text-[11px] font-[Roboto]"
                  >
                    <option value="">Select a goal type...</option>
                    {goalTitleExamples.map((title) => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium font-[Roboto] text-gray-600 mb-3">Select Habit</label>
                  <select
                    value={formData.habit_id}
                    onChange={(e) => setFormData({ ...formData, habit_id: e.target.value })}
                    className="input-field w-full text-[11px] font-[Roboto]"
                  >
                    <option value="">Choose a habit...</option>
                    {habits.map((habit) => (
                      <option key={habit.id} value={habit.id}>{habit.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium font-[Roboto] text-gray-600 mb-3">Target Date</label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    className="input-field w-full text-[11px] font-[Roboto]"
                  />
                </div>

                {!editingGoal && (
                  <div>
                    <label className="block text-[11px] font-medium font-[Roboto] text-gray-600 mb-3">Daily Reminder Time</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="input-field w-full text-[11px] font-[Roboto]"
                      />
                      <span className="text-[11px] font-[Roboto] text-gray-400 w-1/3">
                        Sets a daily alarm
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 bg-white border-t border-gray-100 px-6 py-4 space-y-3 pb-24">
              <button
                onClick={addGoal}
                className="btn-primary w-full py-3 rounded-lg text-[11px] font-medium font-[Roboto] text-white"
              >
                {editingGoal ? 'Update Goal' : 'Create Goal & Set Alarm'}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full py-3 rounded-lg bg-gray-100 text-gray-600 text-[11px] font-medium font-[Roboto]"
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