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
      fetchPendingChallenges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    // Auto-show first pending challenge modal if any exist
    // FIX: Added ?. to safely access length
    if (pendingChallenges?.length > 0 && !selectedChallengeId && !showChallengeReceivedModal) {
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

  const fetchPendingChallenges = async () => {
    try {
      const { data } = await supabase
        .from('challenges')
        .select('*')
        .eq('challenged_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setPendingChallenges(data || []);
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

  const handleViewChallenge = async (userId) => {
    try {
      console.log('🔍 handleViewChallenge called with userId:', userId, 'current user:', user.id);
      
      // Try to find challenge where user is challenger
      let { data } = await supabase
        .from('challenges')
        .select('*')
        .eq('challenger_id', user.id)
        .eq('challenged_user_id', userId)
        .neq('status', 'declined')
        .maybeSingle();

      console.log('📋 Challenge as challenger:', data);

      // If not found, try where user is challenged_user
      if (!data) {
        const result = await supabase
          .from('challenges')
          .select('*')
          .eq('challenger_id', userId)
          .eq('challenged_user_id', user.id)
          .neq('status', 'declined')
          .maybeSingle();
        data = result.data;
        console.log('📋 Challenge as challenged_user:', data);
      }

      if (data) {
        console.log('✅ Challenge found! ID:', data.id, 'Status:', data.status);
        setViewChallengeId(data.id);
        setShowViewChallengeModal(true);
      } else {
        console.log('❌ No challenge found');
        Swal.fire({
          icon: 'warning',
          title: 'Not Found',
          text: 'Challenge not found',
          confirmButtonColor: '#043915',
        });
      }
    } catch (error) {
      console.error('Error finding challenge:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to view challenge',
        confirmButtonColor: '#043915',
      });
    }
  };

  const handleChallengeRespond = () => {
    // Refresh pending challenges after responding
    setSelectedChallengeId(null);
    fetchPendingChallenges();
  };

  return (
    <Layout>
      <Header title="Community Accountability" />
      
      <div className="px-4 py-4 pb-32">
        {/* Show challenge notification badge with refresh button */}
        {/* FIX: Added ?. to safely access length in all 3 places below */}
        {pendingChallenges?.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <p className="text-small text-yellow-900">
              🎯 You have <span className="font-bold">{pendingChallenges?.length}</span> pending challenge{pendingChallenges?.length > 1 ? 's' : ''}!
            </p>
            <button
              onClick={fetchPendingChallenges}
              className="text-xs bg-yellow-200 hover:bg-yellow-300 text-yellow-900 px-2 py-1 rounded font-medium transition"
            >
              🔄 Refresh
            </button>
          </div>
        )}
        
        {/* Refresh button always visible */}
        <button
          onClick={fetchPendingChallenges}
          className="text-xs mb-3 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-medium transition flex items-center gap-1"
        >
          🔄 Check for Challenges
        </button>

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