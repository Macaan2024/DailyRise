import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Leaderboard from '../components/Leaderboard';
import ChallengeModal from '../components/ChallengeModal';
import ChallengeReceivedModal from '../components/ChallengeReceivedModal';
import Swal from 'sweetalert2';

const Community = () => {
  const { user } = useAuth();
  const [communities] = useState([
    { id: 1, name: 'Fitness Warriors', description: 'Exercise and fitness challenges' },
    { id: 2, name: 'Meditation Masters', description: 'Mindfulness and meditation group' },
    { id: 3, name: 'Reading Circle', description: 'Daily reading habits' },
    { id: 4, name: 'Productivity Pros', description: 'Build productive habits together' },
    { id: 5, name: 'Health Champions', description: 'Health and wellness community' },
  ]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengedUserId, setChallengedUserId] = useState(null);
  const [pendingChallenges, setPendingChallenges] = useState([]);
  const [showChallengeReceivedModal, setShowChallengeReceivedModal] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchJoinedCommunities();
      fetchPendingChallenges();
      
      // Poll for new challenges every 5 seconds
      const interval = setInterval(fetchPendingChallenges, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchJoinedCommunities = async () => {
    try {
      const { data } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id);
      setJoinedCommunities(data?.map(m => m.community_id) || []);
    } catch (error) {
      console.error('Error fetching joined communities:', error);
    }
  };

  const fetchPendingChallenges = async () => {
    try {
      const { data } = await supabase
        .from('challenges')
        .select('*')
        .eq('challenged_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setPendingChallenges(data || []);
      
      // Auto-show first pending challenge modal if any exist
      if (data && data.length > 0 && !selectedChallengeId) {
        setSelectedChallengeId(data[0].id);
        setShowChallengeReceivedModal(true);
      }
    } catch (error) {
      console.error('Error fetching pending challenges:', error);
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

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      setJoinedCommunities([...joinedCommunities, communityId]);

      Swal.fire({
        icon: 'success',
        title: 'Joined!',
        text: 'You successfully joined the community',
        timer: 1500,
        confirmButtonColor: '#043915',
      });
    } catch (error) {
      console.error('Join error:', error);
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

      setJoinedCommunities(joinedCommunities.filter(id => id !== communityId));

      Swal.fire({
        icon: 'success',
        title: 'Left!',
        text: 'You left the community',
        timer: 1500,
        confirmButtonColor: '#043915',
      });
    } catch (error) {
      console.error('Leave error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to leave community',
        confirmButtonColor: '#043915',
      });
    }
  };

  const handleChallenge = (userId) => {
    setChallengedUserId(userId);
    setShowChallengeModal(true);
  };

  const handleChallengeRespond = () => {
    // Refresh pending challenges after responding
    fetchPendingChallenges();
    setSelectedChallengeId(null);
  };

  return (
    <Layout>
      <Header title="Community Accountability" />
      
      <div className="px-4 py-4 pb-32">
        {/* Show challenge notification badge */}
        {pendingChallenges.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-small text-yellow-900">
              🎯 You have <span className="font-bold">{pendingChallenges.length}</span> pending challenge{pendingChallenges.length > 1 ? 's' : ''}!
            </p>
          </div>
        )}

        {selectedCommunity ? (
          // Show leaderboard for selected community
          <div>
            <button
              onClick={() => setSelectedCommunity(null)}
              className="text-primary text-small font-medium mb-4 flex items-center"
            >
              ← Back to Communities
            </button>
            <Leaderboard 
              communityId={selectedCommunity} 
              onChallenge={handleChallenge}
            />
          </div>
        ) : (
          // Show communities list
          <div className="space-y-3">
            {communities.map((community) => {
              const isJoined = joinedCommunities.includes(community.id);
              return (
                <div 
                  key={community.id} 
                  className={`card ${isJoined ? 'cursor-pointer hover:shadow-md transition' : ''}`}
                  onClick={() => isJoined && setSelectedCommunity(community.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-body font-medium text-dark">{community.name}</h3>
                      <p className="text-small text-gray-500">{community.description}</p>
                      {isJoined && <p className="text-small text-primary mt-1">👉 Tap to view leaderboard</p>}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        isJoined ? leaveCommunity(community.id) : joinCommunity(community.id);
                      }}
                      className={`px-4 py-2 text-xs rounded font-medium whitespace-nowrap ml-3 ${
                        isJoined
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-primary text-white hover:bg-primary/90'
                      }`}
                    >
                      {isJoined ? 'Leave' : '+ Join'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ChallengeModal
        isOpen={showChallengeModal}
        communityId={selectedCommunity}
        challengedUserId={challengedUserId}
        onClose={() => setShowChallengeModal(false)}
        onSuccess={() => {}}
      />

      <ChallengeReceivedModal
        isOpen={showChallengeReceivedModal}
        challengeId={selectedChallengeId}
        onClose={() => {
          setShowChallengeReceivedModal(false);
          // Check if there are more pending challenges
          setTimeout(() => {
            fetchPendingChallenges();
          }, 500);
        }}
        onRespond={handleChallengeRespond}
      />
    </Layout>
  );
};

export default Community;
