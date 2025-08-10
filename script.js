// Task Dashboard MVP - JavaScript Foundation
// Initial application state and data structures

// Application state
let tasks = [];
let clockTimer = null;

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
        
        tasks.push(newTask);
        clearTaskForm();
        showSuccessMessage('Task added successfully!');
        
        renderTasks();
        updateProgress();
        
    } catch (error) {
        console.error('Error adding task:', error);
    } finally {
        const addButton = document.getElementById('addTaskBtn');
        addButton.disabled = false;
        addButton.textContent = 'Add Task';
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
        if (taskIndex === -1) return;
        
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        
        renderTasks();
        updateProgress();
        
    } catch (error) {
        console.error('Error toggling task completion:', error);
    }
}

function deleteTask(taskId) {
    try {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return;
        
        const taskName = tasks[taskIndex].name;
        
        if (!confirm(`Are you sure you want to delete the task "${taskName}"?`)) {
            return;
        }
        
        tasks.splice(taskIndex, 1);
        
        renderTasks();
        updateProgress();
        
        showSuccessMessage(`Task "${taskName}" deleted successfully`);
        
    } catch (error) {
        console.error('Error deleting task:', error);
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

// Event listeners and initialization
function initializeApp() {
    try {
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