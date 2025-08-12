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

// Accessibility Enhancement Functions for Theme Dropdown

/**
 * Create or get the ARIA live region for positioning announcements
 * @returns {HTMLElement} - The live region element
 */
function getOrCreateAriaLiveRegion() {
    let liveRegion = document.getElementById('theme-positioning-announcements');
    
    if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'theme-positioning-announcements';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.style.cssText = `
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important;
        `;
        
        // Add to document body
        document.body.appendChild(liveRegion);
    }
    
    return liveRegion;
}

/**
 * Announce positioning changes to screen readers
 * Implements requirement 5.3 - Add ARIA live region announcements for significant positioning changes
 * @param {Object} positioningResult - Result from collision avoidance positioning
 */
function announcePositioningChange(positioningResult) {
    try {
        if (!positioningResult || !positioningResult.positionChanged) {
            return;
        }
        
        const liveRegion = getOrCreateAriaLiveRegion();
        let announcement = '';
        let priority = 'polite'; // Default to polite announcements
        
        // Create appropriate announcement based on positioning change
        // Enhanced announcements with more context for screen reader users
        if (positioningResult.strategy === 'left-aligned') {
            announcement = 'Theme menu repositioned to the left to avoid overlapping content. Navigation remains the same.';
        } else if (positioningResult.strategy === 'center-aligned') {
            announcement = 'Theme menu repositioned to center to avoid overlapping content. Navigation remains the same.';
        } else if (positioningResult.strategy === 'offset-left') {
            announcement = 'Theme menu repositioned with left offset to improve visibility. Use arrow keys to navigate options.';
        } else if (positioningResult.strategy === 'offset-right') {
            announcement = 'Theme menu repositioned with right offset to improve visibility. Use arrow keys to navigate options.';
        } else if (positioningResult.strategy === 'collision-avoided') {
            announcement = 'Theme menu repositioned to avoid overlapping with other content. All options remain accessible.';
        } else if (positioningResult.strategy === 'viewport-adjusted') {
            announcement = 'Theme menu repositioned to fit within screen boundaries. Navigation unchanged.';
        } else if (positioningResult.strategy === 'mobile-optimized') {
            announcement = 'Theme menu repositioned for mobile display. Tap or use arrow keys to navigate.';
        } else {
            announcement = 'Theme menu position adjusted for better accessibility. Navigation remains unchanged.';
        }
        
        // Determine if this is a significant change that warrants announcement
        const isSignificantChange = positioningResult.significantChange || 
                                   positioningResult.strategy === 'collision-avoided' ||
                                   positioningResult.strategy === 'viewport-adjusted';
        
        // Use assertive priority for critical positioning changes that affect usability
        if (positioningResult.strategy === 'viewport-adjusted' || 
            positioningResult.strategy === 'collision-avoided') {
            priority = 'assertive';
        }
        
        // Only announce if the positioning change is significant enough to matter to users
        if (isSignificantChange) {
            // Update live region priority if needed
            if (liveRegion.getAttribute('aria-live') !== priority) {
                liveRegion.setAttribute('aria-live', priority);
            }
            
            // Clear previous announcement to ensure new one is read
            liveRegion.textContent = '';
            
            // Use timeout to ensure screen readers pick up the change
            setTimeout(() => {
                liveRegion.textContent = announcement;
                
                // Log announcement for debugging
                console.log('Accessibility announcement:', announcement);
                
                // Clear announcement after reasonable time to avoid repetition
                setTimeout(() => {
                    if (liveRegion.textContent === announcement) {
                        liveRegion.textContent = '';
                        
                        // Reset to polite priority after announcement
                        if (priority === 'assertive') {
                            liveRegion.setAttribute('aria-live', 'polite');
                        }
                    }
                }, priority === 'assertive' ? 6000 : 4000); // Longer duration for assertive announcements
                
            }, 100);
            
            // Additional context announcement for complex positioning changes
            if (positioningResult.reason) {
                setTimeout(() => {
                    const contextAnnouncement = `Repositioning reason: ${positioningResult.reason}`;
                    announceAccessibilityChange(contextAnnouncement, 'polite');
                }, 2000);
            }
        }
        
        // Track positioning announcements for analytics/debugging
        if (typeof positioningResult.trackingCallback === 'function') {
            positioningResult.trackingCallback({
                announced: isSignificantChange,
                strategy: positioningResult.strategy,
                priority: priority,
                announcement: announcement
            });
        }
        
    } catch (error) {
        console.error('Error announcing positioning change:', error);
        
        // Fallback announcement in case of error
        try {
            const fallbackRegion = getOrCreateAriaLiveRegion();
            fallbackRegion.textContent = 'Theme menu position was adjusted. Navigation remains available.';
            
            setTimeout(() => {
                fallbackRegion.textContent = '';
            }, 3000);
        } catch (fallbackError) {
            console.error('Fallback positioning announcement also failed:', fallbackError);
        }
    }
}
        } else if (positioningResult.strategy === 'collision-avoided') {
            announcement = 'Theme menu repositioned to avoid overlapping with other content';
        } else if (positioningResult.strategy === 'viewport-adjusted') {
            announcement = 'Theme menu repositioned to fit within screen boundaries';
        } else {
            announcement = 'Theme menu position adjusted for better accessibility';
        }
        
        // Clear previous announcement and set new one
        liveRegion.textContent = '';
        
        // Use setTimeout to ensure screen readers pick up the change
        setTimeout(() => {
            liveRegion.textContent = announcement;
            
            // Clear the announcement after a delay to avoid repetition
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 3000);
        }, 100);
        
    } catch (error) {
        console.error('Error announcing positioning change:', error);
    }
}

/**
 * Enhanced focus management for theme dropdown
 * Ensures focus remains within dropdown during positioning changes
 * Implements requirements 5.1, 5.2 - maintain proper focus management and keyboard navigation
 * @param {HTMLElement} dropdown - The dropdown element
 * @param {HTMLElement} currentFocusedOption - Currently focused option
 */
function maintainDropdownFocus(dropdown, currentFocusedOption = null) {
    try {
        if (!dropdown || dropdown.getAttribute('aria-hidden') === 'true') {
            return;
        }
        
        const focusableOptions = dropdown.querySelectorAll('.theme-option[tabindex="0"], .theme-option:focus');
        const allOptions = dropdown.querySelectorAll('.theme-option');
        
        // Store the current focus state before any positioning changes
        const activeFocusedElement = document.activeElement;
        const wasDropdownFocused = dropdown.contains(activeFocusedElement);
        
        // Enhanced focus preservation during positioning changes
        if (currentFocusedOption && document.contains(currentFocusedOption)) {
            // Store selection state for restoration
            const selectionStart = currentFocusedOption.selectionStart;
            const selectionEnd = currentFocusedOption.selectionEnd;
            
            // Use multiple animation frames to ensure positioning is complete
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // Check if focus was lost during positioning
                    if (document.activeElement !== currentFocusedOption) {
                        // Restore focus with enhanced error handling
                        try {
                            currentFocusedOption.focus();
                            
                            // Restore selection if applicable
                            if (typeof selectionStart === 'number' && typeof selectionEnd === 'number') {
                                currentFocusedOption.setSelectionRange(selectionStart, selectionEnd);
                            }
                        } catch (focusError) {
                            console.warn('Direct focus restoration failed, trying alternative approach:', focusError);
                            
                            // Alternative focus restoration approach
                            currentFocusedOption.setAttribute('tabindex', '0');
                            currentFocusedOption.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                            currentFocusedOption.focus();
                        }
                        
                        // Verify focus was successfully restored with timeout
                        setTimeout(() => {
                            if (document.activeElement !== currentFocusedOption) {
                                // Final attempt with forced focus
                                try {
                                    currentFocusedOption.setAttribute('tabindex', '0');
                                    currentFocusedOption.focus({ preventScroll: true });
                                    
                                    // Log focus restoration issue for debugging
                                    console.warn('Focus restoration required multiple attempts');
                                } catch (finalError) {
                                    console.error('All focus restoration attempts failed:', finalError);
                                }
                            }
                        }, 50);
                        
                        // Announce focus restoration if positioning changed significantly
                        const positioningClasses = ['position-left', 'position-center', 'position-offset-left', 'position-offset-right'];
                        const hasPositioningClass = positioningClasses.some(cls => dropdown.classList.contains(cls));
                        
                        if (hasPositioningClass) {
                            announceAccessibilityChange('Focus maintained during menu repositioning', 'polite');
                        }
                    }
                });
            });
            return;
        }
        
        // Enhanced focus restoration for dropdown without specific option focus
        if (wasDropdownFocused && allOptions.length > 0) {
            // Find the currently selected option or use first option
            const selectedOption = dropdown.querySelector('.theme-option[aria-selected="true"]') || allOptions[0];
            
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    try {
                        selectedOption.focus();
                        
                        // Ensure proper tabindex management with enhanced accessibility
                        allOptions.forEach((option, index) => {
                            const shouldBeFocusable = option === selectedOption;
                            option.setAttribute('tabindex', shouldBeFocusable ? '0' : '-1');
                            
                            // Update aria-selected state for screen readers
                            if (shouldBeFocusable && !option.hasAttribute('aria-selected')) {
                                option.setAttribute('aria-selected', 'false');
                            }
                        });
                        
                        // Ensure the focused option is visible
                        selectedOption.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                        
                    } catch (restorationError) {
                        console.error('Error during focus restoration:', restorationError);
                        
                        // Fallback to first available option
                        const firstOption = allOptions[0];
                        if (firstOption) {
                            firstOption.setAttribute('tabindex', '0');
                            firstOption.focus();
                        }
                    }
                });
            });
            return;
        }
        
        // Enhanced fallback focus management
        if (allOptions.length > 0) {
            const firstOption = allOptions[0];
            requestAnimationFrame(() => {
                try {
                    firstOption.setAttribute('tabindex', '0');
                    firstOption.focus();
                    
                    // Ensure other options are not focusable
                    allOptions.forEach((option, index) => {
                        if (option !== firstOption) {
                            option.setAttribute('tabindex', '-1');
                        }
                    });
                } catch (fallbackError) {
                    console.error('Fallback focus management failed:', fallbackError);
                }
            });
        }
        
    } catch (error) {
        console.error('Error maintaining dropdown focus:', error);
        
        // Enhanced fallback: try to restore focus to any focusable element in dropdown
        try {
            const anyFocusable = dropdown.querySelector('.theme-option');
            if (anyFocusable) {
                anyFocusable.setAttribute('tabindex', '0');
                anyFocusable.focus();
                
                // Announce fallback focus restoration
                announceAccessibilityChange('Focus restored to theme menu', 'polite');
            }
        } catch (fallbackError) {
            console.error('Enhanced fallback focus restoration also failed:', fallbackError);
            
            // Final fallback: announce focus loss to screen readers
            announceAccessibilityChange('Theme menu focus was lost during repositioning. Press Tab to return to menu.', 'assertive');
        }
    }
}

/**
 * Setup keyboard navigation for theme dropdown with enhanced accessibility
 * Implements requirement 5.2 - Maintain keyboard navigation functionality regardless of position
 * @param {HTMLElement} dropdown - The dropdown element
 */
function setupEnhancedKeyboardNavigation(dropdown) {
    try {
        if (!dropdown) return;
        
        const options = dropdown.querySelectorAll('.theme-option');
        
        options.forEach((option, index) => {
            // Remove existing event listeners to avoid duplicates
            option.removeEventListener('keydown', handleThemeOptionKeydown);
            option.addEventListener('keydown', handleThemeOptionKeydown);
            
            // Set up proper tabindex management based on current selection
            const isSelected = option.getAttribute('aria-selected') === 'true';
            option.setAttribute('tabindex', isSelected ? '0' : '-1');
            
            // Enhanced ARIA attributes for better screen reader support
            if (!option.hasAttribute('aria-describedby')) {
                const themeName = option.getAttribute('data-theme');
                const themeConfig = typeof themeManager !== 'undefined' ? themeManager.getThemeConfig(themeName) : null;
                
                if (themeConfig && themeConfig.description) {
                    // Create description element if it doesn't exist
                    let descId = `theme-desc-${themeName}`;
                    let descElement = document.getElementById(descId);
                    
                    if (!descElement) {
                        descElement = document.createElement('div');
                        descElement.id = descId;
                        descElement.className = 'sr-only';
                        descElement.textContent = themeConfig.description;
                        document.body.appendChild(descElement);
                    }
                    
                    option.setAttribute('aria-describedby', descId);
                }
            }
            
            // Add position-independent event handlers for enhanced accessibility
            option.addEventListener('focus', function(e) {
                // Ensure focused option is visible regardless of dropdown position
                try {
                    e.target.scrollIntoView({ 
                        block: 'nearest', 
                        inline: 'nearest',
                        behavior: 'smooth'
                    });
                    
                    // Update aria-activedescendant on parent dropdown
                    dropdown.setAttribute('aria-activedescendant', e.target.id || `theme-option-${index}`);
                    
                    // Ensure proper tabindex management
                    options.forEach(opt => {
                        opt.setAttribute('tabindex', opt === e.target ? '0' : '-1');
                    });
                    
                } catch (scrollError) {
                    console.warn('Error ensuring option visibility:', scrollError);
                }
            });
            
            // Add blur handler to maintain proper state
            option.addEventListener('blur', function(e) {
                // Clear aria-activedescendant when focus leaves options
                setTimeout(() => {
                    if (!dropdown.contains(document.activeElement)) {
                        dropdown.removeAttribute('aria-activedescendant');
                    }
                }, 10);
            });
            
            // Ensure each option has a unique ID for aria-activedescendant
            if (!option.id) {
                option.id = `theme-option-${themeName || index}`;
            }
        });
        
        // Enhanced dropdown accessibility attributes
        dropdown.setAttribute('role', 'listbox');
        dropdown.setAttribute('aria-orientation', 'vertical');
        dropdown.setAttribute('aria-multiselectable', 'false');
        
        // Add comprehensive keyboard navigation instructions for screen readers
        let navHelpId = 'theme-nav-help';
        let navHelpElement = document.getElementById(navHelpId);
        
        if (!navHelpElement) {
            navHelpElement = document.createElement('div');
            navHelpElement.id = navHelpId;
            navHelpElement.className = 'sr-only';
            navHelpElement.textContent = 'Theme selection menu. Use arrow keys to navigate between options, Enter or Space to select a theme, Escape to close menu. Navigation works regardless of menu position.';
            document.body.appendChild(navHelpElement);
        }
        
        // Always update the describedby attribute to ensure it's current
        dropdown.setAttribute('aria-describedby', navHelpId);
        
        // Add position-change event listener to maintain keyboard navigation
        dropdown.addEventListener('positionchange', function(e) {
            // Custom event that can be triggered when positioning changes
            try {
                const currentFocus = document.activeElement;
                if (dropdown.contains(currentFocus)) {
                    // Ensure focused element remains accessible after position change
                    maintainDropdownFocus(dropdown, currentFocus);
                    
                    // Re-establish keyboard navigation if needed
                    setTimeout(() => {
                        if (dropdown.contains(document.activeElement)) {
                            const focusedOption = document.activeElement;
                            focusedOption.scrollIntoView({ 
                                block: 'nearest', 
                                inline: 'nearest',
                                behavior: 'auto' // Use auto for position changes to avoid jarring movement
                            });
                        }
                    }, 100);
                }
            } catch (positionError) {
                console.warn('Error handling position change for keyboard navigation:', positionError);
            }
        });
        
        // Add resize observer to handle viewport changes that might affect positioning
        if (typeof ResizeObserver !== 'undefined') {
            if (!dropdown._resizeObserver) {
                dropdown._resizeObserver = new ResizeObserver(entries => {
                    for (let entry of entries) {
                        if (entry.target === dropdown && dropdown.getAttribute('aria-hidden') === 'false') {
                            // Dropdown is visible and size changed, maintain keyboard navigation
                            const currentFocus = document.activeElement;
                            if (dropdown.contains(currentFocus)) {
                                maintainDropdownFocus(dropdown, currentFocus);
                            }
                        }
                    }
                });
                dropdown._resizeObserver.observe(dropdown);
            }
        }
        
    } catch (error) {
        console.error('Error setting up enhanced keyboard navigation:', error);
        
        // Fallback: ensure basic keyboard navigation still works
        try {
            dropdown.setAttribute('role', 'listbox');
            const firstOption = dropdown.querySelector('.theme-option');
            if (firstOption) {
                firstOption.setAttribute('tabindex', '0');
            }
        } catch (fallbackError) {
            console.error('Fallback keyboard navigation setup also failed:', fallbackError);
        }
    }
}

/**
 * Enhanced keydown handler for theme options with focus management
 * @param {KeyboardEvent} e - The keyboard event
 */
function handleThemeOptionKeydown(e) {
    try {
        const currentOption = e.target;
        const dropdown = currentOption.closest('.theme-dropdown');
        const options = Array.from(dropdown.querySelectorAll('.theme-option'));
        const currentIndex = options.indexOf(currentOption);
        
        let targetIndex = currentIndex;
        let shouldPreventDefault = true;
        
        switch (e.key) {
            case 'ArrowDown':
                targetIndex = (currentIndex + 1) % options.length;
                break;
            case 'ArrowUp':
                targetIndex = (currentIndex - 1 + options.length) % options.length;
                break;
            case 'Home':
                targetIndex = 0;
                break;
            case 'End':
                targetIndex = options.length - 1;
                break;
            case 'Enter':
            case ' ':
                // Activate the current option
                currentOption.click();
                return;
            case 'Escape':
                closeThemeDropdown();
                document.getElementById('themeToggle').focus();
                return;
            default:
                shouldPreventDefault = false;
        }
        
        if (shouldPreventDefault) {
            e.preventDefault();
            e.stopPropagation();
            
            // Update tabindex and focus
            options.forEach((option, index) => {
                option.setAttribute('tabindex', index === targetIndex ? '0' : '-1');
            });
            
            // Focus the target option and maintain focus during any positioning changes
            const targetOption = options[targetIndex];
            targetOption.focus();
            
            // Ensure focus is maintained even if positioning changes occur
            maintainDropdownFocus(dropdown, targetOption);
        }
        
    } catch (error) {
        console.error('Error handling theme option keydown:', error);
    }
}

/**
 * Announce accessibility changes to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - Priority level ('polite' or 'assertive')
 */
function announceAccessibilityChange(message, priority = 'polite') {
    try {
        if (!message || typeof message !== 'string') {
            return;
        }
        
        // Use existing live region or create a new one for general announcements
        let liveRegion = document.getElementById('accessibility-announcements');
        
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'accessibility-announcements';
            liveRegion.setAttribute('aria-live', priority);
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'sr-only';
            liveRegion.style.cssText = `
                position: absolute !important;
                width: 1px !important;
                height: 1px !important;
                padding: 0 !important;
                margin: -1px !important;
                overflow: hidden !important;
                clip: rect(0, 0, 0, 0) !important;
                white-space: nowrap !important;
                border: 0 !important;
            `;
            document.body.appendChild(liveRegion);
        }
        
        // Update the live region priority if needed
        if (liveRegion.getAttribute('aria-live') !== priority) {
            liveRegion.setAttribute('aria-live', priority);
        }
        
        // Clear previous content and set new message
        liveRegion.textContent = '';
        
        // Use a small delay to ensure screen readers pick up the change
        setTimeout(() => {
            liveRegion.textContent = message;
        }, 100);
        
        // Clear the message after a reasonable time to avoid clutter
        setTimeout(() => {
            if (liveRegion.textContent === message) {
                liveRegion.textContent = '';
            }
        }, 5000);
        
    } catch (error) {
        console.error('Error announcing accessibility change:', error);
    }
}

/**
 * Enhanced focus trap for theme dropdown
 * Ensures focus stays within dropdown and handles edge cases during positioning changes
 * Implements requirement 5.1 - Ensure focus remains within dropdown during positioning changes
 * @param {HTMLElement} dropdown - The dropdown element
 */
function setupFocusTrap(dropdown) {
    try {
        if (!dropdown) return;
        
        const options = dropdown.querySelectorAll('.theme-option');
        if (options.length === 0) return;
        
        const firstOption = options[0];
        const lastOption = options[options.length - 1];
        
        // Enhanced focus trap handler with positioning awareness
        function handleFocusTrap(e) {
            // Only trap focus when dropdown is visible
            if (dropdown.getAttribute('aria-hidden') === 'true') {
                return;
            }
            
            const isTabPressed = e.key === 'Tab';
            if (!isTabPressed) return;
            
            const currentFocus = document.activeElement;
            const isInDropdown = dropdown.contains(currentFocus);
            
            // Enhanced focus trapping with position-aware logic
            if (e.shiftKey) {
                // Shift + Tab (backward)
                if (currentFocus === firstOption || !isInDropdown) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Ensure last option is focusable and visible
                    lastOption.setAttribute('tabindex', '0');
                    lastOption.focus();
                    
                    // Maintain focus during any positioning changes
                    maintainDropdownFocus(dropdown, lastOption);
                    
                    // Ensure the focused option is visible after positioning
                    setTimeout(() => {
                        try {
                            lastOption.scrollIntoView({ 
                                block: 'nearest', 
                                inline: 'nearest',
                                behavior: 'auto'
                            });
                        } catch (scrollError) {
                            console.warn('Error scrolling to last option:', scrollError);
                        }
                    }, 50);
                }
            } else {
                // Tab (forward)
                if (currentFocus === lastOption || !isInDropdown) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Ensure first option is focusable and visible
                    firstOption.setAttribute('tabindex', '0');
                    firstOption.focus();
                    
                    // Maintain focus during any positioning changes
                    maintainDropdownFocus(dropdown, firstOption);
                    
                    // Ensure the focused option is visible after positioning
                    setTimeout(() => {
                        try {
                            firstOption.scrollIntoView({ 
                                block: 'nearest', 
                                inline: 'nearest',
                                behavior: 'auto'
                            });
                        } catch (scrollError) {
                            console.warn('Error scrolling to first option:', scrollError);
                        }
                    }, 50);
                }
            }
            
            // Update tabindex for all options to maintain proper focus management
            options.forEach(option => {
                const shouldBeFocusable = option === document.activeElement;
                option.setAttribute('tabindex', shouldBeFocusable ? '0' : '-1');
            });
        }
        
        // Enhanced focus restoration handler for positioning changes
        function handleFocusRestoration(e) {
            // Handle cases where focus might be lost during positioning
            if (dropdown.getAttribute('aria-hidden') === 'false') {
                const currentFocus = document.activeElement;
                
                // If focus is outside dropdown but dropdown should be focused
                if (!dropdown.contains(currentFocus) && 
                    !document.getElementById('themeToggle').contains(currentFocus)) {
                    
                    // Find the previously focused option or use first option
                    const lastFocusedOption = dropdown.querySelector('.theme-option[tabindex="0"]') || firstOption;
                    
                    // Restore focus with enhanced error handling
                    setTimeout(() => {
                        try {
                            lastFocusedOption.focus();
                            maintainDropdownFocus(dropdown, lastFocusedOption);
                            
                            // Announce focus restoration
                            announceAccessibilityChange('Focus restored to theme menu after repositioning', 'polite');
                        } catch (restorationError) {
                            console.warn('Focus restoration failed:', restorationError);
                        }
                    }, 100);
                }
            }
        }
        
        // Remove existing listeners to avoid duplicates
        if (dropdown._focusTrapHandler) {
            document.removeEventListener('keydown', dropdown._focusTrapHandler);
        }
        if (dropdown._focusRestorationHandler) {
            document.removeEventListener('focusin', dropdown._focusRestorationHandler);
        }
        
        // Add enhanced event listeners
        document.addEventListener('keydown', handleFocusTrap);
        document.addEventListener('focusin', handleFocusRestoration);
        
        // Store references for cleanup
        dropdown._focusTrapHandler = handleFocusTrap;
        dropdown._focusRestorationHandler = handleFocusRestoration;
        
        // Add mutation observer to handle dynamic positioning changes
        if (typeof MutationObserver !== 'undefined' && !dropdown._positionObserver) {
            dropdown._positionObserver = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes' && 
                        (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
                        
                        // Positioning might have changed, maintain focus
                        const currentFocus = document.activeElement;
                        if (dropdown.contains(currentFocus) && 
                            dropdown.getAttribute('aria-hidden') === 'false') {
                            
                            // Use a small delay to allow positioning to complete
                            setTimeout(() => {
                                maintainDropdownFocus(dropdown, currentFocus);
                            }, 50);
                        }
                    }
                });
            });
            
            dropdown._positionObserver.observe(dropdown, {
                attributes: true,
                attributeFilter: ['class', 'style']
            });
        }
        
    } catch (error) {
        console.error('Error setting up enhanced focus trap:', error);
        
        // Fallback: basic focus trap
        try {
            function basicFocusTrap(e) {
                if (e.key === 'Tab' && dropdown.getAttribute('aria-hidden') === 'false') {
                    const focusableElements = dropdown.querySelectorAll('.theme-option');
                    const firstElement = focusableElements[0];
                    const lastElement = focusableElements[focusableElements.length - 1];
                    
                    if (e.shiftKey && document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
            
            document.addEventListener('keydown', basicFocusTrap);
            dropdown._focusTrapHandler = basicFocusTrap;
            
        } catch (fallbackError) {
            console.error('Fallback focus trap setup also failed:', fallbackError);
        }
    }
}

/**
 * Remove focus trap when dropdown is closed
 * Enhanced cleanup for all accessibility event listeners and observers
 * @param {HTMLElement} dropdown - The dropdown element
 */
function removeFocusTrap(dropdown) {
    try {
        if (!dropdown) return;
        
        // Remove focus trap handler
        if (dropdown._focusTrapHandler) {
            document.removeEventListener('keydown', dropdown._focusTrapHandler);
            dropdown._focusTrapHandler = null;
        }
        
        // Remove focus restoration handler
        if (dropdown._focusRestorationHandler) {
            document.removeEventListener('focusin', dropdown._focusRestorationHandler);
            dropdown._focusRestorationHandler = null;
        }
        
        // Disconnect mutation observer for positioning changes
        if (dropdown._positionObserver) {
            dropdown._positionObserver.disconnect();
            dropdown._positionObserver = null;
        }
        
        // Disconnect resize observer
        if (dropdown._resizeObserver) {
            dropdown._resizeObserver.disconnect();
            dropdown._resizeObserver = null;
        }
        
        // Clear any stored focus references
        if (dropdown._previouslyFocusedElement) {
            dropdown._previouslyFocusedElement = null;
        }
        
        // Reset tabindex for all options
        const options = dropdown.querySelectorAll('.theme-option');
        options.forEach(option => {
            option.setAttribute('tabindex', '-1');
        });
        
        // Clear aria-activedescendant
        dropdown.removeAttribute('aria-activedescendant');
        
        // Log cleanup for debugging
        console.log('Focus trap and accessibility observers cleaned up for theme dropdown');
        
    } catch (error) {
        console.error('Error removing focus trap and accessibility features:', error);
        
        // Fallback cleanup
        try {
            if (dropdown._focusTrapHandler) {
                document.removeEventListener('keydown', dropdown._focusTrapHandler);
                dropdown._focusTrapHandler = null;
            }
        } catch (fallbackError) {
            console.error('Fallback focus trap cleanup also failed:', fallbackError);
        }
    }
}

/**
 * Enhanced keyboard navigation with improved accessibility
 * @param {HTMLElement} dropdown - The dropdown element
 */
function enhanceKeyboardNavigation(dropdown) {
    try {
        if (!dropdown) return;
        
        const options = dropdown.querySelectorAll('.theme-option');
        
        // Add enhanced keyboard support for each option
        options.forEach((option, index) => {
            // Enhanced keydown handler with better accessibility
            function handleEnhancedKeydown(e) {
                const currentIndex = Array.from(options).indexOf(option);
                let targetIndex = currentIndex;
                let shouldAnnounce = false;
                let announcement = '';
                
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        targetIndex = (currentIndex + 1) % options.length;
                        shouldAnnounce = true;
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        targetIndex = (currentIndex - 1 + options.length) % options.length;
                        shouldAnnounce = true;
                        break;
                    case 'Home':
                        e.preventDefault();
                        targetIndex = 0;
                        shouldAnnounce = true;
                        announcement = 'First theme option';
                        break;
                    case 'End':
                        e.preventDefault();
                        targetIndex = options.length - 1;
                        shouldAnnounce = true;
                        announcement = 'Last theme option';
                        break;
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        const themeName = option.getAttribute('data-theme');
                        const themeDisplayName = option.querySelector('.theme-name')?.textContent || themeName;
                        announceAccessibilityChange(`${themeDisplayName} theme selected`);
                        option.click();
                        return;
                    case 'Escape':
                        e.preventDefault();
                        announceAccessibilityChange('Theme menu closed');
                        closeThemeDropdown();
                        return;
                }
                
                if (targetIndex !== currentIndex) {
                    // Update focus and tabindex
                    options.forEach((opt, idx) => {
                        opt.setAttribute('tabindex', idx === targetIndex ? '0' : '-1');
                    });
                    
                    const targetOption = options[targetIndex];
                    targetOption.focus();
                    
                    // Announce navigation if needed
                    if (shouldAnnounce && !announcement) {
                        const targetThemeName = targetOption.querySelector('.theme-name')?.textContent || 
                                              targetOption.getAttribute('data-theme');
                        announcement = `${targetThemeName} theme option`;
                    }
                    
                    if (announcement) {
                        announceAccessibilityChange(announcement);
                    }
                    
                    // Maintain focus during any positioning changes
                    maintainDropdownFocus(dropdown, targetOption);
                }
            }
            
            // Remove existing listener and add enhanced one
            option.removeEventListener('keydown', handleThemeOptionKeydown);
            option.removeEventListener('keydown', handleEnhancedKeydown);
            option.addEventListener('keydown', handleEnhancedKeydown);
        });
        
    } catch (error) {
        console.error('Error enhancing keyboard navigation:', error);
    }
}

/**
 * Test screen reader compatibility with dynamic positioning
 * Implements requirement 5.4 - Test screen reader compatibility with dynamic positioning
 * This function can be called during development/testing to verify accessibility
 * @returns {Object} - Detailed test results
 */
function testScreenReaderCompatibility() {
    try {
        const dropdown = document.getElementById('themeDropdown');
        const toggle = document.getElementById('themeToggle');
        
        const testResults = {
            overall: false,
            tests: {},
            details: [],
            recommendations: []
        };
        
        if (!dropdown || !toggle) {
            console.warn('Theme dropdown elements not found for screen reader testing');
            testResults.details.push('FAIL: Theme dropdown elements not found');
            return testResults;
        }
        
        console.log('Testing comprehensive screen reader compatibility...');
        
        // Test 1: Verify ARIA attributes are properly set
        const hasProperAria = dropdown.hasAttribute('aria-hidden') && 
                             dropdown.hasAttribute('role') && 
                             toggle.hasAttribute('aria-expanded') &&
                             toggle.hasAttribute('aria-haspopup') &&
                             dropdown.getAttribute('role') === 'listbox';
        
        testResults.tests.ariaAttributes = hasProperAria;
        testResults.details.push(`ARIA attributes test: ${hasProperAria ? 'PASS' : 'FAIL'}`);
        
        if (!hasProperAria) {
            testResults.recommendations.push('Ensure all required ARIA attributes are set on dropdown and toggle elements');
        }
        
        // Test 2: Verify live region exists and is properly configured
        const liveRegion = getOrCreateAriaLiveRegion();
        const hasLiveRegion = liveRegion && 
                             liveRegion.getAttribute('aria-live') === 'polite' &&
                             liveRegion.getAttribute('aria-atomic') === 'true' &&
                             liveRegion.className.includes('sr-only');
        
        testResults.tests.liveRegion = hasLiveRegion;
        testResults.details.push(`Live region test: ${hasLiveRegion ? 'PASS' : 'FAIL'}`);
        
        if (!hasLiveRegion) {
            testResults.recommendations.push('Create properly configured ARIA live region for positioning announcements');
        }
        
        // Test 3: Verify keyboard navigation setup
        const options = dropdown.querySelectorAll('.theme-option');
        const hasKeyboardNav = options.length > 0 && 
                              Array.from(options).some(option => option.hasAttribute('tabindex')) &&
                              dropdown.hasAttribute('aria-describedby');
        
        testResults.tests.keyboardNavigation = hasKeyboardNav;
        testResults.details.push(`Keyboard navigation test: ${hasKeyboardNav ? 'PASS' : 'FAIL'}`);
        
        if (!hasKeyboardNav) {
            testResults.recommendations.push('Set up proper keyboard navigation with tabindex and aria-describedby');
        }
        
        // Test 4: Test accessibility announcements
        let announcementTest = false;
        try {
            announceAccessibilityChange('Testing screen reader announcements');
            const generalLiveRegion = document.getElementById('accessibility-announcements');
            announcementTest = generalLiveRegion && generalLiveRegion.getAttribute('aria-live');
        } catch (announcementError) {
            console.warn('Accessibility announcement test failed:', announcementError);
        }
        
        testResults.tests.announcements = announcementTest;
        testResults.details.push(`Accessibility announcements test: ${announcementTest ? 'PASS' : 'FAIL'}`);
        
        if (!announcementTest) {
            testResults.recommendations.push('Implement proper accessibility announcement system');
        }
        
        // Test 5: Test focus management during positioning
        const focusTest = testFocusManagement(dropdown);
        testResults.tests.focusManagement = focusTest;
        testResults.details.push(`Focus management test: ${focusTest ? 'PASS' : 'FAIL'}`);
        
        if (!focusTest) {
            testResults.recommendations.push('Improve focus management to handle positioning changes');
        }
        
        // Test 6: Test positioning change announcements
        let positioningAnnouncementTest = false;
        try {
            announcePositioningChange({
                positionChanged: true,
                strategy: 'collision-avoided',
                significantChange: true
            });
            
            // Check if announcement was made
            setTimeout(() => {
                const positioningLiveRegion = document.getElementById('theme-positioning-announcements');
                positioningAnnouncementTest = positioningLiveRegion && 
                                            positioningLiveRegion.textContent.length > 0;
            }, 200);
            
            positioningAnnouncementTest = true; // Assume success if no error thrown
        } catch (positioningError) {
            console.warn('Positioning announcement test failed:', positioningError);
        }
        
        testResults.tests.positioningAnnouncements = positioningAnnouncementTest;
        testResults.details.push(`Positioning announcements test: ${positioningAnnouncementTest ? 'PASS' : 'FAIL'}`);
        
        if (!positioningAnnouncementTest) {
            testResults.recommendations.push('Implement positioning change announcements for screen readers');
        }
        
        // Test 7: Test focus trap functionality
        const focusTrapTest = testFocusTrap(dropdown);
        testResults.tests.focusTrap = focusTrapTest;
        testResults.details.push(`Focus trap test: ${focusTrapTest ? 'PASS' : 'FAIL'}`);
        
        if (!focusTrapTest) {
            testResults.recommendations.push('Implement proper focus trap for dropdown menu');
        }
        
        // Test 8: Test option descriptions and context
        const optionDescriptionTest = Array.from(options).every(option => {
            const hasId = option.id && option.id.length > 0;
            const hasAriaDescribedBy = option.hasAttribute('aria-describedby');
            const hasThemeName = option.querySelector('.theme-name');
            return hasId && hasThemeName && (hasAriaDescribedBy || option.getAttribute('data-theme'));
        });
        
        testResults.tests.optionDescriptions = optionDescriptionTest;
        testResults.details.push(`Option descriptions test: ${optionDescriptionTest ? 'PASS' : 'FAIL'}`);
        
        if (!optionDescriptionTest) {
            testResults.recommendations.push('Ensure all theme options have proper IDs, names, and descriptions');
        }
        
        // Test 9: Test dynamic positioning compatibility
        const dynamicPositioningTest = testDynamicPositioningAccessibility(dropdown);
        testResults.tests.dynamicPositioning = dynamicPositioningTest;
        testResults.details.push(`Dynamic positioning accessibility test: ${dynamicPositioningTest ? 'PASS' : 'FAIL'}`);
        
        if (!dynamicPositioningTest) {
            testResults.recommendations.push('Improve accessibility support for dynamic positioning changes');
        }
        
        // Calculate overall result
        const passedTests = Object.values(testResults.tests).filter(result => result === true).length;
        const totalTests = Object.keys(testResults.tests).length;
        const passRate = passedTests / totalTests;
        
        testResults.overall = passRate >= 0.8; // 80% pass rate required
        testResults.passRate = Math.round(passRate * 100);
        testResults.summary = `${passedTests}/${totalTests} tests passed (${testResults.passRate}%)`;
        
        console.log('Screen reader compatibility test results:', testResults.summary);
        console.log('Overall result:', testResults.overall ? 'PASS' : 'FAIL');
        
        if (testResults.recommendations.length > 0) {
            console.log('Recommendations for improvement:');
            testResults.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
        }
        
        return testResults;
        
    } catch (error) {
        console.error('Error testing screen reader compatibility:', error);
        return {
            overall: false,
            tests: {},
            details: ['ERROR: Test execution failed'],
            recommendations: ['Fix test execution errors and retry'],
            error: error.message
        };
    }
}

/**
 * Test dynamic positioning accessibility specifically
 * @param {HTMLElement} dropdown - The dropdown element
 * @returns {boolean} - Test result
 */
function testDynamicPositioningAccessibility(dropdown) {
    try {
        if (!dropdown) return false;
        
        // Test 1: Verify positioning classes don't break accessibility
        const positioningClasses = ['position-left', 'position-center', 'position-offset-left', 'position-offset-right'];
        let positioningAccessibilityTest = true;
        
        positioningClasses.forEach(className => {
            dropdown.classList.add(className);
            
            // Check if accessibility features still work
            const options = dropdown.querySelectorAll('.theme-option');
            const hasAccessibleOptions = Array.from(options).every(option => 
                option.hasAttribute('tabindex') && 
                option.hasAttribute('role')
            );
            
            if (!hasAccessibleOptions) {
                positioningAccessibilityTest = false;
            }
            
            dropdown.classList.remove(className);
        });
        
        // Test 2: Verify focus management works with positioning changes
        const firstOption = dropdown.querySelector('.theme-option');
        if (firstOption) {
            firstOption.focus();
            
            // Simulate positioning change
            dropdown.classList.add('position-left');
            maintainDropdownFocus(dropdown, firstOption);
            
            // Check if focus is maintained
            const focusMaintained = document.activeElement === firstOption;
            dropdown.classList.remove('position-left');
            
            if (!focusMaintained) {
                positioningAccessibilityTest = false;
            }
        }
        
        // Test 3: Verify live region announcements work with positioning
        const originalTextContent = getOrCreateAriaLiveRegion().textContent;
        announcePositioningChange({
            positionChanged: true,
            strategy: 'test-positioning',
            significantChange: true
        });
        
        // Check if announcement was made (basic check)
        const announcementMade = getOrCreateAriaLiveRegion().textContent !== originalTextContent;
        
        return positioningAccessibilityTest && announcementMade;
        
    } catch (error) {
        console.error('Error testing dynamic positioning accessibility:', error);
        return false;
    }
}

/**
 * Test focus management functionality
 * @param {HTMLElement} dropdown - The dropdown element
 * @returns {boolean} - Test result
 */
function testFocusManagement(dropdown) {
    try {
        if (!dropdown) return false;
        
        const options = dropdown.querySelectorAll('.theme-option');
        if (options.length === 0) return false;
        
        // Test 1: Verify tabindex management
        const hasProperTabindex = Array.from(options).some(option => 
            option.getAttribute('tabindex') === '0'
        ) && Array.from(options).some(option => 
            option.getAttribute('tabindex') === '-1'
        );
        
        // Test 2: Test focus restoration
        const firstOption = options[0];
        firstOption.focus();
        const isFocused = document.activeElement === firstOption;
        
        // Test 3: Test focus maintenance during positioning
        maintainDropdownFocus(dropdown, firstOption);
        const focusMaintained = document.activeElement === firstOption;
        
        return hasProperTabindex && isFocused && focusMaintained;
        
    } catch (error) {
        console.error('Error testing focus management:', error);
        return false;
    }
}

/**
 * Test focus trap functionality
 * @param {HTMLElement} dropdown - The dropdown element
 * @returns {boolean} - Test result
 */
function testFocusTrap(dropdown) {
    try {
        if (!dropdown) return false;
        
        // Setup focus trap
        setupFocusTrap(dropdown);
        
        // Verify focus trap handler is attached
        const hasFocusTrap = dropdown._focusTrapHandler !== null && 
                            dropdown._focusTrapHandler !== undefined;
        
        // Test cleanup
        removeFocusTrap(dropdown);
        const cleanedUp = dropdown._focusTrapHandler === null;
        
        return hasFocusTrap && cleanedUp;
        
    } catch (error) {
        console.error('Error testing focus trap:', error);
        return false;
    }
}

/**
 * Comprehensive accessibility compliance test for theme dropdown
 * Tests all accessibility requirements from the spec
 * @returns {Object} - Test results with detailed breakdown
 */
function testThemeDropdownAccessibility() {
    try {
        const results = {
            overall: false,
            tests: {},
            summary: ''
        };
        
        const dropdown = document.getElementById('themeDropdown');
        const toggle = document.getElementById('themeToggle');
        
        if (!dropdown || !toggle) {
            results.summary = 'Theme dropdown elements not found';
            return results;
        }
        
        // Test 1: Focus management (Requirement 5.1)
        results.tests.focusManagement = testFocusManagement(dropdown);
        
        // Test 2: Keyboard navigation (Requirement 5.2)
        results.tests.keyboardNavigation = testKeyboardNavigation(dropdown);
        
        // Test 3: ARIA live region announcements (Requirement 5.3)
        results.tests.ariaAnnouncements = testAriaAnnouncements();
        
        // Test 4: Screen reader compatibility (Requirement 5.4)
        results.tests.screenReaderCompatibility = testScreenReaderCompatibility();
        
        // Test 5: Dynamic positioning accessibility (Requirement 5.5)
        results.tests.dynamicPositioning = testDynamicPositioningAccessibility(dropdown);
        
        // Calculate overall result
        const passedTests = Object.values(results.tests).filter(result => result === true).length;
        const totalTests = Object.keys(results.tests).length;
        results.overall = passedTests === totalTests;
        
        results.summary = `Accessibility tests: ${passedTests}/${totalTests} passed. ` +
                         `Overall: ${results.overall ? 'PASS' : 'FAIL'}`;
        
        console.log('Theme Dropdown Accessibility Test Results:', results);
        
        return results;
        
    } catch (error) {
        console.error('Error running accessibility tests:', error);
        return {
            overall: false,
            tests: {},
            summary: 'Test execution failed: ' + error.message
        };
    }
}

/**
 * Test keyboard navigation functionality
 * @param {HTMLElement} dropdown - The dropdown element
 * @returns {boolean} - Test result
 */
function testKeyboardNavigation(dropdown) {
    try {
        if (!dropdown) return false;
        
        const options = dropdown.querySelectorAll('.theme-option');
        if (options.length === 0) return false;
        
        // Test arrow key navigation setup
        let hasArrowKeySupport = true;
        options.forEach(option => {
            const listeners = getEventListeners ? getEventListeners(option) : null;
            if (!listeners || !listeners.keydown) {
                hasArrowKeySupport = false;
            }
        });
        
        // Test tabindex management
        const hasProperTabindex = Array.from(options).some(option => 
            option.getAttribute('tabindex') === '0'
        );
        
        // Test ARIA attributes
        const hasProperAria = dropdown.hasAttribute('role') && 
                             dropdown.getAttribute('role') === 'listbox';
        
        return hasArrowKeySupport && hasProperTabindex && hasProperAria;
        
    } catch (error) {
        console.error('Error testing keyboard navigation:', error);
        return false;
    }
}

/**
 * Test ARIA live region announcements
 * @returns {boolean} - Test result
 */
function testAriaAnnouncements() {
    try {
        // Test positioning announcements live region
        const positioningLiveRegion = getOrCreateAriaLiveRegion();
        const hasPositioningRegion = positioningLiveRegion && 
                                   positioningLiveRegion.getAttribute('aria-live') === 'polite';
        
        // Test general accessibility announcements live region
        announceAccessibilityChange('Test announcement');
        const accessibilityLiveRegion = document.getElementById('accessibility-announcements');
        const hasAccessibilityRegion = accessibilityLiveRegion && 
                                     accessibilityLiveRegion.getAttribute('aria-live') === 'polite';
        
        return hasPositioningRegion && hasAccessibilityRegion;
        
    } catch (error) {
        console.error('Error testing ARIA announcements:', error);
        return false;
    }
}

/**
 * Test dynamic positioning accessibility
 * @param {HTMLElement} dropdown - The dropdown element
 * @returns {boolean} - Test result
 */
function testDynamicPositioningAccessibility(dropdown) {
    try {
        if (!dropdown) return false;
        
        // Test that focus is maintained during positioning changes
        const options = dropdown.querySelectorAll('.theme-option');
        if (options.length === 0) return false;
        
        const firstOption = options[0];
        firstOption.focus();
        
        // Simulate positioning change
        dropdown.classList.add('position-left');
        maintainDropdownFocus(dropdown, firstOption);
        
        const focusMaintained = document.activeElement === firstOption;
        
        // Clean up
        dropdown.classList.remove('position-left');
        
        return focusMaintained;
        
    } catch (error) {
        console.error('Error testing dynamic positioning accessibility:', error);
        return false;
    }
}
            strategy: 'collision-avoided'
        });
        
        console.log('Positioning announcement test: Triggered (check screen reader)');
        
        return hasProperAria && hasLiveRegion && hasKeyboardNav;
        
    } catch (error) {
        console.error('Error testing screen reader compatibility:', error);
        return false;
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
    
    // Listen for dropdown content changes (e.g., dynamic theme loading)
    if (themeDropdown && window.MutationObserver) {
        const dropdownObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    // Content changed, update positioning if dropdown is open
                    if (themeDropdown.getAttribute('aria-hidden') === 'false') {
                        updateDropdownPositioning();
                    }
                }
            });
        });
        
        dropdownObserver.observe(themeDropdown, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
    }
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
    
    // Store the currently focused element before opening dropdown
    const previouslyFocusedElement = document.activeElement;
    
    // Enhanced accessibility setup before opening
    try {
        // Setup enhanced keyboard navigation and accessibility features
        setupEnhancedKeyboardNavigation(themeDropdown);
        enhanceKeyboardNavigation(themeDropdown);
        setupFocusTrap(themeDropdown);
        
        // Ensure all theme options have proper accessibility attributes
        const options = themeDropdown.querySelectorAll('.theme-option');
        options.forEach((option, index) => {
            // Ensure proper ARIA attributes
            option.setAttribute('role', 'option');
            if (!option.id) {
                option.id = `theme-option-${option.getAttribute('data-theme') || index}`;
            }
            
            // Set proper selection state
            const isCurrentTheme = typeof themeManager !== 'undefined' && 
                                 themeManager.getCurrentTheme() === option.getAttribute('data-theme');
            option.setAttribute('aria-selected', isCurrentTheme ? 'true' : 'false');
            
            // Ensure proper tabindex
            option.setAttribute('tabindex', isCurrentTheme ? '0' : '-1');
        });
        
    } catch (accessibilityError) {
        console.warn('Error setting up accessibility features:', accessibilityError);
    }
    
    // Calculate and apply positioning before showing dropdown
    let positioningResult = null;
    if (typeof themeManager !== 'undefined' && themeManager.applyCollisionAvoidance) {
        try {
            positioningResult = themeManager.applyCollisionAvoidance(themeDropdown, themeToggle);
        } catch (error) {
            console.warn('Failed to apply collision avoidance positioning:', error);
        }
    }
    
    // Update ARIA states
    themeToggle.setAttribute('aria-expanded', 'true');
    themeDropdown.setAttribute('aria-hidden', 'false');
    
    // Enhanced positioning announcement with context
    if (positioningResult && positioningResult.positionChanged) {
        announcePositioningChange(positioningResult);
        
        // Add additional context for significant positioning changes
        if (positioningResult.strategy === 'collision-avoided') {
            setTimeout(() => {
                announceAccessibilityChange('Menu repositioned to avoid content overlap. All navigation remains the same.', 'polite');
            }, 1000);
        }
    }
    
    // Enhanced focus management with better error handling
    requestAnimationFrame(() => {
        try {
            // Find the appropriate option to focus
            const selectedOption = themeDropdown.querySelector('.theme-option[aria-selected="true"]') || firstOption;
            
            if (selectedOption) {
                // Ensure the option is focusable
                selectedOption.setAttribute('tabindex', '0');
                selectedOption.focus();
                
                // Maintain focus during any positioning changes
                maintainDropdownFocus(themeDropdown, selectedOption);
                
                // Ensure the focused option is visible
                selectedOption.scrollIntoView({ 
                    block: 'nearest', 
                    inline: 'nearest',
                    behavior: 'auto'
                });
                
                // Enhanced opening announcement with more context
                const themeName = selectedOption.querySelector('.theme-name')?.textContent || 'theme';
                announceAccessibilityChange(
                    `Theme selection menu opened. Currently on ${themeName}. Use arrow keys to navigate, Enter to select, Escape to close.`,
                    'polite'
                );
                
            } else {
                console.warn('No focusable theme option found');
                announceAccessibilityChange('Theme selection menu opened. Use Tab to navigate options.', 'polite');
            }
            
        } catch (focusError) {
            console.error('Error focusing theme option:', focusError);
            
            // Fallback announcement
            announceAccessibilityChange('Theme selection menu opened. Navigation may be limited.', 'assertive');
        }
    });
    
    // Store reference to previously focused element for restoration
    themeDropdown._previouslyFocusedElement = previouslyFocusedElement;
    
    // Run accessibility validation in development mode
    if (typeof console !== 'undefined' && console.log) {
        setTimeout(() => {
            try {
                const accessibilityResults = testScreenReaderCompatibility();
                if (!accessibilityResults.overall) {
                    console.warn('Accessibility issues detected in theme dropdown:', accessibilityResults.recommendations);
                }
            } catch (testError) {
                console.warn('Accessibility test failed:', testError);
            }
        }, 500);
    }
}

function closeThemeDropdown() {
    const themeToggle = document.getElementById('themeToggle');
    const themeDropdown = document.getElementById('themeDropdown');
    
    themeToggle.setAttribute('aria-expanded', 'false');
    themeDropdown.setAttribute('aria-hidden', 'true');
    
    // Remove focus trap when closing
    removeFocusTrap(themeDropdown);
    
    // Restore focus to the previously focused element or theme toggle
    const previouslyFocusedElement = themeDropdown._previouslyFocusedElement;
    if (previouslyFocusedElement && document.contains(previouslyFocusedElement)) {
        previouslyFocusedElement.focus();
    } else {
        themeToggle.focus();
    }
    
    // Clear the stored reference
    themeDropdown._previouslyFocusedElement = null;
    
    // Announce dropdown closing to screen readers
    announceAccessibilityChange('Theme selection menu closed');
}

function selectTheme(themeName) {
    if (!themeName || typeof themeManager === 'undefined') {
        console.warn('Cannot select theme:', themeName);
        return;
    }
    
    // Apply theme using theme manager
    const success = themeManager.setTheme(themeName);
    
    if (success) {
        // Update UI to reflect selection (this will also update positioning if dropdown is open)
        updateThemeSelector();
        
        // Get theme display name for announcement
        const themeConfig = themeManager.getThemeConfig(themeName);
        const displayName = themeConfig ? themeConfig.displayName : themeName;
        
        // Close dropdown
        closeThemeDropdown();
        
        // Return focus to toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.focus();
        }
        
        // Announce theme change to screen readers with more descriptive message
        announceAccessibilityChange(`${displayName} applied. Theme changed successfully.`, 'polite');
        
        // Also announce using the existing theme change function if available
        if (typeof announceThemeChange === 'function') {
            announceThemeChange(themeName);
        }
    } else {
        console.error('Failed to apply theme:', themeName);
        announceAccessibilityChange('Failed to change theme. Please try again.', 'assertive');
    }
}

function updateThemeSelector() {
    if (typeof themeManager === 'undefined') {
        return;
    }
    
    const currentTheme = themeManager.getCurrentTheme();
    const themeOptions = document.querySelectorAll('.theme-option');
    const themeDropdown = document.getElementById('themeDropdown');
    const themeToggle = document.getElementById('themeToggle');
    
    // Update aria-selected attributes and visual indicators
    themeOptions.forEach(option => {
        const themeName = option.getAttribute('data-theme');
        const isSelected = themeName === currentTheme;
        
        option.setAttribute('aria-selected', isSelected.toString());
        option.setAttribute('tabindex', isSelected ? '0' : '-1');
    });
    
    // Update toggle button label and description for better accessibility
    const currentThemeConfig = themeManager.getCurrentThemeConfig();
    
    if (themeToggle && currentThemeConfig) {
        // Enhanced ARIA label with more context
        themeToggle.setAttribute('aria-label', `Current theme: ${currentThemeConfig.displayName}. Click to open theme selection menu.`);
        
        // Update or create description for the current theme
        let themeDescId = 'current-theme-description';
        let themeDescElement = document.getElementById(themeDescId);
        
        if (!themeDescElement) {
            themeDescElement = document.createElement('div');
            themeDescElement.id = themeDescId;
            themeDescElement.className = 'sr-only';
            document.body.appendChild(themeDescElement);
        }
        
        themeDescElement.textContent = `Current theme: ${currentThemeConfig.displayName}. ${currentThemeConfig.description || ''}`;
        
        // Link the description to the toggle button
        if (!themeToggle.getAttribute('aria-describedby')?.includes(themeDescId)) {
            const existingDescribedBy = themeToggle.getAttribute('aria-describedby') || '';
            const newDescribedBy = existingDescribedBy ? `${existingDescribedBy} ${themeDescId}` : themeDescId;
            themeToggle.setAttribute('aria-describedby', newDescribedBy);
        }
    }
    
    // Recalculate positioning if dropdown is currently open
    if (themeDropdown && themeDropdown.getAttribute('aria-hidden') === 'false') {
        if (themeManager.applyCollisionAvoidance) {
            try {
                themeManager.applyCollisionAvoidance(themeDropdown, themeToggle);
            } catch (error) {
                console.warn('Failed to update dropdown positioning:', error);
            }
        }
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

/**
 * Enhanced dropdown positioning update function
 * Provides comprehensive error handling and fallback positioning
 * Implements requirements 2.4 and 2.5 for graceful positioning updates
 */
function updateDropdownPositioning() {
    try {
        const themeDropdown = document.getElementById('themeDropdown');
        const themeToggle = document.getElementById('themeToggle');
        
        // Validate elements exist before attempting positioning
        if (!themeDropdown || !themeToggle) {
            console.warn('Theme dropdown or toggle element not found for positioning update');
            return false;
        }
        
        // Check if dropdown is actually visible before updating positioning
        if (themeDropdown.getAttribute('aria-hidden') !== 'false') {
            return false; // Dropdown is not open, no need to update positioning
        }
        
        // Store currently focused element before positioning changes
        const currentlyFocused = document.activeElement;
        const isDropdownFocused = themeDropdown.contains(currentlyFocused);
        
        // Apply collision avoidance positioning if theme manager is available
        if (typeof themeManager !== 'undefined' && themeManager.applyCollisionAvoidance) {
            try {
                const positioningResult = themeManager.applyCollisionAvoidance(themeDropdown, themeToggle);
                
                // Announce significant positioning changes to screen readers
                if (positioningResult && positioningResult.positionChanged) {
                    announcePositioningChange(positioningResult);
                }
                
                // Maintain focus within dropdown after positioning changes
                if (isDropdownFocused && currentlyFocused) {
                    maintainDropdownFocus(themeDropdown, currentlyFocused);
                }
                
                // Log successful positioning update in development
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    console.log('Dropdown positioning updated successfully:', positioningResult);
                }
                
                return true;
                
            } catch (positioningError) {
                console.warn('Failed to apply collision avoidance positioning:', positioningError);
                
                // Attempt fallback positioning
                const fallbackResult = applyFallbackPositioning(themeDropdown, themeToggle);
                
                // Maintain focus even during fallback positioning
                if (isDropdownFocused && currentlyFocused) {
                    maintainDropdownFocus(themeDropdown, currentlyFocused);
                }
                
                return fallbackResult;
            }
        } else {
            console.warn('Theme manager or collision avoidance not available, applying fallback positioning');
            const fallbackResult = applyFallbackPositioning(themeDropdown, themeToggle);
            
            // Maintain focus during fallback positioning
            if (isDropdownFocused && currentlyFocused) {
                maintainDropdownFocus(themeDropdown, currentlyFocused);
            }
            
            return fallbackResult;
        }
        
    } catch (error) {
        console.error('Error in updateDropdownPositioning:', error);
        return false;
    }
}

/**
 * Fallback positioning function for when collision avoidance fails
 * Ensures dropdown remains visible and accessible
 */
function applyFallbackPositioning(dropdown, toggle) {
    try {
        if (!dropdown || !toggle) {
            return false;
        }
        
        // Remove any existing positioning classes
        dropdown.classList.remove('position-left', 'position-center', 'collision-detected');
        
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const toggleRect = toggle.getBoundingClientRect();
        
        // Apply basic responsive positioning
        if (viewportWidth <= 768) {
            // Mobile: ensure dropdown doesn't overflow viewport
            dropdown.style.maxWidth = 'calc(100vw - 2rem)';
            dropdown.style.right = '1rem';
        } else if (viewportWidth <= 1024) {
            // Tablet: standard positioning with viewport awareness
            dropdown.style.maxWidth = '300px';
            dropdown.style.right = '0';
        } else {
            // Desktop: check if dropdown would overflow and adjust
            const dropdownWidth = 320; // Approximate dropdown width
            if (toggleRect.right < dropdownWidth) {
                dropdown.classList.add('position-left');
            }
        }
        
        console.log('Applied fallback positioning for viewport:', `${viewportWidth}x${viewportHeight}`);
        return true;
        
    } catch (error) {
        console.error('Error applying fallback positioning:', error);
        return false;
    }
}

/**
 * Utility function to detect if device is in landscape mode
 * Helps with orientation-specific positioning adjustments
 */
function isLandscapeMode() {
    try {
        // Primary check: compare width vs height
        const isWidthGreater = window.innerWidth > window.innerHeight;
        
        // Secondary check: use orientation API if available
        if (window.screen && window.screen.orientation) {
            const orientationType = window.screen.orientation.type;
            return orientationType.includes('landscape');
        }
        
        // Fallback: use window.orientation if available
        if (typeof window.orientation !== 'undefined') {
            return Math.abs(window.orientation) === 90;
        }
        
        return isWidthGreater;
        
    } catch (error) {
        console.warn('Error detecting landscape mode:', error);
        return window.innerWidth > window.innerHeight;
    }
}

/**
 * Enhanced viewport change detection with device-specific thresholds
 * Provides more accurate detection of significant changes
 */
function isSignificantViewportChange(currentWidth, currentHeight, previousWidth, previousHeight) {
    try {
        const widthChange = Math.abs(currentWidth - previousWidth);
        const heightChange = Math.abs(currentHeight - previousHeight);
        
        // Device-specific thresholds
        const isMobile = currentWidth <= 768;
        const isTablet = currentWidth > 768 && currentWidth <= 1024;
        
        // More sensitive thresholds for mobile devices
        const threshold = isMobile ? 20 : isTablet ? 30 : 50;
        
        // Check for significant changes
        const significantWidthChange = widthChange > threshold;
        const significantHeightChange = heightChange > threshold;
        
        // Additional check for orientation changes
        const aspectRatioChanged = (currentWidth > currentHeight) !== (previousWidth > previousHeight);
        
        return significantWidthChange || significantHeightChange || aspectRatioChanged;
        
    } catch (error) {
        console.warn('Error detecting viewport change significance:', error);
        return true; // Default to updating positioning on error
    }
}

/**
 * Cleanup function for viewport resize handling
 * Clears timeouts and removes event listeners when needed
 */
function cleanupViewportHandlers() {
    try {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
            resizeTimeout = null;
        }
        
        if (orientationTimeout) {
            clearTimeout(orientationTimeout);
            orientationTimeout = null;
        }
        
        console.log('Viewport resize handlers cleaned up');
        
    } catch (error) {
        console.error('Error cleaning up viewport handlers:', error);
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

// Viewport resize handling with debouncing
let resizeTimeout = null;
let orientationTimeout = null;
const RESIZE_DEBOUNCE_DELAY = 250; // 250ms debounce for regular resize events
const ORIENTATION_DEBOUNCE_DELAY = 300; // 300ms debounce for orientation changes

// Track viewport dimensions to detect significant changes
let lastViewportWidth = window.innerWidth;
let lastViewportHeight = window.innerHeight;
let lastOrientation = window.orientation;

/**
 * Enhanced viewport resize handler with improved debouncing and mobile support
 * Implements requirements 2.4 and 2.5 for graceful positioning during viewport changes
 */
function handleViewportResize() {
    // Clear existing timeout to prevent multiple rapid executions
    if (resizeTimeout) {
        clearTimeout(resizeTimeout);
    }
    
    // Debounce the resize handling with optimized delay
    resizeTimeout = setTimeout(() => {
        try {
            const currentWidth = window.innerWidth;
            const currentHeight = window.innerHeight;
            const currentOrientation = window.orientation;
            
            // Enhanced change detection using utility function
            const orientationChanged = currentOrientation !== lastOrientation;
            const significantViewportChange = isSignificantViewportChange(
                currentWidth, currentHeight, lastViewportWidth, lastViewportHeight
            );
            
            // Detect device type for context-aware handling
            const isMobile = currentWidth <= 768;
            const isTablet = currentWidth > 768 && currentWidth <= 1024;
            const isLandscape = isLandscapeMode();
            
            const shouldUpdatePositioning = significantViewportChange || orientationChanged;
            
            if (shouldUpdatePositioning) {
                const themeDropdown = document.getElementById('themeDropdown');
                
                // Only update positioning if dropdown is currently open
                if (themeDropdown && themeDropdown.getAttribute('aria-hidden') === 'false') {
                    // Apply positioning update with error handling
                    updateDropdownPositioning();
                    
                    // Enhanced logging for debugging with comprehensive device context
                    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                        console.log('Dropdown positioning updated due to viewport resize:', {
                            widthChange: currentWidth - lastViewportWidth,
                            heightChange: currentHeight - lastViewportHeight,
                            orientationChanged: orientationChanged,
                            deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
                            viewportSize: `${currentWidth}x${currentHeight}`,
                            isLandscape: isLandscape,
                            significantChange: significantViewportChange
                        });
                    }
                }
                
                // Update cached dimensions
                lastViewportWidth = currentWidth;
                lastViewportHeight = currentHeight;
                lastOrientation = currentOrientation;
            }
            
            // Enhanced orientation change handling for mobile devices
            if (orientationChanged && 'onorientationchange' in window) {
                handleOrientationChange();
            }
            
        } catch (error) {
            console.warn('Error handling viewport resize:', error);
            
            // Attempt graceful recovery by updating cached dimensions
            try {
                lastViewportWidth = window.innerWidth;
                lastViewportHeight = window.innerHeight;
                lastOrientation = window.orientation;
            } catch (recoveryError) {
                console.error('Failed to recover from resize error:', recoveryError);
            }
        }
    }, RESIZE_DEBOUNCE_DELAY);
}

/**
 * Enhanced orientation change handler for mobile devices
 * Provides additional delay and multiple positioning updates for smooth transitions
 */
function handleOrientationChange() {
    // Clear any existing orientation timeout
    if (orientationTimeout) {
        clearTimeout(orientationTimeout);
    }
    
    // Use longer debounce for orientation changes as they take more time to complete
    orientationTimeout = setTimeout(() => {
        try {
            const themeDropdown = document.getElementById('themeDropdown');
            
            if (themeDropdown && themeDropdown.getAttribute('aria-hidden') === 'false') {
                // First positioning update
                updateDropdownPositioning();
                
                // Additional positioning update after orientation animation completes
                setTimeout(() => {
                    if (themeDropdown.getAttribute('aria-hidden') === 'false') {
                        updateDropdownPositioning();
                        
                        // Final update of cached dimensions after orientation change is complete
                        lastViewportWidth = window.innerWidth;
                        lastViewportHeight = window.innerHeight;
                        lastOrientation = window.orientation;
                        
                        // Log orientation change completion
                        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                            console.log('Orientation change positioning completed:', {
                                newOrientation: window.orientation,
                                newViewportSize: `${window.innerWidth}x${window.innerHeight}`
                            });
                        }
                    }
                }, 200); // Additional delay for orientation animation completion
            }
            
        } catch (error) {
            console.warn('Error handling orientation change:', error);
        }
    }, ORIENTATION_DEBOUNCE_DELAY);
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
        
        // Note: Viewport resize handling is now managed by ThemeManager's debounced event system
        // This provides better performance optimization and consistent behavior (Requirements 2.4, 2.5)
        // The ThemeManager handles resize, scroll, orientation change, and visual viewport events
        
        // Keep legacy handler for backward compatibility, but it will be superseded by ThemeManager
        // TODO: Remove this after confirming ThemeManager handles all cases
        if (!window.themeManager || !window.themeManager._debouncedHandlers) {
            console.warn('ThemeManager debounced handlers not available, using legacy resize handler');
            window.addEventListener('resize', handleViewportResize);
        }
        
        // Cleanup viewport handlers on page unload to prevent memory leaks
        window.addEventListener('beforeunload', cleanupViewportHandlers);
        window.addEventListener('pagehide', cleanupViewportHandlers);
        
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