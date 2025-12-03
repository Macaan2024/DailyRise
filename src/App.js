import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabaseClient'; 

// IMPORTANT: Check your file name. 
// If your file is named ReceiveChallengeModal.js, keep this import. 
// If it is named ChallengeReceivedModal.js, change the path accordingly.
import ChallengeReceivedModal from './components/ChallengeReceivedModal'; 

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Progress from './pages/Progress';
import Logs from './pages/Logs';
import Notifications from './pages/Notifications';
import Goals from './pages/Goals';
import Badges from './pages/Badges';
import Community from './pages/Community';
import Rewards from './pages/Rewards';
import Profile from './pages/Profile';

// --- REAL-TIME LISTENER COMPONENT ---
const GlobalChallengeListener = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [challengeId, setChallengeId] = useState(null);

  useEffect(() => {
    if (!user) return;

    // 1. Initial Check: Are there any pending challenges waiting right now?
    const checkPending = async () => {
      const { data } = await supabase
        .from('challenges')
        .select('id')
        .eq('challenged_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        console.log("Found existing pending challenge:", data[0].id);
        setChallengeId(data[0].id);
        setShowModal(true);
      }
    };
    checkPending();

    // 2. REAL-TIME LISTENER: Wakes up instantly when a new row is added
    console.log("Setting up Realtime listener for user:", user.id);
    
    const channel = supabase
      .channel('global-challenges') // Unique name for this connection
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Trigger only on new creations
          schema: 'public',
          table: 'challenges',
          filter: `challenged_user_id=eq.${user.id}` // Only listen for challenges meant for ME
        },
        (payload) => {
          console.log("🔔 REAL-TIME EVENT RECEIVED:", payload);
          // Only show if the status is pending
          if (payload.new.status === 'pending') {
            setChallengeId(payload.new.id);
            setShowModal(true);
          }
        }
      )
      .subscribe((status) => {
        // This log tells you if the connection is successful
        if (status === 'SUBSCRIBED') {
          console.log("✅ Connected to Supabase Realtime!");
        }
      });

    // Cleanup: Disconnect when user logs out or app closes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <ChallengeReceivedModal
      isOpen={showModal}
      challengeId={challengeId}
      onClose={() => {
        setShowModal(false);
        setChallengeId(null);
      }}
      onRespond={() => {
        setShowModal(false);
        // Optional: reload the page to update lists if you want
        // window.location.reload(); 
      }}
    />
  );
};

// --- Route Helpers ---
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (user) return <Navigate to="/home" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* The listener sits here, active on ALL pages */}
        <GlobalChallengeListener />

        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
            <Route path="/badges" element={<ProtectedRoute><Badges /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;