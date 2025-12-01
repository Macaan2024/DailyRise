import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Swal from 'sweetalert2';

const Community = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [habits, setHabits] = useState([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedHabit, setSelectedHabit] = useState('');

  useEffect(() => {
    if (user) {
      fetchCommunities();
      fetchHabits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchHabits = async () => {
    try {
      const { data } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);
      setHabits(data || []);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const fetchCommunities = async () => {
    try {
      const { data: allCommunities } = await supabase
        .from('community')
        .select('*')
        .order('name', { ascending: true });

      const { data: memberOf } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id);

      setCommunities(allCommunities || []);
      setUserCommunities(memberOf?.map(m => m.community_id) || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (communityId) => {
    try {
      const { data: members } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', communityId);

      if (!members) return;

      // Get user details and points
      const memberIds = members.map(m => m.user_id);
      const leaderboardData = memberIds.map(userId => {
        const points = parseInt(localStorage.getItem(`user_points_${userId}`) || '0');
        return { userId, points };
      }).sort((a, b) => b.points - a.points);

      setLeaderboard(leaderboardData);
      setSelectedCommunityId(communityId);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const joinCommunity = async (communityId) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .insert([{ community_id: communityId, user_id: user.id, role: 'member' }]);

      if (error) throw error;

      setUserCommunities([...userCommunities, communityId]);

      Swal.fire({
        icon: 'success',
        title: 'Joined!',
        text: 'You joined the community',
        timer: 1500,
        confirmButtonColor: '#043915',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to join community',
        confirmButtonColor: '#043915',
      });
    }
  };

  const leaveCommunity = async (communityId) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);

      if (error) throw error;

      setUserCommunities(userCommunities.filter(id => id !== communityId));
      if (selectedCommunityId === communityId) {
        setSelectedCommunityId(null);
        setLeaderboard([]);
      }

      Swal.fire({
        icon: 'success',
        title: 'Left!',
        text: 'You left the community',
        timer: 1500,
        confirmButtonColor: '#043915',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to leave community',
        confirmButtonColor: '#043915',
      });
    }
  };

  const sendChallenge = async (challengeeId) => {
    if (!selectedHabit) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select a habit to challenge',
        confirmButtonColor: '#043915',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('challenges')
        .insert([{
          challenger_id: user.id,
          challengee_id: challengeeId,
          habit_id: parseInt(selectedHabit),
          community_id: selectedCommunityId,
          status: 'pending'
        }]);

      if (error) throw error;

      setShowChallengeModal(false);
      setSelectedUser(null);
      setSelectedHabit('');

      Swal.fire({
        icon: 'success',
        title: 'Challenge Sent!',
        text: 'Challenge sent to user',
        timer: 1500,
        confirmButtonColor: '#043915',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to send challenge',
        confirmButtonColor: '#043915',
      });
    }
  };

  return (
    <Layout>
      <Header title="Community" />
      
      <div className="px-4 py-4 pb-32">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-subheading font-poppins text-dark">Communities</h2>
          <button
            onClick={fetchCommunities}
            className="flex items-center gap-1 text-body text-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm12 4h8v4h-8V8zM4 16h16v2H4v-2z" />
            </svg>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-body text-gray-500 mb-4">No communities available yet</p>
            <button
              onClick={fetchCommunities}
              className="btn-primary"
            >
              Refresh Communities
            </button>
          </div>
        ) : (
          <>
            {/* Your Communities */}
            {userCommunities.length > 0 && (
              <div className="mb-8">
                <h3 className="text-body font-medium text-dark mb-3">My Communities</h3>
                <div className="space-y-2">
                  {communities
                    .filter(c => userCommunities.includes(c.id))
                    .map((community) => (
                      <div key={community.id} className="card">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-subheading text-dark">{community.name}</h4>
                            <p className="text-small text-gray-500">{community.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => fetchLeaderboard(community.id)}
                              className="px-3 py-1 bg-primary text-white text-xs rounded hover:bg-primary/90"
                            >
                              Leaderboard
                            </button>
                            <button
                              onClick={() => leaveCommunity(community.id)}
                              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                            >
                              Leave
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Leaderboard */}
            {selectedCommunityId && leaderboard.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-body font-medium text-dark">🏆 Leaderboard</h3>
                  <button
                    onClick={() => setSelectedCommunityId(null)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div key={entry.userId} className="card bg-gradient-to-r from-primary/10 to-transparent">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-body font-medium text-dark">
                              {entry.userId === user.id ? '👤 You' : 'Community Member'}
                            </p>
                            <p className="text-small text-gray-500">{entry.points} points</p>
                          </div>
                        </div>
                        {entry.userId !== user.id && (
                          <button
                            onClick={() => {
                              setSelectedUser(entry.userId);
                              setShowChallengeModal(true);
                            }}
                            className="px-3 py-1 bg-primary text-white text-xs rounded hover:bg-primary/90"
                          >
                            Challenge
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Communities */}
            {communities.filter(c => !userCommunities.includes(c.id)).length > 0 && (
              <div>
                <h3 className="text-body font-medium text-dark mb-3">Discover Communities</h3>
                <div className="space-y-2">
                  {communities
                    .filter(c => !userCommunities.includes(c.id))
                    .map((community) => (
                      <div key={community.id} className="card">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-subheading text-dark">{community.name}</h4>
                            <p className="text-small text-gray-500">{community.description}</p>
                          </div>
                          <button
                            onClick={() => joinCommunity(community.id)}
                            className="px-4 py-2 bg-primary text-white text-body font-medium rounded hover:bg-primary/90"
                          >
                            Join
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>


      {/* Challenge Modal */}
      {showChallengeModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end overflow-hidden">
          <div className="bg-white w-full max-h-[85vh] rounded-t-3xl overflow-hidden flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-heading font-poppins text-dark">Send Challenge</h2>
              <button 
                onClick={() => {
                  setShowChallengeModal(false);
                  setSelectedUser(null);
                }} 
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <div>
                  <p className="text-body font-medium text-dark mb-2">Challenge them to complete:</p>
                  <select
                    value={selectedHabit}
                    onChange={(e) => setSelectedHabit(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">Select a habit...</option>
                    {habits.map((habit) => (
                      <option key={habit.id} value={habit.id}>{habit.name}</option>
                    ))}
                  </select>
                </div>
                <p className="text-small text-gray-500">The user will receive a challenge notification to complete this habit!</p>
              </div>
            </div>

            <div className="flex-shrink-0 bg-white border-t border-gray-100 px-6 py-4 space-y-3 pb-24">
              <button
                onClick={() => sendChallenge(selectedUser)}
                className="btn-primary w-full py-3 rounded-lg font-medium text-white"
              >
                Send Challenge
              </button>
              <button
                onClick={() => {
                  setShowChallengeModal(false);
                  setSelectedUser(null);
                }}
                className="w-full py-3 rounded-lg bg-gray-100 text-gray-600 text-body font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Community;
