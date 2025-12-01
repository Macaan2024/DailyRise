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
  const challengerImage = challenge.challenger?.image;
  const challengedImage = challenge.challenged_user?.image;
  const challengerGender = challenge.challenger?.gender || 'N/A';
  const challengedGender = challenge.challenged_user?.gender || 'N/A';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header Background */}
        <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 h-32"></div>
        
        {/* Content */}
        <div className="px-6 pb-6 -mt-16 relative">
          {/* Title */}
          <h3 className="text-xl font-bold text-dark text-center mb-6">
            🎯 Challenge Battle
          </h3>

          {/* Both Users Profiles */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Challenger Profile */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex flex-col items-center">
                <img
                  src={challengerImage || 'https://via.placeholder.com/80?text=User'}
                  alt={challengerName}
                  className="w-16 h-16 rounded-full border-3 border-white shadow-lg object-cover mb-2"
                />
                <p className="text-xs font-bold text-dark text-center">{challengerName}</p>
                <p className="text-xs text-gray-600 text-center">👤 {challengerGender}</p>
                <p className="text-xs text-blue-900 font-semibold mt-1">Challenger</p>
              </div>
            </div>

            {/* VS Badge */}
            <div className="flex items-center justify-center">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                <p className="text-white font-bold text-lg">VS</p>
              </div>
            </div>

            {/* Challenged User Profile */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex flex-col items-center">
                <img
                  src={challengedImage || 'https://via.placeholder.com/80?text=User'}
                  alt={challengedName}
                  className="w-16 h-16 rounded-full border-3 border-white shadow-lg object-cover mb-2"
                />
                <p className="text-xs font-bold text-dark text-center">{challengedName}</p>
                <p className="text-xs text-gray-600 text-center">👤 {challengedGender}</p>
                <p className="text-xs text-green-900 font-semibold mt-1">Challenged</p>
              </div>
            </div>
          </div>

          {/* Habit Challenge */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 mb-4">
            <p className="text-small text-purple-900 text-center mb-2 font-semibold">
              💪 Complete This Habit:
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
              <p className="text-xs text-green-800 text-center mt-2">
                When either user completes this habit, both earn +10 points!
              </p>
            )}
          </div>

          {/* Reward Info */}
          <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 border border-yellow-300 rounded-xl p-4 mb-5 shadow-md">
            <p className="text-small text-yellow-900 text-center font-semibold">
              ✨ <span className="text-lg">Both Get +10 Points!</span> ✨
            </p>
            <p className="text-xs text-yellow-800 text-center mt-2">
              Complete the habit & click STOP to claim rewards 🏆
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-primary text-white rounded-lg font-bold text-small hover:bg-primary/90 transition shadow-md"
          >
            Got It! Let's Go 💪
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewChallengeModal;
