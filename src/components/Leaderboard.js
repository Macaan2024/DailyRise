import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useChallenges } from '../hooks/useChallenges';

const Leaderboard = ({ communityId, onChallenge, onViewChallenge }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentChallenges, setSentChallenges] = useState({});
  const { sentChallenges: hookChallenges } = useChallenges(user?.id, communityId);

  useEffect(() => {
    setSentChallenges(hookChallenges);
  }, [hookChallenges]);

  useEffect(() => {
    if (communityId && user?.id) {
      fetchLeaderboard();
      fetchSentChallenges();
      
      // Auto-refresh sent challenges every 2 seconds
      const interval = setInterval(fetchSentChallenges, 2000);

      // Subscribe to real-time leaderboard updates
      const channel = supabase.channel(`leaderboard-${communityId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'community_leaderboard'
        }, (payload) => {
          if (payload.new?.community_id === communityId) {
            fetchLeaderboard();
          }
        })
        .subscribe();

      return () => {
        clearInterval(interval);
        channel.unsubscribe();
      };
    }
  }, [communityId, user?.id]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('community_leaderboard')
        .select('*')
        .eq('community_id', communityId)
        .order('rank', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSentChallenges = async () => {
    try {
      const { data } = await supabase
        .from('challenges')
        .select('challenged_user_id, status')
        .eq('challenger_id', user?.id)
        .neq('status', 'declined');

      const map = {};
      data?.forEach(c => {
        map[c.challenged_user_id] = c.status;
      });
      setSentChallenges(map);
    } catch (error) {
      console.error('Error fetching sent challenges:', error);
    }
  };

  const getButtonState = (memberId) => {
    const status = sentChallenges[memberId];
    if (status === 'pending') return 'pending';
    if (status === 'accepted') return 'accepted';
    if (status === 'completed') return 'completed';
    return 'default';
  };

  const handleButtonClick = (memberId) => {
    const state = getButtonState(memberId);
    if (state === 'default') {
      onChallenge(memberId);
    } else if (state === 'accepted' || state === 'completed') {
      onViewChallenge(memberId);
    }
  };

  const getButtonText = (memberId) => {
    const state = getButtonState(memberId);
    if (state === 'pending') return '⏳ Pending';
    if (state === 'accepted' || state === 'completed') return '👁️ View';
    return '🎯 Challenge';
  };

  const getButtonStyle = (memberId) => {
    const state = getButtonState(memberId);
    if (state === 'pending') {
      return 'px-3 py-1 bg-yellow-300 text-dark text-xs rounded font-medium cursor-not-allowed opacity-70';
    }
    if (state === 'accepted' || state === 'completed') {
      return 'px-3 py-1 bg-green-500 text-white text-xs rounded font-medium hover:bg-green-600';
    }
    return 'px-3 py-1 bg-primary text-white text-xs rounded font-medium hover:bg-primary/90';
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading leaderboard...</div>;
  }

  if (members.length === 0) {
    return <div className="text-center py-8 text-gray-500">No members yet</div>;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-body font-semibold text-dark px-4 mb-3">🏆 Leaderboard</h3>
      {members.map((member) => (
        <div key={member.user_id} className="card flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="text-lg font-bold text-primary w-8 text-center">
              #{member.rank}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-body font-medium text-dark">
                {member.firstname} {member.lastname}
              </p>
              <p className="text-small text-gray-500">
                {member.total_points} points
              </p>
            </div>
          </div>
          {member.user_id !== user?.id && (
            <button
              onClick={() => handleButtonClick(member.user_id)}
              disabled={getButtonState(member.user_id) === 'pending'}
              className={getButtonStyle(member.user_id)}
            >
              {getButtonText(member.user_id)}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;
