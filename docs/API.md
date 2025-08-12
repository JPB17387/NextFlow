# Task Dashboard MVP - API Documentation

## JavaScript API Reference

This document provides detailed information about the JavaScript functions and APIs available in the Task Dashboard MVP application.

## 📋 Table of Contents

- [Core Data Structures](#core-data-structures)
- [Task Management Functions](#task-management-functions)
- [UI Rendering Functions](#ui-rendering-functions)
- [Utility Functions](#utility-functions)
- [Event Handling](#event-handling)
- [Performance Monitoring](#performance-monitoring)
- [Accessibility Functions](#accessibility-functions)
- [Error Handling](#error-handling)

## 🏗️ Core Data Structures

### Task Object

```javascript
{
    id: string,           // Unique identifier (timestamp-based)
    name: string,         // Task description
    category: string,     // "Work" | "Study" | "Personal"
    time: string,         // HH:MM format from time input
    completed: boolean    // Completion status
}
```

### Global Variables

```javascript
let tasks = []; // Array of task objects
let clockTimer = null; // Timer reference for clock updates
const suggestions = []; // Array of productivity tips
```

## 📝 Task Management Functions

### `addTask()`

Adds a new task to the task list.

**Parameters**: None (reads from form inputs)

**Returns**: `void`

**Example**:

```javascript
// Called when user clicks "Add Task" button
addTask();
```

**Behavior**:

- Validates form inputs
- Creates new task object with unique ID
- Adds task to global tasks array
- Clears form and shows success message
- Re-renders task list and updates progress

### `deleteTask(taskId)`

Removes a task from the task list.

**Parameters**:

- `taskId` (string): Unique identifier of the task to delete

**Returns**: `void`

**Example**:

```javascript
deleteTask("1641234567890-abc123");
```

**Behavior**:

- Shows confirmation dialog
- Removes task from tasks array
- Re-renders task list and updates progress
- Announces deletion to screen readers

### `toggleTaskComplete(taskId)`

Toggles the completion status of a task.

**Parameters**:

- `taskId` (string): Unique identifier of the task to toggle

**Returns**: `void`

**Example**:

```javascript
toggleTaskComplete("1641234567890-abc123");
```

**Behavior**:

- Finds task by ID and toggles completed property
- Re-renders task list and updates progress
- Announces status change to screen readers

### `generateUniqueId()`

Generates a unique identifier for new tasks.

**Parameters**: None

**Returns**: `string` - Unique ID combining timestamp and random string

**Example**:

```javascript
const newId = generateUniqueId();
// Returns: "1641234567890-abc123def"
```

## 🎨 UI Rendering Functions

### `renderTasks()`

Renders the complete task list in the DOM.

**Parameters**: None

**Returns**: `void`

**Example**:

```javascript
renderTasks(); // Re-renders all tasks
```

**Behavior**:

- Clears existing task list
- Creates DOM elements for each task
- Uses DocumentFragment for performance
- Handles empty state display
- Updates accessibility attributes

### `createTaskElement(task)`

Creates a DOM element for a single task.

**Parameters**:

- `task` (Object): Task object to render

**Returns**: `HTMLElement` - Complete task DOM element

**Example**:

```javascript
const taskElement = createTaskElement({
  id: "123",
  name: "Complete project",
  category: "Work",
  time: "14:30",
  completed: false,
});
```

### `updateProgress()`

Updates the progress bar based on task completion.

**Parameters**: None

**Returns**: `void`

**Example**:

```javascript
updateProgress(); // Updates progress bar
```

**Behavior**:

- Calculates completion percentage
- Updates progress bar width
- Updates progress label text
- Announces progress to screen readers

### `calculateProgress()`

Calculates the completion percentage of tasks.

**Parameters**: None

**Returns**: `number` - Percentage (0-100)

**Example**:

```javascript
const progress = calculateProgress();
console.log(`${progress}% complete`);
```

## 🕐 Clock Functions

### `startClock()`

Initializes and starts the real-time clock display.

**Parameters**: None

**Returns**: `void`

**Example**:

```javascript
startClock(); // Starts the clock
```

**Behavior**:

- Updates clock immediately
- Sets up interval for continuous updates
- Handles errors gracefully

### `updateClock()`

Updates the clock display with current time and date.

**Parameters**: None

**Returns**: `void`

**Example**:

```javascript
updateClock(); // Updates clock once
```

## 🔧 Utility Functions

### `formatTaskTime(timeString)`

Formats time from 24-hour to 12-hour format.

**Parameters**:

- `timeString` (string): Time in HH:MM format

**Returns**: `string` - Formatted time with AM/PM

**Example**:

```javascript
const formatted = formatTaskTime("14:30");
// Returns: "2:30 PM"
```

### `debounce(func, wait)`

Creates a debounced version of a function.

**Parameters**:

- `func` (Function): Function to debounce
- `wait` (number): Delay in milliseconds

**Returns**: `Function` - Debounced function

**Example**:

```javascript
const debouncedSave = debounce(saveData, 300);
debouncedSave(); // Will only execute after 300ms of inactivity
```

### `throttle(func, limit)`

Creates a throttled version of a function.

**Parameters**:

- `func` (Function): Function to throttle
- `limit` (number): Minimum interval in milliseconds

**Returns**: `Function` - Throttled function

**Example**:

```javascript
const throttledScroll = throttle(handleScroll, 100);
window.addEventListener("scroll", throttledScroll);
```

## 📊 Performance Monitoring

### `PerformanceMonitor`

Object containing performance monitoring utilities.

#### `PerformanceMonitor.start(label)`

Starts a performance timer.

**Parameters**:

- `label` (string): Identifier for the timer

**Returns**: `void`

#### `PerformanceMonitor.end(label)`

Ends a performance timer and logs the duration.

**Parameters**:

- `label` (string): Identifier for the timer

**Returns**: `number` - Duration in milliseconds

#### `PerformanceMonitor.measure(fn, label)`

Measures the execution time of a function.

**Parameters**:

- `fn` (Function): Function to measure
- `label` (string): Identifier for the measurement

**Returns**: `any` - Return value of the measured function

**Example**:

```javascript
const result = PerformanceMonitor.measure(() => {
  return expensiveOperation();
}, "expensive-operation");
```

## ♿ Accessibility Functions

### `announceToScreenReader(message)`

Announces a message to screen readers.

**Parameters**:

- `message` (string): Message to announce

**Returns**: `void`

**Example**:

```javascript
announceToScreenReader("Task completed successfully");
```

### `showFieldError(fieldId, message)`

Displays an error message for a form field.

**Parameters**:

- `fieldId` (string): ID of the form field
- `message` (string): Error message to display

**Returns**: `void`

**Example**:

```javascript
showFieldError("taskName", "Task name is required");
```

### `clearErrorMessages()`

Clears all form error messages.

**Parameters**: None

**Returns**: `void`

**Example**:

```javascript
clearErrorMessages(); // Removes all error states
```

## 🚨 Error Handling

### `showSystemError(message)`

Displays a system-wide error message.

**Parameters**:

- `message` (string): Error message to display

**Returns**: `void`

**Example**:

```javascript
showSystemError("Unable to save data. Please try again.");
```

### `checkJavaScriptFeatures()`

Checks availability of required JavaScript features.

**Parameters**: None

**Returns**: `Object` - Feature availability status

**Example**:

```javascript
const features = checkJavaScriptFeatures();
console.log(features);
// Returns: { localStorage: true, addEventListener: true, ... }
```

## 🎯 Form Validation

### `validateTaskForm()`

Validates the task form inputs.

**Parameters**: None

**Returns**: `boolean` - True if form is valid

**Example**:

```javascript
if (validateTaskForm()) {
  // Proceed with task creation
  addTask();
}
```

## 💡 Suggestion System

### `showRandomSuggestion()`

Displays a random productivity tip.

**Parameters**: None

**Returns**: `void`

**Example**:

```javascript
showRandomSuggestion(); // Shows random tip in textarea
```

## 🎮 Event Handling

### Event Listeners Setup

The application sets up various event listeners during initialization:

```javascript
// Form submission
document.getElementById("addTaskBtn").addEventListener("click", addTask);

// Keyboard shortcuts
document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "Enter") {
    addTask();
  }
  if (event.altKey && event.key === "s") {
    showRandomSuggestion();
  }
});

// Form field events
document
  .getElementById("taskName")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      addTask();
    }
  });
```

## 🔄 Application Lifecycle

### `initializeApplication()`

Main initialization function called when DOM is ready.

**Parameters**: None

**Returns**: `void`

**Behavior**:

1. Applies browser-specific optimizations
2. Checks JavaScript feature availability
3. Starts the clock system
4. Renders initial tasks
5. Initializes progress bar
6. Sets up event listeners
7. Configures keyboard shortcuts

## 🧪 Development Utilities

### `DevTools` (Development Only)

Object containing development and debugging utilities:

```javascript
DevTools.addSampleData(); // Adds sample tasks for testing
DevTools.clearAllTasks(); // Removes all tasks
DevTools.showStats(); // Displays application statistics
```

## 📱 Browser Compatibility

### `detectBrowser()`

Detects the current browser.

**Parameters**: None

**Returns**: `string` - Browser name ('chrome', 'firefox', 'safari', 'edge', 'unknown')

### `applyBrowserOptimizations()`

Applies browser-specific performance optimizations.

**Parameters**: None

**Returns**: `void`

**Example**:

```javascript
applyBrowserOptimizations(); // Called during initialization
```

## 🔍 Usage Examples

### Complete Task Management Workflow

```javascript
// Add a new task
const taskData = {
  name: "Complete documentation",
  category: "Work",
  time: "15:30",
};

// This would typically be done through the UI
addTask(); // Reads from form inputs

// Toggle task completion
toggleTaskComplete("task-id-123");

// Delete a task
deleteTask("task-id-123");

// Update progress
updateProgress();
```

### Custom Event Handling

```javascript
// Add custom keyboard shortcut
document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.shiftKey && event.key === "D") {
    // Custom shortcut: Ctrl+Shift+D
    DevTools.clearAllTasks();
  }
});
```

### Performance Monitoring

```javascript
// Monitor task rendering performance
PerformanceMonitor.start("task-render");
renderTasks();
const renderTime = PerformanceMonitor.end("task-render");

if (renderTime > 50) {
  console.warn("Task rendering is slow:", renderTime + "ms");
}
```

---

This API documentation provides comprehensive information about all available functions and their usage in the Task Dashboard MVP application.
