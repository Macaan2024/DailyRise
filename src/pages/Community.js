import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';
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

  useEffect(() => {
    if (user) {
      fetchJoinedCommunities();
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
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
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

  return (
    <Layout>
      <Header title="Community Accountability" />
      
      <div className="px-4 py-4 pb-32">
        <div className="space-y-3">
            {communities.map((community) => {
              const isJoined = joinedCommunities.includes(community.id);
              return (
                <div key={community.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-body font-medium text-dark">{community.name}</h3>
                      <p className="text-small text-gray-500">{community.description}</p>
                    </div>
                    <button
                      onClick={() => isJoined ? leaveCommunity(community.id) : joinCommunity(community.id)}
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
      </div>
    </Layout>
  );
};

export default Community;
