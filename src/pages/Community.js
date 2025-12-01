import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Leaderboard from '../components/Leaderboard';
import ChallengeModal from '../components/ChallengeModal';
import ChallengeReceivedModal from '../components/ChallengeReceivedModal';
import ViewChallengeModal from '../components/ViewChallengeModal';
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
  const [showViewChallengeModal, setShowViewChallengeModal] = useState(false);
  const [viewChallengeId, setViewChallengeId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchJoinedCommunities();
      subscribeToReceivedChallenges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    // Auto-show first pending challenge modal if any exist
    if (pendingChallenges.length > 0 && !selectedChallengeId && !showChallengeReceivedModal) {
      setSelectedChallengeId(pendingChallenges[0].id);
      setShowChallengeReceivedModal(true);
    }
  }, [pendingChallenges, selectedChallengeId, showChallengeReceivedModal]);

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

  const subscribeToReceivedChallenges = () => {
    try {
      console.log('🔔 Subscribing to challenges for user:', user.id);
      const channel = supabase.channel(`challenges-${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'challenges'
        }, (payload) => {
          console.log('📨 Challenge INSERT event received:', payload);
          if (payload.new?.challenged_user_id === user.id && payload.new.status === 'pending') {
            console.log('✅ New challenge for me! Adding to pending:', payload.new);
            setPendingChallenges(prev => [payload.new, ...prev]);
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'challenges'
        }, (payload) => {
          console.log('📨 Challenge UPDATE event received:', payload);
          if (payload.new?.challenged_user_id === user.id) {
            if (payload.new.status === 'pending') {
              setPendingChallenges(prev => {
                const exists = prev.find(c => c.id === payload.new.id);
                if (exists) return prev;
                return [payload.new, ...prev];
              });
            } else {
              setPendingChallenges(prev => prev.filter(c => c.id !== payload.new.id));
            }
          }
        })
        .subscribe((status) => {
          console.log('🔗 Realtime subscription status:', status);
        });

      return () => channel.unsubscribe();
    } catch (error) {
      console.error('Error subscribing to challenges:', error);
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

  const handleViewChallenge = async (userId) => {
    try {
      const { data } = await supabase
        .from('challenges')
        .select('id')
        .eq('challenger_id', user.id)
        .eq('challenged_user_id', userId)
        .eq('status', 'completed')
        .single();

      if (data) {
        setViewChallengeId(data.id);
        setShowViewChallengeModal(true);
      }
    } catch (error) {
      console.error('Error finding challenge:', error);
    }
  };

  const handleChallengeRespond = () => {
    // Refresh pending challenges after responding
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
              onViewChallenge={handleViewChallenge}
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
          setSelectedChallengeId(null);
        }}
        onRespond={handleChallengeRespond}
      />

      <ViewChallengeModal
        isOpen={showViewChallengeModal}
        challengeId={viewChallengeId}
        onClose={() => setShowViewChallengeModal(false)}
      />
    </Layout>
  );
};

export default Community;
