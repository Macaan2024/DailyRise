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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm sm:max-w-md lg:max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Premium Header - Responsive */}
        <div className="relative h-24 sm:h-28 lg:h-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-primary/10 rounded-full blur-3xl -mr-16 sm:-mr-20 -mt-16 sm:-mt-20"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-primary/5 rounded-full blur-3xl -ml-12 sm:-ml-16 -mb-12 sm:-mb-16"></div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white/20 hover:bg-white/30 text-white p-1.5 sm:p-2 rounded-full transition-all text-lg sm:text-xl"
          >
            ✕
          </button>

          <div className="relative h-full flex flex-col justify-center items-center px-4 sm:px-8">
            <p className="text-primary/40 text-xs font-semibold uppercase tracking-wider mb-1">Accountability Challenge</p>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white text-center">⚡ Challenge Battle</h3>
          </div>
        </div>

        {/* Content - Responsive */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Status Section */}
          <div className="mb-6 flex justify-center">
            {isCompleted ? (
              <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-xs sm:text-sm">
                <span className="text-base sm:text-lg">✅</span>
                <p className="font-semibold text-emerald-700">Challenge Accepted</p>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-xs sm:text-sm">
                <span className="text-base sm:text-lg">⏳</span>
                <p className="font-semibold text-amber-700">Awaiting Response</p>
              </div>
            )}
          </div>

          {/* User Cards - Always 2 Columns */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-6 mb-6 sm:mb-8 lg:mb-10">
            {/* Challenger Card */}
            <div className="group">
              <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-100/80 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col items-center">
                  {/* Profile Image */}
                  <div className="relative mb-2 sm:mb-3 lg:mb-5">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 blur-lg opacity-25 group-hover:opacity-40 transition-opacity"></div>
                    <img
                      src={challengerImage || 'https://via.placeholder.com/100?text=User'}
                      alt={challengerName}
                      className="relative w-16 sm:w-20 lg:w-28 h-16 sm:h-20 lg:h-28 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  </div>

                  {/* Info */}
                  <h4 className="text-xs sm:text-base lg:text-lg font-bold text-slate-900 text-center mb-1 sm:mb-2 line-clamp-2">{challengerName}</h4>
                  <div className="flex items-center gap-0.5 sm:gap-1 text-xs lg:text-sm text-slate-600 mb-2 sm:mb-3 text-center">
                    <span>👤</span>
                    <span className="line-clamp-1">{challengerGender}</span>
                    <span>•</span>
                    <span>{challengerAge}y</span>
                  </div>

                  {/* Badge */}
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 bg-blue-100 text-blue-700 text-xs lg:text-sm font-bold rounded-full whitespace-nowrap">
                    🎖️ Challenger
                  </span>
                </div>
              </div>
            </div>

            {/* Challenged User Card */}
            <div className="group">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100/80 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col items-center">
                  {/* Profile Image */}
                  <div className="relative mb-2 sm:mb-3 lg:mb-5">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-300 blur-lg opacity-25 group-hover:opacity-40 transition-opacity"></div>
                    <img
                      src={challengedImage || 'https://via.placeholder.com/100?text=User'}
                      alt={challengedName}
                      className="relative w-16 sm:w-20 lg:w-28 h-16 sm:h-20 lg:h-28 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  </div>

                  {/* Info */}
                  <h4 className="text-xs sm:text-base lg:text-lg font-bold text-slate-900 text-center mb-1 sm:mb-2 line-clamp-2">{challengedName}</h4>
                  <div className="flex items-center gap-0.5 sm:gap-1 text-xs lg:text-sm text-slate-600 mb-2 sm:mb-3 text-center">
                    <span>👤</span>
                    <span className="line-clamp-1">{challengedGender}</span>
                    <span>•</span>
                    <span>{challengedAge}y</span>
                  </div>

                  {/* Badge */}
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 bg-emerald-100 text-emerald-700 text-xs lg:text-sm font-bold rounded-full whitespace-nowrap">
                    🏅 Challenged
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* VS Divider - Responsive */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 mb-6 sm:mb-8 lg:mb-10">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
            <div className="px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 bg-slate-100 rounded-full border border-slate-200">
              <p className="text-xs sm:text-sm font-bold text-slate-600">VS</p>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
          </div>

          {/* Habit Challenge - Responsive */}
          <div className="mb-4 sm:mb-6 lg:mb-8 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-slate-50 to-slate-50/50 border border-slate-200/80 rounded-lg sm:rounded-xl lg:rounded-2xl">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3 text-center">Challenge Objective</p>
            <div className="bg-white border border-slate-100 rounded-lg px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-5 text-center">
              <p className="text-base sm:text-xl lg:text-2xl font-bold text-primary mb-1 sm:mb-2 break-words">"{habitName}"</p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Complete this habit together! When either user completes it, both earn rewards! 🎯
              </p>
            </div>
          </div>

          {/* Rewards Info - Responsive */}
          <div className="mb-4 sm:mb-6 lg:mb-8 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border border-amber-200/60 rounded-lg sm:rounded-xl lg:rounded-2xl">
            <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
              <div className="text-2xl sm:text-3xl lg:text-4xl flex-shrink-0">✨</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 mb-1">+10 Points Reward</p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Both earn <span className="font-semibold">10 points</span> to unlock badges! 🏆
                </p>
              </div>
            </div>
          </div>

          {/* Challenge Timeline - Responsive */}
          <div className="mb-4 sm:mb-6 lg:mb-8 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Timeline</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                <span className="truncate">Created: {new Date(challenge.created_at).toLocaleDateString()}</span>
              </div>
              {challenge.completed_at && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                  <span className="truncate">Completed: {new Date(challenge.completed_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Button - Responsive */}
          <button
            onClick={onClose}
            className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 text-white rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
          >
            Got It! Let's Go 💪
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewChallengeModal;
