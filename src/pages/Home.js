import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';
import HabitCard from '../components/HabitCard';
import AddHabitModal from '../components/AddHabitModal';

const Home = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [todayLogs, setTodayLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editHabit, setEditHabit] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      fetchHabits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchHabits = async () => {
    try {
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (habitsError) throw habitsError;
      setHabits(habitsData || []);

      const habitIds = habitsData?.map(h => h.id) || [];
      if (habitIds.length > 0) {
        const { data: logsData, error: logsError } = await supabase
          .from('habit_logs')
          .select('*')
          .in('habit_id', habitIds)
          .eq('log_date', today);

        if (logsError) throw logsError;

        const logsMap = {};
        logsData?.forEach(log => {
          logsMap[log.habit_id] = log;
        });
        setTodayLogs(logsMap);
      }
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHabit = async (habitId, currentStatus) => {
    try {
      const existingLog = todayLogs[habitId];
      let newStatus;

      if (!existingLog) {
        newStatus = 'done';
      } else if (currentStatus === 'done') {
        newStatus = 'missed';
      } else if (currentStatus === 'missed') {
        newStatus = null;
      } else {
        newStatus = 'done';
      }

      if (newStatus === null && existingLog) {
        await supabase
          .from('habit_logs')
          .delete()
          .eq('id', existingLog.id);

        const newLogs = { ...todayLogs };
        delete newLogs[habitId];
        setTodayLogs(newLogs);
      } else if (existingLog) {
        const { data, error } = await supabase
          .from('habit_logs')
          .update({ status: newStatus })
          .eq('id', existingLog.id)
          .select()
          .single();

        if (error) throw error;
        setTodayLogs({ ...todayLogs, [habitId]: data });
      } else {
        const { data, error } = await supabase
          .from('habit_logs')
          .insert([{ habit_id: habitId, log_date: today, status: newStatus }])
          .select()
          .single();

        if (error) throw error;
        setTodayLogs({ ...todayLogs, [habitId]: data });
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const handleAddHabit = async (habitData) => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .insert([{ ...habitData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setHabits([data, ...habits]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  };

  const handleUpdateHabit = async (habitId, habitData) => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .update(habitData)
        .eq('id', habitId)
        .select()
        .single();

      if (error) throw error;
      setHabits(habits.map(h => h.id === habitId ? data : h));
      setEditHabit(null);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);

      if (error) throw error;
      setHabits(habits.filter(h => h.id !== habitId));
      setEditHabit(null);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const completedCount = Object.values(todayLogs).filter(l => l.status === 'done').length;
  const totalCount = habits.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const formatDate = () => {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <Layout>
      <Header title="Daily Rises" />
      
      <div className="px-4 py-4">
        <div className="mb-6">
          <p className="text-body text-gray-500">{getDayName()}</p>
          <p className="text-subheading text-dark">{formatDate()}</p>
        </div>

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-body text-gray-500">Today's Progress</p>
              <p className="text-heading text-primary">{completedCount}/{totalCount} Habits</p>
            </div>
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#e5e7eb"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#043915"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={`${progressPercent * 1.76} 176`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-body font-medium text-dark">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-subheading font-poppins text-dark">My Habits</h2>
          <button
            onClick={() => {
              setEditHabit(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1 text-body text-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Habit
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : habits.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-body text-gray-500 mb-4">No habits yet. Start by adding one!</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Add Your First Habit
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                log={todayLogs[habit.id]}
                onToggle={() => handleToggleHabit(habit.id, todayLogs[habit.id]?.status)}
                onEdit={() => {
                  setEditHabit(habit);
                  setShowAddModal(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddHabitModal
          habit={editHabit}
          onClose={() => {
            setShowAddModal(false);
            setEditHabit(null);
          }}
          onSave={editHabit ? (data) => handleUpdateHabit(editHabit.id, data) : handleAddHabit}
          onDelete={editHabit ? () => handleDeleteHabit(editHabit.id) : null}
        />
      )}
    </Layout>
  );
};

export default Home;
