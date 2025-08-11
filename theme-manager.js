// Theme Management System
// Handles theme switching, persistence, and error handling

class ThemeManager {
    constructor() {
        this.STORAGE_KEY = 'taskDashboardTheme';
        this.DEFAULT_THEME = 'white';
        this.currentTheme = this.DEFAULT_THEME;
        
        // Available themes configuration
        this.themes = {
            white: {
                name: 'white',
                displayName: 'Light Theme',
                description: 'Clean, bright interface perfect for well-lit environments',
                cssClass: 'theme-white',
                preview: {
                    primaryColor: '#ffffff',
                    secondaryColor: '#f7fafc',
                    textColor: '#1a202c'
                }
            },
            dark: {
                name: 'dark',
                displayName: 'Dark Theme',
                description: 'Modern dark interface reducing eye strain in low-light conditions',
                cssClass: 'theme-dark',
                preview: {
                    primaryColor: '#1a202c',
                    secondaryColor: '#2d3748',
                    textColor: '#f7fafc'
                }
            },
            student: {
                name: 'student',
                displayName: 'Student Theme',
                description: 'Vibrant, energetic colors designed to motivate learning',
                cssClass: 'theme-student',
                preview: {
                    primaryColor: '#f0fff4',
                    secondaryColor: '#e6fffa',
                    textColor: '#1a365d'
                }
            },
            developer: {
                name: 'developer',
                displayName: 'Developer Theme',
                description: 'Code-inspired dark theme with syntax highlighting colors',
                cssClass: 'theme-developer',
                preview: {
                    primaryColor: '#0d1117',
                    secondaryColor: '#161b22',
                    textColor: '#f0f6fc'
                }
            },
            professional: {
                name: 'professional',
                displayName: 'Professional Theme',
                description: 'Sophisticated, business-appropriate interface for corporate environments',
                cssClass: 'theme-professional',
                preview: {
                    primaryColor: '#fafafa',
                    secondaryColor: '#f5f5f5',
                    textColor: '#212121'
                }
            }
        };
        
        this.initialized = false;
        this.errorCallbacks = [];
    }

    /**
     * Initialize the theme system
     * Should be called on page load
     * Implements requirements 8.1, 8.2, 8.3, 8.4, 8.5
     */
    initializeThemeSystem() {
        try {
            console.log('Starting theme system initialization...');
            
            // Check if CSS custom properties are supported
            if (!this.isCSSCustomPropertiesSupported()) {
                this.handleError('CSS custom properties not supported', 'BROWSER_COMPATIBILITY');
                return false;
            }

            // Check localStorage availability (Requirement 8.4)
            const storageAvailable = this.isStorageAvailable();
            if (!storageAvailable) {
                console.warn('localStorage not available - theme preferences will not persist between sessions');
            }

            // Load saved theme preference (Requirement 8.2)
            const savedTheme = this.loadThemePreference();
            
            let themeToApply;
            if (savedTheme) {
                console.log(`Found saved theme preference: ${savedTheme}`);
                themeToApply = savedTheme;
            } else {
                // Apply default theme when no preference is saved (Requirement 8.3)
                console.log(`No saved theme preference found, using default: ${this.DEFAULT_THEME}`);
                themeToApply = this.DEFAULT_THEME;
            }
            
            // Apply the theme without transition on initial load
            const applySuccess = this.setTheme(themeToApply, true);
            if (!applySuccess) {
                console.error('Failed to apply initial theme, falling back to default');
                this.applyThemeToDOM(this.DEFAULT_THEME, true);
                this.currentTheme = this.DEFAULT_THEME;
            }
            
            this.initialized = true;
            
            // Log initialization success with status
            console.log('Theme system initialized successfully', {
                currentTheme: this.currentTheme,
                storageAvailable: storageAvailable,
                hadSavedPreference: !!savedTheme,
                cssSupported: true
            });
            
            return true;
            
        } catch (error) {
            this.handleError('Failed to initialize theme system', 'INITIALIZATION_ERROR', error);
            
            // Fallback to default theme without transition (Requirement 8.5)
            try {
                this.applyThemeToDOM(this.DEFAULT_THEME, true);
                this.currentTheme = this.DEFAULT_THEME;
                console.log('Applied fallback default theme after initialization error');
            } catch (fallbackError) {
                console.error('Even fallback theme application failed:', fallbackError);
            }
            
            return false;
        }
    }

    /**
     * Set the active theme
     * @param {string} themeName - Name of the theme to apply
     * @param {boolean} skipTransition - Skip transition animation (for initial load)
     * @returns {boolean} - Success status
     */
    setTheme(themeName, skipTransition = false) {
        try {
            // Validate theme name
            if (!this.isValidTheme(themeName)) {
                this.handleError(`Invalid theme name: ${themeName}`, 'INVALID_THEME');
                // Fallback to default theme
                themeName = this.DEFAULT_THEME;
            }

            // Store previous theme for rollback if needed
            const previousTheme = this.currentTheme;

            // Preserve form state during theme transition (requirement 7.3)
            let formState = {};
            if (!skipTransition) {
                formState = this.preserveFormState();
            }

            // Apply theme to DOM
            const applySuccess = this.applyThemeToDOM(themeName, skipTransition);
            if (!applySuccess) {
                this.handleError('Failed to apply theme to DOM', 'DOM_APPLICATION_ERROR');
                return false;
            }

            // Restore form state after theme transition
            if (!skipTransition && Object.keys(formState).length > 0) {
                // Use requestAnimationFrame to ensure theme is applied first
                requestAnimationFrame(() => {
                    this.restoreFormState(formState);
                });
            }

            // Update current theme
            this.currentTheme = themeName;

            // Save theme preference (only if not initial load)
            if (!skipTransition) {
                const saveSuccess = this.saveThemePreference(themeName);
                if (!saveSuccess) {
                    // Theme is applied but not saved - warn user
                    this.handleError('Theme applied but could not be saved', 'STORAGE_WARNING');
                }
            }

            // Dispatch theme change event
            this.dispatchThemeChangeEvent(themeName, previousTheme);

            console.log(`Theme changed to: ${themeName}`);
            return true;

        } catch (error) {
            this.handleError('Error setting theme', 'THEME_SET_ERROR', error);
            return false;
        }
    }

    /**
     * Get the currently active theme
     * @returns {string} - Current theme name
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Get current theme configuration object
     * @returns {Object} - Theme configuration
     */
    getCurrentThemeConfig() {
        return this.themes[this.currentTheme] || this.themes[this.DEFAULT_THEME];
    }

    /**
     * Get list of available themes
     * @returns {Array} - Array of theme configuration objects
     */
    getAvailableThemes() {
        return Object.values(this.themes);
    }

    /**
     * Get theme configuration by name
     * @param {string} themeName - Name of the theme
     * @returns {Object|null} - Theme configuration or null if not found
     */
    getThemeConfig(themeName) {
        return this.themes[themeName] || null;
    }

    /**
     * Save theme preference to localStorage
     * Implements requirement 8.1 and handles requirement 8.4 (localStorage unavailability)
     * @param {string} themeName - Theme name to save
     * @returns {boolean} - Success status
     */
    saveThemePreference(themeName) {
        try {
            // Handle localStorage unavailability gracefully (Requirement 8.4)
            if (!this.isStorageAvailable()) {
                console.warn('localStorage not available - theme preference will not persist between sessions');
                // Still return true as the theme is applied, just not persisted
                return false;
            }

            // Validate theme name before saving
            if (!this.isValidTheme(themeName)) {
                console.error(`Cannot save invalid theme: ${themeName}`);
                return false;
            }

            localStorage.setItem(this.STORAGE_KEY, themeName);
            console.log(`Theme preference saved: ${themeName}`);
            return true;

        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('Storage quota exceeded while saving theme preference');
                this.handleError('Storage full - theme preference could not be saved', 'STORAGE_QUOTA_EXCEEDED');
            } else if (error.name === 'SecurityError') {
                console.error('Storage access denied while saving theme preference (private browsing?)');
                this.handleError('Storage access denied - theme preference could not be saved', 'STORAGE_ACCESS_DENIED');
            } else {
                console.error('Error saving theme preference:', error);
                this.handleError('Failed to save theme preference', 'STORAGE_ERROR', error);
            }
            return false;
        }
    }

    /**
     * Load theme preference from localStorage
     * Implements requirement 8.2 and handles requirement 8.5 (browser data clearing)
     * @returns {string|null} - Saved theme name or null if not found
     */
    loadThemePreference() {
        try {
            // Handle localStorage unavailability gracefully (Requirement 8.4)
            if (!this.isStorageAvailable()) {
                console.warn('localStorage not available for theme loading - using session-only persistence');
                return null;
            }

            const savedTheme = localStorage.getItem(this.STORAGE_KEY);
            
            // Handle case when no preference is saved (Requirement 8.3, 8.5)
            if (!savedTheme) {
                console.log('No theme preference found in localStorage');
                return null;
            }
            
            // Validate saved theme
            if (this.isValidTheme(savedTheme)) {
                console.log(`Valid theme preference loaded: ${savedTheme}`);
                return savedTheme;
            } else {
                // Invalid saved theme, clear it (handles corrupted data)
                console.warn(`Invalid saved theme found: ${savedTheme}, clearing preference and using default`);
                this.clearThemePreference();
                return null;
            }

        } catch (error) {
            console.error('Error loading theme preference:', error);
            
            // Try to clear potentially corrupted data
            try {
                this.clearThemePreference();
            } catch (clearError) {
                console.error('Failed to clear corrupted theme preference:', clearError);
            }
            
            return null;
        }
    }

    /**
     * Clear saved theme preference
     * @returns {boolean} - Success status
     */
    clearThemePreference() {
        try {
            if (!this.isStorageAvailable()) {
                return false;
            }

            localStorage.removeItem(this.STORAGE_KEY);
            return true;

        } catch (error) {
            console.error('Error clearing theme preference:', error);
            return false;
        }
    }

    /**
     * Apply theme to DOM by setting data-theme attribute
     * @param {string} themeName - Theme name to apply
     * @param {boolean} skipTransition - Skip transition animation (for initial load)
     * @returns {boolean} - Success status
     */
    applyThemeToDOM(themeName, skipTransition = false) {
        try {
            const documentElement = document.documentElement;
            if (!documentElement) {
                console.error('Document element not available');
                return false;
            }

            // Prevent layout shifts during theme change (requirement 7.4)
            const layoutState = this.preserveLayoutState();

            // Temporarily disable transitions if requested (for initial load)
            if (skipTransition) {
                documentElement.classList.add('theme-transition-disabled');
            }

            // Remove existing theme attributes
            Object.keys(this.themes).forEach(theme => {
                documentElement.removeAttribute(`data-theme-${theme}`);
            });

            // Apply new theme
            if (themeName === 'white') {
                // White theme is the default, no data-theme attribute needed
                documentElement.removeAttribute('data-theme');
            } else {
                documentElement.setAttribute('data-theme', themeName);
            }

            // Check for layout shifts and restore if necessary
            if (!skipTransition) {
                requestAnimationFrame(() => {
                    this.checkAndRestoreLayout(layoutState);
                });
            }

            // Re-enable transitions after a brief delay
            if (skipTransition) {
                // Use requestAnimationFrame to ensure the theme change is applied first
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        documentElement.classList.remove('theme-transition-disabled');
                    });
                });
            }

            return true;

        } catch (error) {
            console.error('Error applying theme to DOM:', error);
            return false;
        }
    }

    /**
     * Preserve layout state to detect shifts
     * @returns {Object} - Layout state information
     */
    preserveLayoutState() {
        try {
            const layoutState = {};
            
            // Get scroll positions
            layoutState.scrollX = window.scrollX || window.pageXOffset;
            layoutState.scrollY = window.scrollY || window.pageYOffset;
            
            // Get viewport dimensions
            layoutState.viewportWidth = window.innerWidth;
            layoutState.viewportHeight = window.innerHeight;
            
            // Get key element positions to detect shifts
            const keyElements = document.querySelectorAll('header, main, .task-item, .progress-section');
            layoutState.elementPositions = {};
            
            keyElements.forEach((element, index) => {
                if (element.id || element.className) {
                    const rect = element.getBoundingClientRect();
                    const key = element.id || `${element.tagName.toLowerCase()}-${index}`;
                    layoutState.elementPositions[key] = {
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height
                    };
                }
            });
            
            return layoutState;
            
        } catch (error) {
            console.error('Error preserving layout state:', error);
            return {};
        }
    }

    /**
     * Check for layout shifts and restore if necessary
     * @param {Object} previousState - Previous layout state
     */
    checkAndRestoreLayout(previousState) {
        try {
            if (!previousState || typeof previousState !== 'object') {
                return;
            }
            
            // Check if scroll position changed unexpectedly
            const currentScrollX = window.scrollX || window.pageXOffset;
            const currentScrollY = window.scrollY || window.pageYOffset;
            
            if (Math.abs(currentScrollX - previousState.scrollX) > 1 ||
                Math.abs(currentScrollY - previousState.scrollY) > 1) {
                
                // Restore scroll position
                window.scrollTo(previousState.scrollX, previousState.scrollY);
                console.log('Restored scroll position after theme change');
            }
            
            // Note: We don't check element positions as theme changes are expected to change colors
            // but not layout. The CSS is designed to prevent layout shifts through consistent sizing.
            
        } catch (error) {
            console.error('Error checking layout state:', error);
        }
    }

    /**
     * Check if a theme name is valid
     * @param {string} themeName - Theme name to validate
     * @returns {boolean} - Validation result
     */
    isValidTheme(themeName) {
        return typeof themeName === 'string' && 
               themeName.trim() !== '' && 
               this.themes.hasOwnProperty(themeName);
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} - Availability status
     */
    isStorageAvailable() {
        try {
            if (typeof localStorage === 'undefined') {
                return false;
            }

            // Test localStorage functionality
            const test = '__theme_storage_test__';
            localStorage.setItem(test, test);
            const retrieved = localStorage.getItem(test);
            localStorage.removeItem(test);

            return retrieved === test;

        } catch (error) {
            return false;
        }
    }

    /**
     * Check if CSS custom properties are supported with comprehensive detection
     * @returns {boolean} - Support status
     */
    isCSSCustomPropertiesSupported() {
        try {
            // Primary check: CSS.supports API
            if (window.CSS && CSS.supports && CSS.supports('color', 'var(--test)')) {
                return true;
            }

            // Fallback check: Create test element and check computed style
            const testElement = document.createElement('div');
            testElement.style.setProperty('--test-var', 'test-value');
            testElement.style.color = 'var(--test-var)';
            
            // Temporarily add to DOM for accurate computation
            testElement.style.position = 'absolute';
            testElement.style.visibility = 'hidden';
            testElement.style.pointerEvents = 'none';
            document.body.appendChild(testElement);
            
            const computedStyle = window.getComputedStyle(testElement);
            const supportsCustomProps = computedStyle.getPropertyValue('--test-var') === 'test-value';
            
            // Clean up
            document.body.removeChild(testElement);
            
            return supportsCustomProps;

        } catch (error) {
            console.warn('CSS custom properties support detection failed:', error);
            
            // Ultra-conservative fallback: check user agent for known incompatible browsers
            const userAgent = navigator.userAgent.toLowerCase();
            const isOldIE = userAgent.indexOf('msie') !== -1 || userAgent.indexOf('trident') !== -1;
            const isOldEdge = userAgent.indexOf('edge/') !== -1 && !userAgent.indexOf('edg/') !== -1;
            
            if (isOldIE || isOldEdge) {
                return false;
            }
            
            // Assume support for modern browsers if detection fails
            return true;
        }
    }

    /**
     * Preserve form state during theme transitions
     * @returns {Object} - Saved form state
     */
    preserveFormState() {
        try {
            const formState = {};
            
            // Save input values
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.id) {
                    if (input.type === 'checkbox' || input.type === 'radio') {
                        formState[input.id] = input.checked;
                    } else {
                        formState[input.id] = input.value;
                    }
                    
                    // Save focus state
                    if (document.activeElement === input) {
                        formState._focusedElement = input.id;
                        formState._selectionStart = input.selectionStart;
                        formState._selectionEnd = input.selectionEnd;
                    }
                }
            });
            
            return formState;
            
        } catch (error) {
            console.error('Error preserving form state:', error);
            return {};
        }
    }

    /**
     * Restore form state after theme transitions
     * @param {Object} formState - Previously saved form state
     */
    restoreFormState(formState) {
        try {
            if (!formState || typeof formState !== 'object') {
                return;
            }
            
            // Restore input values
            Object.keys(formState).forEach(key => {
                if (key.startsWith('_')) return; // Skip internal properties
                
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox' || element.type === 'radio') {
                        element.checked = formState[key];
                    } else {
                        element.value = formState[key];
                    }
                }
            });
            
            // Restore focus and selection
            if (formState._focusedElement) {
                const focusedElement = document.getElementById(formState._focusedElement);
                if (focusedElement) {
                    focusedElement.focus();
                    
                    // Restore text selection if applicable
                    if (typeof focusedElement.setSelectionRange === 'function' &&
                        typeof formState._selectionStart === 'number' &&
                        typeof formState._selectionEnd === 'number') {
                        focusedElement.setSelectionRange(formState._selectionStart, formState._selectionEnd);
                    }
                }
            }
            
        } catch (error) {
            console.error('Error restoring form state:', error);
        }
    }

    /**
     * Dispatch theme change event
     * @param {string} newTheme - New theme name
     * @param {string} previousTheme - Previous theme name
     */
    dispatchThemeChangeEvent(newTheme, previousTheme) {
        try {
            const event = new CustomEvent('themeChanged', {
                detail: {
                    newTheme: newTheme,
                    previousTheme: previousTheme,
                    themeConfig: this.themes[newTheme]
                }
            });

            document.dispatchEvent(event);

        } catch (error) {
            console.error('Error dispatching theme change event:', error);
        }
    }

    /**
     * Handle errors with appropriate user feedback and recovery actions
     * @param {string} message - Error message
     * @param {string} type - Error type
     * @param {Error} originalError - Original error object (optional)
     */
    handleError(message, type, originalError = null) {
        console.error(`Theme Manager Error [${type}]:`, message, originalError);

        // Call registered error callbacks
        this.errorCallbacks.forEach(callback => {
            try {
                callback(message, type, originalError);
            } catch (callbackError) {
                console.error('Error in theme error callback:', callbackError);
            }
        });

        // Show user-friendly error messages with appropriate persistence and recovery actions
        switch (type) {
            case 'BROWSER_COMPATIBILITY':
                this.showUserError('Your browser does not support theme switching. Using default theme.', true);
                this.applyFallbackStyling();
                break;
                
            case 'STORAGE_WARNING':
                this.showUserError('Theme changed but preference could not be saved. You may need to reselect your theme after refreshing.', false);
                break;
                
            case 'INVALID_THEME':
                this.showUserError('Invalid theme selected. Using default theme.', false);
                // Automatically reset to default theme
                this.setTheme(this.DEFAULT_THEME, true);
                break;
                
            case 'STORAGE_QUOTA_EXCEEDED':
                this.showUserError('Storage is full. Theme preference could not be saved. Try clearing browser data.', true);
                break;
                
            case 'STORAGE_ACCESS_DENIED':
                this.showUserError('Storage access denied (private browsing?). Theme preference will not persist.', true);
                break;
                
            case 'DOM_APPLICATION_ERROR':
                this.showUserError('Failed to apply theme. Please refresh the page if themes appear broken.', false);
                this.attemptThemeRecovery();
                break;
                
            case 'INITIALIZATION_ERROR':
                this.showUserError('Theme system could not be initialized. Using default theme.', false);
                this.applyFallbackStyling();
                break;
                
            case 'THEME_SET_ERROR':
                this.showUserError('Failed to change theme. Please try again or refresh the page.', false);
                this.attemptThemeRecovery();
                break;
                
            case 'STORAGE_ERROR':
                this.showUserError('Theme preference could not be saved due to storage error.', false);
                break;
                
            default:
                // Log generic errors but don't show to users to avoid confusion
                console.warn(`Unhandled theme error type: ${type}`);
                break;
        }
    }

    /**
     * Apply fallback styling when CSS custom properties are not supported
     */
    applyFallbackStyling() {
        try {
            // Add a class to indicate fallback mode
            document.documentElement.classList.add('theme-fallback-mode');
            
            // Apply basic styling via inline styles as last resort
            const fallbackStyles = `
                body { background: #ffffff; color: #1a202c; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                .task-item { background: #f7fafc; border: 1px solid #e2e8f0; }
                .btn-primary { background: #667eea; color: white; }
                .btn-secondary { background: #e2e8f0; color: #4a5568; }
            `;
            
            let styleElement = document.getElementById('theme-fallback-styles');
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = 'theme-fallback-styles';
                document.head.appendChild(styleElement);
            }
            
            styleElement.textContent = fallbackStyles;
            
            console.log('Applied fallback styling for unsupported browser');
            
        } catch (error) {
            console.error('Failed to apply fallback styling:', error);
        }
    }

    /**
     * Attempt to recover from theme application errors
     */
    attemptThemeRecovery() {
        try {
            console.log('Attempting theme recovery...');
            
            // Try to reapply current theme
            const currentTheme = this.currentTheme;
            const recoverySuccess = this.applyThemeToDOM(currentTheme, true);
            
            if (recoverySuccess) {
                console.log('Theme recovery successful');
                return true;
            }
            
            // If current theme fails, try default theme
            console.log('Current theme recovery failed, trying default theme...');
            const defaultRecovery = this.applyThemeToDOM(this.DEFAULT_THEME, true);
            
            if (defaultRecovery) {
                this.currentTheme = this.DEFAULT_THEME;
                console.log('Default theme recovery successful');
                return true;
            }
            
            // If all else fails, apply fallback styling
            console.log('All theme recovery attempts failed, applying fallback styling');
            this.applyFallbackStyling();
            return false;
            
        } catch (error) {
            console.error('Theme recovery attempt failed:', error);
            this.applyFallbackStyling();
            return false;
        }
    }

    /**
     * Show error message to user with enhanced fallback handling
     * @param {string} message - User-friendly error message
     * @param {boolean} persistent - Whether the message should persist
     */
    showUserError(message, persistent = false) {
        try {
            // Try to use existing error display system if available
            if (typeof showStorageWarning === 'function') {
                showStorageWarning(message, persistent);
                return;
            }

            // Fallback: create enhanced error display with theme-aware styling
            const errorElement = document.createElement('div');
            errorElement.className = 'theme-error-message';
            errorElement.setAttribute('role', 'alert');
            errorElement.setAttribute('aria-live', 'polite');
            
            // Create error content with icon
            const iconSpan = document.createElement('span');
            iconSpan.textContent = '⚠';
            iconSpan.style.cssText = 'margin-right: 8px; font-size: 1.1rem;';
            
            const messageSpan = document.createElement('span');
            messageSpan.textContent = message;
            
            errorElement.appendChild(iconSpan);
            errorElement.appendChild(messageSpan);
            
            // Apply theme-aware styling with fallback colors
            const isDarkTheme = this.currentTheme === 'dark' || this.currentTheme === 'developer';
            const errorStyles = this.getErrorMessageStyles(isDarkTheme, persistent);
            errorElement.style.cssText = errorStyles;

            // Add close button for persistent messages
            if (persistent) {
                const closeButton = document.createElement('button');
                closeButton.textContent = '×';
                closeButton.style.cssText = `
                    background: none;
                    border: none;
                    color: inherit;
                    font-size: 1.2rem;
                    margin-left: 8px;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                `;
                closeButton.setAttribute('aria-label', 'Close error message');
                closeButton.onclick = () => errorElement.remove();
                errorElement.appendChild(closeButton);
            }

            // Ensure body exists before appending
            if (!document.body) {
                console.error('Document body not available for error display');
                return;
            }

            document.body.appendChild(errorElement);

            // Auto-remove after delay (longer for persistent messages)
            const removeDelay = persistent ? 10000 : 5000;
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.remove();
                }
            }, removeDelay);

        } catch (error) {
            console.error('Error showing user error message:', error);
            // Ultimate fallback: use alert if all else fails
            try {
                if (typeof alert === 'function') {
                    alert(`Theme Error: ${message}`);
                }
            } catch (alertError) {
                console.error('Even alert fallback failed:', alertError);
            }
        }
    }

    /**
     * Get theme-aware error message styles
     * @param {boolean} isDarkTheme - Whether current theme is dark
     * @param {boolean} persistent - Whether message is persistent
     * @returns {string} - CSS styles string
     */
    getErrorMessageStyles(isDarkTheme, persistent) {
        const baseStyles = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 6px;
            z-index: 10000;
            max-width: 300px;
            font-size: 14px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.4;
        `;

        if (isDarkTheme) {
            return baseStyles + `
                background: #742a2a;
                color: #fc8181;
                border: 1px solid #e53e3e;
            `;
        } else {
            return baseStyles + `
                background: #fed7d7;
                color: #c53030;
                border: 1px solid #feb2b2;
            `;
        }
    }

    /**
     * Register error callback
     * @param {Function} callback - Error callback function
     */
    onError(callback) {
        if (typeof callback === 'function') {
            this.errorCallbacks.push(callback);
        }
    }

    /**
     * Get comprehensive theme system status with diagnostics
     * @returns {Object} - Status information
     */
    getStatus() {
        const status = {
            initialized: this.initialized,
            currentTheme: this.currentTheme,
            storageAvailable: this.isStorageAvailable(),
            cssSupported: this.isCSSCustomPropertiesSupported(),
            availableThemes: Object.keys(this.themes),
            hasStoredPreference: false,
            diagnostics: {
                domReady: !!document.documentElement,
                themeApplied: false,
                storageTest: false,
                cssTest: false,
                errors: []
            }
        };

        // Test stored preference
        try {
            const storedTheme = this.loadThemePreference();
            status.hasStoredPreference = !!storedTheme;
            status.storedTheme = storedTheme;
        } catch (error) {
            status.diagnostics.errors.push(`Storage preference test failed: ${error.message}`);
        }

        // Test theme application
        try {
            const currentDataTheme = document.documentElement.getAttribute('data-theme');
            status.diagnostics.themeApplied = currentDataTheme === this.currentTheme || 
                                            (this.currentTheme === 'white' && !currentDataTheme);
            status.appliedDataTheme = currentDataTheme;
        } catch (error) {
            status.diagnostics.errors.push(`Theme application test failed: ${error.message}`);
        }

        // Test storage functionality
        try {
            const testKey = '__theme_test__';
            const testValue = 'test';
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            status.diagnostics.storageTest = retrieved === testValue;
        } catch (error) {
            status.diagnostics.errors.push(`Storage test failed: ${error.message}`);
        }

        // Test CSS custom properties
        try {
            status.diagnostics.cssTest = this.isCSSCustomPropertiesSupported();
        } catch (error) {
            status.diagnostics.errors.push(`CSS test failed: ${error.message}`);
        }

        return status;
    }

    /**
     * Validate theme system integrity and return detailed report
     * @returns {Object} - Validation report
     */
    validateIntegrity() {
        const report = {
            valid: true,
            warnings: [],
            errors: [],
            recommendations: []
        };

        try {
            // Check if theme manager is properly initialized
            if (!this.initialized) {
                report.errors.push('Theme system not initialized');
                report.valid = false;
            }

            // Check current theme validity
            if (!this.isValidTheme(this.currentTheme)) {
                report.errors.push(`Current theme '${this.currentTheme}' is invalid`);
                report.valid = false;
            }

            // Check CSS support
            if (!this.isCSSCustomPropertiesSupported()) {
                report.warnings.push('CSS custom properties not supported - using fallback styling');
                report.recommendations.push('Consider upgrading to a modern browser for full theme support');
            }

            // Check storage availability
            if (!this.isStorageAvailable()) {
                report.warnings.push('localStorage not available - theme preferences will not persist');
                report.recommendations.push('Enable localStorage or exit private browsing mode for theme persistence');
            }

            // Check DOM state
            if (!document.documentElement) {
                report.errors.push('Document element not available');
                report.valid = false;
            }

            // Check theme application consistency
            const expectedDataTheme = this.currentTheme === 'white' ? null : this.currentTheme;
            const actualDataTheme = document.documentElement.getAttribute('data-theme');
            
            if (expectedDataTheme !== actualDataTheme) {
                report.warnings.push(`Theme application mismatch: expected '${expectedDataTheme}', got '${actualDataTheme}'`);
                report.recommendations.push('Try refreshing the page or reselecting your theme');
            }

            // Check for theme-related CSS classes
            const hasTransitionDisabled = document.documentElement.classList.contains('theme-transition-disabled');
            if (hasTransitionDisabled) {
                report.warnings.push('Theme transitions are disabled - this may indicate an initialization issue');
            }

            // Check error callback registration
            if (this.errorCallbacks.length === 0) {
                report.warnings.push('No error callbacks registered - errors may not be properly handled');
            }

        } catch (error) {
            report.errors.push(`Integrity validation failed: ${error.message}`);
            report.valid = false;
        }

        return report;
    }

    /**
     * Reset theme system to defaults with comprehensive cleanup
     * @returns {boolean} - Success status
     */
    reset() {
        try {
            console.log('Resetting theme system to defaults...');
            
            // Clear stored preferences
            this.clearThemePreference();
            
            // Reset to default theme
            this.currentTheme = this.DEFAULT_THEME;
            
            // Clean up DOM attributes
            document.documentElement.removeAttribute('data-theme');
            Object.keys(this.themes).forEach(theme => {
                document.documentElement.removeAttribute(`data-theme-${theme}`);
            });
            
            // Remove any error-related classes
            document.documentElement.classList.remove('theme-fallback-mode', 'theme-transition-disabled');
            
            // Remove any existing error messages
            const errorMessages = document.querySelectorAll('.theme-error-message');
            errorMessages.forEach(msg => msg.remove());
            
            // Remove fallback styles
            const fallbackStyles = document.getElementById('theme-fallback-styles');
            if (fallbackStyles) {
                fallbackStyles.remove();
            }
            
            // Reinitialize if needed
            if (!this.initialized) {
                this.initializeThemeSystem();
            } else {
                // Just apply default theme
                this.applyThemeToDOM(this.DEFAULT_THEME, true);
            }
            
            console.log('Theme system reset completed successfully');
            return true;
            
        } catch (error) {
            this.handleError('Error resetting theme system', 'RESET_ERROR', error);
            
            // Emergency fallback
            try {
                this.applyFallbackStyling();
                this.currentTheme = this.DEFAULT_THEME;
                console.log('Emergency fallback applied after reset failure');
                return false;
            } catch (fallbackError) {
                console.error('Even emergency fallback failed:', fallbackError);
                return false;
            }
        }
    }

    /**
     * Perform comprehensive system recovery
     * @returns {Object} - Recovery report
     */
    performSystemRecovery() {
        const recoveryReport = {
            success: false,
            steps: [],
            errors: [],
            finalState: null
        };

        try {
            recoveryReport.steps.push('Starting system recovery...');

            // Step 1: Validate current state
            const integrity = this.validateIntegrity();
            recoveryReport.steps.push(`Integrity check: ${integrity.valid ? 'PASS' : 'FAIL'}`);
            
            if (integrity.errors.length > 0) {
                recoveryReport.errors.push(...integrity.errors);
            }

            // Step 2: Clear any corrupted state
            try {
                this.clearThemePreference();
                recoveryReport.steps.push('Cleared stored preferences');
            } catch (error) {
                recoveryReport.errors.push(`Failed to clear preferences: ${error.message}`);
            }

            // Step 3: Reset DOM state
            try {
                document.documentElement.removeAttribute('data-theme');
                document.documentElement.classList.remove('theme-fallback-mode', 'theme-transition-disabled');
                recoveryReport.steps.push('Reset DOM state');
            } catch (error) {
                recoveryReport.errors.push(`Failed to reset DOM: ${error.message}`);
            }

            // Step 4: Test CSS support
            const cssSupported = this.isCSSCustomPropertiesSupported();
            recoveryReport.steps.push(`CSS support: ${cssSupported ? 'YES' : 'NO'}`);

            // Step 5: Test storage
            const storageAvailable = this.isStorageAvailable();
            recoveryReport.steps.push(`Storage available: ${storageAvailable ? 'YES' : 'NO'}`);

            // Step 6: Apply default theme
            try {
                if (cssSupported) {
                    this.applyThemeToDOM(this.DEFAULT_THEME, true);
                    recoveryReport.steps.push('Applied default theme');
                } else {
                    this.applyFallbackStyling();
                    recoveryReport.steps.push('Applied fallback styling');
                }
                this.currentTheme = this.DEFAULT_THEME;
            } catch (error) {
                recoveryReport.errors.push(`Failed to apply theme: ${error.message}`);
            }

            // Step 7: Reinitialize system
            try {
                this.initialized = false;
                const initSuccess = this.initializeThemeSystem();
                recoveryReport.steps.push(`Reinitialization: ${initSuccess ? 'SUCCESS' : 'FAILED'}`);
            } catch (error) {
                recoveryReport.errors.push(`Reinitialization failed: ${error.message}`);
            }

            // Final validation
            const finalIntegrity = this.validateIntegrity();
            recoveryReport.success = finalIntegrity.valid;
            recoveryReport.finalState = this.getStatus();
            
            recoveryReport.steps.push(`Recovery ${recoveryReport.success ? 'COMPLETED' : 'PARTIAL'}`);

            console.log('System recovery report:', recoveryReport);
            return recoveryReport;

        } catch (error) {
            recoveryReport.errors.push(`Recovery process failed: ${error.message}`);
            recoveryReport.success = false;
            return recoveryReport;
        }
    }
}

// Create and export theme manager instance
const themeManager = new ThemeManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = themeManager;
} else if (typeof window !== 'undefined') {
    window.themeManager = themeManager;
}