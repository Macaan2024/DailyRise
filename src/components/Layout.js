import React from 'react';
import BottomNav from './BottomNav';
import { useChallenges } from '../hooks/useChallenges';
import ChallengeReceivedModal from './ChallengeReceivedModal';

const Layout = ({ children }) => {
  const { incomingChallenge, acceptChallenge, rejectChallenge } = useChallenges();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <main className="container mx-auto px-4 py-6 max-w-lg">
        {children}
      </main>
      <BottomNav />

      {/* Global Challenge Received Modal */}
      {incomingChallenge && (
        <ChallengeReceivedModal
          challenge={incomingChallenge}
          onAccept={() => acceptChallenge(incomingChallenge.id)}
          onDecline={() => rejectChallenge(incomingChallenge.id)}
        />
      )}F
    </div>
  );
};

export default Layout;