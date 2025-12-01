import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Swal from 'sweetalert2';

const Leaderboard = ({ communityId, onChallenge }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (communityId) {
      fetchLeaderboard();
    }
  }, [communityId]);

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
              onClick={() => onChallenge(member.user_id)}
              className="px-3 py-1 bg-primary text-white text-xs rounded font-medium hover:bg-primary/90"
            >
              Challenge
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;
