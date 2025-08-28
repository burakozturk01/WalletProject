using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Src.Entities;

namespace Src.Services
{
    public interface IUserSettingsService
    {
        Task<T?> GetSettingAsync<T>(Guid userId, string key, T? defaultValue = default);
        Task<string> GetSettingAsync(Guid userId, string key, string defaultValue = "");
        Task SetSettingAsync<T>(Guid userId, string key, T value);
        Task<Dictionary<string, object>> GetAllSettingsAsync(Guid userId);
        Task<UserSettings> UpdateSettingsAsync(Guid userId, Dictionary<string, object> settings);
        Task<UserSettings> GetUserSettingsAsync(Guid userId);
        Task DeleteSettingAsync(Guid userId, string key);
        Task<UserSettings> ResetToDefaultsAsync(Guid userId);
        Task<string> GetTimezoneAsync(Guid userId);
        Task SetTimezoneAsync(Guid userId, string timezone);
    }
}
