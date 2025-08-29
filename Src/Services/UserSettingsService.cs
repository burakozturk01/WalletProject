using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Src.Database;
using Src.Entities;

namespace Src.Services
{
    public class UserSettingsService : IUserSettingsService
    {
        private readonly AppDbContext _context;
        private readonly JsonSerializerOptions _jsonOptions;

        public UserSettingsService(AppDbContext context)
        {
            _context = context;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false,
            };
        }

        public async Task<T?> GetSettingAsync<T>(Guid userId, string key, T? defaultValue = default)
        {
            var settings = await GetUserSettingsInternalAsync(userId);
            if (settings == null || string.IsNullOrEmpty(settings.SettingsJson))
            {
                return defaultValue;
            }

            try
            {
                var settingsDict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
                    settings.SettingsJson,
                    _jsonOptions
                );
                if (settingsDict != null && settingsDict.TryGetValue(key, out var value))
                {
                    return JsonSerializer.Deserialize<T>(value.GetRawText(), _jsonOptions);
                }
            }
            catch (JsonException)
            {
                // If JSON parsing fails, return default value
            }

            return defaultValue;
        }

        public async Task<string> GetSettingAsync(Guid userId, string key, string defaultValue = "")
        {
            return await GetSettingAsync<string>(userId, key, defaultValue) ?? defaultValue;
        }

        public async Task SetSettingAsync<T>(Guid userId, string key, T value)
        {
            var settings = await GetOrCreateUserSettingsAsync(userId);

            Dictionary<string, object> settingsDict;
            try
            {
                settingsDict = string.IsNullOrEmpty(settings.SettingsJson)
                    ? new Dictionary<string, object>()
                    : JsonSerializer.Deserialize<Dictionary<string, object>>(
                        settings.SettingsJson,
                        _jsonOptions
                    ) ?? new Dictionary<string, object>();
            }
            catch (JsonException)
            {
                settingsDict = new Dictionary<string, object>();
            }

            settingsDict[key] = value!;
            settings.SettingsJson = JsonSerializer.Serialize(settingsDict, _jsonOptions);

            await _context.SaveChangesAsync();
        }

        public async Task<Dictionary<string, object>> GetAllSettingsAsync(Guid userId)
        {
            var settings = await GetUserSettingsAsync(userId);
            if (settings == null || string.IsNullOrEmpty(settings.SettingsJson))
            {
                return new Dictionary<string, object>();
            }

            try
            {
                return JsonSerializer.Deserialize<Dictionary<string, object>>(
                        settings.SettingsJson,
                        _jsonOptions
                    ) ?? new Dictionary<string, object>();
            }
            catch (JsonException)
            {
                return new Dictionary<string, object>();
            }
        }

        public async Task<UserSettings> UpdateSettingsAsync(
            Guid userId,
            Dictionary<string, object> newSettings
        )
        {
            var settings = await GetOrCreateUserSettingsAsync(userId);
            settings.SettingsJson = JsonSerializer.Serialize(newSettings, _jsonOptions);
            await _context.SaveChangesAsync();
            return settings;
        }

        public async Task<UserSettings> GetUserSettingsAsync(Guid userId)
        {
            var settings = await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId);

            if (settings == null)
            {
                // Return a new UserSettings with default values
                settings = new UserSettings
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    SettingsJson = "{}",
                };
            }

            return settings;
        }

        public async Task DeleteSettingAsync(Guid userId, string key)
        {
            var settings = await GetUserSettingsAsync(userId);
            if (settings == null || string.IsNullOrEmpty(settings.SettingsJson))
            {
                return;
            }

            try
            {
                var settingsDict =
                    JsonSerializer.Deserialize<Dictionary<string, object>>(
                        settings.SettingsJson,
                        _jsonOptions
                    ) ?? new Dictionary<string, object>();

                if (settingsDict.Remove(key))
                {
                    settings.SettingsJson = JsonSerializer.Serialize(settingsDict, _jsonOptions);
                    await _context.SaveChangesAsync();
                }
            }
            catch (JsonException)
            {
                // If JSON parsing fails, ignore the delete operation
            }
        }

        public async Task<UserSettings> ResetToDefaultsAsync(Guid userId)
        {
            var settings = await GetOrCreateUserSettingsAsync(userId);
            settings.SettingsJson = "{}";
            await _context.SaveChangesAsync();
            return settings;
        }

        // SETTINGS IMPLEMENTATIONS:

        public async Task<string> GetTimezoneAsync(Guid userId)
        {
            return await GetSettingAsync(userId, "timezone", "UTC");
        }

        public async Task SetTimezoneAsync(Guid userId, string timezone)
        {
            await SetSettingAsync(userId, "timezone", timezone);
        }

        // PRIVATE HELPER METHODS:

        private async Task<UserSettings?> GetUserSettingsInternalAsync(Guid userId)
        {
            return await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId);
        }

        private async Task<UserSettings> GetOrCreateUserSettingsAsync(Guid userId)
        {
            var settings = await GetUserSettingsInternalAsync(userId);
            if (settings == null)
            {
                settings = new UserSettings
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    SettingsJson = "{}",
                };
                _context.UserSettings.Add(settings);
                await _context.SaveChangesAsync();
            }
            return settings;
        }
    }
}
