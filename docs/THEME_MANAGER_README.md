# Theme Manager Documentation

## Overview

The Theme Manager is a comprehensive JavaScript module that handles theme switching, persistence, and error handling for the Task Dashboard MVP application. It supports five distinct themes and provides a robust API for theme management.

## Features

- **Five Built-in Themes**: White (default), Dark, Student, Developer, and Professional
- **Persistent Theme Storage**: Uses localStorage to remember user preferences
- **Error Handling**: Graceful fallbacks for invalid themes and storage issues
- **Browser Compatibility**: Detects CSS custom property support
- **Event System**: Dispatches theme change events for UI updates
- **Comprehensive API**: Full set of utility functions for theme management

## Installation

1. Include the theme manager script in your HTML:

```html
<script src="theme-manager.js"></script>
```

2. Initialize the theme system:

```javascript
themeManager.initializeThemeSystem();
```

## API Reference

### Core Methods

#### `initializeThemeSystem()`

Initializes the theme system and applies saved preferences.

- **Returns**: `boolean` - Success status
- **Usage**: Call once on page load

#### `setTheme(themeName)`

Sets the active theme and saves the preference.

- **Parameters**: `themeName` (string) - Name of theme to apply
- **Returns**: `boolean` - Success status
- **Valid themes**: 'white', 'dark', 'student', 'developer', 'professional'

#### `getCurrentTheme()`

Gets the currently active theme name.

- **Returns**: `string` - Current theme name

#### `getAvailableThemes()`

Gets list of all available themes with their configurations.

- **Returns**: `Array<Object>` - Array of theme configuration objects

### Storage Methods

#### `saveThemePreference(themeName)`

Saves theme preference to localStorage.

- **Parameters**: `themeName` (string) - Theme name to save
- **Returns**: `boolean` - Success status

#### `loadThemePreference()`

Loads saved theme preference from localStorage.

- **Returns**: `string|null` - Saved theme name or null if not found

#### `clearThemePreference()`

Clears saved theme preference.

- **Returns**: `boolean` - Success status

### Utility Methods

#### `getStatus()`

Gets comprehensive status information about the theme system.

- **Returns**: `Object` - Status information including initialization state, storage availability, etc.

#### `reset()`

Resets theme system to default state.

- **Returns**: `boolean` - Success status

#### `isValidTheme(themeName)`

Validates if a theme name is supported.

- **Parameters**: `themeName` (string) - Theme name to validate
- **Returns**: `boolean` - Validation result

## Theme Configurations

### White Theme (Default)

- **Name**: 'white'
- **Description**: Clean, bright interface perfect for well-lit environments
- **Colors**: Light backgrounds with dark text

### Dark Theme

- **Name**: 'dark'
- **Description**: Modern dark interface reducing eye strain in low-light conditions
- **Colors**: Dark backgrounds with light text

### Student Theme

- **Name**: 'student'
- **Description**: Vibrant, energetic colors designed to motivate learning
- **Colors**: Bright, educational color palette with rounded elements

### Developer Theme

- **Name**: 'developer'
- **Description**: Code-inspired dark theme with syntax highlighting colors
- **Colors**: Terminal-inspired colors with monospace fonts

### Professional Theme

- **Name**: 'professional'
- **Description**: Sophisticated, business-appropriate interface for corporate environments
- **Colors**: Muted, professional color palette with subtle shadows

## Usage Examples

### Basic Theme Switching

```javascript
// Initialize theme system
themeManager.initializeThemeSystem();

// Switch to dark theme
themeManager.setTheme("dark");

// Get current theme
const currentTheme = themeManager.getCurrentTheme();
console.log("Current theme:", currentTheme);
```

### Working with Theme Events

```javascript
// Listen for theme changes
document.addEventListener("themeChanged", function (event) {
  console.log(
    "Theme changed from",
    event.detail.previousTheme,
    "to",
    event.detail.newTheme
  );
  console.log("New theme config:", event.detail.themeConfig);
});
```

### Error Handling

```javascript
// Register error callback
themeManager.onError(function (message, type, originalError) {
  console.log("Theme error:", message, type);
  if (originalError) {
    console.error("Original error:", originalError);
  }
});
```

### Checking System Status

```javascript
const status = themeManager.getStatus();
console.log("Theme system status:", status);
/*
Output example:
{
    initialized: true,
    currentTheme: 'dark',
    storageAvailable: true,
    cssSupported: true,
    availableThemes: ['white', 'dark', 'student', 'developer', 'professional'],
    hasStoredPreference: true
}
*/
```

## Integration with Main Application

The theme manager is integrated with the main Task Dashboard application through:

1. **Automatic Initialization**: Theme system initializes when the app starts
2. **Global Utilities**: `window.themeUtils` provides easy access to theme functions
3. **Error Integration**: Uses existing error display system when available
4. **Storage Integration**: Respects existing storage availability checks

### Global Utilities

```javascript
// Available on window.themeUtils
window.themeUtils.getCurrentTheme();
window.themeUtils.setTheme("dark");
window.themeUtils.getAvailableThemes();
window.themeUtils.getStatus();
window.themeUtils.reset();
```

## Browser Compatibility

- **CSS Custom Properties**: Required for theme switching
- **localStorage**: Required for theme persistence (graceful fallback if unavailable)
- **ES6 Classes**: Modern browser support required
- **Custom Events**: For theme change notifications

## Error Handling

The theme manager handles various error scenarios:

- **Invalid Theme Names**: Falls back to default theme
- **Storage Unavailability**: Continues with session-only persistence
- **CSS Support Issues**: Provides graceful degradation
- **DOM Manipulation Errors**: Fails safely without breaking the application

## Testing

Use the provided test files to validate functionality:

- `test-theme-manager.html` - Basic functionality testing
- `test-theme-requirements.html` - Comprehensive requirements testing
- `validate-integration.js` - Integration validation

## Requirements Compliance

This implementation fulfills all requirements for Task 3:

- ✅ **Requirement 1.3**: Immediate theme application
- ✅ **Requirement 1.4**: Theme preference saving
- ✅ **Requirement 1.5**: Automatic theme loading
- ✅ **Requirement 8.1**: localStorage persistence
- ✅ **Requirement 8.2**: Automatic preference application
- ✅ **Requirement 8.3**: Default theme fallback
- ✅ **Requirement 8.4**: Graceful storage fallback
- ✅ **Requirement 8.5**: Reset on data clearing

## Performance Considerations

- **Minimal Memory Footprint**: Single instance with efficient theme storage
- **Fast Theme Switching**: Uses CSS custom properties for instant updates
- **Lazy Loading**: Only loads themes when needed
- **Error Recovery**: Automatic cleanup and recovery mechanisms

## Security Considerations

- **Input Validation**: All theme names are validated before application
- **Storage Safety**: Safe localStorage access with error handling
- **XSS Prevention**: No dynamic script execution or HTML injection
- **Graceful Degradation**: Continues working even with security restrictions
