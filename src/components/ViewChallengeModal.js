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
      console.log('📊 Fetching challenge:', challengeId);
      const { data: challengeData, error } = await supabase
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
          habits (name),
          challenger:users!challenger_id (firstname, lastname, image, age, gender),
          challengee:users!challenged_user_id (firstname, lastname, image, age, gender)
        `)
        .eq('id', challengeId)
        .single();

      if (error) {
        console.error('🔴 Query error:', error);
      } else {
        console.log('✅ Challenge fetched:', challengeData);
        setChallenge(challengeData);
      }
    } catch (error) {
      console.error('Error fetching challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  if (loading) return null;
  if (!challenge) return null;

  const challengerName = `${challenge.challenger?.firstname || 'User'} ${challenge.challenger?.lastname || ''}`;
  const challengedName = `${challenge.challengee?.firstname || 'User'} ${challenge.challengee?.lastname || ''}`;
  const habitName = challenge.habits?.[0]?.name || challenge.habits?.name || 'Unknown Habit';
  const isCompleted = challenge.status === 'completed' || challenge.status === 'accepted';
  const challengerImage = challenge.challenger?.image;
  const challengedImage = challenge.challengee?.image;
  const challengerAge = challenge.challenger?.age || 'N/A';
  const challengedAge = challenge.challengee?.age || 'N/A';
  const challengerGender = challenge.challenger?.gender || 'N/A';
  const challengedGender = challenge.challengee?.gender || 'N/A';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl animate-fade-in">
        {/* Premium Header - More Elegant */}
        <div className="relative h-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -ml-16 -mb-16"></div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all"
          >
            ✕
          </button>

          <div className="relative h-full flex flex-col justify-center items-center px-8">
            <p className="text-primary/40 text-xs font-semibold uppercase tracking-widest mb-2">Accountability Challenge</p>
            <h3 className="text-3xl font-bold text-white text-center">⚡ Challenge Battle</h3>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-10">
          {/* Status Section */}
          <div className="mb-8 flex justify-center">
            {isCompleted ? (
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
                <span className="text-lg">✅</span>
                <p className="text-sm font-semibold text-emerald-700">Challenge Accepted</p>
              </div>
            ) : (
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">
                <span className="text-lg">⏳</span>
                <p className="text-sm font-semibold text-amber-700">Awaiting Response</p>
              </div>
            )}
          </div>

          {/* User Cards - Elegant Side-by-Side */}
          <div className="grid grid-cols-2 gap-6 mb-10">
            {/* Challenger Card */}
            <div className="group">
              <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-100/80 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col items-center">
                  {/* Profile Image */}
                  <div className="relative mb-5">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 blur-lg opacity-25 group-hover:opacity-40 transition-opacity"></div>
                    <img
                      src={challengerImage || 'https://via.placeholder.com/100?text=User'}
                      alt={challengerName}
                      className="relative w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  </div>

                  {/* Info */}
                  <h4 className="text-lg font-bold text-slate-900 text-center mb-2">{challengerName}</h4>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                    <span>👤</span>
                    <span>{challengerGender}</span>
                    <span>•</span>
                    <span>{challengerAge} yrs</span>
                  </div>

                  {/* Badge */}
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    🎖️ Challenger
                  </span>
                </div>
              </div>
            </div>

            {/* Challenged User Card */}
            <div className="group">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100/80 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col items-center">
                  {/* Profile Image */}
                  <div className="relative mb-5">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-300 blur-lg opacity-25 group-hover:opacity-40 transition-opacity"></div>
                    <img
                      src={challengedImage || 'https://via.placeholder.com/100?text=User'}
                      alt={challengedName}
                      className="relative w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  </div>

                  {/* Info */}
                  <h4 className="text-lg font-bold text-slate-900 text-center mb-2">{challengedName}</h4>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                    <span>👤</span>
                    <span>{challengedGender}</span>
                    <span>•</span>
                    <span>{challengedAge} yrs</span>
                  </div>

                  {/* Badge */}
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                    🏅 Challenged
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* VS Divider - Elegant */}
          <div className="flex items-center gap-4 mb-10">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
            <div className="px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
              <p className="text-sm font-bold text-slate-600">VS</p>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
          </div>

          {/* Habit Challenge - Premium Box */}
          <div className="mb-8 p-8 bg-gradient-to-br from-slate-50 to-slate-50/50 border border-slate-200/80 rounded-2xl">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">Challenge Objective</p>
            <div className="bg-white border border-slate-100 rounded-xl px-6 py-5 text-center">
              <p className="text-2xl font-bold text-primary mb-2">"{habitName}"</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Complete this habit together and showcase your commitment to accountability. When either user completes the habit, both earn rewards! 🎯
              </p>
            </div>
          </div>

          {/* Rewards Info - Elegant */}
          <div className="mb-10 p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border border-amber-200/60 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="text-4xl">✨</div>
              <div className="flex-1">
                <p className="text-lg font-bold text-slate-900 mb-1">+10 Points Reward</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Both participants instantly earn <span className="font-semibold">10 points</span> when the challenge is completed. Use these points to unlock badges and climb the leaderboard! 🏆
                </p>
              </div>
            </div>
          </div>

          {/* Challenge Timeline */}
          <div className="mb-10 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Timeline</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Challenge created: {new Date(challenge.created_at).toLocaleDateString()}</span>
              </div>
              {challenge.completed_at && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span>Challenge completed: {new Date(challenge.completed_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Button - Premium */}
          <button
            onClick={onClose}
            className="w-full px-6 py-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 text-white rounded-xl font-bold text-base transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
          >
            Got It! Let's Go 💪
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewChallengeModal;
