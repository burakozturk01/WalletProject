/**
 * Settings Registry - Central configuration for all user settings
 * 
 * This registry defines all available settings in the application.
 * Adding new settings only requires updating this file - no backend changes needed.
 * 
 * NOTE: Settings are stored in database but do not affect application behavior yet.
 * This creates the foundation for future implementation.
 */

export type SettingType = 'select' | 'toggle' | 'text' | 'number' | 'color';

export interface SettingOption {
  value: string;
  label: string;
  description?: string;
}

export interface SettingDefinition {
  key: string;
  label: string;
  description: string;
  type: SettingType;
  category: string;
  defaultValue: any;
  options?: SettingOption[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
  dependencies?: {
    key: string;
    value: any;
  }[];
}

export interface SettingCategory {
  key: string;
  label: string;
  description: string;
  icon?: string;
  order: number;
}

// Define setting categories
export const SETTING_CATEGORIES: SettingCategory[] = [
  {
    key: 'general',
    label: 'General',
    description: 'Basic application preferences',
    icon: '⚙️',
    order: 1
  },
  {
    key: 'display',
    label: 'Display & Formatting',
    description: 'How information is displayed and formatted',
    icon: '🎨',
    order: 2
  },
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Notification preferences and alerts',
    icon: '🔔',
    order: 3
  },
  {
    key: 'security',
    label: 'Security & Privacy',
    description: 'Security and privacy settings',
    icon: '🔒',
    order: 4
  }
];

// Timezone options - comprehensive list of common timezones
const TIMEZONE_OPTIONS: SettingOption[] = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', description: 'GMT+0' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)', description: 'GMT-5/-4' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)', description: 'GMT-6/-5' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)', description: 'GMT-7/-6' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)', description: 'GMT-8/-7' },
  { value: 'Europe/London', label: 'London (GMT/BST)', description: 'GMT+0/+1' },
  { value: 'Europe/Paris', label: 'Central European Time', description: 'GMT+1/+2' },
  { value: 'Europe/Istanbul', label: 'Turkey Time', description: 'GMT+3' },
  { value: 'Europe/Moscow', label: 'Moscow Time', description: 'GMT+3' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time', description: 'GMT+4' },
  { value: 'Asia/Kolkata', label: 'India Standard Time', description: 'GMT+5:30' },
  { value: 'Asia/Shanghai', label: 'China Standard Time', description: 'GMT+8' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time', description: 'GMT+9' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time', description: 'GMT+10/+11' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time', description: 'GMT+12/+13' }
];


const DATE_FORMAT_OPTIONS: SettingOption[] = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', description: 'US format (12/31/2023)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', description: 'European format (31/12/2023)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', description: 'ISO format (2023-12-31)' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY', description: 'German format (31.12.2023)' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY', description: 'Text format (31 Dec 2023)' }
];

const TIME_FORMAT_OPTIONS: SettingOption[] = [
  { value: '12', label: '12-hour (AM/PM)', description: '2:30 PM' },
  { value: '24', label: '24-hour', description: '14:30' }
];

const THEME_OPTIONS: SettingOption[] = [
  { value: 'light', label: 'Light Theme', description: 'Light background with dark text' },
  { value: 'dark', label: 'Dark Theme', description: 'Dark background with light text' },
  { value: 'auto', label: 'Auto (System)', description: 'Follow system preference' }
];

// Define all settings
export const SETTINGS_REGISTRY: SettingDefinition[] = [
  // General Settings
  {
    key: 'timezone',
    label: 'Timezone',
    description: 'Your local timezone for displaying dates and times',
    type: 'select',
    category: 'general',
    defaultValue: 'UTC',
    options: TIMEZONE_OPTIONS,
    validation: { required: true }
  },
  {
    key: 'language',
    label: 'Language',
    description: 'Application language',
    type: 'select',
    category: 'general',
    defaultValue: 'en',
    options: [
      { value: 'en', label: 'English', description: 'English (US)' },
      { value: 'tr', label: 'Türkçe', description: 'Turkish' },
      { value: 'es', label: 'Español', description: 'Spanish' },
      { value: 'fr', label: 'Français', description: 'French' },
      { value: 'de', label: 'Deutsch', description: 'German' }
    ]
  },

  // Display & Formatting Settings
  {
    key: 'dateFormat',
    label: 'Date Format',
    description: 'How dates are displayed throughout the application',
    type: 'select',
    category: 'display',
    defaultValue: 'MM/DD/YYYY',
    options: DATE_FORMAT_OPTIONS
  },
  {
    key: 'timeFormat',
    label: 'Time Format',
    description: 'How times are displayed (12-hour or 24-hour)',
    type: 'select',
    category: 'display',
    defaultValue: '12',
    options: TIME_FORMAT_OPTIONS
  },
  {
    key: 'theme',
    label: 'Theme',
    description: 'Application color theme',
    type: 'select',
    category: 'display',
    defaultValue: 'light',
    options: THEME_OPTIONS
  },
  {
    key: 'compactMode',
    label: 'Compact Mode',
    description: 'Use compact layout to show more information',
    type: 'toggle',
    category: 'display',
    defaultValue: false
  },
  {
    key: 'showCents',
    label: 'Show Cents',
    description: 'Display cents/decimal places in currency amounts',
    type: 'toggle',
    category: 'display',
    defaultValue: true
  },

  // Notification Settings
  {
    key: 'emailNotifications',
    label: 'Email Notifications',
    description: 'Receive notifications via email',
    type: 'toggle',
    category: 'notifications',
    defaultValue: true
  },
  {
    key: 'transactionAlerts',
    label: 'Transaction Alerts',
    description: 'Get notified of new transactions',
    type: 'toggle',
    category: 'notifications',
    defaultValue: true,
    dependencies: [{ key: 'emailNotifications', value: true }]
  },
  {
    key: 'lowBalanceAlert',
    label: 'Low Balance Alerts',
    description: 'Get notified when account balance is low',
    type: 'toggle',
    category: 'notifications',
    defaultValue: true,
    dependencies: [{ key: 'emailNotifications', value: true }]
  },
  {
    key: 'lowBalanceThreshold',
    label: 'Low Balance Threshold',
    description: 'Amount below which to trigger low balance alerts',
    type: 'number',
    category: 'notifications',
    defaultValue: 100,
    validation: { min: 0, max: 10000 },
    dependencies: [{ key: 'lowBalanceAlert', value: true }]
  },

  // Security Settings
  {
    key: 'sessionTimeout',
    label: 'Session Timeout (minutes)',
    description: 'Automatically log out after this many minutes of inactivity',
    type: 'number',
    category: 'security',
    defaultValue: 60,
    validation: { min: 5, max: 480 }
  },
  {
    key: 'requirePasswordForTransfers',
    label: 'Require Password for Transfers',
    description: 'Require password confirmation for money transfers',
    type: 'toggle',
    category: 'security',
    defaultValue: false
  },
  {
    key: 'twoFactorAuth',
    label: 'Two-Factor Authentication',
    description: 'Enable two-factor authentication for enhanced security',
    type: 'toggle',
    category: 'security',
    defaultValue: false
  }
];

// Utility functions for working with settings
export class SettingsRegistry {
  /**
   * Get all settings grouped by category
   */
  static getSettingsByCategory(): Record<string, SettingDefinition[]> {
    const grouped: Record<string, SettingDefinition[]> = {};
    
    SETTING_CATEGORIES.forEach(category => {
      grouped[category.key] = SETTINGS_REGISTRY.filter(
        setting => setting.category === category.key
      );
    });
    
    return grouped;
  }

  /**
   * Get a specific setting definition by key
   */
  static getSetting(key: string): SettingDefinition | undefined {
    return SETTINGS_REGISTRY.find(setting => setting.key === key);
  }

  /**
   * Get category information by key
   */
  static getCategory(key: string): SettingCategory | undefined {
    return SETTING_CATEGORIES.find(category => category.key === key);
  }

  /**
   * Get all setting keys
   */
  static getAllKeys(): string[] {
    return SETTINGS_REGISTRY.map(setting => setting.key);
  }

  /**
   * Get default values for all settings
   */
  static getDefaultValues(): Record<string, any> {
    const defaults: Record<string, any> = {};
    SETTINGS_REGISTRY.forEach(setting => {
      defaults[setting.key] = setting.defaultValue;
    });
    return defaults;
  }

  /**
   * Validate a setting value
   */
  static validateSetting(key: string, value: any): { valid: boolean; error?: string } {
    const setting = this.getSetting(key);
    if (!setting) {
      return { valid: false, error: 'Setting not found' };
    }

    const { validation } = setting;
    if (!validation) {
      return { valid: true };
    }

    // Required validation
    if (validation.required && (value === null || value === undefined || value === '')) {
      return { valid: false, error: 'This setting is required' };
    }

    // Number validations
    if (setting.type === 'number' && typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        return { valid: false, error: `Value must be at least ${validation.min}` };
      }
      if (validation.max !== undefined && value > validation.max) {
        return { valid: false, error: `Value must be at most ${validation.max}` };
      }
    }

    // Pattern validation for text
    if (setting.type === 'text' && validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return { valid: false, error: 'Invalid format' };
      }
    }

    // Select validation - ensure value is in options
    if (setting.type === 'select' && setting.options) {
      const validValues = setting.options.map(opt => opt.value);
      if (!validValues.includes(value)) {
        return { valid: false, error: 'Invalid option selected' };
      }
    }

    return { valid: true };
  }

  /**
   * Check if a setting should be visible based on dependencies
   */
  static isSettingVisible(key: string, currentValues: Record<string, any>): boolean {
    const setting = this.getSetting(key);
    if (!setting || !setting.dependencies) {
      return true;
    }

    return setting.dependencies.every(dep => {
      const currentValue = currentValues[dep.key];
      return currentValue === dep.value;
    });
  }

  /**
   * Get visible settings for a category based on current values
   */
  static getVisibleSettingsForCategory(categoryKey: string, currentValues: Record<string, any>): SettingDefinition[] {
    const categorySettings = SETTINGS_REGISTRY.filter(setting => setting.category === categoryKey);
    return categorySettings.filter(setting => this.isSettingVisible(setting.key, currentValues));
  }
}
