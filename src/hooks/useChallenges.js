import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useChallenges = (userId, communityId) => {
  const [sentChallenges, setSentChallenges] = useState({});
  const [receivedChallenges, setReceivedChallenges] = useState([]);

  useEffect(() => {
    if (!userId) return;

    // Fetch initial sent challenges
    fetchSentChallenges();

    // Subscribe to sent challenges changes
    const sentSub = supabase
      .from('challenges')
      .on('*', (payload) => {
        if (payload.new?.challenger_id === userId) {
          setSentChallenges(prev => ({
            ...prev,
            [payload.new.challenged_user_id]: payload.new.status
          }));
        }
      })
      .subscribe();

    // Subscribe to received challenges changes
    const receivedSub = supabase
      .from('challenges')
      .on('*', (payload) => {
        if (payload.new?.challenged_user_id === userId) {
          if (payload.new.status === 'pending') {
            setReceivedChallenges(prev => {
              const exists = prev.find(c => c.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.new.status === 'completed' || payload.new.status === 'declined') {
            setReceivedChallenges(prev => 
              prev.filter(c => c.id !== payload.new.id)
            );
          }
        }
      })
      .subscribe();

    return () => {
      sentSub.unsubscribe();
      receivedSub.unsubscribe();
    };
  }, [userId]);

  const fetchSentChallenges = async () => {
    try {
      const { data } = await supabase
        .from('challenges')
        .select('challenged_user_id, status')
        .eq('challenger_id', userId)
        .neq('status', 'declined');

      const map = {};
      data?.forEach(c => {
        map[c.challenged_user_id] = c.status;
      });
      setSentChallenges(map);
    } catch (error) {
      console.error('Error fetching sent challenges:', error);
    }
  };

  return {
    sentChallenges,
    receivedChallenges,
    setReceivedChallenges
  };
};
