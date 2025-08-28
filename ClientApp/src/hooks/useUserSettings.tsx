import { useState, useEffect, useCallback } from 'react';
import { api, UserSettings, SettingUpdateRequest } from '../services/api';
import { SettingsRegistry } from '../utils/settingsRegistry';

export interface UseUserSettingsReturn {
  settings: Record<string, any>;
  loading: boolean;
  error: string | null;
  updateSetting: (key: string, value: any) => Promise<void>;
  updateMultipleSettings: (updates: Record<string, any>) => Promise<void>;
  getSetting: <T = any>(key: string, fallback?: T) => T;
  resetToDefaults: () => Promise<void>;
  isSettingVisible: (key: string) => boolean;
  validateSetting: (key: string, value: any) => { valid: boolean; error?: string };
  refresh: () => Promise<void>;
}

export function useUserSettings(): UseUserSettingsReturn {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current settings values with defaults - parse JSON from backend
  const settings = userSettings?.settingsJson 
    ? (() => {
        try {
          return JSON.parse(userSettings.settingsJson);
        } catch (e) {
          console.error('Failed to parse settings JSON:', e);
          return {};
        }
      })()
    : {};
  
  const settingsWithDefaults = {
    ...SettingsRegistry.getDefaultValues(),
    ...settings,
  };

  // Load user settings from API
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.settings.getUserSettings();
      setUserSettings(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
      setError(errorMessage);
      console.error('Failed to load user settings:', err);
      
      // If settings don't exist yet, create with defaults
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        try {
          const defaultSettings = SettingsRegistry.getDefaultValues();
          const created = await api.settings.updateUserSettings({ settings: defaultSettings });
          setUserSettings(created);
          setError(null);
        } catch (createErr) {
          console.error('Failed to create default settings:', createErr);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Update a single setting
  const updateSetting = useCallback(async (key: string, value: any) => {
    try {
      setError(null);
      
      // Validate the setting
      const validation = SettingsRegistry.validateSetting(key, value);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid setting value');
      }

      const updateData: SettingUpdateRequest = { key, value };
      const updated = await api.settings.updateSetting(updateData);
      setUserSettings(updated);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update setting';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update multiple settings at once
  const updateMultipleSettings = useCallback(async (updates: Record<string, any>) => {
    try {
      setError(null);
      
      // Validate all settings
      for (const [key, value] of Object.entries(updates)) {
        const validation = SettingsRegistry.validateSetting(key, value);
        if (!validation.valid) {
          throw new Error(`Invalid value for ${key}: ${validation.error}`);
        }
      }

      // Merge with existing settings
      const newSettings = { ...settingsWithDefaults, ...updates };
      const updated = await api.settings.updateUserSettings({ settings: newSettings });
      setUserSettings(updated);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      throw err;
    }
  }, [settingsWithDefaults]);

  // Get a setting value with fallback
  const getSetting = useCallback(<T = any>(key: string, fallback?: T): T => {
    const value = settingsWithDefaults[key];
    if (value !== undefined && value !== null) {
      return value as T;
    }
    
    // Try to get default from registry
    const settingDef = SettingsRegistry.getSetting(key);
    if (settingDef) {
      return settingDef.defaultValue as T;
    }
    
    // Return provided fallback or undefined
    return fallback as T;
  }, [settingsWithDefaults]);

  // Reset all settings to defaults
  const resetToDefaults = useCallback(async () => {
    try {
      setError(null);
      const updated = await api.settings.resetToDefaults();
      setUserSettings(updated);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset settings';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Check if a setting should be visible based on dependencies
  const isSettingVisible = useCallback((key: string): boolean => {
    return SettingsRegistry.isSettingVisible(key, settingsWithDefaults);
  }, [settingsWithDefaults]);

  // Validate a setting value
  const validateSetting = useCallback((key: string, value: any) => {
    return SettingsRegistry.validateSetting(key, value);
  }, []);

  // Refresh settings from server
  const refresh = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  return {
    settings: settingsWithDefaults,
    loading,
    error,
    updateSetting,
    updateMultipleSettings,
    getSetting,
    resetToDefaults,
    isSettingVisible,
    validateSetting,
    refresh,
  };
}

// Helper hook for getting a specific setting value
export function useSetting<T = any>(key: string, fallback?: T): [T, (value: T) => Promise<void>] {
  const { getSetting, updateSetting } = useUserSettings();
  
  const value = getSetting<T>(key, fallback);
  
  const setValue = useCallback(async (newValue: T) => {
    await updateSetting(key, newValue);
  }, [key, updateSetting]);

  return [value, setValue];
}

// Helper hook for getting settings by category
export function useSettingsByCategory(categoryKey: string) {
  const { settings, isSettingVisible } = useUserSettings();
  
  const categorySettings = SettingsRegistry.getVisibleSettingsForCategory(categoryKey, settings);
  
  return categorySettings.map(setting => ({
    ...setting,
    value: settings[setting.key] ?? setting.defaultValue,
    visible: isSettingVisible(setting.key),
  }));
}
