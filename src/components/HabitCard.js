import React from 'react';

const categoryIcons = {
  health: '🏃',
  fitness: '💪',
  mindfulness: '🧘',
  learning: '📚',
  productivity: '⚡',
  social: '👥',
  finance: '💰',
  creativity: '🎨',
  other: '✨',
};

const HabitCard = ({ habit, log, onToggle, onEdit }) => {
  const status = log?.status || 'pending';

  const getStatusStyles = () => {
    switch (status) {
      case 'done':
        return 'bg-primary text-white';
      case 'missed':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'done':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'missed':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
    }
  };

  return (
    <div className="habit-card flex items-center gap-3">
      <button
        onClick={onToggle}
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${getStatusStyles()}`}
      >
        {getStatusIcon()}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-body">{categoryIcons[habit.category] || '✨'}</span>
          <h3 className={`text-subheading truncate ${status === 'done' ? 'line-through text-gray-400' : 'text-dark'}`}>
            {habit.name}
          </h3>
        </div>
        <p className="text-small text-gray-400 capitalize">{habit.frequency || 'Daily'}</p>
      </div>

      <button
        onClick={onEdit}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </div>
  );
};

export default HabitCard;
