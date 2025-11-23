import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';
import { groupVaultFactory } from '../services/contracts';

const GroupContext = createContext();

export function useGroup() {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
}

export function GroupProvider({ children }) {
  const address = useTonAddress();
  const [currentGroup, setCurrentGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user's groups from factory contract
  useEffect(() => {
    async function loadGroups() {
      if (!address) {
        setGroups([]);
        setCurrentGroup(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get user's groups from factory
        const userGroups = await groupVaultFactory.getUserGroups(address);

        if (userGroups && userGroups.length > 0) {
          setGroups(userGroups);

          // Auto-select first group if none selected
          if (!currentGroup) {
            setCurrentGroup(userGroups[0]);
            // Store in localStorage for persistence
            localStorage.setItem('selectedGroupAddress', userGroups[0].address);
          }
        } else {
          setGroups([]);
          setCurrentGroup(null);
        }
      } catch (err) {
        console.error('Error loading groups:', err);
        setError(err.message);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    }

    loadGroups();
  }, [address]);

  // Restore selected group from localStorage on mount
  useEffect(() => {
    const savedGroupAddress = localStorage.getItem('selectedGroupAddress');
    if (savedGroupAddress && groups.length > 0) {
      const savedGroup = groups.find(g => g.address === savedGroupAddress);
      if (savedGroup) {
        setCurrentGroup(savedGroup);
      }
    }
  }, [groups]);

  const selectGroup = (group) => {
    setCurrentGroup(group);
    if (group) {
      localStorage.setItem('selectedGroupAddress', group.address);
    } else {
      localStorage.removeItem('selectedGroupAddress');
    }
  };

  const addGroup = (group) => {
    setGroups(prev => [...prev, group]);
    if (!currentGroup) {
      selectGroup(group);
    }
  };

  const refreshGroups = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const userGroups = await groupVaultFactory.getUserGroups(address);
      setGroups(userGroups || []);
    } catch (err) {
      console.error('Error refreshing groups:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentGroup,
    groups,
    loading,
    error,
    selectGroup,
    addGroup,
    refreshGroups,
  };

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
}
