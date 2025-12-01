import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const ViewChallengeModal = ({ isOpen, challengeId, onClose }) => {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && challengeId) {
      fetchChallenge();
    }
  }, [isOpen, challengeId]);

  const fetchChallenge = async () => {
    try {
      const { data: challengeData } = await supabase
        .from('challenges')
        .select(`
          id,
          status,
          created_at,
          completed_at,
          challenger_id,
          challenged_user_id,
          habit_id,
          community_id,
          habits:habit_id (name),
          challenger:challenger_id (firstname, lastname, image, age, gender),
          challenged_user:challenged_user_id (firstname, lastname, image, age, gender)
        `)
        .eq('id', challengeId)
        .single();

      setChallenge(challengeData);
    } catch (error) {
      console.error('Error fetching challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  if (loading) return null;
  if (!challenge) return null;

  const challengerName = `${challenge.challenger?.firstname} ${challenge.challenger?.lastname}`;
  const challengedName = `${challenge.challenged_user?.firstname} ${challenge.challenged_user?.lastname}`;
  const habitName = challenge.habits?.name || 'Unknown Habit';
  const isCompleted = challenge.status === 'completed';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden">
        {/* Header Background */}
        <div className="bg-gradient-to-r from-primary to-primary/80 h-24"></div>
        
        {/* Content */}
        <div className="px-6 pb-6 -mt-12 relative">
          {/* Title */}
          <h3 className="text-lg font-bold text-dark text-center mb-4">
            🎯 Active Challenge
          </h3>

          {/* Challenge Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-small text-blue-900 mb-3">
              <span className="font-semibold">{challengerName}</span> challenged <span className="font-semibold">{challengedName}</span> to:
            </p>
            <p className="text-base font-bold text-primary text-center">
              "{habitName}"
            </p>
          </div>

          {/* Status Info */}
          <div className={`rounded-xl p-3 mb-4 ${
            isCompleted 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <p className={`text-small text-center font-semibold ${
              isCompleted ? 'text-green-900' : 'text-yellow-900'
            }`}>
              {isCompleted ? '✅ Challenge Accepted' : '⏳ Challenge Pending'}
            </p>
            {isCompleted && (
              <p className="text-small text-green-800 text-center mt-1">
                When either user completes this habit, both earn 25 points!
              </p>
            )}
          </div>

          {/* Reward Info */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-3 mb-5">
            <p className="text-small text-yellow-900 text-center">
              ✨ <span className="font-bold">25 Points</span> awarded for completion
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium text-small hover:bg-primary/90 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewChallengeModal;
