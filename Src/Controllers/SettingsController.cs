using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Src.Entities;
using Src.Services;

namespace Src.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SettingsController : ControllerBase
    {
        private readonly IUserSettingsService _settingsService;

        public SettingsController(IUserSettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token");
            }
            return userId;
        }

        [HttpGet]
        public async Task<ActionResult<UserSettings>> GetUserSettings()
        {
            try
            {
                var userId = GetCurrentUserId();
                var userSettings = await _settingsService.GetUserSettingsAsync(userId);
                return Ok(userSettings);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to retrieve user settings: {ex.Message}");
            }
        }

        [HttpPut]
        public async Task<ActionResult<UserSettings>> UpdateUserSettings(
            [FromBody] UpdateSettingsRequest request
        )
        {
            try
            {
                var userId = GetCurrentUserId();
                var userSettings = await _settingsService.UpdateSettingsAsync(
                    userId,
                    request.Settings
                );
                return Ok(userSettings);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to update user settings: {ex.Message}");
            }
        }

        [HttpPut("setting")]
        public async Task<ActionResult<UserSettings>> UpdateSetting(
            [FromBody] UpdateSettingRequest request
        )
        {
            try
            {
                var userId = GetCurrentUserId();
                await _settingsService.SetSettingAsync(userId, request.Key, request.Value);
                var userSettings = await _settingsService.GetUserSettingsAsync(userId);
                return Ok(userSettings);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to update setting '{request.Key}': {ex.Message}");
            }
        }

        [HttpGet("setting/{key}")]
        public async Task<ActionResult<SettingValueResponse>> GetSetting(string key)
        {
            try
            {
                var userId = GetCurrentUserId();
                var value = await _settingsService.GetSettingAsync<object>(userId, key);
                return Ok(new SettingValueResponse { Key = key, Value = value });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to retrieve setting '{key}': {ex.Message}");
            }
        }

        [HttpDelete("setting/{key}")]
        public async Task<ActionResult> DeleteSetting(string key)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _settingsService.DeleteSettingAsync(userId, key);
                return Ok();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to delete setting '{key}': {ex.Message}");
            }
        }

        [HttpPost("reset")]
        public async Task<ActionResult<UserSettings>> ResetToDefaults()
        {
            try
            {
                var userId = GetCurrentUserId();
                var userSettings = await _settingsService.ResetToDefaultsAsync(userId);
                return Ok(userSettings);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to reset settings to defaults: {ex.Message}");
            }
        }

        // SPECIFIC SETTING ENDPOINTS (for backward compatibility):

        [HttpGet("timezone")]
        public async Task<ActionResult<string>> GetTimezone()
        {
            try
            {
                var userId = GetCurrentUserId();
                var timezone = await _settingsService.GetTimezoneAsync(userId);
                return Ok(timezone);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to retrieve timezone setting: {ex.Message}");
            }
        }

        [HttpPut("timezone")]
        public async Task<ActionResult> SetTimezone([FromBody] string timezone)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _settingsService.SetTimezoneAsync(userId, timezone);
                return Ok();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to set timezone setting: {ex.Message}");
            }
        }
    }

    // Request/Response DTOs
    public class UpdateSettingsRequest
    {
        public Dictionary<string, object> Settings { get; set; } = new();
    }

    public class UpdateSettingRequest
    {
        public string Key { get; set; } = string.Empty;
        public object Value { get; set; } = null!;
    }

    public class SettingValueResponse
    {
        public string Key { get; set; } = string.Empty;
        public object Value { get; set; } = null!;
    }
}
