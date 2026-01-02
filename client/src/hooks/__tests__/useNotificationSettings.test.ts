import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotificationSettings } from '../useNotificationSettings';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useNotificationSettings', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should have notifications enabled by default', () => {
      const { result } = renderHook(() => useNotificationSettings());
      expect(result.current.isEnabled).toBe(true);
    });

    it('should have sound enabled by default', () => {
      const { result } = renderHook(() => useNotificationSettings());
      expect(result.current.soundEnabled).toBe(true);
    });

    it('should have DND inactive by default', () => {
      const { result } = renderHook(() => useNotificationSettings());
      expect(result.current.isDndActive).toBe(false);
    });

    it('should have all notification types enabled by default', () => {
      const { result } = renderHook(() => useNotificationSettings());
      expect(result.current.notificationTypes.contact).toBe(true);
      expect(result.current.notificationTypes.quote).toBe(true);
      expect(result.current.notificationTypes.application).toBe(true);
      expect(result.current.notificationTypes.newsletter).toBe(true);
      expect(result.current.notificationTypes.system).toBe(true);
    });
  });

  describe('Toggle Notifications', () => {
    it('should toggle notifications enabled state', () => {
      const { result } = renderHook(() => useNotificationSettings());
      
      act(() => {
        result.current.setIsEnabled(false);
      });
      
      expect(result.current.isEnabled).toBe(false);
      
      act(() => {
        result.current.setIsEnabled(true);
      });
      
      expect(result.current.isEnabled).toBe(true);
    });

    it('should toggle sound enabled state', () => {
      const { result } = renderHook(() => useNotificationSettings());
      
      act(() => {
        result.current.setSoundEnabled(false);
      });
      
      expect(result.current.soundEnabled).toBe(false);
    });
  });

  describe('Do Not Disturb Mode', () => {
    it('should activate DND mode for specified minutes', () => {
      const { result } = renderHook(() => useNotificationSettings());
      
      act(() => {
        result.current.setDndMode(30);
      });
      
      expect(result.current.isDndActive).toBe(true);
    });

    it('should clear DND mode', () => {
      const { result } = renderHook(() => useNotificationSettings());
      
      act(() => {
        result.current.setDndMode(30);
      });
      
      expect(result.current.isDndActive).toBe(true);
      
      act(() => {
        result.current.clearDndMode();
      });
      
      expect(result.current.isDndActive).toBe(false);
    });

    it('should return remaining DND time as formatted string', () => {
      const { result } = renderHook(() => useNotificationSettings());
      
      act(() => {
        result.current.setDndMode(30);
      });
      
      const remaining = result.current.getRemainingDndTime();
      expect(remaining).toMatch(/\d+m/);
    });

    it('should return empty string when DND is not active', () => {
      const { result } = renderHook(() => useNotificationSettings());
      
      const remaining = result.current.getRemainingDndTime();
      expect(remaining).toBe('');
    });
  });

  describe('Notification Types', () => {
    it('should toggle individual notification types', () => {
      const { result } = renderHook(() => useNotificationSettings());
      
      act(() => {
        result.current.toggleNotificationType('contact');
      });
      
      expect(result.current.notificationTypes.contact).toBe(false);
      
      act(() => {
        result.current.toggleNotificationType('contact');
      });
      
      expect(result.current.notificationTypes.contact).toBe(true);
    });

    it('should toggle quote notification type', () => {
      const { result } = renderHook(() => useNotificationSettings());
      
      act(() => {
        result.current.toggleNotificationType('quote');
      });
      
      expect(result.current.notificationTypes.quote).toBe(false);
    });

    it('should toggle application notification type', () => {
      const { result } = renderHook(() => useNotificationSettings());
      
      act(() => {
        result.current.toggleNotificationType('application');
      });
      
      expect(result.current.notificationTypes.application).toBe(false);
    });
  });

  describe('shouldShowNotification', () => {
    it('should return false when notifications are disabled', () => {
      const { result } = renderHook(() => useNotificationSettings());
      
      act(() => {
        result.current.setIsEnabled(false);
      });
      
      expect(result.current.shouldShowNotification('contact')).toBe(false);
    });

    it('should return false when DND is active', () => {
      const { result } = renderHook(() => useNotificationSettings());
      
      act(() => {
        result.current.setDndMode(30);
      });
      
      expect(result.current.shouldShowNotification('contact')).toBe(false);
    });

    it('should return false when specific type is disabled', () => {
      const { result } = renderHook(() => useNotificationSettings());
      
      act(() => {
        result.current.toggleNotificationType('contact');
      });
      
      expect(result.current.shouldShowNotification('contact')).toBe(false);
      expect(result.current.shouldShowNotification('quote')).toBe(true);
    });

    it('should return true for enabled type when notifications are on', () => {
      const { result } = renderHook(() => useNotificationSettings());
      
      expect(result.current.shouldShowNotification('contact')).toBe(true);
      expect(result.current.shouldShowNotification('quote')).toBe(true);
    });

    it('should return true for unknown types by default', () => {
      const { result } = renderHook(() => useNotificationSettings());
      
      expect(result.current.shouldShowNotification('unknown_type')).toBe(true);
    });
  });

  describe('Persistence', () => {
    it('should save settings to localStorage', () => {
      const { result } = renderHook(() => useNotificationSettings());
      
      act(() => {
        result.current.setIsEnabled(false);
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should load settings from localStorage', () => {
      const savedSettings = {
        isEnabled: false,
        soundEnabled: false,
        dndEndTime: null,
        notificationTypes: {
          contact: false,
          quote: true,
          application: true,
          newsletter: true,
          system: true,
        },
      };
      
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedSettings));
      
      const { result } = renderHook(() => useNotificationSettings());
      
      expect(result.current.isEnabled).toBe(false);
      expect(result.current.soundEnabled).toBe(false);
      expect(result.current.notificationTypes.contact).toBe(false);
    });
  });
});
