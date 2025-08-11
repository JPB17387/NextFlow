// Task Dashboard MVP - JavaScript Foundation
// Initial application state and data structures

// Application state
let tasks = [];
let clockTimer = null;

// Local Storage Configuration
const STORAGE_KEY = 'taskDashboardTasks';

// Storage Manager Functions
function isStorageAvailable() {
    try {
        // Check if localStorage exists
        if (typeof localStorage === 'undefined') {
            console.warn('localStorage is not supported in this browser');
            return false;
        }
        
        // Test if we can actually use localStorage
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        const retrieved = localStorage.getItem(test);
        localStorage.removeItem(test);
        
        // Verify the test worked correctly
        if (retrieved !== test) {
            console.warn('localStorage test failed - data integrity issue');
            return false;
        }
        
        return true;
    } catch (error) {
        // Handle specific error types
        if (error.name === 'SecurityError') {
            console.warn('localStorage access denied (private browsing mode?):', error);
        } else if (error.name === 'QuotaExceededError') {
            console.warn('localStorage quota exceeded during availability test:', error);
        } else {
            console.warn('localStorage is not available:', error);
        }
        return false;
    }
}

function loadTasksFromStorage() {
    try {
        if (!isStorageAvailable()) {
            console.warn('localStorage not available, using in-memory storage');
            showStorageWarning('Local storage is not available. Tasks will not be saved between sessions.');
            return [];
        }
        
        const storedTasks = localStorage.getItem(STORAGE_KEY);
        if (!storedTasks) {
            return [];
        }
        
        let parsedTasks;
        try {
            parsedTasks = JSON.parse(storedTasks);
        } catch (parseError) {
            console.error('Failed to parse stored task data:', parseError);
            showStorageWarning('Stored task data is corrupted. Starting with empty task list.');
            // Clear corrupted data
            localStorage.removeItem(STORAGE_KEY);
            return [];
        }
        
        // Validate loaded data structure
        if (!Array.isArray(parsedTasks)) {
            console.warn('Invalid task data format, resetting to empty array');
            showStorageWarning('Task data format is invalid. Starting with empty task list.');
            localStorage.removeItem(STORAGE_KEY);
            return [];
        }
        
        // Validate each task object with more comprehensive checks
        const validTasks = parsedTasks.filter(task => {
            if (!task || typeof task !== 'object') {
                return false;
            }
            
            // Check required fields
            if (typeof task.id !== 'string' || task.id.trim() === '') {
                return false;
            }
            
            if (typeof task.name !== 'string' || task.name.trim() === '') {
                return false;
            }
            
            if (typeof task.category !== 'string' || 
                !['Work', 'Study', 'Personal'].includes(task.category)) {
                return false;
            }
            
            if (typeof task.completed !== 'boolean') {
                return false;
            }
            
            // Validate time field (optional)
            if (task.time !== '' && typeof task.time !== 'string') {
                return false;
            }
            
            // Validate time format if present (HH:MM)
            if (task.time && task.time !== '') {
                const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timeRegex.test(task.time)) {
                    return false;
                }
            }
            
            // Validate task name length
            if (task.name.length > 100) {
                return false;
            }
            
            return true;
        });
        
        if (validTasks.length !== parsedTasks.length) {
            const invalidCount = parsedTasks.length - validTasks.length;
            console.warn(`Filtered out ${invalidCount} invalid tasks`);
            showStorageWarning(`${invalidCount} invalid tasks were removed from your list.`);
            
            // Save the cleaned data back to storage
            if (validTasks.length > 0) {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(validTasks));
                } catch (saveError) {
                    console.error('Failed to save cleaned task data:', saveError);
                }
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        
        return validTasks;
        
    } catch (error) {
        console.error('Error loading tasks from storage:', error);
        showStorageWarning('Failed to load saved tasks. Starting with empty task list.');
        
        // Try to clear potentially corrupted data
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (clearError) {
            console.error('Failed to clear corrupted storage:', clearError);
        }
        
        return [];
    }
}

function saveTasksToStorage(tasksToSave) {
    try {
        if (!isStorageAvailable()) {
            console.warn('localStorage not available, tasks will not persist');
            showStorageWarning('Local storage is not available. Tasks will not be saved between sessions.');
            return false;
        }
        
        // Validate tasks before saving
        if (!Array.isArray(tasksToSave)) {
            console.error('Invalid tasks data: expected array');
            return false;
        }
        
        const tasksJson = JSON.stringify(tasksToSave);
        
        // Check if the data size is reasonable (warn if > 1MB)
        if (tasksJson.length > 1024 * 1024) {
            console.warn('Task data is very large, may cause performance issues');
            showStorageWarning('Task data is getting large. Consider removing completed tasks.');
        }
        
        localStorage.setItem(STORAGE_KEY, tasksJson);
        return true;
        
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            console.error('Storage quota exceeded. Consider clearing old data.');
            showStorageWarning('Storage is full. Some tasks may not be saved. Try removing completed tasks.');
            
            // Attempt to save only incomplete tasks as fallback
            try {
                const incompleteTasks = tasksToSave.filter(task => !task.completed);
                if (incompleteTasks.length < tasksToSave.length) {
                    const fallbackJson = JSON.stringify(incompleteTasks);
                    localStorage.setItem(STORAGE_KEY, fallbackJson);
                    showStorageWarning('Storage full. Only incomplete tasks were saved.');
                    return true;
                }
            } catch (fallbackError) {
                console.error('Fallback save also failed:', fallbackError);
            }
        } else if (error.name === 'SecurityError') {
            console.error('Storage access denied (private browsing mode?):', error);
            showStorageWarning('Storage access denied. Tasks will not be saved (private browsing mode?).');
        } else {
            console.error('Error saving tasks to storage:', error);
            showStorageWarning('Failed to save tasks. Please try again.');
        }
        return false;
    }
}

function clearStorage() {
    try {
        if (isStorageAvailable()) {
            localStorage.removeItem(STORAGE_KEY);
            console.log('Task storage cleared');
        }
    } catch (error) {
        console.error('Error clearing storage:', error);
    }
}

function attemptStorageRecovery() {
    try {
        console.log('Attempting storage recovery...');
        
        // Try to get storage info
        if (!isStorageAvailable()) {
            console.log('Storage not available, cannot recover');
            return false;
        }
        
        // Check if we can estimate storage usage
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
                const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
                const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2);
                console.log(`Storage usage: ${usedMB}MB / ${quotaMB}MB`);
                
                // Warn if storage is getting full (>80%)
                if (estimate.usage / estimate.quota > 0.8) {
                    showStorageWarning('Storage is getting full. Consider clearing browser data.', true);
                }
            }).catch(error => {
                console.warn('Could not estimate storage usage:', error);
            });
        }
        
        // Try to clean up any corrupted data
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            try {
                JSON.parse(storedData);
                console.log('Storage data appears valid');
                return true;
            } catch (parseError) {
                console.log('Found corrupted data, clearing...');
                localStorage.removeItem(STORAGE_KEY);
                showStorageWarning('Corrupted task data was cleared. Starting fresh.');
                return true;
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('Storage recovery failed:', error);
        return false;
    }
}

function getStorageInfo() {
    try {
        if (!isStorageAvailable()) {
            return { available: false, reason: 'localStorage not supported or accessible' };
        }
        
        const testData = JSON.stringify(tasks);
        const dataSize = new Blob([testData]).size;
        
        return {
            available: true,
            dataSize: dataSize,
            dataSizeFormatted: (dataSize / 1024).toFixed(2) + ' KB',
            taskCount: tasks.length
        };
        
    } catch (error) {
        return { available: false, reason: error.message };
    }
}

function showStorageWarning(message, persistent = false) {
    try {
        // Remove existing warnings of the same type to avoid duplicates
        const existingWarnings = document.querySelectorAll('.storage-warning');
        existingWarnings.forEach(warning => {
            if (warning.textContent === message) {
                warning.remove();
            }
        });
        
        const warningElement = document.createElement('div');
        warningElement.className = 'storage-warning';
        warningElement.textContent = message;
        warningElement.setAttribute('role', 'alert');
        warningElement.setAttribute('aria-live', 'polite');
        
        // Add close button for persistent warnings
        if (persistent) {
            warningElement.classList.add('persistent');
            const closeButton = document.createElement('button');
            closeButton.className = 'warning-close';
            closeButton.textContent = '×';
            closeButton.setAttribute('aria-label', 'Close warning');
            closeButton.addEventListener('click', () => {
                warningElement.remove();
            });
            warningElement.appendChild(closeButton);
        }
        
        const header = document.querySelector('header');
        if (header) {
            header.parentNode.insertBefore(warningElement, header.nextSibling);
            
            // Auto-remove non-persistent warnings after 8 seconds
            if (!persistent) {
                setTimeout(() => {
                    if (warningElement.parentNode) {
                        warningElement.remove();
                    }
                }, 8000);
            }
        } else {
            console.error('Could not find header element to display warning');
        }
        
    } catch (error) {
        console.error('Error displaying storage warning:', error);
        // Fallback to console warning if DOM manipulation fails
        console.warn('STORAGE WARNING:', message);
    }
}

// Sample suggestions array with productivity tips
const suggestions = [
    "Break large tasks into smaller, manageable chunks",
    "Use the Pomodoro Technique: 25 minutes focused work, 5 minute break",
    "Prioritize your most important task first thing in the morning",
    "Take regular breaks to maintain focus and avoid burnout",
    "Set specific deadlines for each task to create urgency",
    "Eliminate distractions by turning off notifications during work time",
    "Review and plan your tasks at the end of each day",
    "Focus on completing one task at a time instead of multitasking",
    "Use time-blocking to allocate specific hours for different activities",
    "Celebrate small wins to maintain motivation throughout the day"
];

// Utility function to generate unique IDs
function generateUniqueId() {
    return Date.now().toString() + Math.random().toString(36).substring(2, 11);
}

// Clock functionality
function updateClock() {
    try {
        const now = new Date();
        
        // Format time as HH:MM:SS AM/PM
        const timeOptions = {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        const timeString = now.toLocaleTimeString('en-US', timeOptions);
        
        // Format date as Day, Month DD, YYYY
        const dateOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const dateString = now.toLocaleDateString('en-US', dateOptions);
        
        // Update DOM elements
        const clockElement = document.getElementById('clock');
        const dateElement = document.getElementById('date');
        
        if (clockElement) {
            clockElement.textContent = timeString;
            clockElement.setAttribute('aria-label', `Current time: ${timeString}`);
        }
        
        if (dateElement) {
            dateElement.textContent = dateString;
            dateElement.setAttribute('aria-label', `Current date: ${dateString}`);
        }
        
    } catch (error) {
        console.error('Error updating clock:', error);
    }
}

function startClock() {
    try {
        // Update clock immediately
        updateClock();
        
        // Clear any existing timer
        if (clockTimer) {
            clearInterval(clockTimer);
        }
        
        // Set up interval to update every second
        clockTimer = setInterval(updateClock, 1000);
        
    } catch (error) {
        console.error('Error starting clock:', error);
    }
}

// Task form validation
function validateTaskForm() {
    const taskName = document.getElementById('taskName').value.trim();
    const taskCategory = document.getElementById('taskCategory').value;
    
    clearErrorMessages();
    
    let isValid = true;
    
    if (!taskName) {
        showFieldError('taskName', 'Task name is required');
        isValid = false;
    } else if (taskName.length > 100) {
        showFieldError('taskName', 'Task name must be 100 characters or less');
        isValid = false;
    }
    
    if (!taskCategory) {
        showFieldError('taskCategory', 'Please select a category');
        isValid = false;
    }
    
    return isValid;
}

function showFieldError(fieldId, message) {
    try {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;
        
        field.classList.add('error');
        field.setAttribute('aria-invalid', 'true');
        
        let errorElement = formGroup.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.setAttribute('role', 'alert');
            formGroup.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        field.focus();
        
    } catch (error) {
        console.error('Error showing field error:', error);
    }
}

function clearErrorMessages() {
    try {
        const errorMessages = document.querySelectorAll('.error-message');
        const errorFields = document.querySelectorAll('.error');
        
        errorMessages.forEach(element => element.remove());
        errorFields.forEach(field => {
            field.classList.remove('error');
            field.removeAttribute('aria-invalid');
        });
        
    } catch (error) {
        console.error('Error clearing error messages:', error);
    }
}

function clearTaskForm() {
    document.getElementById('taskName').value = '';
    document.getElementById('taskCategory').value = '';
    document.getElementById('taskTime').value = '';
    clearErrorMessages();
}

function showSuccessMessage(message) {
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const successElement = document.createElement('div');
    successElement.className = 'success-message';
    successElement.textContent = message;
    
    const form = document.getElementById('taskForm');
    form.parentNode.insertBefore(successElement, form.nextSibling);
    
    setTimeout(() => {
        if (successElement.parentNode) {
            successElement.remove();
        }
    }, 3000);
}

// Add task function
function addTask() {
    try {
        const addButton = document.getElementById('addTaskBtn');
        addButton.disabled = true;
        addButton.textContent = 'Adding...';
        
        if (!validateTaskForm()) {
            return;
        }
        
        const taskName = document.getElementById('taskName').value.trim();
        const taskCategory = document.getElementById('taskCategory').value;
        const taskTime = document.getElementById('taskTime').value;
        
        const newTask = {
            id: generateUniqueId(),
            name: taskName,
            category: taskCategory,
            time: taskTime || '',
            completed: false
        };
        
        // Add task to memory first
        tasks.push(newTask);
        
        // Try to save to storage
        const saveSuccess = saveTasksToStorage(tasks);
        if (!saveSuccess) {
            // If save failed, still keep the task in memory but warn user
            showStorageWarning('Task added but could not be saved. It will be lost when you refresh the page.');
        }
        
        clearTaskForm();
        showSuccessMessage('Task added successfully!');
        
        renderTasks();
        updateProgress();
        
    } catch (error) {
        console.error('Error adding task:', error);
        showStorageWarning('Failed to add task. Please try again.');
        
        // Try to recover by removing the potentially corrupted task
        if (tasks.length > 0) {
            const lastTask = tasks[tasks.length - 1];
            if (lastTask && lastTask.name === document.getElementById('taskName').value.trim()) {
                tasks.pop();
            }
        }
        
    } finally {
        const addButton = document.getElementById('addTaskBtn');
        if (addButton) {
            addButton.disabled = false;
            addButton.textContent = 'Add Task';
        }
    }
}

// Task rendering
function renderTasks() {
    try {
        const taskListContainer = document.getElementById('taskList');
        if (!taskListContainer) return;
        
        taskListContainer.innerHTML = '';
        
        if (tasks.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No tasks yet. Add your first task above!';
            taskListContainer.appendChild(emptyState);
            return;
        }
        
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskListContainer.appendChild(taskElement);
        });
        
    } catch (error) {
        console.error('Error rendering tasks:', error);
    }
}

function createTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.className = `task-item${task.completed ? ' completed' : ''}`;
    taskItem.setAttribute('data-task-id', task.id);
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
    
    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';
    
    const taskName = document.createElement('div');
    taskName.className = 'task-name';
    taskName.textContent = task.name;
    
    const taskMeta = document.createElement('div');
    taskMeta.className = 'task-meta';
    
    const categoryTag = document.createElement('span');
    categoryTag.className = `task-category ${task.category.toLowerCase()}`;
    categoryTag.textContent = task.category;
    taskMeta.appendChild(categoryTag);
    
    if (task.time) {
        const timeDisplay = document.createElement('span');
        timeDisplay.className = 'task-time';
        timeDisplay.textContent = formatTaskTime(task.time);
        taskMeta.appendChild(timeDisplay);
    }
    
    taskContent.appendChild(taskName);
    taskContent.appendChild(taskMeta);
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'task-delete';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteTask(task.id));
    
    taskItem.appendChild(checkbox);
    taskItem.appendChild(taskContent);
    taskItem.appendChild(deleteButton);
    
    return taskItem;
}

function formatTaskTime(timeString) {
    if (!timeString) return '';
    
    try {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const minute = parseInt(minutes, 10);
        
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const displayMinute = minute.toString().padStart(2, '0');
        
        return `${displayHour}:${displayMinute} ${period}`;
    } catch (error) {
        console.error('Error formatting time:', error);
        return timeString;
    }
}

function toggleTaskComplete(taskId) {
    try {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) {
            console.warn('Task not found for toggle:', taskId);
            return;
        }
        
        // Store original state for rollback
        const originalState = tasks[taskIndex].completed;
        
        // Update task state
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        
        // Try to save to storage
        const saveSuccess = saveTasksToStorage(tasks);
        if (!saveSuccess) {
            // Rollback on save failure
            tasks[taskIndex].completed = originalState;
            showStorageWarning('Could not save task status change. Change will be lost on page refresh.');
        }
        
        renderTasks();
        updateProgress();
        
    } catch (error) {
        console.error('Error toggling task completion:', error);
        showStorageWarning('Failed to update task status. Please try again.');
        
        // Re-render to ensure UI is consistent
        renderTasks();
        updateProgress();
    }
}

function deleteTask(taskId) {
    try {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) {
            console.warn('Task not found for deletion:', taskId);
            return;
        }
        
        const taskToDelete = tasks[taskIndex];
        const taskName = taskToDelete.name;
        
        if (!confirm(`Are you sure you want to delete the task "${taskName}"?`)) {
            return;
        }
        
        // Remove task from array
        tasks.splice(taskIndex, 1);
        
        // Try to save to storage
        const saveSuccess = saveTasksToStorage(tasks);
        if (!saveSuccess) {
            // Rollback on save failure
            tasks.splice(taskIndex, 0, taskToDelete);
            showStorageWarning('Could not save task deletion. Task will reappear on page refresh.');
            return;
        }
        
        renderTasks();
        updateProgress();
        
        showSuccessMessage(`Task "${taskName}" deleted successfully`);
        
    } catch (error) {
        console.error('Error deleting task:', error);
        showStorageWarning('Failed to delete task. Please try again.');
        
        // Re-render to ensure UI is consistent
        renderTasks();
        updateProgress();
    }
}

// Progress tracking
function calculateProgress() {
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / tasks.length) * 100);
}

function updateProgress() {
    try {
        const progress = calculateProgress();
        const progressBar = document.getElementById('progressBar');
        const progressLabel = document.getElementById('progressLabel');
        const progressContainer = document.getElementById('progressContainer');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressLabel) {
            progressLabel.textContent = `${progress}%`;
        }
        
        if (progressContainer) {
            progressContainer.setAttribute('aria-valuenow', progress);
            if (progress === 100) {
                progressContainer.classList.add('complete');
            } else {
                progressContainer.classList.remove('complete');
            }
        }
        
    } catch (error) {
        console.error('Error updating progress:', error);
    }
}

// Suggestion system
function showRandomSuggestion() {
    try {
        const suggestionText = document.getElementById('suggestionText');
        if (!suggestionText) return;
        
        const randomIndex = Math.floor(Math.random() * suggestions.length);
        const randomSuggestion = suggestions[randomIndex];
        
        suggestionText.value = randomSuggestion;
        suggestionText.classList.add('suggestion-updated');
        
        setTimeout(() => {
            suggestionText.classList.remove('suggestion-updated');
        }, 1000);
        
    } catch (error) {
        console.error('Error showing suggestion:', error);
    }
}

// Theme system integration functions
function getThemeManager() {
    return typeof themeManager !== 'undefined' ? themeManager : null;
}

function getCurrentTheme() {
    const manager = getThemeManager();
    return manager ? manager.getCurrentTheme() : 'white';
}

function setTheme(themeName) {
    const manager = getThemeManager();
    if (manager) {
        return manager.setTheme(themeName);
    }
    console.warn('Theme manager not available');
    return false;
}

function getAvailableThemes() {
    const manager = getThemeManager();
    return manager ? manager.getAvailableThemes() : [];
}

function getThemeStatus() {
    const manager = getThemeManager();
    return manager ? manager.getStatus() : { initialized: false };
}

// Theme system initialization helper functions
function handleThemeInitializationError(error) {
    console.error('Theme system initialization error:', error);
    
    // Ensure default theme is applied
    try {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('theme-transition-disabled');
    } catch (domError) {
        console.error('Failed to apply fallback theme:', domError);
    }
    
    // Show user-friendly error message
    showStorageWarning('Theme system could not be initialized. Using default theme.', false);
}

// Enhanced error handling for theme system
function handleThemeError(message, type, originalError = null) {
    console.error(`Theme Error [${type}]:`, message, originalError);
    
    // Handle specific error types with appropriate user feedback
    switch (type) {
        case 'BROWSER_COMPATIBILITY':
            showStorageWarning('Your browser does not support theme switching. Using default theme.', true);
            break;
        case 'STORAGE_WARNING':
            showStorageWarning('Theme changed but preference could not be saved. You may need to reselect your theme after refreshing.', false);
            break;
        case 'INVALID_THEME':
            showStorageWarning('Invalid theme selected. Using default theme.', false);
            // Reset to default theme
            if (typeof themeManager !== 'undefined') {
                themeManager.setTheme('white');
            }
            break;
        case 'CSS_SUPPORT_ERROR':
            showStorageWarning('Your browser does not support CSS custom properties. Theme switching is disabled.', true);
            break;
        case 'DOM_APPLICATION_ERROR':
            showStorageWarning('Failed to apply theme. Please refresh the page.', false);
            break;
        default:
            // Don't show generic errors to users to avoid confusion
            console.warn('Unhandled theme error type:', type);
            break;
    }
}

// CSS custom properties support detection
function detectCSSCustomPropertiesSupport() {
    try {
        if (!window.CSS || !CSS.supports) {
            return false;
        }
        return CSS.supports('color', 'var(--test)');
    } catch (error) {
        console.error('Error detecting CSS custom properties support:', error);
        return false;
    }
}

// Enhanced localStorage availability check with detailed error reporting
function checkStorageAvailabilityDetailed() {
    try {
        if (typeof localStorage === 'undefined') {
            return { available: false, reason: 'localStorage not supported', error: 'STORAGE_NOT_SUPPORTED' };
        }

        // Test localStorage functionality
        const test = '__theme_storage_test__';
        localStorage.setItem(test, test);
        const retrieved = localStorage.getItem(test);
        localStorage.removeItem(test);

        if (retrieved !== test) {
            return { available: false, reason: 'localStorage test failed', error: 'STORAGE_TEST_FAILED' };
        }

        return { available: true, reason: 'localStorage working normally', error: null };

    } catch (error) {
        let errorType = 'STORAGE_UNKNOWN_ERROR';
        let reason = 'Unknown storage error';

        if (error.name === 'SecurityError') {
            errorType = 'STORAGE_SECURITY_ERROR';
            reason = 'Storage access denied (private browsing mode?)';
        } else if (error.name === 'QuotaExceededError') {
            errorType = 'STORAGE_QUOTA_EXCEEDED';
            reason = 'Storage quota exceeded';
        }

        return { available: false, reason: reason, error: errorType };
    }
}

// Theme system recovery function
function attemptThemeSystemRecovery() {
    try {
        console.log('Attempting theme system recovery...');
        
        // Check if theme manager is available
        if (typeof themeManager === 'undefined') {
            console.error('Theme manager not available for recovery');
            return false;
        }
        
        // Check CSS custom properties support
        if (!detectCSSCustomPropertiesSupport()) {
            console.warn('CSS custom properties not supported - theme system disabled');
            handleThemeError('CSS custom properties not supported', 'CSS_SUPPORT_ERROR');
            return false;
        }
        
        // Check storage availability
        const storageCheck = checkStorageAvailabilityDetailed();
        if (!storageCheck.available) {
            console.warn('Storage not available:', storageCheck.reason);
            handleThemeError(storageCheck.reason, storageCheck.error);
            // Continue with session-only theme support
        }
        
        // Try to reinitialize theme system
        const reinitSuccess = themeManager.initializeThemeSystem();
        if (reinitSuccess) {
            console.log('Theme system recovery successful');
            return true;
        } else {
            console.error('Theme system recovery failed');
            return false;
        }
        
    } catch (error) {
        console.error('Theme system recovery failed:', error);
        handleThemeError('Theme system recovery failed', 'RECOVERY_ERROR', error);
        return false;
    }
}

function verifyThemeSystemIntegrity() {
    try {
        if (typeof themeManager === 'undefined') {
            return { valid: false, error: 'Theme manager not loaded' };
        }
        
        const status = themeManager.getStatus();
        
        // Check if theme system is properly initialized
        if (!status.initialized) {
            return { valid: false, error: 'Theme system not initialized' };
        }
        
        // Check if current theme is valid
        const currentTheme = themeManager.getCurrentTheme();
        const availableThemes = themeManager.getAvailableThemes();
        const themeExists = availableThemes.some(theme => theme.name === currentTheme);
        
        if (!themeExists) {
            return { valid: false, error: `Invalid current theme: ${currentTheme}` };
        }
        
        // Check if DOM reflects the current theme
        const expectedDataTheme = currentTheme === 'white' ? null : currentTheme;
        const actualDataTheme = document.documentElement.getAttribute('data-theme');
        
        if (expectedDataTheme !== actualDataTheme) {
            return { 
                valid: false, 
                error: `DOM theme mismatch. Expected: ${expectedDataTheme}, Actual: ${actualDataTheme}` 
            };
        }
        
        return { valid: true };
        
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

// Global theme functions for console testing
if (typeof window !== 'undefined') {
    window.themeUtils = {
        getCurrentTheme: getCurrentTheme,
        setTheme: setTheme,
        getAvailableThemes: getAvailableThemes,
        getStatus: getThemeStatus,
        reset: function() {
            const manager = getThemeManager();
            return manager ? manager.reset() : false;
        },
        verify: verifyThemeSystemIntegrity,
        reinitialize: function() {
            if (typeof themeManager !== 'undefined') {
                return themeManager.initializeThemeSystem();
            }
            return false;
        }
    };
}

// Theme Selector Functionality
function initializeThemeSelector() {
    const themeToggle = document.getElementById('themeToggle');
    const themeDropdown = document.getElementById('themeDropdown');
    const themeOptions = document.querySelectorAll('.theme-option');
    
    if (!themeToggle || !themeDropdown || !themeOptions.length) {
        console.warn('Theme selector elements not found');
        return;
    }
    
    // Update theme selector to show current theme
    updateThemeSelector();
    
    // Toggle dropdown visibility
    themeToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleThemeDropdown();
    });
    
    // Handle theme selection
    themeOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const themeName = this.getAttribute('data-theme');
            selectTheme(themeName);
        });
        
        // Keyboard navigation support
        option.addEventListener('keydown', function(e) {
            handleThemeOptionKeydown(e, this);
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!themeToggle.contains(e.target) && !themeDropdown.contains(e.target)) {
            closeThemeDropdown();
        }
    });
    
    // Close dropdown on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && themeDropdown.getAttribute('aria-hidden') === 'false') {
            closeThemeDropdown();
            themeToggle.focus();
        }
    });
    
    // Listen for theme changes from other sources
    document.addEventListener('themeChanged', function(e) {
        updateThemeSelector();
    });
}

function toggleThemeDropdown() {
    const themeToggle = document.getElementById('themeToggle');
    const themeDropdown = document.getElementById('themeDropdown');
    
    const isOpen = themeDropdown.getAttribute('aria-hidden') === 'false';
    
    if (isOpen) {
        closeThemeDropdown();
    } else {
        openThemeDropdown();
    }
}

function openThemeDropdown() {
    const themeToggle = document.getElementById('themeToggle');
    const themeDropdown = document.getElementById('themeDropdown');
    const firstOption = themeDropdown.querySelector('.theme-option');
    
    themeToggle.setAttribute('aria-expanded', 'true');
    themeDropdown.setAttribute('aria-hidden', 'false');
    
    // Focus first option for keyboard navigation
    if (firstOption) {
        firstOption.focus();
    }
}

function closeThemeDropdown() {
    const themeToggle = document.getElementById('themeToggle');
    const themeDropdown = document.getElementById('themeDropdown');
    
    themeToggle.setAttribute('aria-expanded', 'false');
    themeDropdown.setAttribute('aria-hidden', 'true');
}

function selectTheme(themeName) {
    if (!themeName || typeof themeManager === 'undefined') {
        console.warn('Cannot select theme:', themeName);
        return;
    }
    
    // Apply theme using theme manager
    const success = themeManager.setTheme(themeName);
    
    if (success) {
        // Update UI to reflect selection
        updateThemeSelector();
        
        // Close dropdown
        closeThemeDropdown();
        
        // Return focus to toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.focus();
        }
        
        // Announce theme change to screen readers
        announceThemeChange(themeName);
    } else {
        console.error('Failed to apply theme:', themeName);
    }
}

function updateThemeSelector() {
    if (typeof themeManager === 'undefined') {
        return;
    }
    
    const currentTheme = themeManager.getCurrentTheme();
    const themeOptions = document.querySelectorAll('.theme-option');
    
    // Update aria-selected attributes and visual indicators
    themeOptions.forEach(option => {
        const themeName = option.getAttribute('data-theme');
        const isSelected = themeName === currentTheme;
        
        option.setAttribute('aria-selected', isSelected.toString());
        option.setAttribute('tabindex', isSelected ? '0' : '-1');
    });
    
    // Update toggle button label if needed
    const themeToggle = document.getElementById('themeToggle');
    const currentThemeConfig = themeManager.getCurrentThemeConfig();
    
    if (themeToggle && currentThemeConfig) {
        themeToggle.setAttribute('aria-label', `Current theme: ${currentThemeConfig.displayName}. Click to change theme.`);
    }
}

function handleThemeOptionKeydown(e, option) {
    const themeOptions = Array.from(document.querySelectorAll('.theme-option'));
    const currentIndex = themeOptions.indexOf(option);
    
    switch (e.key) {
        case 'Enter':
        case ' ':
            e.preventDefault();
            const themeName = option.getAttribute('data-theme');
            selectTheme(themeName);
            break;
            
        case 'ArrowDown':
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % themeOptions.length;
            themeOptions[nextIndex].focus();
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            const prevIndex = currentIndex === 0 ? themeOptions.length - 1 : currentIndex - 1;
            themeOptions[prevIndex].focus();
            break;
            
        case 'Home':
            e.preventDefault();
            themeOptions[0].focus();
            break;
            
        case 'End':
            e.preventDefault();
            themeOptions[themeOptions.length - 1].focus();
            break;
            
        case 'Escape':
            e.preventDefault();
            closeThemeDropdown();
            document.getElementById('themeToggle').focus();
            break;
    }
}

function announceThemeChange(themeName) {
    if (typeof themeManager === 'undefined') {
        return;
    }
    
    const themeConfig = themeManager.getThemeConfig(themeName);
    if (!themeConfig) {
        return;
    }
    
    // Create announcement for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Theme changed to ${themeConfig.displayName}`;
    
    document.body.appendChild(announcement);
    
    // Remove announcement after screen readers have processed it
    setTimeout(() => {
        if (announcement.parentNode) {
            announcement.remove();
        }
    }, 1000);
}

// Event listeners and initialization
function initializeApp() {
    try {
        // Initialize theme system first (Requirement 8.1, 8.2, 8.3, 8.4, 8.5)
        if (typeof themeManager !== 'undefined') {
            console.log('Initializing theme system...');
            
            // Initialize theme system with persistence and error handling
            const themeInitialized = themeManager.initializeThemeSystem();
            
            if (themeInitialized) {
                console.log('Theme system initialized successfully');
                
                // Log current theme status for debugging
                const status = themeManager.getStatus();
                console.log('Theme system status:', {
                    currentTheme: status.currentTheme,
                    storageAvailable: status.storageAvailable,
                    hasStoredPreference: status.hasStoredPreference
                });
                
                // Initialize theme selector UI
                initializeThemeSelector();
                
                // Verify theme was applied correctly
                const appliedTheme = themeManager.getCurrentTheme();
                console.log(`Applied theme: ${appliedTheme}`);
                
            } else {
                console.warn('Theme system initialization failed, continuing with default theme');
                // Ensure fallback theme is applied even if initialization fails
                document.documentElement.removeAttribute('data-theme');
            }
            
        } else {
            console.error('Theme manager not available - theme system will not function');
            // Ensure default theme styling is applied
            document.documentElement.removeAttribute('data-theme');
        }
        
        // Attempt storage recovery first
        attemptStorageRecovery();
        
        // Load tasks from storage
        tasks = loadTasksFromStorage();
        
        // Show persistent warning if localStorage is not available
        if (!isStorageAvailable()) {
            showStorageWarning('Local storage is not available. Tasks will not be saved between sessions.', true);
        }
        
        // Start the clock
        startClock();
        
        // Add task button event listener
        const addTaskBtn = document.getElementById('addTaskBtn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', addTask);
        }
        
        // Form submission event listener
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', function(e) {
                e.preventDefault();
                addTask();
            });
        }
        
        // Enter key on task name field
        const taskNameField = document.getElementById('taskName');
        if (taskNameField) {
            taskNameField.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addTask();
                }
            });
        }
        
        // Suggestion button event listener
        const suggestionBtn = document.getElementById('suggestionBtn');
        if (suggestionBtn) {
            suggestionBtn.addEventListener('click', showRandomSuggestion);
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ctrl+Enter to add task
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                addTask();
            }
            
            // Alt+S for suggestion
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                showRandomSuggestion();
            }
        });
        
        // Initial render
        renderTasks();
        updateProgress();
        
        console.log('Task Dashboard MVP initialized successfully');
        
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}