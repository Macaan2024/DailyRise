import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Swal from 'sweetalert2';

const Community = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCommunities();
      fetchJoinedCommunities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('community')
        .select('*')
        .order('id', { ascending: true });
      setCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

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

      if (error) throw error;

      setJoinedCommunities([...joinedCommunities, communityId]);

      Swal.fire({
        icon: 'success',
        title: 'Joined!',
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

      setJoinedCommunities(joinedCommunities.filter(id => id !== communityId));

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

  return (
    <Layout>
      <Header title="Community Accountability" />
      
      <div className="px-4 py-4 pb-32">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
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

            {communities.length === 0 && (
              <div className="text-center py-12">
                <p className="text-body text-gray-500">No communities available</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Community;
