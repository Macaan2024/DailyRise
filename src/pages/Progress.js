import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';

const Progress = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [weeklyStats, setWeeklyStats] = useState({ completed: 0, missed: 0, total: 0 });

  useEffect(() => {
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentMonth]);

  // Refresh data every 3 seconds for dynamic updates
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchData();
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentMonth]);

  const fetchData = async () => {
    try {
      const { data: habitsData } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      setHabits(habitsData || []);

      if (habitsData && habitsData.length > 0) {
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const { data: logsData } = await supabase
          .from('habit_logs')
          .select('*')
          .in('habit_id', habitsData.map(h => h.id))
          .gte('log_date', startOfMonth.toISOString().split('T')[0])
          .lte('log_date', endOfMonth.toISOString().split('T')[0]);

        setLogs(logsData || []);
        calculateWeeklyStats(logsData || [], habitsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const calculateWeeklyStats = (logsData, habitsData) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const weekLogs = logsData.filter(log => {
      const logDate = new Date(log.log_date);
      return logDate >= startOfWeek && logDate <= today;
    });

    const completed = weekLogs.filter(l => l.status === 'done').length;
    const missed = weekLogs.filter(l => l.status === 'missed').length;
    const daysInWeek = today.getDay() + 1;
    const total = habitsData.length * daysInWeek;

    setWeeklyStats({ completed, missed, total });
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const daysArray = [];
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(null);
    }
    for (let i = 1; i <= days; i++) {
      daysArray.push(i);
    }
    return daysArray;
  };

  const getLogForDay = (day) => {
    if (!day) return null;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (selectedHabit) {
      return logs.find(l => l.habit_id === selectedHabit && l.log_date === dateStr);
    }
    
    const dayLogs = logs.filter(l => l.log_date === dateStr);
    const done = dayLogs.filter(l => l.status === 'done').length;
    const missed = dayLogs.filter(l => l.status === 'missed').length;
    
    if (done > missed) return { status: 'done' };
    if (missed > done) return { status: 'missed' };
    if (dayLogs.length > 0) return { status: 'partial' };
    return null;
  };

  const getDayStatusColor = (log) => {
    if (!log) return 'bg-gray-100';
    switch (log.status) {
      case 'done': return 'bg-primary';
      case 'missed': return 'bg-red-400';
      case 'partial': return 'bg-yellow-400';
      default: return 'bg-gray-100';
    }
  };

  const changeMonth = (delta) => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
    setCurrentMonth(newMonth);
    setSelectedDay(new Date().getDate());
  };

  const calculateStreak = () => {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayLogs = logs.filter(l => l.log_date === dateStr && l.status === 'done');
      
      if (dayLogs.length === 0 && currentDate < today) break;
      if (dayLogs.length > 0) streak++;
      
      currentDate.setDate(currentDate.getDate() - 1);
      if (streak > 365) break;
    }

    return streak;
  };

  const successRate = weeklyStats.total > 0 
    ? Math.round((weeklyStats.completed / weeklyStats.total) * 100) 
    : 0;


  return (
    <Layout>
      <Header title="Progress" />
      
      <div className="px-4 py-4 pb-24">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center">
            <p className="text-heading text-primary font-bold">{calculateStreak()}</p>
            <p className="text-small text-gray-500">Day Streak</p>
          </div>
          <div className="card text-center">
            <p className="text-heading text-primary font-bold">{successRate}%</p>
            <p className="text-small text-gray-500">Success Rate</p>
          </div>
          <div className="card text-center">
            <p className="text-heading text-primary font-bold">{weeklyStats.completed}</p>
            <p className="text-small text-gray-500">This Week</p>
          </div>
        </div>

        <div className="card mb-6">
          <h3 className="text-subheading font-poppins mb-4">Weekly Summary</h3>
          <div className="space-y-4">
            {weeklyStats.completed === 0 && weeklyStats.missed === 0 ? (
              <p className="text-body text-gray-500 text-center py-3">No data</p>
            ) : (
              <>
                {weeklyStats.completed > 0 || weeklyStats.missed > 0 ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-body text-gray-600">Completed</span>
                        <span className="text-body font-medium text-primary">
                          {weeklyStats.completed === 0 && weeklyStats.missed === 0 
                            ? 'No data' 
                            : `${Math.round((weeklyStats.completed / (weeklyStats.completed + weeklyStats.missed)) * 100)}%`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-primary h-3 rounded-full transition-all duration-300"
                          style={{ width: weeklyStats.completed === 0 && weeklyStats.missed === 0 ? '0%' : `${Math.round((weeklyStats.completed / (weeklyStats.completed + weeklyStats.missed)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-body text-gray-600">Missed</span>
                        <span className="text-body font-medium text-orange-500">
                          {weeklyStats.completed === 0 && weeklyStats.missed === 0 
                            ? 'No data' 
                            : `${Math.round((weeklyStats.missed / (weeklyStats.completed + weeklyStats.missed)) * 100)}%`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: weeklyStats.completed === 0 && weeklyStats.missed === 0 ? '0%' : `${Math.round((weeklyStats.missed / (weeklyStats.completed + weeklyStats.missed)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-body text-gray-600">Data</span>
                      <span className="text-body font-medium text-gray-400">No data</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gray-300 h-3 rounded-full"></div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {weeklyStats.completed > 0 && (
          <div className="card mb-6">
            <h3 className="text-body font-poppins mb-3 text-primary">✓ Completed This Week - {weeklyStats.completed}</h3>
            <div className="space-y-2">
              {logs
                .filter(log => {
                  const today = new Date();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - today.getDay());
                  const logDate = new Date(log.log_date);
                  return log.status === 'done' && logDate >= startOfWeek && logDate <= today;
                })
                .sort((a, b) => new Date(b.log_date) - new Date(a.log_date))
                .map((log, idx) => {
                  const habit = habits.find(h => h.id === log.habit_id);
                  return (
                    <div key={`${log.id}-${idx}`} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                      <span className="text-lg text-primary">✓</span>
                      <div className="flex-1">
                        <p className="text-body text-gray-700">{habit?.name}</p>
                        <p className="text-xs text-gray-500">{new Date(log.log_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {weeklyStats.missed > 0 && (
          <div className="card mb-6">
            <h3 className="text-body font-poppins mb-3 text-red-500">✗ Missed This Week - {weeklyStats.missed}</h3>
            <div className="space-y-2">
              {logs
                .filter(log => {
                  const today = new Date();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - today.getDay());
                  const logDate = new Date(log.log_date);
                  return log.status === 'missed' && logDate >= startOfWeek && logDate <= today;
                })
                .sort((a, b) => new Date(b.log_date) - new Date(a.log_date))
                .map((log, idx) => {
                  const habit = habits.find(h => h.id === log.habit_id);
                  return (
                    <div key={`${log.id}-${idx}`} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                      <span className="text-lg text-red-500">✗</span>
                      <div className="flex-1">
                        <p className="text-body text-gray-700">{habit?.name}</p>
                        <p className="text-xs text-gray-500">{new Date(log.log_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => changeMonth(-1)} className="p-2 text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-subheading font-poppins">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => changeMonth(1)} className="p-2 text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="mb-4 overflow-x-auto hide-scrollbar">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedHabit(null)}
                className={`px-3 py-1.5 rounded-full text-small whitespace-nowrap transition-all ${
                  !selectedHabit ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                All Habits
              </button>
              {habits.map((habit) => (
                <button
                  key={habit.id}
                  onClick={() => setSelectedHabit(habit.id)}
                  className={`px-3 py-1.5 rounded-full text-small whitespace-nowrap transition-all ${
                    selectedHabit === habit.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {habit.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-small text-gray-400 py-1">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="bg-transparent"></div>;
              }
              
              const log = getLogForDay(day);
              const isToday = new Date().getDate() === day && 
                new Date().getMonth() === currentMonth.getMonth() &&
                new Date().getFullYear() === currentMonth.getFullYear();
              const isSelected = day === selectedDay;
              
              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-small font-medium transition-all ${
                    getDayStatusColor(log)
                  } ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''} ${
                    isSelected ? 'ring-2 ring-dark ring-offset-2' : ''
                  } ${
                    log?.status === 'done' ? 'text-white' : 'text-gray-600'
                  } cursor-pointer hover:opacity-80`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary"></div>
              <span className="text-small text-gray-500">Done</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-400"></div>
              <span className="text-small text-gray-500">Missed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-100"></div>
              <span className="text-small text-gray-500">No data</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Progress;
