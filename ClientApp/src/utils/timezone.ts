import { SettingsRegistry } from './settingsRegistry';

export interface DateFormatOptions {
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  showTime?: boolean;
  showDate?: boolean;
}

export function getUserTimezone(): string {
  // TODO: In future implementation, get from user settings
  // const { getSetting } = useUserSettings();
  // return getSetting('timezone', 'UTC');
  return 'UTC';
}

export function getUserDateFormat(): string {
  // TODO: In future implementation, get from user settings
  // const { getSetting } = useUserSettings();
  // return getSetting('dateFormat', 'MM/DD/YYYY');
  return 'MM/DD/YYYY';
}

export function getUserTimeFormat(): string {
  // TODO: In future implementation, get from user settings
  // const { getSetting } = useUserSettings();
  // return getSetting('timeFormat', '12');
  return '12';
}

export function dateFormatToIntlOptions(format: string): Intl.DateTimeFormatOptions {
  const options: Intl.DateTimeFormatOptions = {};

  switch (format) {
    case 'MM/DD/YYYY':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      break;
    case 'DD/MM/YYYY':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      break;
    case 'YYYY-MM-DD':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      break;
    case 'DD.MM.YYYY':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      break;
    case 'DD MMM YYYY':
      options.year = 'numeric';
      options.month = 'short';
      options.day = 'numeric';
      break;
    default:
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
  }

  return options;
}

export function timeFormatToIntlOptions(format: string): Intl.DateTimeFormatOptions {
  return {
    hour: '2-digit',
    minute: '2-digit',
    hour12: format === '12',
  };
}

export function formatDate(date: Date | string, options: DateFormatOptions = {}): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const {
    timezone = getUserTimezone(),
    dateFormat = getUserDateFormat(),
    timeFormat = getUserTimeFormat(),
    showTime = false,
    showDate = true,
  } = options;

  const intlOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
  };

  if (showDate) {
    Object.assign(intlOptions, dateFormatToIntlOptions(dateFormat));
  }

  if (showTime) {
    Object.assign(intlOptions, timeFormatToIntlOptions(timeFormat));
  }

  try {
    return new Intl.DateTimeFormat('en-US', intlOptions).format(dateObj);
  } catch (error) {
    console.warn('Error formatting date:', error);
    return dateObj.toLocaleDateString();
  }
}

export function formatDateTime(date: Date | string, options: DateFormatOptions = {}): string {
  return formatDate(date, { ...options, showTime: true, showDate: true });
}

export function formatTime(date: Date | string, options: DateFormatOptions = {}): string {
  return formatDate(date, { ...options, showTime: true, showDate: false });
}

export function formatTransactionDate(date: Date | string): string {
  return formatDateTime(date);
}

export function formatAccountDate(date: Date | string): string {
  return formatDate(date);
}

export function formatActivityDate(date: Date | string): string {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    }
    const hours = Math.floor(diffInHours);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  return formatDate(date);
}

export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffInMs = now.getTime() - dateObj.getTime();
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }
  
  const years = Math.floor(diffInDays / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return dateObj.getDate() === today.getDate() &&
         dateObj.getMonth() === today.getMonth() &&
         dateObj.getFullYear() === today.getFullYear();
}

export function isYesterday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return dateObj.getDate() === yesterday.getDate() &&
         dateObj.getMonth() === yesterday.getMonth() &&
         dateObj.getFullYear() === yesterday.getFullYear();
}

export function getFriendlyDate(date: Date | string): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return formatDate(date);
}

export function convertToUserTimezone(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  const timezone = getUserTimezone();
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(dateObj);
  
  const dateParts: Record<string, string> = {};
  parts.forEach(part => {
    if (part.type !== 'literal') {
      dateParts[part.type] = part.value;
    }
  });
  
  const localDate = new Date(
    parseInt(dateParts.year!),
    parseInt(dateParts.month!) - 1,
    parseInt(dateParts.day!),
    parseInt(dateParts.hour!),
    parseInt(dateParts.minute!),
    parseInt(dateParts.second!)
  );
  
  return localDate;
}

export function getTimezoneOptions() {
  const timezoneSetting = SettingsRegistry.getSetting('timezone');
  return timezoneSetting?.options || [];
}

export function getTimezoneDisplayName(timezone: string): string {
  const options = getTimezoneOptions();
  const option = options.find(opt => opt.value === timezone);
  return option?.label || timezone;
}
