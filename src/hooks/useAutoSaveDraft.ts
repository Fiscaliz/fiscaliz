import { useState, useEffect, useCallback, useRef } from 'react';

const DRAFT_STORAGE_PREFIX = 'fiscaliz_draft_';
const AUTO_SAVE_INTERVAL = 5000; // Save every 5 seconds

interface DraftData {
  savedAt: string;
  data: any;
}

/**
 * Hook to auto-save document drafts to localStorage
 * Prevents data loss when internet connection fails
 */
export function useAutoSaveDraft<T>(
  key: string,
  initialData: T,
  options?: {
    enabled?: boolean;
    interval?: number;
  }
) {
  const { enabled = true, interval = AUTO_SAVE_INTERVAL } = options || {};
  const [data, setData] = useState<T>(initialData);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasPendingDraft, setHasPendingDraft] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = `${DRAFT_STORAGE_PREFIX}${key}`;

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!enabled) return;
    
    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        const parsed: DraftData = JSON.parse(savedDraft);
        setData(parsed.data);
        setLastSaved(new Date(parsed.savedAt));
        setHasPendingDraft(true);
      }
    } catch (error) {
      console.error('[AutoSave] Error loading draft:', error);
    }
  }, [storageKey, enabled]);

  // Save draft to localStorage
  const saveDraft = useCallback((dataToSave: T) => {
    if (!enabled) return;
    
    try {
      const draftData: DraftData = {
        savedAt: new Date().toISOString(),
        data: dataToSave,
      };
      localStorage.setItem(storageKey, JSON.stringify(draftData));
      setLastSaved(new Date());
      setHasPendingDraft(true);
    } catch (error) {
      console.error('[AutoSave] Error saving draft:', error);
    }
  }, [storageKey, enabled]);

  // Auto-save on interval
  useEffect(() => {
    if (!enabled) return;
    
    intervalRef.current = setInterval(() => {
      saveDraft(data);
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [data, saveDraft, interval, enabled]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasPendingDraft(false);
      setLastSaved(null);
    } catch (error) {
      console.error('[AutoSave] Error clearing draft:', error);
    }
  }, [storageKey]);

  // Update data and trigger save
  const updateData = useCallback((newData: T | ((prev: T) => T)) => {
    setData(prev => {
      const updated = typeof newData === 'function' 
        ? (newData as (prev: T) => T)(prev) 
        : newData;
      // Save immediately when data changes
      saveDraft(updated);
      return updated;
    });
  }, [saveDraft]);

  // Check if there's a saved draft
  const getDraft = useCallback((): T | null => {
    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        const parsed: DraftData = JSON.parse(savedDraft);
        return parsed.data;
      }
    } catch (error) {
      console.error('[AutoSave] Error getting draft:', error);
    }
    return null;
  }, [storageKey]);

  return {
    data,
    setData: updateData,
    saveDraft: () => saveDraft(data),
    clearDraft,
    getDraft,
    lastSaved,
    hasPendingDraft,
  };
}

/**
 * Get all saved drafts from localStorage
 */
export function getAllDrafts(): { key: string; savedAt: string; data: any }[] {
  const drafts: { key: string; savedAt: string; data: any }[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(DRAFT_STORAGE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          const parsed: DraftData = JSON.parse(value);
          drafts.push({
            key: key.replace(DRAFT_STORAGE_PREFIX, ''),
            savedAt: parsed.savedAt,
            data: parsed.data,
          });
        }
      }
    }
  } catch (error) {
    console.error('[AutoSave] Error getting all drafts:', error);
  }
  
  return drafts.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

/**
 * Clear a specific draft by key
 */
export function clearDraftByKey(key: string): void {
  try {
    localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${key}`);
  } catch (error) {
    console.error('[AutoSave] Error clearing draft:', error);
  }
}

/**
 * Clear all saved drafts
 */
export function clearAllDrafts(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(DRAFT_STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('[AutoSave] Error clearing all drafts:', error);
  }
}
