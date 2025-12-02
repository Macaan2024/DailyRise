import React, { useState } from 'react';
import { useChallenges } from '../hooks/useChallenges';
import ChallengeModal from '../components/ChallengeModal';
import { Plus, Users, Trophy, Zap } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';
import ViewChallengeModal from '../components/ViewChallengeModal';

const Community = () => {
  // Removed incomingChallenge logic as it is now handled globally in Layout.js
  const { challenges, loading, createChallenge } = useChallenges();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [activeTab, setActiveTab] = useState('challenges');

  const handleCreateChallenge = async (challengeData) => {
    const success = await createChallenge(challengeData);
    if (success) {
      setIsCreateModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community</h1>
          <p className="text-gray-500">Connect and compete with friends</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'challenges'
              ? 'bg-primary text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Zap size={16} />
            <span>Active Challenges</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'leaderboard'
              ? 'bg-primary text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Trophy size={16} />
            <span>Leaderboard</span>
          </div>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'challenges' ? (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading challenges...</div>
          ) : challenges.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Active Challenges</h3>
              <p className="text-gray-500 max-w-xs mx-auto mb-6">
                Create a challenge to compete with your friends and boost your motivation!
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-primary font-medium hover:text-primary-dark"
              >
                Start a Challenge
              </button>
            </div>
          ) : (
            challenges.map((challenge) => (
              <div
                key={challenge.id}
                onClick={() => setSelectedChallenge(challenge)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-primary transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                    <p className="text-sm text-gray-500">
                      by {challenge.creator?.email?.split('@')[0] || 'Unknown'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    challenge.status === 'active' 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {challenge.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {challenge.participants?.length || 0} participants
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy size={14} />
                      {challenge.duration_days} days
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <Leaderboard />
      )}

      {/* Modals */}
      <ChallengeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateChallenge}
      />

      {selectedChallenge && (
        <ViewChallengeModal
          challenge={selectedChallenge}
          isOpen={!!selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
        />
      )}
    </div>
  );
};

export default Community;