# Dynamic Settings System - Complete Implementation Guide

## Overview

This guide provides step-by-step instructions for adding new settings to the WalletProject, from frontend UI to backend database storage. The system is designed to be completely dynamic - no database migrations are required when adding new settings.

## Current Settings

The system currently supports the following settings:

### General Settings
- **timezone** (string): User's preferred timezone (e.g., "America/New_York", "Europe/London", "UTC")
- **language** (string): Application language (e.g., "en", "tr", "es", "fr", "de")

### Display & Formatting Settings
- **dateFormat** (string): Date display format (e.g., "MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD")
- **timeFormat** (string): Time display format ("12" for 12-hour, "24" for 24-hour)
- **theme** (string): Application theme ("light", "dark", "auto")
- **compactMode** (boolean): Use compact layout
- **showCents** (boolean): Display cents in currency amounts

### Notification Settings
- **emailNotifications** (boolean): Enable email notifications
- **transactionAlerts** (boolean): Get notified of new transactions
- **lowBalanceAlert** (boolean): Get notified when balance is low
- **lowBalanceThreshold** (number): Amount threshold for low balance alerts

### Security & Privacy Settings
- **sessionTimeout** (number): Session timeout in minutes
- **requirePasswordForTransfers** (boolean): Require password for transfers
- **twoFactorAuth** (boolean): Enable two-factor authentication

## Complete Guide to Add New Settings

### Step 1: Frontend Settings Registry

Add your setting definition to `ClientApp/src/utils/settingsRegistry.ts` in the `SETTINGS_REGISTRY` array:

```typescript
{
  key: 'myNewSetting',
  label: 'My New Setting',
  description: 'Description of what this setting does',
  type: 'select', // or 'toggle', 'number', 'text', 'color'
  category: 'general', // or 'display', 'notifications', 'security'
  defaultValue: 'defaultOption',
  options: [ // only for 'select' type
    { value: 'option1', label: 'Option 1', description: 'Description' },
    { value: 'option2', label: 'Option 2', description: 'Description' }
  ],
  validation: { // optional
    required: true,
    min: 0,
    max: 100
  },
  dependencies: [ // optional - show only when other settings have specific values
    { key: 'emailNotifications', value: true }
  ]
}
```

### Step 2: Backend Service Interface (Optional)

If you need specific getter/setter methods, add them to `Src/Services/IUserSettingsService.cs`:

```csharp
Task<string> GetMyNewSettingAsync(Guid userId);
Task SetMyNewSettingAsync(Guid userId, string value);
```

### Step 3: Backend Service Implementation (Optional)

Add the implementation to `Src/Services/UserSettingsService.cs`:

```csharp
public async Task<string> GetMyNewSettingAsync(Guid userId)
{
    return await GetSettingAsync(userId, "myNewSetting", "defaultOption");
}

public async Task SetMyNewSettingAsync(Guid userId, string value)
{
    await SetSettingAsync(userId, "myNewSetting", value);
}
```

### Step 4: Controller Endpoints (Optional)

Add specific endpoints to `Src/Controllers/SettingsController.cs`:

```csharp
[HttpGet("myNewSetting")]
public async Task<ActionResult<string>> GetMyNewSetting()
{
    try
    {
        var userId = GetCurrentUserId();
        var value = await _settingsService.GetMyNewSettingAsync(userId);
        return Ok(value);
    }
    catch (UnauthorizedAccessException ex)
    {
        return Unauthorized(ex.Message);
    }
    catch (Exception ex)
    {
        return StatusCode(500, $"Failed to retrieve setting: {ex.Message}");
    }
}

[HttpPut("myNewSetting")]
public async Task<ActionResult> SetMyNewSetting([FromBody] string value)
{
    try
    {
        var userId = GetCurrentUserId();
        await _settingsService.SetMyNewSettingAsync(userId, value);
        return Ok();
    }
    catch (UnauthorizedAccessException ex)
    {
        return Unauthorized(ex.Message);
    }
    catch (Exception ex)
    {
        return StatusCode(500, $"Failed to set setting: {ex.Message}");
    }
}
```

## What Happens Automatically

Once you add a setting to the registry (Step 1), your new setting will:

✅ **Automatically appear in the Settings page UI**
✅ **Auto-save when users change it** (1-second debounce)
✅ **Be stored in the database as JSON** (no migration needed)
✅ **Have validation and dependency support**
✅ **Work with the existing useUserSettings hook**
✅ **Support all setting types**: select, toggle, number, text, color

## Setting Types

### Select (Dropdown)
```typescript
{
  type: 'select',
  options: [
    { value: 'option1', label: 'Option 1', description: 'Optional description' },
    { value: 'option2', label: 'Option 2', description: 'Optional description' }
  ]
}
```

### Toggle (Boolean)
```typescript
{
  type: 'toggle',
  defaultValue: false
}
```

### Number
```typescript
{
  type: 'number',
  defaultValue: 60,
  validation: {
    min: 5,
    max: 480
  }
}
```

### Text
```typescript
{
  type: 'text',
  defaultValue: '',
  validation: {
    required: true,
    pattern: '^[a-zA-Z0-9]+$' // regex pattern
  }
}
```

### Color
```typescript
{
  type: 'color',
  defaultValue: '#007bff'
}
```

## Validation

Settings support comprehensive validation:

- **required**: Setting must have a value
- **min/max**: For number types
- **pattern**: Regex pattern for text types
- **options**: For select types (automatically validated)

## Dependencies

Settings can depend on other settings:

```typescript
{
  key: 'transactionAlerts',
  // ... other properties
  dependencies: [
    { key: 'emailNotifications', value: true }
  ]
}
```

This setting will only be visible when `emailNotifications` is set to `true`.

## Categories

Settings are organized into categories:

- **general**: Basic application preferences
- **display**: How information is displayed and formatted
- **notifications**: Notification preferences and alerts
- **security**: Security and privacy settings

## Important Notes

- **Steps 2-4 are OPTIONAL** - the generic endpoints handle all settings automatically
- Only add specific methods/endpoints if you need custom logic or validation
- Settings are automatically validated on the frontend using the registry
- All settings are stored as JSON in `UserSettings.SettingsJson` column
- **No database migrations needed** when adding new settings
- Settings support dependencies (show setting B only when setting A is enabled)
- The Settings page auto-generates forms based on the registry
- Auto-save functionality works with 1-second debouncing
- All changes are validated before saving

## Frontend Integration

### Using Settings in Components

```typescript
import { useUserSettings } from '../hooks/useUserSettings';

function MyComponent() {
  const { getSetting } = useUserSettings();
  
  const theme = getSetting('theme', 'light');
  const timezone = getSetting('timezone', 'UTC');
  
  // Use the settings...
}
```

### Using Specific Setting Hook

```typescript
import { useSetting } from '../hooks/useUserSettings';

function MyComponent() {
  const [theme, setTheme] = useSetting('theme', 'light');
  
  // theme contains current value
  // setTheme(newValue) updates the setting
}
```

## Backend Storage

Settings are stored as JSON in the `UserSettings` table:

```sql
CREATE TABLE UserSettings (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    UserId UNIQUEIDENTIFIER NOT NULL,
    SettingsJson NVARCHAR(MAX) NOT NULL DEFAULT '{}',
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
```

Example JSON structure:
```json
{
  "timezone": "America/New_York",
  "theme": "dark",
  "emailNotifications": true,
  "sessionTimeout": 120
}
```

This approach allows for:
- Dynamic settings without schema changes
- Easy addition of new settings
- Flexible data types
- Efficient storage and retrieval
