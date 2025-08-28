import React, { useState } from 'react';
import { useUserSettings } from '../../../../hooks/useUserSettings';
import { SETTING_CATEGORIES, SettingsRegistry, SettingDefinition } from '../../../../utils/settingsRegistry';
import { Button } from '../../shared/ui/Button';
import { Toggle } from '../../shared/ui/Toggle';

interface SettingFieldProps {
  setting: SettingDefinition;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

function SettingField({ setting, value, onChange, disabled }: SettingFieldProps) {
  const handleChange = (newValue: any) => {
    if (!disabled) {
      onChange(newValue);
    }
  };

  switch (setting.type) {
    case 'select':
      return (
        <select
          value={value || setting.defaultValue}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {setting.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case 'toggle':
      return (
        <div className="mt-1">
          <Toggle
            checked={value ?? setting.defaultValue}
            onChange={handleChange}
            disabled={disabled}
          />
        </div>
      );

    case 'number':
      return (
        <input
          type="number"
          value={value ?? setting.defaultValue}
          onChange={(e) => handleChange(Number(e.target.value))}
          disabled={disabled}
          min={setting.validation?.min}
          max={setting.validation?.max}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      );

    case 'text':
      return (
        <input
          type="text"
          value={value ?? setting.defaultValue}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          pattern={setting.validation?.pattern}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      );

    case 'color':
      return (
        <input
          type="color"
          value={value ?? setting.defaultValue}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          className="mt-1 block w-16 h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      );

    default:
      return (
        <div className="mt-1 text-gray-500 italic">
          Unsupported setting type: {setting.type}
        </div>
      );
  }
}

interface SettingItemProps {
  setting: SettingDefinition;
  value: any;
  onChange: (key: string, value: any) => void;
  disabled?: boolean;
  visible?: boolean;
}

function SettingItem({ setting, value, onChange, disabled, visible = true }: SettingItemProps) {
  if (!visible) return null;

  return (
    <div className="py-4 border-b border-gray-200 last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <label className="block text-sm font-medium text-gray-900">
            {setting.label}
            {setting.validation?.required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
          <p className="mt-1 text-sm text-gray-600">{setting.description}</p>
          {setting.options && setting.type === 'select' && (
            <div className="mt-2">
              {setting.options.map((option) => (
                option.value === value && option.description && (
                  <p key={option.value} className="text-xs text-gray-500 italic">
                    {option.description}
                  </p>
                )
              ))}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 w-64">
          <SettingField
            setting={setting}
            value={value}
            onChange={(newValue) => onChange(setting.key, newValue)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

interface SettingsCategoryProps {
  categoryKey: string;
  settings: Record<string, any>;
  onSettingChange: (key: string, value: any) => void;
  isSettingVisible: (key: string) => boolean;
  disabled?: boolean;
}

function SettingsCategory({ categoryKey, settings, onSettingChange, isSettingVisible, disabled }: SettingsCategoryProps) {
  const category = SettingsRegistry.getCategory(categoryKey);
  const categorySettings = SettingsRegistry.getVisibleSettingsForCategory(categoryKey, settings);

  if (!category || categorySettings.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          {category.icon && (
            <span className="text-2xl mr-3">{category.icon}</span>
          )}
          <div>
            <h3 className="text-lg font-medium text-gray-900">{category.label}</h3>
            <p className="text-sm text-gray-600">{category.description}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-2">
        {categorySettings.map((setting) => (
          <SettingItem
            key={setting.key}
            setting={setting}
            value={settings[setting.key]}
            onChange={onSettingChange}
            disabled={disabled}
            visible={isSettingVisible(setting.key)}
          />
        ))}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const {
    settings,
    loading,
    error,
    updateSetting,
    resetToDefaults,
    isSettingVisible,
    validateSetting,
  } = useUserSettings();

  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    // Validate the setting
    const validation = validateSetting(key, value);
    
    if (!validation.valid) {
      setValidationErrors(prev => ({
        ...prev,
        [key]: validation.error || 'Invalid value'
      }));
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }

    setPendingChanges(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSetting = async (key: string, value: any) => {
    try {
      setSaving(true);
      await updateSetting(key, value);
      
      // Remove from pending changes
      setPendingChanges(prev => {
        const newPending = { ...prev };
        delete newPending[key];
        return newPending;
      });
    } catch (err) {
      console.error('Failed to save setting:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (window.confirm('Are you sure you want to reset all settings to their default values? This action cannot be undone.')) {
      try {
        setSaving(true);
        await resetToDefaults();
        setPendingChanges({});
        setValidationErrors({});
      } catch (err) {
        console.error('Failed to reset settings:', err);
      } finally {
        setSaving(false);
      }
    }
  };

  // Auto-save settings when they change (with debouncing)
  React.useEffect(() => {
    const timeouts: Record<string, number> = {};

    Object.entries(pendingChanges).forEach(([key, value]) => {
      if (validationErrors[key]) return; // Don't save invalid values

      if (timeouts[key]) {
        clearTimeout(timeouts[key]);
      }

      timeouts[key] = window.setTimeout(() => {
        handleSaveSetting(key, value);
      }, 1000); // 1 second debounce
    });

    return () => {
      Object.values(timeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [pendingChanges, validationErrors]);

  const currentSettings = { ...settings, ...pendingChanges };
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account preferences and application settings.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading settings</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {hasValidationErrors && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Validation Errors</h3>
              <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                {Object.entries(validationErrors).map(([key, error]) => (
                  <li key={key}>
                    {SettingsRegistry.getSetting(key)?.label || key}: {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {hasPendingChanges && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-blue-400">💾</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Auto-saving changes...</h3>
                <p className="text-sm text-blue-700">
                  Your settings will be saved automatically.
                </p>
              </div>
            </div>
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {SETTING_CATEGORIES
          .sort((a, b) => a.order - b.order)
          .map((category) => (
            <SettingsCategory
              key={category.key}
              categoryKey={category.key}
              settings={currentSettings}
              onSettingChange={handleSettingChange}
              isSettingVisible={isSettingVisible}
              disabled={saving}
            />
          ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Reset Settings</h3>
            <p className="text-sm text-gray-600">
              Reset all settings to their default values.
            </p>
          </div>
          <Button
            onClick={handleResetToDefaults}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Reset to Defaults
          </Button>
        </div>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        <p>
          💡 <strong>Note:</strong> Settings are stored in your account but do not affect application behavior yet. 
          This creates the foundation for future implementation.
        </p>
      </div>
    </div>
  );
}
