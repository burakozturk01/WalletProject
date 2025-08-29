import { useCallback } from 'react';
import { useUserSettings } from './useUserSettings';
import {
    formatDate as baseFormatDate,
    formatDateTime as baseFormatDateTime,
    formatTime as baseFormatTime,
    formatTransactionDate as baseFormatTransactionDate,
    formatAccountDate as baseFormatAccountDate,
    formatActivityDate as baseFormatActivityDate,
    getRelativeTime as baseGetRelativeTime,
    getFriendlyDate as baseGetFriendlyDate,
    convertToUserTimezone as baseConvertToUserTimezone,
    DateFormatOptions
} from '../utils/timezone';

export interface UseTimezoneReturn {
    timezone: string;
    dateFormat: string;
    timeFormat: string;

    formatDate: (date: Date | string, options?: Partial<DateFormatOptions>) => string;
    formatDateTime: (date: Date | string, options?: Partial<DateFormatOptions>) => string;
    formatTime: (date: Date | string, options?: Partial<DateFormatOptions>) => string;
    formatTransactionDate: (date: Date | string) => string;
    formatAccountDate: (date: Date | string) => string;
    formatActivityDate: (date: Date | string) => string;
    getRelativeTime: (date: Date | string) => string;
    getFriendlyDate: (date: Date | string) => string;
    convertToUserTimezone: (date: Date | string) => Date;

    isToday: (date: Date | string) => boolean;
    isYesterday: (date: Date | string) => boolean;
}

export function useTimezone(): UseTimezoneReturn {
    const { getSetting } = useUserSettings();

    const timezone = getSetting('timezone', 'UTC');
    const dateFormat = getSetting('dateFormat', 'MM/DD/YYYY');
    const timeFormat = getSetting('timeFormat', '12');

    const formatDate = useCallback((date: Date | string, options: Partial<DateFormatOptions> = {}) => {
        return baseFormatDate(date, {
            timezone,
            dateFormat,
            timeFormat,
            ...options
        });
    }, [timezone, dateFormat, timeFormat]);

    const formatDateTime = useCallback((date: Date | string, options: Partial<DateFormatOptions> = {}) => {
        return baseFormatDateTime(date, {
            timezone,
            dateFormat,
            timeFormat,
            ...options
        });
    }, [timezone, dateFormat, timeFormat]);

    const formatTime = useCallback((date: Date | string, options: Partial<DateFormatOptions> = {}) => {
        return baseFormatTime(date, {
            timezone,
            dateFormat,
            timeFormat,
            ...options
        });
    }, [timezone, dateFormat, timeFormat]);

    const formatTransactionDate = useCallback((date: Date | string) => {
        return baseFormatDateTime(date, {
            timezone,
            dateFormat,
            timeFormat
        });
    }, [timezone, dateFormat, timeFormat]);

    const formatAccountDate = useCallback((date: Date | string) => {
        return baseFormatDate(date, {
            timezone,
            dateFormat,
            timeFormat
        });
    }, [timezone, dateFormat, timeFormat]);

    const formatActivityDate = useCallback((date: Date | string) => {
        const now = new Date();
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        const userNow = baseConvertToUserTimezone(now);
        const userDate = baseConvertToUserTimezone(dateObj);

        const diffInHours = (userNow.getTime() - userDate.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            if (diffInHours < 1) {
                const diffInMinutes = Math.floor(diffInHours * 60);
                return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
            }
            const hours = Math.floor(diffInHours);
            return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
        }

        return baseFormatDate(date, {
            timezone,
            dateFormat,
            timeFormat
        });
    }, [timezone, dateFormat, timeFormat]);

    const getRelativeTime = useCallback((date: Date | string) => {
        const now = new Date();
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        const userNow = baseConvertToUserTimezone(now);
        const userDate = baseConvertToUserTimezone(dateObj);

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
    }, []);

    const getFriendlyDate = useCallback((date: Date | string) => {
        const userTimezone = timezone;

        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const userDate = baseConvertToUserTimezone(dateObj);
        const userNow = baseConvertToUserTimezone(new Date());

        if (userDate.getDate() === userNow.getDate() &&
            userDate.getMonth() === userNow.getMonth() &&
            userDate.getFullYear() === userNow.getFullYear()) {
            return 'Today';
        }

        const userYesterday = new Date(userNow);
        userYesterday.setDate(userYesterday.getDate() - 1);

        if (userDate.getDate() === userYesterday.getDate() &&
            userDate.getMonth() === userYesterday.getMonth() &&
            userDate.getFullYear() === userYesterday.getFullYear()) {
            return 'Yesterday';
        }

        return baseFormatDate(date, {
            timezone,
            dateFormat,
            timeFormat
        });
    }, [timezone, dateFormat, timeFormat]);

    const convertToUserTimezone = useCallback((date: Date | string) => {
        return baseConvertToUserTimezone(date);
    }, []);

    const isToday = useCallback((date: Date | string) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const userDate = baseConvertToUserTimezone(dateObj);
        const userNow = baseConvertToUserTimezone(new Date());

        return userDate.getDate() === userNow.getDate() &&
            userDate.getMonth() === userNow.getMonth() &&
            userDate.getFullYear() === userNow.getFullYear();
    }, []);

    const isYesterday = useCallback((date: Date | string) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const userDate = baseConvertToUserTimezone(dateObj);
        const userYesterday = baseConvertToUserTimezone(new Date());
        userYesterday.setDate(userYesterday.getDate() - 1);

        return userDate.getDate() === userYesterday.getDate() &&
            userDate.getMonth() === userYesterday.getMonth() &&
            userDate.getFullYear() === userYesterday.getFullYear();
    }, []);

    return {
        timezone,
        dateFormat,
        timeFormat,
        formatDate,
        formatDateTime,
        formatTime,
        formatTransactionDate,
        formatAccountDate,
        formatActivityDate,
        getRelativeTime,
        getFriendlyDate,
        convertToUserTimezone,
        isToday,
        isYesterday
    };
}
