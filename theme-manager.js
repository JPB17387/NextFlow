// Theme Management System
// Handles theme switching, persistence, and error handling

class ThemeManager {
    constructor() {
        this.STORAGE_KEY = 'taskDashboardTheme';
        this.DEFAULT_THEME = 'white';
        this.currentTheme = this.DEFAULT_THEME;
        
        // Performance monitoring
        this._performanceMetrics = {
            themeChanges: 0,
            averageChangeTime: 0,
            lastChangeTime: 0,
            memoryUsage: 0
        };
        
        // Cleanup tracking
        this._eventListeners = [];
        this._timeouts = [];
        this._themeChangeTimeout = null;
        
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
        
        // Performance optimization: bind methods once to avoid repeated function creation
        this._boundHandleVisibilityChange = this._handleVisibilityChange.bind(this);
        this._boundHandleMemoryPressure = this._handleMemoryPressure.bind(this);
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
            const cssSupported = this.isCSSCustomPropertiesSupported();
            if (!cssSupported) {
                console.warn('CSS custom properties not supported, applying fallback styling');
                this.handleError('Your browser does not support modern theme features. Using basic styling.', 'BROWSER_COMPATIBILITY');
                // Continue with initialization but in fallback mode
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
            
            // Setup performance monitoring
            this._setupPerformanceMonitoring();
            
            // Initialize performance metrics
            this._performanceMetrics.lastChangeTime = performance.now();
            
            // Log initialization success with status
            console.log('Theme system initialized successfully', {
                currentTheme: this.currentTheme,
                storageAvailable: storageAvailable,
                hadSavedPreference: !!savedTheme,
                cssSupported: true,
                performanceMonitoring: true
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
            // Performance optimization: early return if theme is already active
            if (this.currentTheme === themeName && this.initialized) {
                console.log(`Theme '${themeName}' is already active, skipping change`);
                return true;
            }

            // Validate theme name with comprehensive checking
            if (!this.isValidTheme(themeName)) {
                console.warn(`Invalid theme name provided: ${themeName}`);
                this.handleError(`Invalid theme name: ${themeName}. Available themes: ${Object.keys(this.themes).join(', ')}`, 'INVALID_THEME');
                
                // Fallback to default theme
                const originalTheme = themeName;
                themeName = this.DEFAULT_THEME;
                
                // Log the fallback for debugging
                console.log(`Falling back from invalid theme '${originalTheme}' to default theme '${themeName}'`);
                
                // Verify default theme is valid (safety check)
                if (!this.isValidTheme(themeName)) {
                    console.error(`Even default theme '${themeName}' is invalid! Theme system is corrupted.`);
                    this.handleError('Theme system is corrupted - default theme is invalid', 'SYSTEM_CORRUPTION');
                    return false;
                }
            }

            // Performance optimization: debounce rapid theme changes
            if (this._themeChangeTimeout) {
                clearTimeout(this._themeChangeTimeout);
            }

            // Store previous theme for rollback if needed
            const previousTheme = this.currentTheme;

            // Performance optimization: only preserve form state if there are form elements
            let formState = {};
            if (!skipTransition && document.querySelector('input, select, textarea')) {
                formState = this.preserveFormState();
            }

            // Apply theme to DOM with comprehensive error handling
            const applySuccess = this.applyThemeToDOM(themeName, skipTransition);
            if (!applySuccess) {
                console.error(`Failed to apply theme '${themeName}' to DOM`);
                this.handleError(`Failed to apply theme '${themeName}'. Attempting recovery.`, 'DOM_APPLICATION_ERROR');
                
                // Try to recover by applying default theme
                if (themeName !== this.DEFAULT_THEME) {
                    console.log('Attempting to recover by applying default theme...');
                    const defaultApplySuccess = this.applyThemeToDOM(this.DEFAULT_THEME, true);
                    if (defaultApplySuccess) {
                        this.currentTheme = this.DEFAULT_THEME;
                        console.log('Successfully recovered with default theme');
                        return true;
                    }
                }
                
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

            // Performance optimization: debounce storage operations
            if (!skipTransition) {
                this._themeChangeTimeout = setTimeout(() => {
                    const saveSuccess = this.saveThemePreference(themeName);
                    if (!saveSuccess) {
                        // Theme is applied but not saved - warn user
                        this.handleError('Theme applied but could not be saved', 'STORAGE_WARNING');
                    }
                }, 100); // 100ms debounce
            }

            // Performance monitoring: track theme change metrics
            this._trackThemeChangePerformance(themeName, previousTheme);

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

            // Performance optimization: batch DOM operations
            const operations = [];

            // Prevent layout shifts during theme change (requirement 7.4)
            const layoutState = this.preserveLayoutState();

            // Temporarily disable transitions if requested (for initial load)
            if (skipTransition) {
                operations.push(() => documentElement.classList.add('theme-transition-disabled'));
            }

            // Performance optimization: only remove/set attributes if they're different
            const currentTheme = documentElement.getAttribute('data-theme');
            
            if (themeName === 'white') {
                // White theme is the default, no data-theme attribute needed
                if (currentTheme !== null) {
                    operations.push(() => documentElement.removeAttribute('data-theme'));
                }
            } else {
                if (currentTheme !== themeName) {
                    operations.push(() => documentElement.setAttribute('data-theme', themeName));
                }
            }

            // Execute all DOM operations in a single batch to minimize reflows
            if (operations.length > 0) {
                operations.forEach(operation => operation());
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
     * Check if localStorage is available with comprehensive detection
     * @returns {boolean} - Availability status
     */
    isStorageAvailable() {
        try {
            // Cache the result to avoid repeated expensive checks
            if (this._storageAvailable !== undefined) {
                return this._storageAvailable;
            }

            // Check if localStorage exists
            if (typeof localStorage === 'undefined' || localStorage === null) {
                this._storageAvailable = false;
                return false;
            }

            // Test localStorage functionality with comprehensive checks
            const test = '__theme_storage_test__';
            const testValue = 'test_value_' + Date.now();
            
            // Test setItem
            localStorage.setItem(test, testValue);
            
            // Test getItem
            const retrieved = localStorage.getItem(test);
            
            // Test removeItem
            localStorage.removeItem(test);
            
            // Verify the test worked correctly
            const isWorking = retrieved === testValue;
            
            // Additional test: check if removeItem actually worked
            const shouldBeNull = localStorage.getItem(test);
            const removeWorked = shouldBeNull === null;
            
            const isAvailable = isWorking && removeWorked;
            this._storageAvailable = isAvailable;
            
            if (!isAvailable) {
                console.warn('localStorage functionality test failed');
            }
            
            return isAvailable;

        } catch (error) {
            // Handle specific error types for better diagnostics
            if (error.name === 'SecurityError') {
                console.warn('localStorage access denied (private browsing mode?):', error);
                this.handleError('Storage access denied - likely private browsing mode', 'STORAGE_ACCESS_DENIED');
            } else if (error.name === 'QuotaExceededError') {
                console.warn('localStorage quota exceeded during availability test:', error);
                this.handleError('Storage quota exceeded during test', 'STORAGE_QUOTA_EXCEEDED');
            } else {
                console.warn('localStorage availability test failed:', error);
            }
            
            this._storageAvailable = false;
            return false;
        }
    }

    /**
     * Check if CSS custom properties are supported with comprehensive detection
     * @returns {boolean} - Support status
     */
    isCSSCustomPropertiesSupported() {
        try {
            // Cache the result to avoid repeated expensive checks
            if (this._cssSupported !== undefined) {
                return this._cssSupported;
            }

            // Primary check: CSS.supports API
            if (window.CSS && CSS.supports && CSS.supports('color', 'var(--test)')) {
                this._cssSupported = true;
                return true;
            }

            // Secondary check: Test actual CSS variable functionality
            if (document.body) {
                const testElement = document.createElement('div');
                testElement.style.setProperty('--test-var', 'rgb(255, 0, 0)');
                testElement.style.color = 'var(--test-var, blue)';
                
                // Temporarily add to DOM for accurate computation
                testElement.style.position = 'absolute';
                testElement.style.visibility = 'hidden';
                testElement.style.pointerEvents = 'none';
                testElement.style.top = '-9999px';
                testElement.style.left = '-9999px';
                
                document.body.appendChild(testElement);
                
                const computedStyle = window.getComputedStyle(testElement);
                const computedColor = computedStyle.color;
                
                // Clean up
                document.body.removeChild(testElement);
                
                // Check if the CSS variable was applied (red color)
                const supportsCustomProps = computedColor === 'rgb(255, 0, 0)' || 
                                          computedColor === 'red' ||
                                          computedStyle.getPropertyValue('--test-var').trim() === 'rgb(255, 0, 0)';
                
                this._cssSupported = supportsCustomProps;
                return supportsCustomProps;
            }

            // Tertiary check: User agent detection for known incompatible browsers
            const userAgent = navigator.userAgent.toLowerCase();
            const isOldIE = userAgent.indexOf('msie') !== -1 || userAgent.indexOf('trident') !== -1;
            const isOldEdge = userAgent.indexOf('edge/') !== -1 && userAgent.indexOf('edg/') === -1;
            const isOldChrome = /chrome\/([0-9]+)/.test(userAgent) && parseInt(RegExp.$1) < 49;
            const isOldFirefox = /firefox\/([0-9]+)/.test(userAgent) && parseInt(RegExp.$1) < 31;
            const isOldSafari = /version\/([0-9]+).*safari/.test(userAgent) && parseInt(RegExp.$1) < 9;
            
            if (isOldIE || isOldEdge || isOldChrome || isOldFirefox || isOldSafari) {
                this._cssSupported = false;
                return false;
            }
            
            // Assume support for modern browsers if all detection methods fail
            console.warn('CSS custom properties support could not be determined, assuming support');
            this._cssSupported = true;
            return true;

        } catch (error) {
            console.warn('CSS custom properties support detection failed:', error);
            
            // Conservative fallback: assume no support if detection fails
            this._cssSupported = false;
            return false;
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
                
            case 'SYSTEM_CORRUPTION':
                this.showUserError('Theme system is corrupted. Please refresh the page.', true);
                this.performSystemRecovery();
                break;
                
            default:
                // Log generic errors but don't show to users to avoid confusion
                console.warn(`Unhandled theme error type: ${type}. Message: ${message}`);
                if (originalError) {
                    console.error('Original error:', originalError);
                }
                break;
        }
    }

    /**
     * Apply fallback styling when CSS custom properties are not supported
     */
    applyFallbackStyling() {
        try {
            console.log('Applying fallback styling for browser compatibility...');
            
            // Add a class to indicate fallback mode
            document.documentElement.classList.add('theme-fallback-mode');
            
            // Remove any existing theme attributes that won't work
            document.documentElement.removeAttribute('data-theme');
            Object.keys(this.themes).forEach(theme => {
                document.documentElement.removeAttribute(`data-theme-${theme}`);
            });
            
            // Apply comprehensive fallback styling via inline styles
            const fallbackStyles = `
                /* Fallback Theme Styles - Applied when CSS custom properties are not supported */
                .theme-fallback-mode {
                    /* Base colors */
                    background: #ffffff;
                    color: #1a202c;
                }
                
                .theme-fallback-mode body {
                    background: #ffffff;
                    color: #1a202c;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .theme-fallback-mode .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                
                .theme-fallback-mode .task-item {
                    background: #f7fafc;
                    border: 1px solid #e2e8f0;
                    color: #1a202c;
                }
                
                .theme-fallback-mode .task-item.completed {
                    background: #e6fffa;
                    opacity: 0.7;
                }
                
                .theme-fallback-mode .btn-primary {
                    background: #667eea;
                    color: white;
                    border: none;
                }
                
                .theme-fallback-mode .btn-secondary {
                    background: #e2e8f0;
                    color: #4a5568;
                    border: 1px solid #cbd5e0;
                }
                
                .theme-fallback-mode .form-input {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    color: #1a202c;
                }
                
                .theme-fallback-mode .form-select {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    color: #1a202c;
                }
                
                .theme-fallback-mode .progress-bar {
                    background: #e2e8f0;
                }
                
                .theme-fallback-mode .progress-fill {
                    background: #667eea;
                }
                
                .theme-fallback-mode .category-work {
                    background: #3182ce;
                    color: white;
                }
                
                .theme-fallback-mode .category-study {
                    background: #38a169;
                    color: white;
                }
                
                .theme-fallback-mode .category-personal {
                    background: #ed8936;
                    color: white;
                }
                
                .theme-fallback-mode .storage-warning,
                .theme-fallback-mode .theme-error-message {
                    background: #fed7d7;
                    color: #c53030;
                    border: 1px solid #feb2b2;
                }
                
                /* Disable transitions in fallback mode */
                .theme-fallback-mode * {
                    transition: none !important;
                    animation: none !important;
                }
            `;
            
            let styleElement = document.getElementById('theme-fallback-styles');
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = 'theme-fallback-styles';
                styleElement.type = 'text/css';
                
                // Try to add to head, fallback to body if head doesn't exist
                const targetElement = document.head || document.body || document.documentElement;
                if (targetElement) {
                    targetElement.appendChild(styleElement);
                } else {
                    console.error('Could not find element to append fallback styles');
                    return false;
                }
            }
            
            styleElement.textContent = fallbackStyles;
            
            console.log('Applied comprehensive fallback styling for unsupported browser');
            return true;
            
        } catch (error) {
            console.error('Failed to apply fallback styling:', error);
            
            // Ultimate fallback: try to set basic inline styles on body
            try {
                if (document.body) {
                    document.body.style.background = '#ffffff';
                    document.body.style.color = '#1a202c';
                    console.log('Applied emergency inline styles');
                }
                return false;
            } catch (inlineError) {
                console.error('Even emergency inline styles failed:', inlineError);
                return false;
            }
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
            const defaultRecoverySuccess = this.applyThemeToDOM(this.DEFAULT_THEME, true);
            
            if (defaultRecoverySuccess) {
                this.currentTheme = this.DEFAULT_THEME;
                console.log('Default theme recovery successful');
                this.showUserError('Theme was reset to default due to an error.', false);
                return true;
            }
            
            // If even default theme fails, apply fallback styling
            console.log('Default theme recovery failed, applying fallback styling...');
            this.applyFallbackStyling();
            this.currentTheme = this.DEFAULT_THEME;
            this.showUserError('Theme system encountered an error. Using basic styling.', true);
            return false;
            
        } catch (error) {
            console.error('Theme recovery attempt failed:', error);
            
            // Last resort: apply emergency fallback
            try {
                this.applyFallbackStyling();
                this.currentTheme = this.DEFAULT_THEME;
                console.log('Emergency fallback applied');
                return false;
            } catch (fallbackError) {
                console.error('Even emergency fallback failed:', fallbackError);
                return false;
            }
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
                console.log('Using existing showStorageWarning function for theme error');
                showStorageWarning(`Theme: ${message}`, persistent);
                return;
            }

            // Check if we're in a browser environment
            if (typeof document === 'undefined' || !document) {
                console.error('Document not available for error display:', message);
                return;
            }

            // Remove existing theme error messages to avoid duplicates
            const existingErrors = document.querySelectorAll('.theme-error-message');
            existingErrors.forEach(error => {
                if (error.textContent.includes(message)) {
                    error.remove();
                }
            });

            // Fallback: create enhanced error display with theme-aware styling
            const errorElement = document.createElement('div');
            errorElement.className = 'theme-error-message';
            errorElement.setAttribute('role', 'alert');
            errorElement.setAttribute('aria-live', 'polite');
            
            // Create error content with icon
            const iconSpan = document.createElement('span');
            iconSpan.textContent = '⚠️';
            iconSpan.style.cssText = 'margin-right: 8px; font-size: 1.1rem;';
            iconSpan.setAttribute('aria-hidden', 'true');
            
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
                    margin-left: auto;
                    margin-right: 4px;
                    cursor: pointer;
                    padding: 4px;
                    line-height: 1;
                    border-radius: 2px;
                `;
                closeButton.setAttribute('aria-label', 'Close theme error message');
                closeButton.setAttribute('type', 'button');
                closeButton.onclick = () => {
                    errorElement.remove();
                    console.log('Theme error message dismissed by user');
                };
                
                // Add hover effect
                closeButton.onmouseover = () => {
                    closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                };
                closeButton.onmouseout = () => {
                    closeButton.style.backgroundColor = 'transparent';
                };
                
                errorElement.appendChild(closeButton);
            }

            // Find the best place to insert the error message
            let insertTarget = null;
            
            // Try to insert after header (like showStorageWarning does)
            const header = document.querySelector('header');
            if (header && header.parentNode) {
                insertTarget = header.parentNode;
                insertTarget.insertBefore(errorElement, header.nextSibling);
            } else if (document.body) {
                // Fallback: prepend to body
                insertTarget = document.body;
                insertTarget.insertBefore(errorElement, insertTarget.firstChild);
            } else {
                console.error('Could not find suitable element to display theme error');
                // Last resort: try to append to document element
                if (document.documentElement) {
                    document.documentElement.appendChild(errorElement);
                } else {
                    throw new Error('No suitable parent element found');
                }
            }

            console.log(`Theme error message displayed: ${message} (persistent: ${persistent})`);

            // Auto-remove after delay (longer for persistent messages)
            const removeDelay = persistent ? 15000 : 6000;
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.remove();
                    console.log('Theme error message auto-removed after timeout');
                }
            }, removeDelay);

        } catch (error) {
            console.error('Error showing user error message:', error);
            
            // Ultimate fallback: use console and alert
            console.warn(`THEME ERROR (could not display UI): ${message}`);
            
            try {
                // Only use alert for critical errors to avoid annoying users
                if (persistent && typeof alert === 'function') {
                    alert(`Theme System Error: ${message}`);
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

    /**
     * Performance Monitoring and Optimization Methods
     */

    /**
     * Track theme change performance metrics
     * @param {string} newTheme - New theme name
     * @param {string} previousTheme - Previous theme name
     */
    _trackThemeChangePerformance(newTheme, previousTheme) {
        try {
            const now = performance.now();
            const changeTime = now - (this._performanceMetrics.lastChangeTime || now);
            
            this._performanceMetrics.themeChanges++;
            this._performanceMetrics.lastChangeTime = now;
            
            // Calculate rolling average of change times
            if (this._performanceMetrics.themeChanges === 1) {
                this._performanceMetrics.averageChangeTime = changeTime;
            } else {
                this._performanceMetrics.averageChangeTime = 
                    (this._performanceMetrics.averageChangeTime * 0.8) + (changeTime * 0.2);
            }
            
            // Monitor memory usage if available
            if (performance.memory) {
                this._performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
            }
            
            // Log performance warnings if theme changes are slow
            if (changeTime > 500) { // More than 500ms
                console.warn(`Slow theme change detected: ${changeTime.toFixed(2)}ms`);
            }
            
            // Log performance summary every 10 theme changes
            if (this._performanceMetrics.themeChanges % 10 === 0) {
                this._logPerformanceSummary();
            }
            
        } catch (error) {
            console.error('Error tracking theme performance:', error);
        }
    }

    /**
     * Log performance summary
     */
    _logPerformanceSummary() {
        try {
            const metrics = this._performanceMetrics;
            console.log('Theme System Performance Summary:', {
                totalChanges: metrics.themeChanges,
                averageChangeTime: `${metrics.averageChangeTime.toFixed(2)}ms`,
                memoryUsage: metrics.memoryUsage ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A',
                currentTheme: this.currentTheme
            });
        } catch (error) {
            console.error('Error logging performance summary:', error);
        }
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return {
            ...this._performanceMetrics,
            memoryUsageFormatted: this._performanceMetrics.memoryUsage ? 
                `${(this._performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A'
        };
    }

    /**
     * Optimize theme system performance
     */
    optimizePerformance() {
        try {
            // Clear any pending timeouts
            this._clearTimeouts();
            
            // Force garbage collection if available (development only)
            if (window.gc && typeof window.gc === 'function') {
                window.gc();
                console.log('Forced garbage collection for theme system');
            }
            
            // Clear cached DOM queries
            this._clearDOMCache();
            
            // Reset performance metrics
            this._performanceMetrics = {
                themeChanges: 0,
                averageChangeTime: 0,
                lastChangeTime: 0,
                memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0
            };
            
            console.log('Theme system performance optimized');
            return true;
            
        } catch (error) {
            console.error('Error optimizing theme performance:', error);
            return false;
        }
    }

    /**
     * Handle visibility change to optimize performance when tab is hidden
     */
    _handleVisibilityChange() {
        try {
            if (document.hidden) {
                // Tab is hidden, reduce performance overhead
                this._pausePerformanceMonitoring();
            } else {
                // Tab is visible, resume normal operation
                this._resumePerformanceMonitoring();
            }
        } catch (error) {
            console.error('Error handling visibility change:', error);
        }
    }

    /**
     * Handle memory pressure events
     */
    _handleMemoryPressure() {
        try {
            console.log('Memory pressure detected, optimizing theme system...');
            this.optimizePerformance();
        } catch (error) {
            console.error('Error handling memory pressure:', error);
        }
    }

    /**
     * Pause performance monitoring when tab is hidden
     */
    _pausePerformanceMonitoring() {
        this._performanceMonitoringPaused = true;
    }

    /**
     * Resume performance monitoring when tab becomes visible
     */
    _resumePerformanceMonitoring() {
        this._performanceMonitoringPaused = false;
        this._performanceMetrics.lastChangeTime = performance.now();
    }

    /**
     * Clear all timeouts to prevent memory leaks
     */
    _clearTimeouts() {
        try {
            if (this._themeChangeTimeout) {
                clearTimeout(this._themeChangeTimeout);
                this._themeChangeTimeout = null;
            }
            
            this._timeouts.forEach(timeout => {
                if (timeout) {
                    clearTimeout(timeout);
                }
            });
            this._timeouts = [];
            
        } catch (error) {
            console.error('Error clearing timeouts:', error);
        }
    }

    /**
     * Clear DOM cache to free memory
     */
    _clearDOMCache() {
        try {
            // Clear any cached DOM references
            this._cachedElements = null;
            
            // Clear cached storage availability
            this._storageAvailable = undefined;
            this._cssSupported = undefined;
            
        } catch (error) {
            console.error('Error clearing DOM cache:', error);
        }
    }

    /**
     * Setup performance monitoring event listeners
     */
    _setupPerformanceMonitoring() {
        try {
            // Monitor page visibility changes
            if (typeof document.addEventListener === 'function') {
                document.addEventListener('visibilitychange', this._boundHandleVisibilityChange);
                this._eventListeners.push({
                    element: document,
                    event: 'visibilitychange',
                    handler: this._boundHandleVisibilityChange
                });
            }
            
            // Monitor memory pressure if supported
            if ('memory' in performance && 'addEventListener' in window) {
                window.addEventListener('memory-pressure', this._boundHandleMemoryPressure);
                this._eventListeners.push({
                    element: window,
                    event: 'memory-pressure',
                    handler: this._boundHandleMemoryPressure
                });
            }
            
        } catch (error) {
            console.error('Error setting up performance monitoring:', error);
        }
    }

    /**
     * Cleanup all resources and event listeners
     */
    cleanup() {
        try {
            console.log('Cleaning up theme system resources...');
            
            // Clear all timeouts
            this._clearTimeouts();
            
            // Remove all event listeners
            this._eventListeners.forEach(({ element, event, handler }) => {
                try {
                    element.removeEventListener(event, handler);
                } catch (error) {
                    console.warn('Error removing event listener:', error);
                }
            });
            this._eventListeners = [];
            
            // Clear DOM cache
            this._clearDOMCache();
            
            // Clear error callbacks
            this.errorCallbacks = [];
            
            // Reset state
            this.initialized = false;
            
            console.log('Theme system cleanup completed');
            return true;
            
        } catch (error) {
            console.error('Error during theme system cleanup:', error);
            return false;
        }
    }

    /**
     * Test theme system performance
     * @param {number} iterations - Number of test iterations
     * @returns {Object} Performance test results
     */
    async testPerformance(iterations = 10) {
        try {
            console.log(`Starting theme system performance test with ${iterations} iterations...`);
            
            const themes = Object.keys(this.themes);
            const results = {
                totalTime: 0,
                averageTime: 0,
                minTime: Infinity,
                maxTime: 0,
                iterations: iterations,
                errors: 0
            };
            
            const originalTheme = this.currentTheme;
            
            for (let i = 0; i < iterations; i++) {
                const testTheme = themes[i % themes.length];
                const startTime = performance.now();
                
                try {
                    await new Promise(resolve => {
                        this.setTheme(testTheme);
                        requestAnimationFrame(() => {
                            requestAnimationFrame(resolve);
                        });
                    });
                    
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    results.totalTime += duration;
                    results.minTime = Math.min(results.minTime, duration);
                    results.maxTime = Math.max(results.maxTime, duration);
                    
                } catch (error) {
                    results.errors++;
                    console.error(`Performance test error on iteration ${i}:`, error);
                }
            }
            
            // Restore original theme
            this.setTheme(originalTheme);
            
            results.averageTime = results.totalTime / iterations;
            
            console.log('Theme System Performance Test Results:', {
                ...results,
                totalTime: `${results.totalTime.toFixed(2)}ms`,
                averageTime: `${results.averageTime.toFixed(2)}ms`,
                minTime: `${results.minTime.toFixed(2)}ms`,
                maxTime: `${results.maxTime.toFixed(2)}ms`
            });
            
            return results;
            
        } catch (error) {
            console.error('Error running performance test:', error);
            return null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
} else if (typeof window !== 'undefined') {
    // Create and export theme manager instance for browser
    const themeManager = new ThemeManager();
    window.themeManager = themeManager;
    window.ThemeManager = ThemeManager;
}