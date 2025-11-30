import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';

const Notifications = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    if (user) {
      fetchData();
    }
    checkNotificationPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const fetchData = async () => {
    try {
      const { data: habitsData } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      setHabits(habitsData || []);

      const storedReminders = localStorage.getItem(`reminders_${user.id}`);
      if (storedReminders) {
        setReminders(JSON.parse(storedReminders));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addReminder = () => {
    if (!selectedHabit || !reminderTime) return;

    const habit = habits.find(h => h.id === parseInt(selectedHabit));
    const newReminder = {
      id: Date.now(),
      habitId: parseInt(selectedHabit),
      habitName: habit?.name || 'Unknown',
      time: reminderTime,
      enabled: true,
    };

    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    localStorage.setItem(`reminders_${user.id}`, JSON.stringify(updatedReminders));
    
    setShowAddModal(false);
    setSelectedHabit('');
    setReminderTime('09:00');

    scheduleNotification(newReminder);
  };

  const toggleReminder = (reminderId) => {
    const updatedReminders = reminders.map(r => 
      r.id === reminderId ? { ...r, enabled: !r.enabled } : r
    );
    setReminders(updatedReminders);
    localStorage.setItem(`reminders_${user.id}`, JSON.stringify(updatedReminders));
  };

  const deleteReminder = (reminderId) => {
    const updatedReminders = reminders.filter(r => r.id !== reminderId);
    setReminders(updatedReminders);
    localStorage.setItem(`reminders_${user.id}`, JSON.stringify(updatedReminders));
  };

  const scheduleNotification = (reminder) => {
    if (notificationPermission !== 'granted' || !reminder.enabled) return;

    const [hours, minutes] = reminder.time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      if (document.hidden) {
        new Notification('DailyRise Reminder', {
          body: `Time to complete: ${reminder.habitName}`,
          icon: '/logo192.png',
        });
      }
    }, delay);
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  return (
    <Layout>
      <Header title="Reminders" />
      
      <div className="px-4 py-4">
        {notificationPermission !== 'granted' && (
          <div className="card mb-4 bg-yellow-50 border border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-subheading text-yellow-800">Enable Notifications</h3>
                <p className="text-body text-yellow-700 mt-1">Allow notifications to receive habit reminders.</p>
                <button
                  onClick={requestNotificationPermission}
                  className="mt-3 bg-yellow-500 text-white px-4 py-2 rounded-lg text-body font-medium"
                >
                  Enable
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-subheading font-poppins text-dark">My Reminders</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-body text-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Reminder
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-body text-gray-500 mb-4">No reminders set. Add one to stay on track!</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Add Your First Reminder
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="card">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    reminder.enabled ? 'bg-primary' : 'bg-gray-200'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${reminder.enabled ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-subheading text-dark">{reminder.habitName}</h3>
                    <p className="text-body text-gray-500">{formatTime(reminder.time)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleReminder(reminder.id)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        reminder.enabled ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                        reminder.enabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}></div>
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder.id)}
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading font-poppins">Add Reminder</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-body text-gray-600 mb-2">Select Habit</label>
                <select
                  value={selectedHabit}
                  onChange={(e) => setSelectedHabit(e.target.value)}
                  className="input-field"
                >
                  <option value="">Choose a habit</option>
                  {habits.map((habit) => (
                    <option key={habit.id} value={habit.id}>{habit.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-body text-gray-600 mb-2">Reminder Time</label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                onClick={addReminder}
                disabled={!selectedHabit}
                className="btn-primary w-full py-3 mt-4"
              >
                Add Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Notifications;
