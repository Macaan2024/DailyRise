import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useChallenges = (userId, communityId) => {
  const [sentChallenges, setSentChallenges] = useState({});
  const [receivedChallenges, setReceivedChallenges] = useState([]);

  useEffect(() => {
    if (!userId) return;

    // Fetch initial sent challenges
    fetchSentChallenges();
  }, [userId]);

  const fetchSentChallenges = async () => {
    try {
      const { data } = await supabase
        .from('challenges')
        .select('challengee_id, status')
        .eq('challenger_id', userId)
        .neq('status', 'declined');

      const map = {};
      data?.forEach(c => {
        map[c.challengee_id] = c.status;
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
