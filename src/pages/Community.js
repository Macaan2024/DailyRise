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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunity, setNewCommunity] = useState({ name: '', description: '' });

  // eslint-disable-next-line no-unused-vars
  const communityNameExamples = [
    'Morning Runners',
    'Study Partners',
    'Fitness Buddies',
    'Daily Readers',
    'Meditation Circle',
    'Night Owls',
    'Book Club',
    'Wellness Warriors',
    'Tech Enthusiasts',
    'Yoga Lovers',
    'Writing Collective',
    'Cooking Challenge'
  ];

  useEffect(() => {
    if (user) {
      fetchCommunities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const createCommunity = async () => {
    if (!newCommunity.name || !newCommunity.description) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please fill in all fields',
        confirmButtonColor: '#043915',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('community')
        .insert([{ name: newCommunity.name, description: newCommunity.description }])
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      await supabase
        .from('community_members')
        .insert([{ community_id: data.id, user_id: user.id, role: 'admin' }]);

      setCommunities([...communities, data]);
      setUserCommunities([...userCommunities, data.id]);
      setNewCommunity({ name: '', description: '' });
      setShowCreateModal(false);

      Swal.fire({
        icon: 'success',
        title: 'Created!',
        text: 'Community created successfully',
        timer: 1500,
        confirmButtonColor: '#043915',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to create community',
        confirmButtonColor: '#043915',
      });
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

      Swal.fire({
        icon: 'success',
        title: 'Left',
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
      <Header title="Communities" />

      <div className="px-4 py-4 pb-32">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-subheading font-poppins text-dark">Join a Community</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 text-body text-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM12 14c-5.373 0-9 2.686-9 6v2h18v-2c0-3.314-3.627-6-9-6z" />
              </svg>
            </div>
            <p className="text-body text-gray-500 mb-4">No communities available yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {communities.map((community) => {
              const isMember = userCommunities.includes(community.id);
              return (
                <div key={community.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-body font-medium text-dark">{community.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{community.description}</p>
                      <p className="text-xs text-primary mt-2">👥 Community Group</p>
                    </div>
                    <button
                      onClick={() => isMember ? leaveCommunity(community.id) : joinCommunity(community.id)}
                      className={`px-4 py-2 rounded-lg text-body font-medium transition-colors ${
                        isMember
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-primary text-white hover:bg-primary/90'
                      }`}
                    >
                      {isMember ? 'Leave' : 'Join'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end overflow-hidden">
          <div className="bg-white w-full max-h-[85vh] rounded-t-3xl overflow-hidden flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-heading font-poppins text-dark">Create Community</h2>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="block text-body text-gray-600 mb-2 font-medium">Community Name</label>
                <select
                  value={newCommunity.name}
                  onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="">Select a community type...</option>
                  {communityNameExamples.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-body text-gray-600 mb-2 font-medium">Description</label>
                <textarea
                  value={newCommunity.description}
                  onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                  placeholder="Tell others about this community..."
                  rows="4"
                  className="input-field w-full resize-none"
                />
              </div>
            </div>

            <div className="flex-shrink-0 bg-white border-t border-gray-100 px-6 py-4 space-y-3 pb-24">
              <button
                onClick={createCommunity}
                className="btn-primary w-full py-3 rounded-lg font-medium text-white"
              >
                Create Community
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
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
