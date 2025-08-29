using System;
using System.Threading.Tasks;
using Src.Services;

namespace Src.Services
{
    public class TimezoneService : ITimezoneService
    {
        private readonly IUserSettingsService _userSettingsService;

        public TimezoneService(IUserSettingsService userSettingsService)
        {
            _userSettingsService = userSettingsService;
        }

        public async Task<DateTime> ConvertToUserTimezoneAsync(Guid userId, DateTime utcDateTime)
        {
            var timezoneInfo = await GetUserTimezoneInfoAsync(userId);
            return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, timezoneInfo);
        }

        public async Task<DateTime> ConvertToUtcAsync(Guid userId, DateTime localDateTime)
        {
            var timezoneInfo = await GetUserTimezoneInfoAsync(userId);
            return TimeZoneInfo.ConvertTimeToUtc(localDateTime, timezoneInfo);
        }

        public async Task<TimeZoneInfo> GetUserTimezoneInfoAsync(Guid userId)
        {
            var timezoneString = await GetUserTimezoneAsync(userId);

            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(timezoneString);
            }
            catch (TimeZoneNotFoundException)
            {
                return TimeZoneInfo.Utc;
            }
            catch (InvalidTimeZoneException)
            {
                return TimeZoneInfo.Utc;
            }
        }

        public async Task<string> GetUserTimezoneAsync(Guid userId)
        {
            return await _userSettingsService.GetTimezoneAsync(userId);
        }
    }
}
