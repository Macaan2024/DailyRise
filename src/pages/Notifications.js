import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';

const alarmSounds = [
  { id: 'beep', name: '🔔 Classic Beep', frequency: 800 },
  { id: 'bell', name: '🎵 Sweet Bell', frequency: 1000 },
  { id: 'chime', name: '✨ Gentle Chime', frequency: 600 },
  { id: 'alarm', name: '🔊 Loud Alarm', frequency: 1200 },
  { id: 'tone', name: '📢 Rising Tone', frequency: 700 },
];

const Notifications = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [selectedAlarm, setSelectedAlarm] = useState('beep');
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [alarmCountdown, setAlarmCountdown] = useState(0);
  const [currentAlarmReminder, setCurrentAlarmReminder] = useState(null);
  const [alarmIntervalId, setAlarmIntervalId] = useState(null);
  const [isPrefilledChallenge, setIsPrefilledChallenge] = useState(false);
  const [prefilledHabitName, setPrefilledHabitName] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
      checkForPrefilled();
    }
    checkNotificationPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkForPrefilled = () => {
    const prefilled = localStorage.getItem('prefillReminder');
    if (prefilled) {
      const data = JSON.parse(prefilled);
      setSelectedHabit(data.habitId?.toString() || '');
      setReminderTime(data.reminderTime || '09:00');
      setIsPrefilledChallenge(true);
      
      // Get the habit name
      const habit = habits.find(h => h.id === data.habitId);
      setPrefilledHabitName(habit?.name || 'Unknown Habit');
      
      setShowAddModal(true);
      localStorage.removeItem('prefillReminder');
    }
  };

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
      id: Date.now() + Math.random(),
      habitId: parseInt(selectedHabit),
      habitName: habit?.name || 'Unknown',
      time: reminderTime,
      alarmSound: selectedAlarm,
      enabled: true,
    };

    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    localStorage.setItem(`reminders_${user.id}`, JSON.stringify(updatedReminders));
    
    setShowAddModal(false);
    setSelectedHabit('');
    setReminderTime('09:00');
    setSelectedAlarm('beep');
    setIsPrefilledChallenge(false);
    setPrefilledHabitName('');

    scheduleNotification(newReminder);
  };

  useEffect(() => {
    if (reminders.length > 0) {
      reminders.forEach(reminder => {
        if (reminder.enabled) {
          scheduleNotification(reminder);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationPermission]);

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

  const playAlarmSound = (alarmType = 'beep', duration = 0.5) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume audio context if it's suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const alarm = alarmSounds.find(a => a.id === alarmType) || alarmSounds[0];
      oscillator.frequency.value = alarm.frequency;
      oscillator.type = 'sine';
      
      // Higher volume for alarm
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Audio context error:', error);
    }
  };

  const playPreview = (alarmType) => {
    playAlarmSound(alarmType, 1);
  };

  const stopAlarm = async (isWin = true) => {
    // Add 10 points only if user clicks STOP button (win)
    // If isWin=false, it means alarm expired (loss), no points awarded
    if (user && currentAlarmReminder && isWin) {
      const currentPoints = parseInt(localStorage.getItem(`user_points_${user.id}`) || '0');
      const newPoints = currentPoints + 10;
      localStorage.setItem(`user_points_${user.id}`, newPoints.toString());
      
      // Dispatch storage event for real-time updates in Rewards page
      window.dispatchEvent(new StorageEvent('storage', {
        key: `user_points_${user.id}`,
        newValue: newPoints.toString(),
      }));

      // Check if this habit is part of an active challenge and mark user as winner
      try {
        const { data: challenges } = await supabase
          .from('challenges')
          .select('id, challenger_id, challenged_user_id')
          .eq('habit_id', currentAlarmReminder.habitId)
          .eq('status', 'completed')
          .is('winner_id', null)
          .maybeSingle();

        if (challenges) {
          // Mark current user as winner
          await supabase
            .from('challenges')
            .update({ winner_id: user.id })
            .eq('id', challenges.id);
        }
      } catch (error) {
        console.error('Error checking for challenges:', error);
      }
    }
    
    // Stop alarm sound and modal
    setIsAlarmRinging(false);
    if (alarmIntervalId) {
      clearInterval(alarmIntervalId);
      setAlarmIntervalId(null);
    }
    // Reset reminder state after clearing modal
    setTimeout(() => setCurrentAlarmReminder(null), 100);
  };

  useEffect(() => {
    if (isAlarmRinging && alarmCountdown > 0) {
      const timer = setTimeout(() => {
        setAlarmCountdown(alarmCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isAlarmRinging && alarmCountdown === 0) {
      // Alarm expired without user clicking STOP - auto loss (0 points)
      stopAlarm(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAlarmRinging, alarmCountdown]);

  const scheduleNotification = (reminder) => {
    if (!reminder.enabled) return;

    const [hours, minutes] = reminder.time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      const alarmType = reminder.alarmSound || 'beep';
      
      // Show alarm modal for 60 seconds
      setCurrentAlarmReminder(reminder);
      setIsAlarmRinging(true);
      setAlarmCountdown(60);
      
      // Play alarm continuously during countdown - loop every 1.5 seconds for constant sound
      const playAlarmContinuously = () => {
        // Play 3 rapid beeps (total ~1.5s)
        for (let i = 0; i < 3; i++) {
          setTimeout(() => playAlarmSound(alarmType, 0.4), i * 500);
        }
      };
      
      // Start immediately and repeat every 1.5 seconds
      playAlarmContinuously();
      const alarmInterval = setInterval(playAlarmContinuously, 1500);
      setAlarmIntervalId(alarmInterval);
      
      if (notificationPermission === 'granted' && 'Notification' in window) {
        try {
          new Notification('DailyRise Reminder ⏰', {
            body: `Time to complete: ${reminder.habitName}`,
            icon: '/logo192.png',
            tag: 'dailyrise-reminder',
            requireInteraction: true,
          });
        } catch (error) {
          console.warn('Notification skipped:', error);
        }
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
      
      <div className="px-4 py-4 pb-32">
        {notificationPermission !== 'granted' && (
          <div className="card mb-4 bg-yellow-50 border border-yellow-200 relative z-40">
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
                  className="mt-3 bg-yellow-500 text-white px-4 py-2 rounded-lg text-body font-medium hover:bg-yellow-600 transition-colors cursor-pointer active:scale-95"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end overflow-hidden">
          <div className="bg-white w-full max-h-[85vh] rounded-t-3xl overflow-hidden flex flex-col animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-heading font-poppins text-dark">Add Reminder</h2>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                <div>
                  <label className="block text-body text-gray-600 mb-3 font-medium">Habit</label>
                  {isPrefilledChallenge ? (
                    <div className="input-field w-full bg-gray-100 text-gray-700 font-medium cursor-not-allowed">
                      {prefilledHabitName}
                    </div>
                  ) : (
                    <select
                      value={selectedHabit}
                      onChange={(e) => setSelectedHabit(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">Choose a habit...</option>
                      {habits.map((habit) => (
                        <option key={habit.id} value={habit.id}>{habit.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-body text-gray-600 mb-3 font-medium">Reminder Time</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => !isPrefilledChallenge && setReminderTime(e.target.value)}
                    disabled={isPrefilledChallenge}
                    className={`input-field w-full ${isPrefilledChallenge ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label className="block text-body text-gray-600 mb-3 font-medium">Alarm Sound</label>
                  <div className="space-y-2">
                    {alarmSounds.map((alarm) => (
                      <div key={alarm.id} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                        <input
                          type="radio"
                          id={`alarm-${alarm.id}`}
                          name="alarm"
                          value={alarm.id}
                          checked={selectedAlarm === alarm.id}
                          onChange={(e) => setSelectedAlarm(e.target.value)}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`alarm-${alarm.id}`} className="flex-1 text-body text-gray-700">{alarm.name}</label>
                        <button
                          type="button"
                          onClick={() => playPreview(alarm.id)}
                          className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200"
                        >
                          Play
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Buttons at Bottom */}
            <div className="flex-shrink-0 bg-white border-t border-gray-100 px-6 py-4 space-y-3 pb-24">
              <button
                onClick={addReminder}
                disabled={!selectedHabit}
                className={`btn-primary w-full py-3 rounded-lg font-medium text-white ${!selectedHabit ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isPrefilledChallenge ? 'Set Alarm & Add Reminder' : 'Add Reminder'}
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

      {isAlarmRinging && currentAlarmReminder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center">
            <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 4a1 1 0 112 0v5a1 1 0 11-2 0V4z" />
              </svg>
            </div>
            <h2 className="text-heading font-poppins text-dark mb-2">Reminder!</h2>
            <p className="text-body text-gray-600 mb-4">{currentAlarmReminder.habitName}</p>
            
            <div className="mb-6 p-4 rounded-lg bg-primary/10">
              <p className="text-5xl font-bold text-primary">{alarmCountdown}</p>
              <p className="text-body text-gray-600 mt-1">seconds</p>
            </div>

            <button
              onClick={() => stopAlarm(true)}
              className="w-full py-3 rounded-lg bg-red-500 text-white text-body font-medium hover:bg-red-600 transition-all active:scale-95"
            >
              STOP - WIN +10 🏆
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Notifications;
