import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';
import HabitCard from '../components/HabitCard';
import AddHabitModal from '../components/AddHabitModal';
import SelectHabitModal from '../components/SelectHabitModal';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [habits, setHabits] = useState([]);
  const [todayLogs, setTodayLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const [goalsCount, setGoalsCount] = useState(0);
  const [badgesCount, setBadgesCount] = useState(0);
  const [communityCount, setCommunityCount] = useState(0);
  const [userPoints, setUserPoints] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      fetchHabits();
      fetchGoalsAndBadges();
      const savedPoints = localStorage.getItem(`user_points_${user.id}`);
      if (savedPoints) {
        setUserPoints(parseInt(savedPoints));
      }
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

  const fetchGoalsAndBadges = async () => {
    try {
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      const { data: badgesData } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id);

      const { data: communitiesData } = await supabase
        .from('community_members')
        .select('*')
        .eq('user_id', user.id);

      const { data: allLogs } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('status', 'done');

      const userCompletedLogs = allLogs?.filter(log => {
        const habit = habits.find(h => h.id === log.habit_id);
        return habit?.user_id === user.id;
      }) || [];

      setGoalsCount(goalsData?.length || 0);
      setBadgesCount(badgesData?.length || 0);
      setCommunityCount(communitiesData?.length || 0);
      setUserPoints(userCompletedLogs.length * 10);
    } catch (error) {
      console.error('Error fetching goals and badges:', error);
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
      <Header title="Daily Rise" />
      
      <div className="px-4 py-4">
        {/* Tagline Section */}
        <div className="bg-gradient-to-r from-primary to-green-700 rounded-xl p-4 mb-6 text-white">
          <h1 className="text-heading font-poppins font-bold mb-1">Level up your life,</h1>
          <p className="text-body">every single day</p>
          <p className="text-xs mt-3 opacity-90">Join thousands building better habits together</p>
        </div>

        <div className="mb-6">
          <p className="text-body text-gray-500">{getDayName()}</p>
          <p className="text-subheading text-dark">{formatDate()}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card">
            <p className="text-body text-gray-500">Today's Progress</p>
            <p className="text-heading text-primary mt-1">{completedCount}/{totalCount}</p>
            <p className="text-xs text-gray-400 mt-1">{progressPercent}% Done</p>
          </div>
          <div className="card">
            <p className="text-body text-gray-500">Badges Earned</p>
            <p className="text-heading text-primary mt-1">{badgesCount}</p>
            <p className="text-xs text-gray-400 mt-1">Achievements</p>
          </div>
          <div className="card">
            <p className="text-body text-gray-500">Points</p>
            <p className="text-heading text-primary mt-1">{userPoints}</p>
            <p className="text-xs text-gray-400 mt-1">Total Earned</p>
          </div>
          <div className="card">
            <p className="text-body text-gray-500">Communities</p>
            <p className="text-heading text-primary mt-1">{communityCount}</p>
            <p className="text-xs text-gray-400 mt-1">Groups Joined</p>
          </div>
        </div>

        {/* DailyRise Highlights */}
        <div className="mb-6">
          <h3 className="text-subheading font-poppins text-dark mb-3">What Makes Us Unique</h3>
          
          {/* Feature 1: Gamified Progress */}
          <div 
            onClick={() => navigate('/badges')}
            className="card mb-3 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🏆</span>
              </div>
              <div className="flex-1">
                <p className="text-body font-medium text-dark">Gamified Progress</p>
                <p className="text-xs text-gray-500 mt-1">Earn badges & rewards as you complete habits</p>
                <p className="text-xs text-primary font-medium mt-2">{badgesCount} Badge{badgesCount !== 1 ? 's' : ''} Earned</p>
              </div>
            </div>
          </div>

          {/* Feature 2: Goals Setting */}
          <div 
            onClick={() => navigate('/goals')}
            className="card mb-3 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🎯</span>
              </div>
              <div className="flex-1">
                <p className="text-body font-medium text-dark">Set & Achieve Goals</p>
                <p className="text-xs text-gray-500 mt-1">Connect habits with your personal goals</p>
                <p className="text-xs text-primary font-medium mt-2">{goalsCount} Goal{goalsCount !== 1 ? 's' : ''} Created</p>
              </div>
            </div>
          </div>

          {/* Feature 3: Smart Insights */}
          <div 
            onClick={() => navigate('/progress')}
            className="card mb-3 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">📈</span>
              </div>
              <div className="flex-1">
                <p className="text-body font-medium text-dark">Smart Insights</p>
                <p className="text-xs text-gray-500 mt-1">Detailed analytics & trends for your habits</p>
                <p className="text-xs text-primary font-medium mt-2">View your progress calendar</p>
              </div>
            </div>
          </div>

          {/* Feature 4: Community Accountability */}
          <div 
            onClick={() => navigate('/community')}
            className="card mb-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🤝</span>
              </div>
              <div className="flex-1">
                <p className="text-body font-medium text-dark">Community Accountability</p>
                <p className="text-xs text-gray-500 mt-1">Join groups and build habits together</p>
                <p className="text-xs text-primary font-medium mt-2">{communityCount} Group{communityCount !== 1 ? 's' : ''} Joined</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-subheading font-poppins text-dark">My Habits</h2>
          {/* UPDATED: Add Habit button with solid green background, no icon */}
          <button
            onClick={() => {
              setEditHabit(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-[#043915] text-white text-xs rounded-lg font-medium hover:bg-[#043915]/90 transition-colors"
          >
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
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex-1"
              >
                Create New Habit
              </button>
              <button
                onClick={() => setShowSelectModal(true)}
                className="flex-1 py-3 rounded-lg bg-gray-100 text-gray-600 text-body font-medium"
              >
                Select Habit
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
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

      {showSelectModal && (
        <SelectHabitModal
          onClose={() => setShowSelectModal(false)}
          onSelect={(habit) => {
            setEditHabit(habit);
            setShowSelectModal(false);
            setShowAddModal(true);
          }}
        />
      )}
    </Layout>
  );
};

export default Home;