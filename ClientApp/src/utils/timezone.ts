import { SettingsRegistry } from './settingsRegistry';

export interface DateFormatOptions {
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
    showTime?: boolean;
    showDate?: boolean;
}

let globalSettingsCache: Record<string, any> = {};

export function setGlobalSettingsCache(settings: Record<string, any>) {
    globalSettingsCache = settings;
}

export function getUserTimezone(): string {
    return globalSettingsCache['timezone'] || 'UTC';
}

export function getUserDateFormat(): string {
    return globalSettingsCache['dateFormat'] || 'MM/DD/YYYY';
}

export function getUserTimeFormat(): string {
    return globalSettingsCache['timeFormat'] || '12';
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

    const userNow = convertToUserTimezone(now);
    const userDate = convertToUserTimezone(dateObj);

    const diffInHours = (userNow.getTime() - userDate.getTime()) / (1000 * 60 * 60);

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

    const userNow = convertToUserTimezone(now);
    const userDate = convertToUserTimezone(dateObj);

    const diffInMs = userNow.getTime() - userDate.getTime();

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

    const userToday = convertToUserTimezone(today);
    const userDate = convertToUserTimezone(dateObj);

    return userDate.getDate() === userToday.getDate() &&
        userDate.getMonth() === userToday.getMonth() &&
        userDate.getFullYear() === userToday.getFullYear();
}

export function isYesterday(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const userYesterday = convertToUserTimezone(yesterday);
    const userDate = convertToUserTimezone(dateObj);

    return userDate.getDate() === userYesterday.getDate() &&
        userDate.getMonth() === userYesterday.getMonth() &&
        userDate.getFullYear() === userYesterday.getFullYear();
}

export function getFriendlyDate(date: Date | string): string {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return formatDate(date);
}

export function convertToUserTimezone(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    const timezone = getUserTimezone();

    if (timezone === 'UTC') {
        return dateObj;
    }

    try {
        // The key insight: we need to return a Date object that, when used in calculations,
        // represents the time as it appears in the user's timezone

        const formatter = new Intl.DateTimeFormat('sv-SE', { // sv-SE gives us YYYY-MM-DD HH:mm:ss format
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const timeInUserTz = formatter.format(dateObj);

        const convertedDate = new Date(timeInUserTz.replace(' ', 'T'));

        return convertedDate;

    } catch (error) {
        console.warn('Error converting timezone:', error);
        return dateObj;
    }
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
