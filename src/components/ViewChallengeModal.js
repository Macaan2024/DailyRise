import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const ViewChallengeModal = ({ isOpen, challengeId, onClose }) => {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && challengeId) {
      fetchChallenge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          challengee_id,
          habit_id,
          community_id,
          habits:habit_id (name),
          challenger:challenger_id (firstname, lastname, image, age, gender),
          challengee:challengee_id (firstname, lastname, image, age, gender)
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
  const challengedName = `${challenge.challengee?.firstname} ${challenge.challengee?.lastname}`;
  const habitName = challenge.habits?.name || 'Unknown Habit';
  const isCompleted = challenge.status === 'completed';
  const challengerImage = challenge.challenger?.image;
  const challengedImage = challenge.challengee?.image;
  const challengerGender = challenge.challenger?.gender || 'N/A';
  const challengedGender = challenge.challengee?.gender || 'N/A';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/85 px-8 py-8">
          <h3 className="text-2xl font-bold text-white text-center mb-1">
            🎯 Challenge Battle
          </h3>
          <p className="text-primary/30 text-center text-sm">Accountability Challenge</p>
        </div>
        
        {/* Content */}
        <div className="px-8 py-8">
          {/* Left-Right Layout */}
          <div className="flex items-center gap-6 mb-8">
            {/* Left: Challenger */}
            <div className="flex-1">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border border-blue-200/60 shadow-sm">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur opacity-30"></div>
                    <img
                      src={challengerImage || 'https://via.placeholder.com/96?text=User'}
                      alt={challengerName}
                      className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  </div>
                  <p className="text-sm font-bold text-dark text-center mb-1">{challengerName}</p>
                  <p className="text-xs text-gray-600 mb-3">👤 {challengerGender}</p>
                  <span className="inline-block px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-xs font-semibold">
                    Challenger
                  </span>
                </div>
              </div>
            </div>

            {/* Center: VS Badge */}
            <div className="flex-shrink-0">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full w-14 h-14 flex items-center justify-center shadow-xl">
                  <p className="text-white font-bold text-xl">VS</p>
                </div>
                <div className="w-12 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>
            </div>

            {/* Right: Challenged User */}
            <div className="flex-1">
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-6 border border-green-200/60 shadow-sm">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur opacity-30"></div>
                    <img
                      src={challengedImage || 'https://via.placeholder.com/96?text=User'}
                      alt={challengedName}
                      className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  </div>
                  <p className="text-sm font-bold text-dark text-center mb-1">{challengedName}</p>
                  <p className="text-xs text-gray-600 mb-3">👤 {challengedGender}</p>
                  <span className="inline-block px-3 py-1 bg-green-200 text-green-900 rounded-full text-xs font-semibold">
                    Challenged
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Separator Line */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-8"></div>

          {/* Habit Challenge Section */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">Challenge Objective</p>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200/60 rounded-2xl p-6 shadow-sm">
              <p className="text-center text-base font-bold text-primary mb-1">
                "{habitName}"
              </p>
              <p className="text-xs text-purple-700 text-center">
                💪 Complete this habit together to earn rewards
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            {isCompleted ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 rounded-full">
                <span className="text-lg">✅</span>
                <p className="text-xs font-semibold text-green-900">Challenge Accepted</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 rounded-full">
                <span className="text-lg">⏳</span>
                <p className="text-xs font-semibold text-yellow-900">Awaiting Response</p>
              </div>
            )}
          </div>

          {/* Reward Box - Premium Design */}
          <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-300/40 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">✨</span>
              <p className="text-center font-bold text-gray-900 text-lg">Both Earn +10 Points</p>
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-xs text-gray-700 text-center leading-relaxed">
              When either completes the habit and clicks <span className="font-semibold">STOP</span>, both users instantly earn <span className="font-bold">10 points</span> towards their rewards. 🏆
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full px-6 py-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 text-white rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl"
          >
            Got It! Let's Go 💪
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewChallengeModal;
