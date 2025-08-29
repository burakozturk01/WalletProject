using System;
using System.Threading.Tasks;
using Src.Services;

namespace Src.Shared.DTO
{
    public abstract class TimezoneAwareDTO
    {
        protected async Task<DateTime> ConvertToUserTimezone(
            ITimezoneService timezoneService,
            Guid userId,
            DateTime utcDateTime
        )
        {
            return await timezoneService.ConvertToUserTimezoneAsync(userId, utcDateTime);
        }
    }
}
