import React, { useEffect } from 'react';
import { useAuth } from '../App';
import { usePeerInterviewQueue } from '../context/PeerInterviewQueueContext';

/** Loads peer waitlist from Lambda when userId is available (login / restore session). */
const PeerInterviewBackendSync: React.FC = () => {
  const { userId } = useAuth();
  const { refreshWaitlistFromBackend } = usePeerInterviewQueue();

  useEffect(() => {
    if (!userId) return;
    void refreshWaitlistFromBackend(userId);
  }, [userId, refreshWaitlistFromBackend]);

  return null;
};

export default PeerInterviewBackendSync;
