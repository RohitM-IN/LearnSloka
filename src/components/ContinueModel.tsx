import React from 'react';
import type { ContinueModalProps } from '../@types/player';

export const ContinueModal: React.FC<ContinueModalProps> = ({
  showContinueModal,
  onContinue,
  onStartFresh
}) => {
  if (!showContinueModal) return null;

  return (
    <div className="fixed inset-0 bg-background bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 text-white">Continue from where you left off?</h3>
        <p className="text-subtext mb-6">
          We found your last played position. Would you like to continue from where you left off or start fresh?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onStartFresh}
            className="px-4 py-2 bg-base hover:bg-hover text-white rounded-md font-medium transition-colors"
          >
            Start Fresh
          </button>
          <button
            onClick={onContinue}
            className="px-4 py-2 bg-accent hover:bg-active text-white rounded-md font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};