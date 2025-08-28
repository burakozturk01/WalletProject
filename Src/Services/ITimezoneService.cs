using System;
using System.Threading.Tasks;

namespace Src.Services
{
    public interface ITimezoneService
    {
        Task<DateTime> ConvertToUserTimezoneAsync(Guid userId, DateTime utcDateTime);
        Task<DateTime> ConvertToUtcAsync(Guid userId, DateTime localDateTime);
        Task<TimeZoneInfo> GetUserTimezoneInfoAsync(Guid userId);
        Task<string> GetUserTimezoneAsync(Guid userId);
    }
}
