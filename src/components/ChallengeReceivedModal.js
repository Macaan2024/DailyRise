import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Swal from 'sweetalert2';

const ChallengeReceivedModal = ({ isOpen, challengeId, onClose, onRespond }) => {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (isOpen && challengeId) {
      fetchChallenge();
    }
  }, [isOpen, challengeId]);

  const fetchChallenge = async () => {
    try {
      const { data: challengeData } = await supabase
        .from('challenges')
        .select(`
          id,
          status,
          created_at,
          challenger_id,
          habit_id,
          community_id,
          habits:habit_id (name),
          challenger:challenger_id (firstname, lastname, image)
        `)
        .eq('id', challengeId)
        .single();

      setChallenge(challengeData);
    } catch (error) {
      console.error('Error fetching challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setResponding(true);
    try {
      const { error } = await supabase
        .from('challenges')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', challengeId);

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Challenge Accepted!',
        text: 'Complete the habit to earn 25 points!',
        timer: 1500,
        confirmButtonColor: '#043915',
      });

      onRespond?.();
      onClose();
    } catch (error) {
      console.error('Error accepting challenge:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to accept challenge',
        confirmButtonColor: '#043915',
      });
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    setResponding(true);
    try {
      const { error } = await supabase
        .from('challenges')
        .update({ status: 'declined' })
        .eq('id', challengeId);

      if (error) throw error;

      Swal.fire({
        icon: 'info',
        title: 'Challenge Declined',
        text: 'You declined the challenge',
        timer: 1500,
        confirmButtonColor: '#043915',
      });

      onRespond?.();
      onClose();
    } catch (error) {
      console.error('Error declining challenge:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to decline challenge',
        confirmButtonColor: '#043915',
      });
    } finally {
      setResponding(false);
    }
  };

  if (!isOpen) return null;
  if (loading) return null;
  if (!challenge) return null;

  const challengerName = `${challenge.challenger?.firstname} ${challenge.challenger?.lastname}`;
  const habitName = challenge.habits?.name || 'Unknown Habit';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold text-dark mb-2">🎯 New Challenge!</h3>
        
        <div className="mb-4">
          <p className="text-body text-dark">
            <span className="font-semibold">{challengerName}</span> challenged you to complete:
          </p>
          <p className="text-lg font-bold text-primary mt-2 mb-3">"{habitName}"</p>
          <p className="text-small text-gray-600">
            Complete this habit to earn <span className="font-bold text-primary">25 points</span>!
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-small text-blue-900">
            ✨ Completing challenges helps you earn points and build accountability in your community.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            disabled={responding}
            className="flex-1 px-4 py-2 bg-gray-200 text-dark rounded font-medium text-small hover:bg-gray-300 disabled:opacity-50"
          >
            {responding ? 'Processing...' : 'Decline'}
          </button>
          <button
            onClick={handleAccept}
            disabled={responding}
            className="flex-1 px-4 py-2 bg-primary text-white rounded font-medium text-small hover:bg-primary/90 disabled:opacity-50"
          >
            {responding ? 'Processing...' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeReceivedModal;
