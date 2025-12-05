import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';
import ViewChallengeModal from '../components/ViewChallengeModal';

const alarmSounds = [
  { id: 'beep', name: '🎵 Classic Beep', frequency: 800 },
  { id: 'bell', name: '🔔 Sweet Bell', frequency: 1000 },
  { id: 'chime', name: '🎐 Gentle Chime', frequency: 600 },
  { id: 'alarm', name: '🚨 Loud Alarm', frequency: 1200 },
  { id: 'tone', name: '📈 Rising Tone', frequency: 700 },
];

const Notifications = () => {
  const { user } = useAuth();
  
  // --- STATE MANAGEMENT ---
  const [habits, setHabits] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [challenges, setChallenges] = useState([]);
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewChallengeModal, setShowViewChallengeModal] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);

  // Reminder/Alarm Form States
  const [selectedHabit, setSelectedHabit] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [selectedAlarm, setSelectedAlarm] = useState('beep');
  const [isPrefilledChallenge, setIsPrefilledChallenge] = useState(false);
  const [prefilledHabitName, setPrefilledHabitName] = useState('');
  
  // Alarm Playing States
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [alarmCountdown, setAlarmCountdown] = useState(0);
  const [currentAlarmReminder, setCurrentAlarmReminder] = useState(null);
  const [alarmIntervalId, setAlarmIntervalId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchChallenges();
      checkForPrefilled();
    }
    checkNotificationPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- FETCH DATA FUNCTIONS ---
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
    }
  };

  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          habit:habits (name),
          challenger:users!challenger_id (firstname, lastname, image),
          challengee:users!challenged_user_id (firstname, lastname, image)
        `)
        .or(`challenger_id.eq.${user.id},challenged_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

  // --- REUSABLE FUNCTION: AWARD POINTS (Kept for Alarm Stop) ---
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

  // --- HELPER FUNCTIONS ---
  const checkForPrefilled = () => {
    const prefilled = localStorage.getItem('prefillReminder');
    if (prefilled) {
      const data = JSON.parse(prefilled);
      setSelectedHabit(data.habitId?.toString() || '');
      setReminderTime(data.reminderTime || '09:00');
      setIsPrefilledChallenge(true);
      
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

  // --- ALARM LOGIC ---
  const playAlarmSound = (alarmType = 'beep', duration = 0.5) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume();
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const alarm = alarmSounds.find(a => a.id === alarmType) || alarmSounds[0];
      oscillator.frequency.value = alarm.frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Audio context error:', error);
    }
  };

  const stopAlarm = async (isWin = true) => {
    if (user && currentAlarmReminder && isWin) {
      // 1. Award Points to DB
      await awardPoints(10);

      // 2. Check for challenge win
      try {
        const { data: challenges } = await supabase
          .from('challenges')
          .select('id')
          .eq('habit_id', currentAlarmReminder.habitId)
          .eq('status', 'completed')
          .is('winner_id', null)
          .maybeSingle();

        if (challenges) {
          await supabase
            .from('challenges')
            .update({ winner_id: user.id })
            .eq('id', challenges.id);
        }
      } catch (error) {
        console.error('Error checking for challenges:', error);
      }
    }
    
    setIsAlarmRinging(false);
    if (alarmIntervalId) {
      clearInterval(alarmIntervalId);
      setAlarmIntervalId(null);
    }
    setTimeout(() => setCurrentAlarmReminder(null), 100);
  };

  useEffect(() => {
    if (isAlarmRinging && alarmCountdown > 0) {
      const timer = setTimeout(() => setAlarmCountdown(alarmCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isAlarmRinging && alarmCountdown === 0) {
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

    if (scheduledTime <= now) scheduledTime.setDate(scheduledTime.getDate() + 1);

    const delay = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      const alarmType = reminder.alarmSound || 'beep';
      setCurrentAlarmReminder(reminder);
      setIsAlarmRinging(true);
      setAlarmCountdown(60);
      
      const playAlarmContinuously = () => {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => playAlarmSound(alarmType, 0.4), i * 500);
        }
      };
      
      playAlarmContinuously();
      const alarmInterval = setInterval(playAlarmContinuously, 1500);
      setAlarmIntervalId(alarmInterval);
      
      if (notificationPermission === 'granted' && 'Notification' in window) {
        new Notification('DailyRise Reminder ⏰', {
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

  const getStatusDetails = (status) => {
    switch (status) {
      case 'pending': return { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' };
      case 'accepted': return { color: 'bg-blue-100 text-blue-800', label: 'In Progress' };
      case 'completed': return { color: 'bg-green-100 text-green-800', label: 'Completed' };
      case 'declined': return { color: 'bg-red-100 text-red-800', label: 'Declined' };
      default: return { color: 'bg-gray-100 text-gray-800', label: status };
    }
  };

  return (
    <Layout>
      <Header title="Notifications" />
      
      <div className="px-4 py-4 pb-32">
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
                <button onClick={requestNotificationPermission} className="mt-2 bg-yellow-500 text-white px-3 py-1 rounded text-small">Enable</button>
              </div>
            </div>
          </div>
        )}

        {/* --- SECTION 1: MY REMINDERS --- */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-subheading font-poppins text-dark">My Reminders</h2>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1 text-body text-primary">
            <span className="text-xl">+</span> Add
          </button>
        </div>

        {reminders.length === 0 ? (
          <p className="text-center text-gray-500 py-4 mb-8">No reminders set.</p>
        ) : (
          <div className="space-y-3 mb-8 border-b border-gray-100 pb-6">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="card">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${reminder.enabled ? 'bg-primary' : 'bg-gray-200'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-subheading text-dark">{reminder.habitName}</h3>
                    <p className="text-body text-gray-500">{formatTime(reminder.time)}</p>
                  </div>
                  <button onClick={() => toggleReminder(reminder.id)} className={`w-10 h-5 rounded-full ${reminder.enabled ? 'bg-primary' : 'bg-gray-300'} relative transition-colors`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${reminder.enabled ? 'left-5' : 'left-0.5'}`}></div>
                  </button>
                  <button onClick={() => deleteReminder(reminder.id)} className="text-gray-400 hover:text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- SECTION 2: MY CHALLENGES --- */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-subheading font-poppins text-dark">My Challenges</h2>
          <button onClick={fetchChallenges} className="text-xs text-gray-500 hover:text-primary">Refresh</button>
        </div>

        {challenges.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-body text-gray-500">No active challenges.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {challenges.map((challenge) => {
              const isChallenger = challenge.challenger_id === user.id;
              const opponent = isChallenger ? challenge.challengee : challenge.challenger;
              const statusInfo = getStatusDetails(challenge.status);
              
              return (
                <div 
                  key={challenge.id} 
                  className="card cursor-pointer hover:shadow-md transition-all"
                  onClick={() => {
                    setSelectedChallengeId(challenge.id);
                    setShowViewChallengeModal(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                      {opponent?.image ? (
                        <img src={opponent.image} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs">
                          {opponent?.firstname?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-subheading font-medium text-dark truncate">
                        Vs. {opponent?.firstname}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {challenge.habit?.name}
                      </p>
                    </div>
                    
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODALS --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end overflow-hidden">
          <div className="bg-white w-full max-h-[85vh] rounded-t-3xl overflow-hidden flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-heading font-poppins text-dark">Add Reminder</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
                <div>
                  <label className="block text-gray-600 mb-2 font-medium">Habit</label>
                  {isPrefilledChallenge ? (
                    <div className="p-3 bg-gray-100 rounded text-gray-700">{prefilledHabitName}</div>
                  ) : (
                    <select value={selectedHabit} onChange={(e) => setSelectedHabit(e.target.value)} className="w-full p-3 border rounded-lg bg-white">
                      <option value="">Choose a habit...</option>
                      {habits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  )}
                </div>
                <div>
                   <label className="block text-gray-600 mb-2 font-medium">Time</label>
                   <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="w-full p-3 border rounded-lg" />
                </div>
                <button onClick={addReminder} disabled={!selectedHabit} className="w-full bg-primary text-white py-3 rounded-lg font-medium disabled:opacity-50">
                    Add Reminder
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Alarm Modal */}
      {isAlarmRinging && currentAlarmReminder && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
               <span className="text-4xl">⏰</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">It's Time!</h2>
            <p className="text-gray-600 mb-6">Complete your habit: <br/><strong>{currentAlarmReminder.habitName}</strong></p>
            <button onClick={() => stopAlarm(true)} className="w-full py-3 bg-red-500 text-white rounded-lg font-bold text-lg hover:bg-red-600">
              STOP ALARM (+10 PTS)
            </button>
          </div>
        </div>
      )}

      <ViewChallengeModal 
        isOpen={showViewChallengeModal}
        challengeId={selectedChallengeId}
        onClose={() => setShowViewChallengeModal(false)}
      />
    </Layout>
  );
};

export default Notifications;