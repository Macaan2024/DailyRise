import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const GlobalChallengeAlarm = () => {
  const { user } = useAuth();
  
  // State
  const [challenges, setChallenges] = useState([]);
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  // Refs
  const audioCtxRef = useRef(null);
  const intervalRef = useRef(null);
  const processedAlarmsRef = useRef(new Set());

  // 1. Initialize Audio Context
  useEffect(() => {
    const enableAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      setAudioEnabled(true);
    };

    document.addEventListener('click', enableAudio);
    return () => document.removeEventListener('click', enableAudio);
  }, []);

  // 2. Poll for Challenges (Every 3s)
  useEffect(() => {
    if (!user) return;

    const fetchScheduledChallenges = async () => {
      try {
        const { data } = await supabase
          .from('challenges')
          .select(`*, habit:habits (name)`)
          .or(`challenger_id.eq.${user.id},challenged_user_id.eq.${user.id}`)
          .not('completed_at', 'is', null) // Must have time
          .neq('status', 'declined')       // Not declined
          .neq('status', 'completed');     // Not already done

        setChallenges(data || []);
      } catch (error) {
        console.error('Error fetching challenges:', error);
      }
    };

    fetchScheduledChallenges();
    const pollTimer = setInterval(fetchScheduledChallenges, 3000);
    return () => clearInterval(pollTimer);
  }, [user]);

  // 3. Time Check Logic (Every 1s)
  useEffect(() => {
    if (activeAlarm) return; // Don't check if already ringing

    const checkTime = () => {
      const now = new Date();
      
      challenges.forEach(challenge => {
        // Skip if already handled this session
        if (processedAlarmsRef.current.has(challenge.id)) return;

        const targetTime = new Date(challenge.completed_at);
        // difference in ms. Negative means "in the past", Positive means "future"
        const timeDiff = targetTime.getTime() - now.getTime(); 

        // DEBUG: Log time check to console to verify
        // console.log(`Checking ${challenge.habit?.name}: Due in ${timeDiff/1000}s`);

        // LOGIC FIX: 
        // 1. timeDiff <= 0: Time has arrived or passed (prevents ringing early)
        // 2. timeDiff > -10000: It happened within the last 10 seconds (prevents ringing for old stuff)
        if (timeDiff <= 0 && timeDiff > -10000) { 
           triggerAlarm(challenge);
        }
      });
    };

    const timer = setInterval(checkTime, 1000);
    return () => clearInterval(timer);
  }, [challenges, activeAlarm]);

  // 4. Countdown Timer
  useEffect(() => {
    if (activeAlarm && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (activeAlarm && countdown === 0) {
      stopAlarm(false);
      alert("Time is up! You missed the challenge window.");
    }
  }, [activeAlarm, countdown]);

  // --- ACTIONS ---

  const triggerAlarm = (challenge) => {
    console.log("⏰ ALARM TRIGGERED FOR:", challenge.habit?.name);
    
    // Mark as processed immediately so we don't double-trigger
    processedAlarmsRef.current.add(challenge.id);
    
    setActiveAlarm(challenge);
    setCountdown(60);
    playAlarmSound();
  };

  const playAlarmSound = () => {
    if (!audioCtxRef.current) return;

    const playBeep = () => {
      try {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        
        osc.frequency.value = 800; 
        osc.type = 'square';
        
        gain.gain.setValueAtTime(0.2, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.5);
        
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + 0.5);
      } catch (e) {
        console.error("Audio Error:", e);
      }
    };

    playBeep();
    intervalRef.current = setInterval(playBeep, 1000);
  };

  const stopAlarm = async (isSuccess) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    const finishedChallenge = activeAlarm;
    setActiveAlarm(null);
    
    if (isSuccess && finishedChallenge) {
      try {
        // 1. Award Points
        await awardPoints(10, finishedChallenge.community_id);

        // 2. Update DB
        await supabase
          .from('challenges')
          .update({ 
            status: 'completed',
            winner_id: user.id 
          })
          .eq('id', finishedChallenge.id);
          
        alert(`🎉 Challenge "${finishedChallenge.habit?.name}" Completed! +10 Points!`);
      } catch (err) {
        console.error("Error completing challenge:", err);
      }
    }
  };

  // --- POINTS LOGIC ---
  const awardPoints = async (amount, communityId) => {
    try {
      console.log(`Awarding ${amount} points...`);
      const { data: existingRecord, error: fetchError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .eq('community_id', communityId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingRecord) {
        await supabase
          .from('user_points')
          .update({ 
            total_points: parseInt(existingRecord.total_points || 0) + amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);
      } else {
        await supabase
          .from('user_points')
          .insert({
            user_id: user.id,
            community_id: communityId,
            total_points: amount
          });
      }
    } catch (error) {
      console.error("Points Error:", error);
    }
  };

  // --- RENDER ---
  if (!activeAlarm) {
    // Debug: Little bell icon if waiting for alarms
    if (challenges.length > 0) {
      return (
        <div className="fixed bottom-4 left-4 z-50 group">
          <div className="bg-gray-800 text-white p-2 rounded-full shadow-lg text-xs cursor-help opacity-50 hover:opacity-100 transition-opacity">
            🔔
          </div>
          <div className="hidden group-hover:block absolute bottom-10 left-0 bg-white text-gray-800 p-3 rounded shadow-xl w-64 text-xs border border-gray-200">
            <p className="font-bold mb-1">Upcoming Challenges:</p>
            {challenges.map(c => (
              <div key={c.id} className="mb-1 border-b pb-1 last:border-0">
                <span className="font-semibold">{c.habit?.name}</span>
                <br/>
                {new Date(c.completed_at).toLocaleTimeString()}
              </div>
            ))}
            {!audioEnabled && <div className="text-red-500 mt-2 font-bold">⚠️ Click page to enable audio</div>}
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-red-600/90 flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl animate-bounce-slight">
        
        <div className="text-6xl mb-4 animate-pulse">🚨</div>
        
        <h2 className="text-3xl font-black text-red-600 mb-2">CHALLENGE TIME!</h2>
        
        <p className="text-gray-600 text-lg mb-6">
          <span className="font-bold text-black text-xl block mt-2">
            {activeAlarm.habit?.name || "Your Habit"}
          </span>
        </p>

        <div className="text-5xl font-mono font-bold text-dark mb-8 border-2 border-gray-100 rounded-lg py-2">
          00:{String(countdown).padStart(2, '0')}
        </div>

        <button 
          onClick={() => stopAlarm(true)}
          className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-xl shadow-lg transform transition-transform active:scale-95"
        >
          ✅ I DID IT! (+10 PTS)
        </button>
        
        <button 
          onClick={() => stopAlarm(false)}
          className="mt-4 text-gray-400 text-sm underline hover:text-gray-600"
        >
          Skip (No Points)
        </button>
      </div>
    </div>
  );
};

export default GlobalChallengeAlarm;