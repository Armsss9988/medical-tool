import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'golab_recent_tests';
const MAX_RECENT = 15;

interface RecentTestItem {
  code: string;
  name: string;
  category: string;
}

/**
 * Hook to manage recently-used test indicators in localStorage.
 * Stores up to 15 most recently added tests for quick re-selection.
 */
export function useRecentTests() {
  const [recentTests, setRecentTests] = useState<RecentTestItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentTests(parsed.slice(0, MAX_RECENT));
        }
      }
    } catch {
      // Silently ignore parse errors
    }
  }, []);

  // Persist to localStorage whenever recentTests changes
  const persist = useCallback((items: RecentTestItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Silently ignore storage errors
    }
  }, []);

  const addToRecent = useCallback((item: RecentTestItem) => {
    setRecentTests((prev) => {
      // Remove duplicate if exists, then prepend
      const filtered = prev.filter((t) => t.code !== item.code);
      const next = [item, ...filtered].slice(0, MAX_RECENT);
      persist(next);
      return next;
    });
  }, [persist]);

  const addMultipleToRecent = useCallback((items: RecentTestItem[]) => {
    setRecentTests((prev) => {
      let updated = [...prev];
      for (const item of items) {
        updated = updated.filter((t) => t.code !== item.code);
        updated = [item, ...updated];
      }
      const next = updated.slice(0, MAX_RECENT);
      persist(next);
      return next;
    });
  }, [persist]);

  const clearRecent = useCallback(() => {
    setRecentTests([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silently ignore
    }
  }, []);

  return {
    recentTests,
    addToRecent,
    addMultipleToRecent,
    clearRecent
  };
}
