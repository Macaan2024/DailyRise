import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Swal from 'sweetalert2';

const Community = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [communityMembers, setCommunityMembers] = useState([]);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedHabit, setSelectedHabit] = useState('');
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    if (user) {
      fetchCommunities();
      fetchHabits();
      fetchFriends();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchCommunities = async () => {
    try {
      const { data } = await supabase
        .from('community')
        .select('*')
        .order('name', { ascending: true });
      setCommunities(data || []);
      if (data && data.length > 0) {
        setSelectedCommunityId(data[0].id);
        fetchCommunityMembers(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunityMembers = async (communityId) => {
    try {
      const { data: members } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', communityId);

      if (!members) {
        setCommunityMembers([]);
        return;
      }

      // Get member details with points
      const membersData = members.map(m => ({
        userId: m.user_id,
        points: parseInt(localStorage.getItem(`user_points_${m.user_id}`) || '0'),
      })).sort((a, b) => b.points - a.points);

      setCommunityMembers(membersData);
    } catch (error) {
      console.error('Error fetching community members:', error);
    }
  };

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

  const fetchFriends = async () => {
    try {
      const { data } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');
      setFriends(data?.map(f => f.friend_id) || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const addFriend = async (friendId) => {
    try {
      const { error } = await supabase
        .from('friends')
        .insert([{
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        }]);

      if (error) throw error;

      setFriends([...friends, friendId]);

      Swal.fire({
        icon: 'success',
        title: 'Friend Request Sent!',
        text: 'Friend request sent successfully',
        timer: 1500,
        confirmButtonColor: '#043915',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add friend',
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
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Community Selector */}
            <div className="mb-6">
              <label className="block text-body font-medium text-dark mb-3">Select a Community</label>
              <select
                value={selectedCommunityId || ''}
                onChange={(e) => {
                  const communityId = parseInt(e.target.value);
                  setSelectedCommunityId(communityId);
                  fetchCommunityMembers(communityId);
                }}
                className="input-field w-full"
              >
                <option value="">Choose a community...</option>
                {communities.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
              {selectedCommunityId && (
                <p className="text-small text-gray-500 mt-2">
                  {communities.find(c => c.id === selectedCommunityId)?.description}
                </p>
              )}
            </div>

            {/* Community Members */}
            {selectedCommunityId && (
              <div>
                <h2 className="text-subheading font-poppins text-dark mb-4">
                  Community Members ({communityMembers.length})
                </h2>

                {communityMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-body text-gray-500">No members in this community yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {communityMembers.map((member, index) => (
                      <div key={member.userId} className="card">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-body font-medium text-dark">
                                {member.userId === user.id ? '👤 You' : 'User'}
                              </p>
                              <p className="text-small text-gray-500">{member.points} points</p>
                            </div>
                          </div>

                          {member.userId !== user.id && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedUser(member.userId);
                                  setShowChallengeModal(true);
                                }}
                                className="px-3 py-1 bg-primary text-white text-xs rounded hover:bg-primary/90"
                                title="Challenge this user"
                              >
                                ⚡ Challenge
                              </button>
                              <button
                                onClick={() => addFriend(member.userId)}
                                disabled={friends.includes(member.userId)}
                                className={`px-3 py-1 text-xs rounded ${
                                  friends.includes(member.userId)
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-500 text-white hover:bg-green-600'
                                }`}
                                title={friends.includes(member.userId) ? 'Already a friend' : 'Add friend'}
                              >
                                {friends.includes(member.userId) ? '✓ Friend' : '+ Add Friend'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
