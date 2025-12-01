import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Swal from 'sweetalert2';

const Community = () => {
  const { user } = useAuth();
  const [selectedCommunityId, setSelectedCommunityId] = useState(1);
  const [habits, setHabits] = useState([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedHabit, setSelectedHabit] = useState('');
  const [friends, setFriends] = useState([]);

  // Static Communities Data
  const communities = [
    { id: 1, name: 'Fitness Warriors', description: 'Exercise and fitness challenges' },
    { id: 2, name: 'Meditation Masters', description: 'Mindfulness and meditation group' },
    { id: 3, name: 'Reading Circle', description: 'Daily reading habits' },
    { id: 4, name: 'Productivity Pros', description: 'Build productive habits together' },
    { id: 5, name: 'Health Champions', description: 'Health and wellness community' },
  ];

  // Static Community Members Data (Demo Users)
  const demoMembers = {
    1: [
      { userId: 'user-1', name: 'Alex Runner', points: 2450 },
      { userId: 'user-2', name: 'Jordan Fit', points: 1890 },
      { userId: 'user-3', name: 'Casey Strong', points: 1650 },
      { userId: 'user-4', name: 'Morgan Active', points: 1200 },
    ],
    2: [
      { userId: 'user-5', name: 'Sam Zen', points: 3100 },
      { userId: 'user-6', name: 'Riley Peace', points: 2780 },
      { userId: 'user-7', name: 'Blake Calm', points: 2340 },
    ],
    3: [
      { userId: 'user-8', name: 'Pages Reader', points: 2650 },
      { userId: 'user-9', name: 'Story Lover', points: 2120 },
      { userId: 'user-10', name: 'Book Maven', points: 1950 },
    ],
    4: [
      { userId: 'user-11', name: 'Pro Worker', points: 3450 },
      { userId: 'user-12', name: 'Hustle Mode', points: 2890 },
      { userId: 'user-13', name: 'Focus Master', points: 2560 },
      { userId: 'user-14', name: 'Grind Daily', points: 2100 },
    ],
    5: [
      { userId: 'user-15', name: 'Health Pro', points: 2890 },
      { userId: 'user-16', name: 'Wellness Max', points: 2450 },
      { userId: 'user-17', name: 'Life Coach', points: 2200 },
    ],
  };

  useEffect(() => {
    fetchHabits();
    fetchFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const selectedCommunity = communities.find(c => c.id === selectedCommunityId);
  const communityMembers = demoMembers[selectedCommunityId] || [];

  return (
    <Layout>
      <Header title="Community" />
      
      <div className="px-4 py-4 pb-32">
        {/* Community Selector */}
        <div className="mb-6">
          <label className="block text-body font-medium text-dark mb-3">Select a Community</label>
          <select
            value={selectedCommunityId}
            onChange={(e) => setSelectedCommunityId(parseInt(e.target.value))}
            className="input-field w-full"
          >
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
          {selectedCommunity && (
            <p className="text-small text-gray-500 mt-2">
              {selectedCommunity.description}
            </p>
          )}
        </div>

        {/* Community Members */}
        {selectedCommunity && (
          <div>
            <h2 className="text-subheading font-poppins text-dark mb-4">
              👥 Community Members ({communityMembers.length})
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
                            {member.name}
                          </p>
                          <p className="text-small text-gray-500">{member.points} points</p>
                        </div>
                      </div>

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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                  <p className="text-small text-gray-500">The user will receive a challenge notification to complete this habit!</p>
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
