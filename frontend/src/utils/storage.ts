export const DEMO_USER_ID = 'mock-user-1';
export const DEMO_EMAIL = 'demo@studiq.com';
export const OFFLINE_USERS_KEY = 'studiq_offline_users'; // Single source of truth — used by register, login, logout
export const STORAGE_VERSION = 'v1';
export const TELEMETRY_MAX_LIMIT = 100;

export interface FocusSessionLog {
  id: string;
  createdAt: string;
  completedAt: string;
  startTime: string;
  endTime: string;
  focusDuration: number;
  idleDuration: number;
  distractionCount: number;
  focusScore: number;
}

export const safeParse = <T>(jsonStr: string | null, fallback: T): T => {
  if (!jsonStr) return fallback;
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.warn('Malformed storage JSON detected, resetting to default', e);
    return fallback;
  }
};

export const getStorageKey = (key: string): string => {
  if (!key.startsWith('studiq_')) return key;
  
  const globalKeys = [
    'studiq_user',
    'studiq_access_token',
    'studiq_refresh_token',
    'studiq_theme'
  ];
  if (globalKeys.includes(key)) {
    return key;
  }

  const userStr = localStorage.getItem('studiq_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const userId = user?.id || user?._id;
      if (userId) {
        const baseKey = key.startsWith('studiq_') ? key.replace('studiq_', '') : key;
        const userPrefix = `studiq_${STORAGE_VERSION}_${userId}_`;
        if (key.startsWith(userPrefix)) {
          return key;
        }
        return `${userPrefix}${baseKey}`;
      }
    } catch (e) {
      // Fallback
    }
  }

  return key;
};

export const storage = {
  getItem: (key: string): string | null => {
    return localStorage.getItem(getStorageKey(key));
  },
  
  setItem: (key: string, value: string): void => {
    localStorage.setItem(getStorageKey(key), value);
  },
  
  removeItem: (key: string): void => {
    localStorage.removeItem(getStorageKey(key));
  },

  runMigrationCleanup: (): void => {
    try {
      const userStr = localStorage.getItem('studiq_user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      const userId = user?.id || user?._id;
      if (userId && userId !== DEMO_USER_ID) {
        const keys = Object.keys(localStorage);
        const globalKeys = [
          'studiq_user',
          'studiq_access_token',
          'studiq_refresh_token',
          'studiq_theme',
          'studiq_offline_users'
        ];
        keys.forEach((key) => {
          if (key.startsWith('studiq_') && !globalKeys.includes(key) && !key.includes(`_${STORAGE_VERSION}_`)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (e) {
      console.error('Migration cleanup failed', e);
    }
  }
};
