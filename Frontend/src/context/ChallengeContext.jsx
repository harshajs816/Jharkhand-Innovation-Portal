import { createContext, useState } from 'react';
import { mockChallenges, currentUser, notifications as initialNotifications } from '../data/mockData';

export const ChallengeContext = createContext();

export const ChallengeProvider = ({ children }) => {
  const [challenges, setChallenges] = useState(mockChallenges);
  const [userNotifications, setUserNotifications] = useState(initialNotifications);

  // Admin Action: University ko Assign karna
  const assignUniversity = (challengeId, universityId, universityName) => {
    setChallenges((prev) =>
      prev.map((item) => {
        if (item.id === challengeId) {
          const today = new Date().toISOString().split('T')[0];
          return {
            ...item,
            status: 'university-matching',
            assignedUniversityId: universityId,
            assignedUniversityName: universityName,
            updatedAt: new Date().toISOString(),
            timeline: [
              ...item.timeline,
              { status: 'university-matching', date: today, note: `Routed to ${universityName} for matching.` }
            ]
          };
        }
        return item;
      })
    );
  };

  // University Action: Accept / Reject / Status Update karna
  const updateChallengeStatus = (challengeId, newStatus, note = '') => {
    setChallenges((prev) =>
      prev.map((item) => {
        if (item.id === challengeId) {
          const today = new Date().toISOString().split('T')[0];
          return {
            ...item,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            timeline: [
              ...item.timeline,
              { status: newStatus, date: today, note: note || `Status updated to ${newStatus}` }
            ]
          };
        }
        return item;
      })
    );
  };

  // Citizen Action: Naya challenge submit karna
  const submitChallenge = (newChallengeData) => {
    const newId = `JH-2026-000${Math.floor(100 + Math.random() * 900)}`;
    const today = new Date().toISOString().split('T')[0];
    
    const createdChallenge = {
      id: newId,
      ...newChallengeData,
      status: 'submitted',
      endorsements: 1,
      userEndorsed: true,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [{ status: 'submitted', date: today, note: 'Challenge submitted by citizen.' }]
    };

    setChallenges((prev) => [createdChallenge, ...prev]);
  };

  return (
    <ChallengeContext.Provider
      value={{
        challenges,
        assignUniversity,
        updateChallengeStatus,
        submitChallenge,
        userNotifications,
        setUserNotifications,
      }}
    >
      {children}
    </ChallengeContext.Provider>
  );
};