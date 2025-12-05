import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Leaderboard from '../components/Leaderboard';
import ChallengeModal from '../components/ChallengeModal';
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
  const [showViewChallengeModal, setShowViewChallengeModal] = useState(false);
  const [viewChallengeId, setViewChallengeId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchJoinedCommunities();
      fetchPendingChallenges();
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
      
      // FIX: Added .order() and .limit(1) to always get the LATEST active challenge
      // This prevents crashes when users have multiple past challenges
      
      // 1. Try to find where I am the Challenger
      let { data } = await supabase
        .from('challenges')
        .select('*')
        .eq('challenger_id', user.id)
        .eq('challenged_user_id', userId)
        .neq('status', 'declined')
        .order('created_at', { ascending: false }) // Get the newest one
        .limit(1)
        .maybeSingle();

      console.log('📋 Challenge as challenger:', data);

      // 2. If not found, try where I am the Challenged User
      if (!data) {
        const result = await supabase
          .from('challenges')
          .select('*')
          .eq('challenger_id', userId)
          .eq('challenged_user_id', user.id)
          .neq('status', 'declined')
          .order('created_at', { ascending: false }) // Get the newest one
          .limit(1)
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

  return (
    <Layout>
      <Header title="Community Group" />

      <div className="px-4 py-4 pb-32">
        {/* Show challenge notification badge with refresh button */}
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

        {/* --- CHANGED SECTION START --- */}
        {/* Navigation / Actions Row */}
        <div className="flex flex-row justify-between items-center mb-4">
          {/* Back Button (Only visible when a community is selected) */}
          {selectedCommunity ? (
            <button
              onClick={() => setSelectedCommunity(null)}
              className="bg-gray-200 rounded-sm py-1 px-4 text-secondary text-small font-medium flex items-center"
            >
              Back
            </button>
          ) : (
            <div></div> // Spacer to keep Refresh on the right if that's preferred, or remove to align left
          )}

          {/* Refresh Button */}
          <button
            onClick={fetchPendingChallenges}
            className="text-secondary text-small font-medium px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition flex items-center gap-1"
          >
            Refresh
          </button>
        </div>
        {/* --- CHANGED SECTION END --- */}

        {selectedCommunity ? (
          // Show leaderboard for selected community
          <div>
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
                      className={`px-4 py-2 text-xs rounded font-medium whitespace-nowrap ml-3 ${isJoined
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-primary text-white hover:bg-primary/90'
                        }`}
                    >
                      {isJoined ? 'Leave' : '  Join  '}
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
        onSuccess={() => { }}
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