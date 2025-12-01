import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Swal from 'sweetalert2';

const Community = () => {
  const { user } = useAuth();
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [allCommunities, setAllCommunities] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [communityMembers, setCommunityMembers] = useState([]);
  const [habits, setHabits] = useState([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedHabit, setSelectedHabit] = useState('');
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCommunities();
      fetchUserCommunities();
      fetchHabits();
      fetchFriends();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (selectedCommunityId) {
      fetchCommunityMembers(selectedCommunityId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCommunityId]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('community')
        .select('*')
        .order('name', { ascending: true });
      setAllCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCommunities = async () => {
    try {
      const { data } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id);
      setUserCommunities(data?.map(m => m.community_id) || []);
      
      // Set first joined community as selected, or first available
      if (data && data.length > 0) {
        setSelectedCommunityId(data[0].community_id);
      }
    } catch (error) {
      console.error('Error fetching user communities:', error);
    }
  };

  const fetchCommunityMembers = async (communityId) => {
    try {
      setLoading(true);
      // Get community members
      const { data: members } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', communityId);

      if (!members || members.length === 0) {
        setCommunityMembers([]);
        return;
      }

      // Get user details
      const userIds = members.map(m => m.user_id);
      const { data: userDetails } = await supabase
        .from('users')
        .select('id, firstname, lastname')
        .in('id', userIds);

      // Combine with points from localStorage
      const membersWithPoints = (userDetails || []).map(user => ({
        userId: user.id,
        name: `${user.firstname} ${user.lastname}`,
        points: parseInt(localStorage.getItem(`user_points_${user.id}`) || '0'),
      })).sort((a, b) => b.points - a.points);

      setCommunityMembers(membersWithPoints);
    } catch (error) {
      console.error('Error fetching community members:', error);
      setCommunityMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHabits = async () => {
    try {
      if (user) {
        const { data } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id);
        setHabits(data || []);
      }
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const fetchFriends = async () => {
    try {
      if (user) {
        const { data } = await supabase
          .from('friends')
          .select('friend_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted');
        setFriends(data?.map(f => f.friend_id) || []);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const joinCommunity = async (communityId) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .insert([{
          community_id: communityId,
          user_id: user.id,
          role: 'member'
        }]);

      if (error) throw error;

      setUserCommunities([...userCommunities, communityId]);
      setSelectedCommunityId(communityId);
      fetchCommunityMembers(communityId);

      Swal.fire({
        icon: 'success',
        title: 'Community Joined!',
        text: 'You successfully joined the community',
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

      const updated = userCommunities.filter(id => id !== communityId);
      setUserCommunities(updated);
      
      if (selectedCommunityId === communityId) {
        setSelectedCommunityId(updated.length > 0 ? updated[0] : null);
        setCommunityMembers([]);
      }

      Swal.fire({
        icon: 'success',
        title: 'Left Community',
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

  const selectedCommunity = allCommunities.find(c => c.id === selectedCommunityId);
  const myJoinedCommunities = allCommunities.filter(c => userCommunities.includes(c.id));
  const availableCommunities = allCommunities.filter(c => !userCommunities.includes(c.id));

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
            {/* My Communities */}
            {myJoinedCommunities.length > 0 && (
              <div className="mb-8">
                <h2 className="text-subheading font-poppins text-dark mb-4">👥 My Communities</h2>
                <div className="space-y-3">
                  {myJoinedCommunities.map((community) => (
                    <div 
                      key={community.id}
                      onClick={() => setSelectedCommunityId(community.id)}
                      className={`card cursor-pointer transition ${selectedCommunityId === community.id ? 'bg-primary/10 border-2 border-primary' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-body font-medium text-dark">{community.name}</h3>
                          <p className="text-small text-gray-500">{community.description}</p>
                        </div>
                        <button
                          onClick={() => leaveCommunity(community.id)}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          Leave
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Communities */}
            {availableCommunities.length > 0 && (
              <div className="mb-8">
                <h2 className="text-subheading font-poppins text-dark mb-4">🔓 Available Communities</h2>
                <div className="space-y-3">
                  {availableCommunities.map((community) => (
                    <div key={community.id} className="card">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-body font-medium text-dark">{community.name}</h3>
                          <p className="text-small text-gray-500">{community.description}</p>
                        </div>
                        <button
                          onClick={() => joinCommunity(community.id)}
                          className="px-4 py-2 bg-primary text-white text-xs rounded hover:bg-primary/90 font-medium"
                        >
                          + Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Community Members */}
            {selectedCommunity && userCommunities.includes(selectedCommunity.id) && (
              <div>
                <h2 className="text-subheading font-poppins text-dark mb-4">
                  🏆 {selectedCommunity.name} Members ({communityMembers.length})
                </h2>

                {communityMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-body text-gray-500">No members yet. You're the first!</p>
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
                                {member.userId === user.id ? '👤 You' : member.name}
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
                                {friends.includes(member.userId) ? '✓ Friend' : '+ Add'}
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
                {habits.length === 0 && (
                  <p className="text-small text-gray-500">Create a habit first to send challenges!</p>
                )}
                {habits.length > 0 && (
                  <p className="text-small text-gray-500">The user will receive a challenge notification!</p>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 bg-white border-t border-gray-100 px-6 py-4 space-y-3 pb-24">
              <button
                onClick={() => sendChallenge(selectedUser)}
                disabled={habits.length === 0}
                className={`w-full py-3 rounded-lg font-medium text-white ${
                  habits.length === 0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90'
                }`}
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
