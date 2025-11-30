import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';

const Logs = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [editingLog, setEditingLog] = useState(null);
  const [noteInput, setNoteInput] = useState('');

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

      setHabits(habitsData || []);

      if (habitsData && habitsData.length > 0) {
        const { data: logsData } = await supabase
          .from('habit_logs')
          .select('*, habits(name, category)')
          .in('habit_id', habitsData.map(h => h.id))
          .order('log_date', { ascending: false })
          .limit(100);

        setLogs(logsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (logId) => {
    try {
      const { error } = await supabase
        .from('habit_logs')
        .update({ notes: noteInput })
        .eq('id', logId);

      if (error) throw error;

      setLogs(logs.map(l => l.id === logId ? { ...l, notes: noteInput } : l));
      setEditingLog(null);
      setNoteInput('');
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const groupLogsByDate = () => {
    const filteredLogs = selectedHabit 
      ? logs.filter(l => l.habit_id === selectedHabit)
      : logs;

    const grouped = {};
    filteredLogs.forEach(log => {
      const date = log.log_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(log);
    });
    return grouped;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done':
        return (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'missed':
        return (
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
    }
  };

  const groupedLogs = groupLogsByDate();

  return (
    <Layout>
      <Header title="Habit Logs" />
      
      <div className="px-4 py-4">
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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : Object.keys(groupedLogs).length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-body text-gray-500">No logs yet. Start tracking your habits!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedLogs).map(([date, dateLogs]) => (
              <div key={date}>
                <h3 className="text-body text-gray-500 mb-3">{formatDate(date)}</h3>
                <div className="space-y-2">
                  {dateLogs.map((log) => (
                    <div key={log.id} className="card">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(log.status)}
                        <div className="flex-1">
                          <h4 className="text-subheading text-dark">{log.habits?.name || 'Unknown Habit'}</h4>
                          <p className="text-small text-gray-400 capitalize">{log.status}</p>
                          
                          {editingLog === log.id ? (
                            <div className="mt-2">
                              <textarea
                                value={noteInput}
                                onChange={(e) => setNoteInput(e.target.value)}
                                placeholder="Add a note..."
                                className="input-field text-small resize-none"
                                rows={2}
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleUpdateNote(log.id)}
                                  className="btn-primary text-small py-1 px-3"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingLog(null);
                                    setNoteInput('');
                                  }}
                                  className="btn-ghost text-small py-1 px-3"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : log.notes ? (
                            <p 
                              className="text-body text-gray-600 mt-2 cursor-pointer hover:text-primary"
                              onClick={() => {
                                setEditingLog(log.id);
                                setNoteInput(log.notes);
                              }}
                            >
                              {log.notes}
                            </p>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingLog(log.id);
                                setNoteInput('');
                              }}
                              className="text-small text-primary mt-2"
                            >
                              + Add note
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Logs;
