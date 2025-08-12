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
        
        // Enhanced measurement caching system for performance optimization
        this._measurementCache = {
            elements: new Map(), // Cache for element measurements
            viewport: null,      // Cache for viewport dimensions
            lastUpdate: 0,       // Timestamp of last cache update
            maxAge: 100,         // Cache validity in milliseconds (Requirements 1.2, 4.4)
            hitCount: 0,         // Cache hit counter
            missCount: 0,        // Cache miss counter
            invalidationCount: 0 // Track cache invalidations
        };
        
        // Cache invalidation triggers and performance monitoring
        this._cacheInvalidationListeners = [];
        this._lastLayoutChangeTime = 0;
        this._resizeObserver = null;
        this._mutationObserver = null;
        
        // Debounced event handling system (Requirements 2.4, 2.5)
        this._debouncedHandlers = new Map();
        this._throttledHandlers = new Map();
        this._eventTimeouts = new Map();
        this._eventThrottles = new Map();
    }

    /**
     * Initialize measurement caching system
     * Implements requirements 1.2, 4.4 - Cache frequently used element measurements
     */
    _initializeMeasurementCaching() {
        try {
            // Set up ResizeObserver for automatic cache invalidation on layout changes
            if (window.ResizeObserver) {
                this._resizeObserver = new ResizeObserver((entries) => {
                    this._invalidateMeasurementCache('resize');
                });
                
                // Observe key elements that affect dropdown positioning
                const elementsToObserve = [
                    document.documentElement,
                    document.body,
                    document.querySelector('header'),
                    document.querySelector('.task-list-section'),
                    document.querySelector('.theme-dropdown')
                ].filter(Boolean);
                
                elementsToObserve.forEach(element => {
                    this._resizeObserver.observe(element);
                });
            }
            
            // Set up MutationObserver for DOM changes that affect layout
            if (window.MutationObserver) {
                this._mutationObserver = new MutationObserver((mutations) => {
                    let shouldInvalidate = false;
                    
                    mutations.forEach(mutation => {
                        // Check for changes that affect layout
                        if (mutation.type === 'childList' || 
                            (mutation.type === 'attributes' && 
                             ['class', 'style', 'data-theme'].includes(mutation.attributeName))) {
                            shouldInvalidate = true;
                        }
                    });
                    
                    if (shouldInvalidate) {
                        this._invalidateMeasurementCache('mutation');
                    }
                });
                
                this._mutationObserver.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class', 'style', 'data-theme']
                });
            }
            
            console.log('Measurement caching system initialized');
            
        } catch (error) {
            console.warn('Failed to initialize measurement caching:', error);
        }
    }

    /**
     * Get cached element measurements or compute and cache new ones
     * Implements requirements 1.2, 4.4 - Optimize DOM queries to minimize layout thrashing
     * @param {string|HTMLElement} elementSelector - CSS selector or element
     * @param {boolean} forceRefresh - Force cache refresh
     * @returns {DOMRect|null} - Element bounding rect
     */
    getCachedElementMeasurements(elementSelector, forceRefresh = false) {
        try {
            const element = typeof elementSelector === 'string' 
                ? document.querySelector(elementSelector) 
                : elementSelector;
                
            if (!element) {
                return null;
            }
            
            const elementKey = typeof elementSelector === 'string' 
                ? elementSelector 
                : element.tagName + (element.id ? '#' + element.id : '') + 
                  (element.className ? '.' + element.className.split(' ').join('.') : '');
            
            const now = performance.now();
            const cached = this._measurementCache.elements.get(elementKey);
            
            // Check if cache is valid and not forced refresh
            if (!forceRefresh && cached && 
                (now - cached.timestamp) < this._measurementCache.maxAge) {
                this._measurementCache.hitCount++;
                return cached.rect;
            }
            
            // Cache miss - compute new measurements
            this._measurementCache.missCount++;
            const rect = element.getBoundingClientRect();
            
            // Store in cache with timestamp
            this._measurementCache.elements.set(elementKey, {
                rect: {
                    top: rect.top,
                    left: rect.left,
                    right: rect.right,
                    bottom: rect.bottom,
                    width: rect.width,
                    height: rect.height,
                    x: rect.x,
                    y: rect.y
                },
                timestamp: now
            });
            
            this._measurementCache.lastUpdate = now;
            return rect;
            
        } catch (error) {
            console.warn('Error getting cached measurements:', error);
            return null;
        }
    }

    /**
     * Get cached viewport dimensions
     * Implements requirements 1.2, 4.4 - Cache frequently used measurements
     * @param {boolean} forceRefresh - Force cache refresh
     * @returns {Object} - Viewport dimensions
     */
    getCachedViewportDimensions(forceRefresh = false) {
        try {
            const now = performance.now();
            
            // Check if cache is valid and not forced refresh
            if (!forceRefresh && this._measurementCache.viewport && 
                (now - this._measurementCache.viewport.timestamp) < this._measurementCache.maxAge) {
                this._measurementCache.hitCount++;
                return this._measurementCache.viewport.dimensions;
            }
            
            // Cache miss - compute new dimensions
            this._measurementCache.missCount++;
            const dimensions = {
                width: window.innerWidth,
                height: window.innerHeight,
                scrollX: window.scrollX || window.pageXOffset,
                scrollY: window.scrollY || window.pageYOffset
            };
            
            // Store in cache with timestamp
            this._measurementCache.viewport = {
                dimensions,
                timestamp: now
            };
            
            this._measurementCache.lastUpdate = now;
            return dimensions;
            
        } catch (error) {
            console.warn('Error getting cached viewport dimensions:', error);
            return {
                width: window.innerWidth || 0,
                height: window.innerHeight || 0,
                scrollX: 0,
                scrollY: 0
            };
        }
    }

    /**
     * Invalidate measurement cache
     * Implements requirements 1.2, 4.4 - Add cache invalidation on layout changes
     * @param {string} reason - Reason for invalidation
     */
    _invalidateMeasurementCache(reason = 'manual') {
        try {
            const cacheSize = this._measurementCache.elements.size;
            
            // Clear element measurements cache
            this._measurementCache.elements.clear();
            
            // Clear viewport cache
            this._measurementCache.viewport = null;
            
            // Update invalidation tracking
            this._measurementCache.invalidationCount++;
            this._lastLayoutChangeTime = performance.now();
            
            // Log cache invalidation for debugging
            if (cacheSize > 0) {
                console.log(`Measurement cache invalidated (${reason}): ${cacheSize} entries cleared`);
            }
            
        } catch (error) {
            console.warn('Error invalidating measurement cache:', error);
        }
    }

    /**
     * Get measurement cache statistics
     * @returns {Object} - Cache performance statistics
     */
    getMeasurementCacheStats() {
        const hitRate = this._measurementCache.hitCount + this._measurementCache.missCount > 0
            ? (this._measurementCache.hitCount / (this._measurementCache.hitCount + this._measurementCache.missCount) * 100).toFixed(2)
            : 0;
            
        return {
            hitCount: this._measurementCache.hitCount,
            missCount: this._measurementCache.missCount,
            hitRate: `${hitRate}%`,
            cacheSize: this._measurementCache.elements.size,
            invalidationCount: this._measurementCache.invalidationCount,
            lastUpdate: this._measurementCache.lastUpdate,
            maxAge: this._measurementCache.maxAge
        };
    }

    /**
     * Get performance optimization statistics
     * Implements requirements 1.2, 4.4 - Performance monitoring for optimizations
     * @returns {Object} - Performance statistics
     */
    getPerformanceOptimizationStats() {
        const cacheStats = this.getMeasurementCacheStats();
        
        return {
            measurementCaching: cacheStats,
            debouncedEvents: {
                activeHandlers: this._debouncedHandlers.size,
                activeTimeouts: this._eventTimeouts.size,
                throttledHandlers: this._throttledHandlers.size,
                activeThrottles: this._eventThrottles.size
            },
            observers: {
                resizeObserver: !!this._resizeObserver,
                mutationObserver: !!this._mutationObserver
            },
            lastLayoutChange: this._lastLayoutChangeTime,
            timeSinceLastLayoutChange: this._lastLayoutChangeTime ? 
                performance.now() - this._lastLayoutChangeTime : 0
        };
    }

    /**
     * Log performance optimization statistics (for debugging)
     */
    logPerformanceStats() {
        try {
            const stats = this.getPerformanceOptimizationStats();
            console.group('Theme Manager Performance Optimization Stats');
            console.log('Measurement Caching:', stats.measurementCaching);
            console.log('Debounced Events:', stats.debouncedEvents);
            console.log('Observers:', stats.observers);
            console.log('Layout Changes:', {
                lastChange: stats.lastLayoutChange,
                timeSince: `${stats.timeSinceLastLayoutChange.toFixed(2)}ms`
            });
            console.groupEnd();
        } catch (error) {
            console.warn('Error logging performance stats:', error);
        }
    }

    /**
     * Create a debounced function
     * Implements requirements 2.4, 2.5 - Implement debounced resize event handler
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @param {string} key - Unique key for the debounced function
     * @returns {Function} - Debounced function
     */
    _createDebouncedHandler(func, delay = 250, key = 'default') {
        return (...args) => {
            // Clear existing timeout
            const existingTimeout = this._eventTimeouts.get(key);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }
            
            // Set new timeout
            const timeout = setTimeout(() => {
                func.apply(this, args);
                this._eventTimeouts.delete(key);
            }, delay);
            
            this._eventTimeouts.set(key, timeout);
        };
    }

    /**
     * Create a throttled function
     * Implements requirements 2.4, 2.5 - Add throttled scroll event handling if needed
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @param {string} key - Unique key for the throttled function
     * @returns {Function} - Throttled function
     */
    _createThrottledHandler(func, limit = 100, key = 'default') {
        return (...args) => {
            const now = performance.now();
            const lastCall = this._eventThrottles.get(key) || 0;
            
            if (now - lastCall >= limit) {
                this._eventThrottles.set(key, now);
                func.apply(this, args);
            }
        };
    }

    /**
     * Debounced resize handler for theme dropdown positioning
     * Implements requirements 2.4, 2.5 - Optimize positioning calculations for smooth performance
     */
    _handleDebouncedResize() {
        try {
            // Invalidate measurement cache
            this._invalidateMeasurementCache('debounced-resize');
            
            // Update dropdown positioning if dropdown is open
            const dropdown = document.querySelector('.theme-dropdown');
            if (dropdown && dropdown.style.display !== 'none') {
                const positioningResult = this.calculateDropdownPosition();
                if (positioningResult.success) {
                    this._applyPositioning(dropdown, positioningResult);
                }
            }
            
            // Log performance metrics
            const cacheStats = this.getMeasurementCacheStats();
            console.log('Resize handled - Cache stats:', cacheStats);
            
        } catch (error) {
            console.warn('Error in debounced resize handler:', error);
        }
    }

    /**
     * Throttled scroll handler for dropdown positioning updates
     * Implements requirements 2.4, 2.5 - Add throttled scroll event handling if needed
     */
    _handleThrottledScroll() {
        try {
            // Only handle scroll if dropdown is open and visible
            const dropdown = document.querySelector('.theme-dropdown');
            if (!dropdown || dropdown.style.display === 'none') {
                return;
            }
            
            // Check if dropdown position needs adjustment due to scroll
            const viewport = this.getCachedViewportDimensions(true); // Force refresh for scroll
            const dropdownRect = this.getBoundingRectSafe(dropdown, false); // Don't use cache for scroll
            
            if (dropdownRect) {
                // Check if dropdown is still within viewport
                const isInViewport = dropdownRect.top >= 0 && 
                                   dropdownRect.left >= 0 && 
                                   dropdownRect.bottom <= viewport.height && 
                                   dropdownRect.right <= viewport.width;
                
                if (!isInViewport) {
                    // Recalculate positioning
                    const positioningResult = this.calculateDropdownPosition();
                    if (positioningResult.success) {
                        this._applyPositioning(dropdown, positioningResult);
                    }
                }
            }
            
        } catch (error) {
            console.warn('Error in throttled scroll handler:', error);
        }
    }

    /**
     * Initialize debounced event handlers
     * Implements requirements 2.4, 2.5 - Implement debounced resize event handler
     */
    _initializeDebouncedEventHandlers() {
        try {
            // Create debounced resize handler (250ms delay for smooth performance)
            const debouncedResize = this._createDebouncedHandler(
                this._handleDebouncedResize, 
                250, 
                'viewport-resize'
            );
            
            // Create throttled scroll handler (100ms limit for responsiveness)
            const throttledScroll = this._createThrottledHandler(
                this._handleThrottledScroll, 
                100, 
                'viewport-scroll'
            );
            
            // Store handlers for cleanup
            this._debouncedHandlers.set('resize', debouncedResize);
            this._throttledHandlers.set('scroll', throttledScroll);
            
            // Add event listeners with passive option for better performance
            window.addEventListener('resize', debouncedResize, { passive: true });
            window.addEventListener('scroll', throttledScroll, { passive: true });
            
            // Handle orientation changes on mobile devices (Requirements 2.4, 2.5)
            if ('orientation' in window) {
                const debouncedOrientationChange = this._createDebouncedHandler(
                    () => {
                        // Orientation change often triggers resize, but add extra handling
                        this._invalidateMeasurementCache('orientation-change');
                        setTimeout(() => this._handleDebouncedResize(), 100);
                    },
                    300,
                    'orientation-change'
                );
                
                window.addEventListener('orientationchange', debouncedOrientationChange, { passive: true });
                this._debouncedHandlers.set('orientationchange', debouncedOrientationChange);
            }
            
            // Handle visual viewport changes (modern browsers, mobile keyboards)
            if ('visualViewport' in window) {
                const debouncedVisualViewportResize = this._createDebouncedHandler(
                    () => {
                        this._invalidateMeasurementCache('visual-viewport-change');
                        this._handleDebouncedResize();
                    },
                    200,
                    'visual-viewport-resize'
                );
                
                window.visualViewport.addEventListener('resize', debouncedVisualViewportResize);
                this._debouncedHandlers.set('visualViewport', debouncedVisualViewportResize);
            }
            
            console.log('Debounced event handlers initialized');
            
        } catch (error) {
            console.warn('Failed to initialize debounced event handlers:', error);
        }
    }

    /**
     * Apply positioning results to dropdown element
     * @param {HTMLElement} dropdown - Dropdown element
     * @param {Object} positioningResult - Result from calculateDropdownPosition
     */
    _applyPositioning(dropdown, positioningResult) {
        try {
            if (!dropdown || !positioningResult.success) {
                return;
            }
            
            // Apply the recommended positioning strategy
            const strategy = positioningResult.recommendation;
            
            // Remove existing positioning classes
            dropdown.classList.remove('position-left', 'position-center', 'position-right');
            
            // Apply new positioning class based on strategy
            switch (strategy) {
                case 'left-aligned':
                    dropdown.classList.add('position-left');
                    break;
                case 'center-aligned':
                    dropdown.classList.add('position-center');
                    break;
                case 'collision-aware':
                    // Apply specific positioning based on collision avoidance
                    if (positioningResult.adjustments) {
                        if (positioningResult.adjustments.alignLeft) {
                            dropdown.classList.add('position-left');
                        } else if (positioningResult.adjustments.center) {
                            dropdown.classList.add('position-center');
                        }
                    }
                    break;
                default:
                    // Standard positioning - no additional classes needed
                    break;
            }
            
            // Apply any custom positioning styles if needed
            if (positioningResult.styles) {
                Object.assign(dropdown.style, positioningResult.styles);
            }
            
        } catch (error) {
            console.warn('Error applying positioning:', error);
        }
    }

    /**
     * Clean up debounced event handlers
     */
    _cleanupDebouncedEventHandlers() {
        try {
            // Clear all timeouts
            this._eventTimeouts.forEach(timeout => clearTimeout(timeout));
            this._eventTimeouts.clear();
            
            // Clear throttle tracking
            this._eventThrottles.clear();
            
            // Remove event listeners
            const resizeHandler = this._debouncedHandlers.get('resize');
            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler);
            }
            
            const scrollHandler = this._throttledHandlers.get('scroll');
            if (scrollHandler) {
                window.removeEventListener('scroll', scrollHandler);
            }
            
            const orientationHandler = this._debouncedHandlers.get('orientationchange');
            if (orientationHandler) {
                window.removeEventListener('orientationchange', orientationHandler);
            }
            
            const visualViewportHandler = this._debouncedHandlers.get('visualViewport');
            if (visualViewportHandler && 'visualViewport' in window) {
                window.visualViewport.removeEventListener('resize', visualViewportHandler);
            }
            
            // Clear handler maps
            this._debouncedHandlers.clear();
            this._throttledHandlers.clear();
            
            console.log('Debounced event handlers cleaned up');
            
        } catch (error) {
            console.warn('Error cleaning up debounced event handlers:', error);
        }
    }

    /**
     * Clean up measurement caching resources
     */
    _cleanupMeasurementCaching() {
        try {
            if (this._resizeObserver) {
                this._resizeObserver.disconnect();
                this._resizeObserver = null;
            }
            
            if (this._mutationObserver) {
                this._mutationObserver.disconnect();
                this._mutationObserver = null;
            }
            
            this._invalidateMeasurementCache('cleanup');
            
        } catch (error) {
            console.warn('Error cleaning up measurement caching:', error);
        }
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
            
            // Initialize measurement caching system (Requirements 1.2, 4.4)
            this._initializeMeasurementCaching();
            
            // Initialize debounced event handlers (Requirements 2.4, 2.5)
            this._initializeDebouncedEventHandlers();
            
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
     * Collision Detection System
     * Implements requirements 1.1, 1.5, 3.4
     */

    /**
     * Get bounding rectangle safely with error handling and caching
     * @param {Element} element - DOM element to measure
     * @param {boolean} useCache - Whether to use cached measurements (default: true)
     * @returns {DOMRect|null} - Bounding rectangle or null if measurement fails
     */
    getBoundingRectSafe(element, useCache = true) {
        try {
            if (!element || typeof element.getBoundingClientRect !== 'function') {
                console.warn('Invalid element provided to getBoundingRectSafe');
                return null;
            }

            // Check if element is in the DOM
            if (!document.contains(element)) {
                console.warn('Element is not in the DOM');
                return null;
            }

            // Try to get from cache first if caching is enabled (Requirements 1.2, 4.4)
            if (useCache) {
                const cachedRect = this.getCachedElementMeasurements(element);
                if (cachedRect) {
                    return cachedRect;
                }
            }
            const rect = element.getBoundingClientRect();
            
            // Validate the returned rectangle
            if (typeof rect.top !== 'number' || 
                typeof rect.left !== 'number' || 
                typeof rect.width !== 'number' || 
                typeof rect.height !== 'number') {
                console.warn('Invalid bounding rectangle returned');
                return null;
            }

            // Check for degenerate rectangles (zero or negative dimensions)
            if (rect.width <= 0 || rect.height <= 0) {
                console.warn('Element has zero or negative dimensions');
                return null;
            }

            // Cache the measurement using enhanced caching system (Requirements 1.2, 4.4)
            if (useCache) {
                // The getCachedElementMeasurements method already handles caching
                // when it performs a cache miss, so we don't need to explicitly cache here
            }

            return rect;

        } catch (error) {
            console.error('Error getting bounding rectangle:', error);
            return null;
        }
    }

    /**
     * Detect collisions between dropdown and other page elements
     * @param {DOMRect} dropdownRect - Dropdown bounding rectangle
     * @param {Array} obstacles - Array of obstacle elements to check against
     * @returns {Object} - Collision detection results
     */
    detectCollisions(dropdownRect, obstacles = []) {
        try {
            if (!dropdownRect) {
                console.warn('No dropdown rectangle provided for collision detection');
                return { hasCollisions: false, collisions: [] };
            }

            const collisions = [];
            const defaultObstacles = [
                '.task-list-section',
                '.suggestions-section', 
                '.progress-section'
            ];

            // Use provided obstacles or default ones
            const obstacleSelectors = obstacles.length > 0 ? obstacles : defaultObstacles;

            obstacleSelectors.forEach(selector => {
                try {
                    const element = document.querySelector(selector);
                    if (!element) {
                        return; // Skip if element not found
                    }

                    const obstacleRect = this.getBoundingRectSafe(element);
                    if (!obstacleRect) {
                        return; // Skip if measurement failed
                    }

                    // Check for overlap using standard rectangle intersection algorithm
                    const hasOverlap = !(
                        dropdownRect.right <= obstacleRect.left ||
                        dropdownRect.left >= obstacleRect.right ||
                        dropdownRect.bottom <= obstacleRect.top ||
                        dropdownRect.top >= obstacleRect.bottom
                    );

                    if (hasOverlap) {
                        // Calculate overlap area for priority assessment
                        const overlapLeft = Math.max(dropdownRect.left, obstacleRect.left);
                        const overlapRight = Math.min(dropdownRect.right, obstacleRect.right);
                        const overlapTop = Math.max(dropdownRect.top, obstacleRect.top);
                        const overlapBottom = Math.min(dropdownRect.bottom, obstacleRect.bottom);
                        
                        const overlapWidth = overlapRight - overlapLeft;
                        const overlapHeight = overlapBottom - overlapTop;
                        const overlapArea = overlapWidth * overlapHeight;

                        collisions.push({
                            element: element,
                            selector: selector,
                            obstacleRect: obstacleRect,
                            overlapArea: overlapArea,
                            overlapPercentage: (overlapArea / (dropdownRect.width * dropdownRect.height)) * 100,
                            priority: this._getObstaclePriority(selector)
                        });
                    }

                } catch (elementError) {
                    console.warn(`Error checking collision with ${selector}:`, elementError);
                }
            });

            // Sort collisions by priority and overlap area
            collisions.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return b.priority - a.priority; // Higher priority first
                }
                return b.overlapArea - a.overlapArea; // Larger overlap first
            });

            return {
                hasCollisions: collisions.length > 0,
                collisions: collisions,
                totalCollisions: collisions.length,
                highestPriorityCollision: collisions[0] || null
            };

        } catch (error) {
            console.error('Error in collision detection:', error);
            return { hasCollisions: false, collisions: [], error: error.message };
        }
    }

    /**
     * Get priority level for different obstacle types
     * @param {string} selector - CSS selector for the obstacle
     * @returns {number} - Priority level (higher = more important to avoid)
     */
    _getObstaclePriority(selector) {
        const priorityMap = {
            '.task-list-section': 10, // Highest priority - main content area
            '.suggestions-section': 5, // Medium priority
            '.progress-section': 3,   // Lower priority
            '.task-form-section': 2   // Lowest priority
        };

        return priorityMap[selector] || 1;
    }

    /**
     * Measurement Caching System
     * Implements requirement 1.2, 4.4 - Cache frequently used element measurements
     */

    /**
     * Get cached element measurement if available and valid
     * @param {Element} element - DOM element
     * @returns {DOMRect|null} - Cached measurement or null if not available/expired
     */
    _getCachedElementMeasurement(element) {
        try {
            if (!this._isCacheValid()) {
                return null;
            }

            // Generate cache key based on element characteristics
            const cacheKey = this._generateElementCacheKey(element);
            if (!cacheKey) {
                return null;
            }

            const cachedData = this._measurementCache.elements.get(cacheKey);
            if (!cachedData) {
                return null;
            }

            // Check if cached data is still valid
            const now = performance.now();
            if (now - cachedData.timestamp > this._measurementCache.maxAge) {
                this._measurementCache.elements.delete(cacheKey);
                return null;
            }

            // Verify element hasn't changed significantly
            if (!this._isElementUnchanged(element, cachedData.elementState)) {
                this._measurementCache.elements.delete(cacheKey);
                return null;
            }

            return cachedData.rect;

        } catch (error) {
            console.error('Error retrieving cached measurement:', error);
            return null;
        }
    }

    /**
     * Cache element measurement
     * @param {Element} element - DOM element
     * @param {DOMRect} rect - Bounding rectangle to cache
     */
    _cacheElementMeasurement(element, rect) {
        try {
            const cacheKey = this._generateElementCacheKey(element);
            if (!cacheKey) {
                return;
            }

            // Create a copy of the rect to avoid reference issues
            const rectCopy = {
                top: rect.top,
                left: rect.left,
                right: rect.right,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height,
                x: rect.x,
                y: rect.y
            };

            // Store element state for validation
            const elementState = this._captureElementState(element);

            this._measurementCache.elements.set(cacheKey, {
                rect: rectCopy,
                timestamp: performance.now(),
                elementState: elementState
            });

            // Limit cache size to prevent memory leaks
            if (this._measurementCache.elements.size > 50) {
                this._cleanupOldCacheEntries();
            }

        } catch (error) {
            console.error('Error caching element measurement:', error);
        }
    }

    /**
     * Generate cache key for element
     * @param {Element} element - DOM element
     * @returns {string|null} - Cache key or null if element can't be cached
     */
    _generateElementCacheKey(element) {
        try {
            // Use element ID if available
            if (element.id) {
                return `id:${element.id}`;
            }

            // Use class name for common elements
            if (element.className && typeof element.className === 'string') {
                const classes = element.className.trim().split(/\s+/).sort().join(' ');
                if (classes) {
                    return `class:${classes}:${element.tagName}`;
                }
            }

            // Use tag name and position for generic elements
            const parent = element.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children);
                const index = siblings.indexOf(element);
                return `tag:${element.tagName}:${index}:${parent.tagName}`;
            }

            return null;

        } catch (error) {
            console.error('Error generating cache key:', error);
            return null;
        }
    }

    /**
     * Capture element state for cache validation
     * @param {Element} element - DOM element
     * @returns {Object} - Element state snapshot
     */
    _captureElementState(element) {
        try {
            return {
                tagName: element.tagName,
                className: element.className,
                offsetWidth: element.offsetWidth,
                offsetHeight: element.offsetHeight,
                scrollTop: element.scrollTop,
                scrollLeft: element.scrollLeft,
                parentChanged: element.parentElement ? element.parentElement.tagName : null
            };
        } catch (error) {
            console.error('Error capturing element state:', error);
            return {};
        }
    }

    /**
     * Check if element state has changed significantly
     * @param {Element} element - Current element
     * @param {Object} cachedState - Previously cached state
     * @returns {boolean} - True if element appears unchanged
     */
    _isElementUnchanged(element, cachedState) {
        try {
            if (!cachedState) {
                return false;
            }

            const currentState = this._captureElementState(element);
            
            // Check critical properties that would affect measurements
            return (
                currentState.tagName === cachedState.tagName &&
                currentState.className === cachedState.className &&
                currentState.offsetWidth === cachedState.offsetWidth &&
                currentState.offsetHeight === cachedState.offsetHeight &&
                currentState.parentChanged === cachedState.parentChanged
            );

        } catch (error) {
            console.error('Error checking element state:', error);
            return false;
        }
    }

    /**
     * Check if measurement cache is valid
     * @returns {boolean} - True if cache can be used
     */
    _isCacheValid() {
        const now = performance.now();
        
        // Check if cache has expired globally
        if (now - this._measurementCache.lastUpdate > this._measurementCache.maxAge * 10) {
            this._invalidateMeasurementCache();
            return false;
        }

        // Check if layout has changed recently
        if (this._lastLayoutChangeTime > this._measurementCache.lastUpdate) {
            this._invalidateMeasurementCache();
            return false;
        }

        return true;
    }

    /**
     * Clean up old cache entries to prevent memory leaks
     */
    _cleanupOldCacheEntries() {
        try {
            const now = performance.now();
            const maxAge = this._measurementCache.maxAge;
            
            for (const [key, data] of this._measurementCache.elements.entries()) {
                if (now - data.timestamp > maxAge) {
                    this._measurementCache.elements.delete(key);
                }
            }

        } catch (error) {
            console.error('Error cleaning up cache entries:', error);
        }
    }

    /**
     * Invalidate measurement cache
     * @param {string} reason - Reason for invalidation (for debugging)
     */
    _invalidateMeasurementCache(reason = 'unknown') {
        try {
            this._measurementCache.elements.clear();
            this._measurementCache.viewport = null;
            this._measurementCache.lastUpdate = performance.now();
            
            console.log(`Measurement cache invalidated: ${reason}`);

        } catch (error) {
            console.error('Error invalidating measurement cache:', error);
        }
    }

    /**
     * Get cached viewport dimensions
     * @returns {Object|null} - Cached viewport dimensions or null
     */
    _getCachedViewportDimensions() {
        try {
            if (!this._isCacheValid() || !this._measurementCache.viewport) {
                return null;
            }

            const now = performance.now();
            if (now - this._measurementCache.viewport.timestamp > this._measurementCache.maxAge) {
                this._measurementCache.viewport = null;
                return null;
            }

            this._measurementCache.hitCount++;
            return {
                width: this._measurementCache.viewport.width,
                height: this._measurementCache.viewport.height
            };

        } catch (error) {
            console.error('Error getting cached viewport dimensions:', error);
            return null;
        }
    }

    /**
     * Cache viewport dimensions
     * @param {number} width - Viewport width
     * @param {number} height - Viewport height
     */
    _cacheViewportDimensions(width, height) {
        try {
            this._measurementCache.viewport = {
                width: width,
                height: height,
                timestamp: performance.now()
            };

        } catch (error) {
            console.error('Error caching viewport dimensions:', error);
        }
    }

    /**
     * Get viewport dimensions with caching
     * @returns {Object} - Viewport dimensions {width, height}
     */
    _getViewportDimensions() {
        try {
            // Use enhanced caching system (Requirements 1.2, 4.4)
            const cached = this.getCachedViewportDimensions();
            if (cached) {
                return { width: cached.width, height: cached.height };
            }

            // Fallback for cache miss (should not happen with enhanced caching)
            console.warn('Viewport dimensions cache miss - this should not happen');
            return { width: window.innerWidth || 1024, height: window.innerHeight || 768 };

        } catch (error) {
            console.error('Error getting viewport dimensions:', error);
            return { width: 1024, height: 768 }; // Fallback dimensions
        }
    }

    /**
     * Setup cache invalidation listeners
     * Implements requirement 4.4 - Add cache invalidation on layout changes
     */
    _setupCacheInvalidation() {
        try {
            // Invalidate cache on window resize
            const resizeHandler = () => {
                this._lastLayoutChangeTime = performance.now();
                this._invalidateMeasurementCache('window resize');
            };

            // Invalidate cache on DOM mutations that could affect layout
            const mutationHandler = (mutations) => {
                let shouldInvalidate = false;
                
                mutations.forEach(mutation => {
                    // Check for attribute changes that affect layout
                    if (mutation.type === 'attributes') {
                        const affectsLayout = ['class', 'style', 'id'].includes(mutation.attributeName);
                        if (affectsLayout) {
                            shouldInvalidate = true;
                        }
                    }
                    
                    // Check for DOM structure changes
                    if (mutation.type === 'childList' && 
                        (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                        shouldInvalidate = true;
                    }
                });

                if (shouldInvalidate) {
                    this._lastLayoutChangeTime = performance.now();
                    this._invalidateMeasurementCache('DOM mutation');
                }
            };

            // Add event listeners
            window.addEventListener('resize', resizeHandler, { passive: true });
            this._cacheInvalidationListeners.push({ type: 'resize', handler: resizeHandler });

            // Setup mutation observer for DOM changes
            if (typeof MutationObserver !== 'undefined') {
                const observer = new MutationObserver(mutationHandler);
                observer.observe(document.body, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    attributeFilter: ['class', 'style', 'id']
                });
                
                this._cacheInvalidationListeners.push({ type: 'mutation', handler: observer });
            }

            console.log('Cache invalidation listeners setup complete');

        } catch (error) {
            console.error('Error setting up cache invalidation:', error);
        }
    }

    /**
     * Get cache performance statistics
     * @returns {Object} - Cache performance metrics
     */
    _getCacheStats() {
        try {
            const total = this._measurementCache.hitCount + this._measurementCache.missCount;
            const hitRate = total > 0 ? (this._measurementCache.hitCount / total * 100).toFixed(2) : 0;

            return {
                hitCount: this._measurementCache.hitCount,
                missCount: this._measurementCache.missCount,
                hitRate: `${hitRate}%`,
                cacheSize: this._measurementCache.elements.size,
                lastUpdate: this._measurementCache.lastUpdate
            };

        } catch (error) {
            console.error('Error getting cache stats:', error);
            return { error: error.message };
        }
    }

    /**
     * Calculate optimal dropdown position to avoid collisions
     * Implements requirements 1.1, 1.4, 4.1, 4.4
     * @param {Element} dropdownElement - The dropdown element
     * @param {Element} buttonElement - The theme toggle button
     * @returns {Object} - Positioning recommendation
     */
    calculateDropdownPosition(dropdownElement = null, buttonElement = null) {
        try {
            // Get elements if not provided
            const dropdown = dropdownElement || document.querySelector('.theme-dropdown');
            const button = buttonElement || document.querySelector('.theme-toggle-btn');

            if (!dropdown || !button) {
                console.warn('Required elements not found for position calculation');
                return {
                    success: false,
                    error: 'Required elements not found',
                    recommendation: 'standard'
                };
            }

            // Get current measurements
            const buttonRect = this.getBoundingRectSafe(button);
            if (!buttonRect) {
                console.warn('Could not measure button element');
                return {
                    success: false,
                    error: 'Could not measure button element',
                    recommendation: 'standard'
                };
            }

            // Get viewport dimensions (with caching)
            const viewport = this._getViewportDimensions();
            const viewportWidth = viewport.width;
            const viewportHeight = viewport.height;

            // Calculate dropdown dimensions (use current or estimated)
            let dropdownRect = this.getBoundingRectSafe(dropdown);
            
            // If dropdown is hidden, estimate dimensions
            if (!dropdownRect || dropdownRect.width === 0) {
                dropdownRect = this._estimateDropdownDimensions(dropdown, buttonRect);
            }

            if (!dropdownRect) {
                console.warn('Could not determine dropdown dimensions');
                return {
                    success: false,
                    error: 'Could not determine dropdown dimensions',
                    recommendation: 'standard'
                };
            }

            // Test different positioning strategies
            const positioningStrategies = this._generatePositioningStrategies(
                buttonRect, 
                dropdownRect, 
                viewportWidth, 
                viewportHeight
            );

            // Evaluate each strategy for collisions and viewport fit
            const evaluatedStrategies = positioningStrategies.map(strategy => {
                const testRect = {
                    left: strategy.left,
                    top: strategy.top,
                    right: strategy.left + dropdownRect.width,
                    bottom: strategy.top + dropdownRect.height,
                    width: dropdownRect.width,
                    height: dropdownRect.height
                };

                // Check for collisions
                const collisionResult = this.detectCollisions(testRect);
                
                // Check viewport boundaries
                const fitsInViewport = this._checkViewportFit(testRect, viewportWidth, viewportHeight);

                return {
                    ...strategy,
                    testRect: testRect,
                    collisionResult: collisionResult,
                    fitsInViewport: fitsInViewport,
                    score: this._calculatePositionScore(strategy, collisionResult, fitsInViewport)
                };
            });

            // Sort strategies by score (higher is better)
            evaluatedStrategies.sort((a, b) => b.score - a.score);

            const bestStrategy = evaluatedStrategies[0];

            return {
                success: true,
                recommendation: bestStrategy.name,
                position: {
                    left: bestStrategy.left,
                    top: bestStrategy.top,
                    right: bestStrategy.right,
                    transform: bestStrategy.transform
                },
                collisionResult: bestStrategy.collisionResult,
                fitsInViewport: bestStrategy.fitsInViewport,
                score: bestStrategy.score,
                alternativeStrategies: evaluatedStrategies.slice(1, 3), // Top 2 alternatives
                measurements: {
                    buttonRect: buttonRect,
                    dropdownRect: dropdownRect,
                    viewportWidth: viewportWidth,
                    viewportHeight: viewportHeight
                }
            };

        } catch (error) {
            console.error('Error calculating dropdown position:', error);
            return {
                success: false,
                error: error.message,
                recommendation: 'standard'
            };
        }
    }

    /**
     * Estimate dropdown dimensions when element is hidden
     * @param {Element} dropdown - Dropdown element
     * @param {DOMRect} buttonRect - Button bounding rectangle
     * @returns {Object} - Estimated dimensions
     */
    _estimateDropdownDimensions(dropdown, buttonRect) {
        try {
            // Temporarily show dropdown to measure it
            const originalDisplay = dropdown.style.display;
            const originalVisibility = dropdown.style.visibility;
            const originalPosition = dropdown.style.position;
            const originalTop = dropdown.style.top;
            const originalLeft = dropdown.style.left;

            // Make it invisible but measurable
            dropdown.style.visibility = 'hidden';
            dropdown.style.position = 'absolute';
            dropdown.style.top = '-9999px';
            dropdown.style.left = '-9999px';
            dropdown.style.display = 'block';

            const rect = this.getBoundingRectSafe(dropdown);

            // Restore original styles
            dropdown.style.display = originalDisplay;
            dropdown.style.visibility = originalVisibility;
            dropdown.style.position = originalPosition;
            dropdown.style.top = originalTop;
            dropdown.style.left = originalLeft;

            return rect;

        } catch (error) {
            console.error('Error estimating dropdown dimensions:', error);
            
            // Fallback to reasonable estimates
            return {
                width: 200,
                height: 180,
                left: 0,
                top: 0,
                right: 200,
                bottom: 180
            };
        }
    }

    /**
     * Generate different positioning strategies to test
     * @param {DOMRect} buttonRect - Button bounding rectangle
     * @param {DOMRect} dropdownRect - Dropdown bounding rectangle
     * @param {number} viewportWidth - Viewport width
     * @param {number} viewportHeight - Viewport height
     * @returns {Array} - Array of positioning strategies
     */
    _generatePositioningStrategies(buttonRect, dropdownRect, viewportWidth, viewportHeight) {
        const spacing = 8; // Standard spacing from button
        const strategies = [];

        // Strategy 1: Standard (bottom-right aligned)
        strategies.push({
            name: 'standard',
            cssClass: '',
            left: buttonRect.right - dropdownRect.width,
            top: buttonRect.bottom + spacing,
            right: 'auto',
            transform: null,
            priority: 10
        });

        // Strategy 2: Bottom-left aligned
        strategies.push({
            name: 'position-left',
            cssClass: 'position-left',
            left: buttonRect.left,
            top: buttonRect.bottom + spacing,
            right: 'auto',
            transform: null,
            priority: 8
        });

        // Strategy 3: Bottom-center aligned
        strategies.push({
            name: 'position-center',
            cssClass: 'position-center',
            left: buttonRect.left + (buttonRect.width / 2),
            top: buttonRect.bottom + spacing,
            right: 'auto',
            transform: 'translateX(-50%)',
            priority: 6
        });

        // Strategy 4: Offset left (for desktop collision avoidance)
        if (viewportWidth >= 1024) {
            strategies.push({
                name: 'position-offset-left',
                cssClass: 'position-offset-left',
                left: buttonRect.left - (dropdownRect.width / 2),
                top: buttonRect.bottom + spacing,
                right: 'auto',
                transform: null,
                priority: 7
            });

            // Strategy 5: Offset right (for desktop collision avoidance)
            strategies.push({
                name: 'position-offset-right',
                cssClass: 'position-offset-right',
                left: buttonRect.right - (dropdownRect.width * 0.75),
                top: buttonRect.bottom + spacing,
                right: 'auto',
                transform: null,
                priority: 5
            });
        }

        // Strategy 6: Above button (if bottom strategies don't work)
        strategies.push({
            name: 'position-above',
            cssClass: 'position-above',
            left: buttonRect.right - dropdownRect.width,
            top: buttonRect.top - dropdownRect.height - spacing,
            right: 'auto',
            transform: null,
            priority: 4
        });

        return strategies;
    }

    /**
     * Check if dropdown fits within viewport boundaries
     * @param {Object} testRect - Test rectangle for dropdown
     * @param {number} viewportWidth - Viewport width
     * @param {number} viewportHeight - Viewport height
     * @returns {Object} - Viewport fit analysis
     */
    _checkViewportFit(testRect, viewportWidth, viewportHeight) {
        const margin = 16; // Minimum margin from viewport edges

        return {
            fitsHorizontally: testRect.left >= margin && testRect.right <= (viewportWidth - margin),
            fitsVertically: testRect.top >= margin && testRect.bottom <= (viewportHeight - margin),
            overflowLeft: Math.max(0, margin - testRect.left),
            overflowRight: Math.max(0, testRect.right - (viewportWidth - margin)),
            overflowTop: Math.max(0, margin - testRect.top),
            overflowBottom: Math.max(0, testRect.bottom - (viewportHeight - margin)),
            get fitsCompletely() {
                return this.fitsHorizontally && this.fitsVertically;
            }
        };
    }

    /**
     * Calculate score for a positioning strategy
     * @param {Object} strategy - Positioning strategy
     * @param {Object} collisionResult - Collision detection result
     * @param {Object} viewportFit - Viewport fit analysis
     * @returns {number} - Strategy score (higher is better)
     */
    _calculatePositionScore(strategy, collisionResult, viewportFit) {
        let score = strategy.priority * 10; // Base score from strategy priority

        // Penalize collisions heavily
        if (collisionResult.hasCollisions) {
            score -= collisionResult.totalCollisions * 50;
            
            // Extra penalty for high-priority collisions
            if (collisionResult.highestPriorityCollision) {
                score -= collisionResult.highestPriorityCollision.priority * 10;
                score -= collisionResult.highestPriorityCollision.overlapPercentage;
            }
        }

        // Reward viewport fit
        if (viewportFit.fitsCompletely) {
            score += 100;
        } else {
            // Penalize viewport overflow
            score -= viewportFit.overflowLeft + viewportFit.overflowRight;
            score -= viewportFit.overflowTop + viewportFit.overflowBottom;
        }

        return Math.max(0, score); // Ensure non-negative score
    }

    /**
     * Dynamic Positioning Logic
     * Implements requirements 1.4, 4.1, 4.4
     */

    /**
     * Apply collision avoidance positioning to dropdown
     * @param {Element} dropdownElement - The dropdown element (optional)
     * @param {Element} buttonElement - The theme toggle button (optional)
     * @returns {Object} - Application result
     */
    applyCollisionAvoidance(dropdownElement = null, buttonElement = null) {
        try {
            // Get elements if not provided
            const dropdown = dropdownElement || document.querySelector('.theme-dropdown');
            const button = buttonElement || document.querySelector('.theme-toggle-btn');

            if (!dropdown || !button) {
                console.warn('Required elements not found');
                return {
                    success: false,
                    error: 'Required elements not found',
                    appliedStrategy: null
                };
            }

            // Calculate optimal position
            const positionResult = this._calculateOptimalPosition(dropdown, button);
            
            if (!positionResult.success) {
                console.warn('Position calculation failed:', positionResult.error);
                return {
                    success: false,
                    error: positionResult.error,
                    appliedStrategy: null
                };
            }

            // Apply the recommended positioning strategy
            const applyResult = this._applyPositioningStrategy(
                dropdown, 
                positionResult.recommendation, 
                positionResult.position
            );

            if (!applyResult.success) {
                console.warn('Failed to apply positioning strategy:', applyResult.error);
                
                // Try fallback positioning
                try {
                    console.log('Attempting emergency fallback positioning');
                    this._resetDropdownPositioning(dropdown);
                    
                    return {
                        success: false,
                        error: 'Applied emergency fallback',
                        appliedStrategy: 'emergency-fallback',
                        originalError: applyResult.error,
                        positionResult: positionResult
                    };
                } catch (fallbackError) {
                    console.error('Emergency fallback also failed:', fallbackError);
                    
                    return {
                        success: false,
                        error: fallbackError.message,
                        appliedStrategy: null
                    };
                }
            }

            // Log successful positioning
            console.log('Collision avoidance applied successfully:', {
                strategy: positionResult.recommendation,
                position: positionResult.position,
                fitsInViewport: positionResult.fitsInViewport
            });

            return {
                success: true,
                appliedStrategy: positionResult.recommendation,
                positionResult: positionResult,
                applyResult: applyResult
            };

        } catch (error) {
            console.error('Error in collision avoidance:', error);
            
            // Emergency fallback
            try {
                console.log('Attempting emergency fallback positioning');
                this._resetDropdownPositioning(dropdown);
            } catch (fallbackError) {
                console.error('Emergency fallback also failed:', fallbackError);
            }

            return {
                success: false,
                error: error.message,
                appliedStrategy: null
            };
        }
    }

    /**
     * Apply positioning strategy to dropdown
     * @param {Element} dropdown - The dropdown element
     * @param {string} strategyName - Name of the positioning strategy
     * @param {Object} position - Position data
     * @returns {Object} - Application result
     */
    _applyPositioningStrategy(dropdown, strategyName, position) {
        try {
            if (!dropdown || !strategyName) {
                return { success: false, error: 'Missing required parameters' };
            }

            // Remove existing positioning classes
            const existingClasses = [
                'position-left',
                'position-center', 
                'position-offset-left',
                'position-right',
                'position-auto'
            ];

            existingClasses.forEach(className => {
                dropdown.classList.remove(className);
            });

            // Apply new positioning class if needed
            if (strategyName && strategyName !== 'inline') {
                dropdown.classList.add(strategyName);
            }

            // Apply inline positioning if needed
            if (position && typeof position === 'object') {
                // Only apply inline styles when necessary
                const needsInlineStyles = this._needsInlinePositioning(strategyName, position);
                
                if (needsInlineStyles) {
                    if (typeof position.left === 'number') {
                        dropdown.style.left = `${position.left}px`;
                        dropdown.style.right = 'auto';
                    }
                    
                    if (typeof position.top === 'number') {
                        dropdown.style.top = `${position.top}px`;
                    }

                    if (typeof position.right === 'number') {
                        dropdown.style.right = `${position.right}px`;
                    }
                } else {
                    // Clear inline positioning
                    dropdown.style.left = '';
                    dropdown.style.right = '';
                    dropdown.style.top = '';
                    dropdown.style.transform = '';
                }
            }

            return { success: true, appliedStrategy: strategyName };

        } catch (error) {
            console.error('Error applying positioning strategy:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Determine if a positioning strategy needs inline styles
     * @param {string} strategyName - Strategy name
     * @param {Object} position - Position object
     * @returns {boolean} - Whether inline styles are needed
     */
    _needsInlinePositioning(strategyName, position) {
        // Strategies that are handled purely by CSS classes
        const cssOnlyStrategies = [
            'standard',
            'position-left',
            'position-center',
            'position-offset-left',
            'position-offset-right'
        ];

        // If it's a CSS-only strategy, use CSS
        if (cssOnlyStrategies.includes(strategyName)) {
            return false;
        }

        // If we have custom coordinates that need inline positioning
        return position && (
            typeof position.left === 'number' ||
            typeof position.top === 'number' ||
            typeof position.right === 'number'
        );
    }

    /**
     * Apply fallback positioning
     * @param {Element} dropdown - Dropdown element
     * @param {Element} button - Button element
     * @returns {Object} - Fallback result
     */
    _applyFallbackPositioning(dropdown, button) {
        try {
            console.log('Applying fallback positioning...');

            // Reset to clean state
            this._resetDropdownPositioning(dropdown);

            // Get viewport dimensions
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const buttonRect = this.getBoundingRectSafe(button);

            if (!buttonRect) {
                console.error('Could not get button rect for fallback positioning');
                return { success: false, error: 'Button rect unavailable' };
            }

            // Choose safest fallback based on viewport size
            let fallbackStrategy;

            if (viewportWidth < 768) {
                // Mobile: center dropdown
                fallbackStrategy = 'mobile-safe';
                dropdown.classList.add('position-center');
                dropdown.style.left = '50%';
                dropdown.style.transform = 'translateX(-50%)';
                dropdown.style.right = 'auto';
                dropdown.style.maxWidth = 'calc(100vw - 32px)';

            } else if (viewportWidth < 1024) {
                // Tablet: position right
                fallbackStrategy = 'tablet-safe';
                dropdown.style.right = '24px';
                dropdown.style.left = 'auto';
                dropdown.style.transform = '';

            } else {
                // Desktop: try to avoid header area
                fallbackStrategy = 'desktop-safe';
                
                // Position on the left side of the button
                dropdown.classList.add('position-left');
                dropdown.style.left = buttonRect.left + 'px';
                dropdown.style.right = 'auto';
                
            }

            console.log(`Applied strategy: ${fallbackStrategy}`);

            return { 
                success: true, 
                strategy: fallbackStrategy,
                note: 'Fallback applied successfully'
            };

        } catch (error) {
            console.error('Fallback positioning failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Reset dropdown positioning to clean state
     * @param {Element} dropdown - Dropdown element
     */
    _resetDropdownPositioning(dropdown) {
        try {
            if (!dropdown) return;

            // Remove all positioning classes
            const positioningClasses = [
                'position-left',
                'position-center',
                'position-offset-left', 
                'position-right',
                'position-above'
            ];

            positioningClasses.forEach(className => {
                dropdown.classList.remove(className);
            });

            // Clear inline styles
            dropdown.style.left = '';
            dropdown.style.right = '';
            dropdown.style.top = '';
            dropdown.style.transform = '';
            dropdown.style.maxWidth = '';

        } catch (error) {
            console.error('Error resetting dropdown positioning:', error);
        }
    }

    /**
     * Select optimal positioning strategy
     * @param {Array} strategies - Array of evaluated strategies
     * @param {Object} constraints - Positioning constraints
     * @returns {Object} - Selected strategy
     */
    selectPositioningStrategy(strategies, constraints = {}) {
        try {
            if (!Array.isArray(strategies) || strategies.length === 0) {
                console.warn('No strategies provided');
                return null;
            }

            // Filter strategies that meet constraints
            let filteredStrategies = strategies.filter(strategy => {
                // Filter out strategies that don't meet requirements
                if (constraints.requiresNoCollision && strategy.hasCollision) {
                    return false;
                }

                if (constraints.requiresViewportFit && 
                    strategy.collisionResult && !strategy.collisionResult.fitsInViewport) {
                    return false;
                }

                if (constraints.minScore && strategy.score < constraints.minScore) {
                    return false;
                }

                return true;
            });

            // If no strategies meet constraints, use original list
            if (filteredStrategies.length === 0) {
                console.warn('No strategies meet constraints, using all strategies');
                filteredStrategies = strategies;
            }

            // Sort by score (highest first)
            filteredStrategies.sort((a, b) => (b.score || 0) - (a.score || 0));

            const selectedStrategy = filteredStrategies[0];

            console.log('Selected positioning strategy:', {
                name: selectedStrategy.name,
                score: selectedStrategy.score,
                hasCollision: selectedStrategy.hasCollision || false
            });

            return selectedStrategy;

        } catch (error) {
            console.error('Error selecting positioning strategy:', error);
            return strategies[0] || null; // Return first strategy as fallback
        }
    }

    /**
     * Handle edge cases in positioning
     * @param {Object} positionResult - Position result
     * @param {Object} options - Options
     * @returns {Object} - Handled result
     */
    _handleEdgeCases(positionResult = {}, options = {}) {
        try {
            const edgeCases = [];
            const solutions = [];

            // Edge case 1: Very narrow viewport
            if (options.context && options.context.viewportWidth < 320) {
                edgeCases.push('narrow-viewport');
                solutions.push({
                    type: 'narrow-viewport',
                    action: 'force-center-with-max-width',
                    css: {
                        position: 'fixed',
                        maxWidth: 'calc(100vw - 20px)',
                        left: '50%',
                        transform: 'translateX(-50%)'
                    }
                });
            }

            // Edge case 2: Very tall dropdown (many theme options)
            if (options.context && options.context.dropdownHeight && options.context.dropdownHeight > (options.context.viewportHeight * 0.8)) {
                edgeCases.push('tall-dropdown');
                solutions.push({
                    type: 'tall-dropdown',
                    action: 'enable-scrolling',
                    css: {
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }
                });
            }

            // Edge case 3: Unavoidable collisions with high-priority elements
            if (positionResult.success && 
                positionResult.collisionResult && positionResult.collisionResult.hasCollisions &&
                positionResult.score < 5) {
                edgeCases.push('unavoidable-collisions');
                solutions.push({
                    type: 'unavoidable-collisions',
                    action: 'increase-z-index',
                    css: {
                        zIndex: '9999' // Higher than normal
                    }
                });
            }

            // Edge case 4: Dropdown extends beyond viewport on all sides
            if (positionResult.success && 
                positionResult.fitsInViewport && !positionResult.fitsInViewport.fitsCompletely &&
                positionResult.fitsInViewport.overflowRight > 0) {
                edgeCases.push('viewport-overflow');
                solutions.push({
                    type: 'viewport-overflow',
                    action: 'force-fit-viewport',
                    css: {
                        left: '16px',
                        right: '16px',
                        width: 'auto',
                        maxWidth: 'calc(100vw - 32px)'
                    }
                });
            }

            return {
                hasEdgeCases: edgeCases.length > 0,
                edgeCases: edgeCases,
                solutions: solutions,
                recommendedSolution: solutions[0] || null
            };

        } catch (error) {
            console.error('Error handling edge cases:', error);
            return {
                hasEdgeCases: false,
                edgeCases: [],
                solutions: [],
                error: error.message
            };
        }
    }

    /**
ons
     * @paramransitie ter theme aftrm state fo  * Restor   ions: lutes:', ecasedge g ioninndling positr('Error haerroole.[0] || nullsh > 0,engtses.lgeCadgeCases: edsEw - 3c(100vx',rflowewport-ove'vih(ight &&> 0 wLeft erflo.ovportViewsInResult.fition    posit            ly &&mplete Higher t//x: '1100' nde          zI  cole- 'unavoidabl       type: 0) {ionlisant colgnific have siegies3: All strat case / Edge/7)}px`, * 0.portHeightt.viewexloor(contath.fHeight: `${M max                          styles:   le-scr: 'enabon   actipdown 0.8)) *eight- 16pvw alc(100Width: 'c       max                 : { styles      r',on-centeitis: 'posClas0) {Width < 32ortwpviext.onte& crtWidth &wpo(context.vief ntext =onResult, coases(positigeCitioningEdPosdle     * resulting case handlct} - Edgens {Obje* @returext informational contntext - Addi{Object} coaram ulation rcalcosition - Pt nResul} positio{Object itionios fallbackstrategy asst  error);ategy:', strioningositerrotrategy;ctedSselereturn Comport.fitsfitsInViewegy.tedStratecort: selfitsInViewp    ollisions,esult.hasCcollisionRategy.electedStrions: sing strategyoncore - a.sco=> b.sb) rt((a, gies.soedStrateiltert)highest firs (es')ategi strsing allints, uconstraes meet h === 0lengttegies.Straeredif (filtreturn t    re)nts.minSco constraiore <y.scrateg && stnScoresions)xColliraints.mastcons > ollision.totalCtlisiaints.maxCol(constr    if    alse;y) itsCompletelViewport.fitsInegy.f && !stratViewportFitrequires.onstraint if (c        requirememum t minir(strateges.filte strategitegies =filteredStra let     teraints filtrcons   // Apply             }rn n   retuelectio sed fors providtegiera'No straints = {}gies, constate(strsilable span avaegy based oraterror)ning:', tioropdown posig dror resettin'Er(rortch (eransform = '.trwn.styledropdo = ''right.style.owndropdt = 'yle.lefropdown.stningione positear inli);classNamee(t.removlassLis.c-offset-on'positissown (!dropdown elem.message };or: errorrror);fain ioulatto calclied due ing appsitionornkStratfallbacy: ${egack stratfallbform = '';e.transopdown.styldre.right =wn.stylropdo0' = 'ftposition-lefk ld tas to avoionutt'desktoegy = kStratallbacsk lis tafostyle.transn.ropdowu-saf = 'tabletackStrategyfallbfe marginsned with sa: right-aligblet/ Ta024h < 10vw - 32px)'(10 'calc=50%)';teX(-m = 'translaforstyle.transwn.pdodroft = '50%';style.leropdown.r');ion-cented('positade'arginsequate madwn with Strategallback viewed' };urement failmeasn ollback')ts for farementon measu butot gete.warn('CannconsolttonRect) {bufe(buttRectSaBoundingis.geterHeight;w.innonsafe positiions for nsewport dimeet viropdown)ioning(dsitng.niback positioing falle.log('Applyol) {n, buttonowlown elementropdwn - Dt} dropdolemenilrategies fall sthen aning wck positiobansformion.traer' ||mb= 'nue inlts, usSS defaulrom Ciffer fat dgyName)) trateitioning, stom posd no cuy anion-centersit'pon-lesitiogy namerateme - StegyNa strat {string}message };r: error.m false, erron { success:    retur y:', error)ning strategying positioError applrror('.ensole      co      ch ( cat   }trategyNameategy: se, struccess: trught = '';e.ridown.styldrople.left = 'dropdown.sty    ndle posithases clas let CSS styles tone li Clear inransform;= position.te.transform ) {transform(position.    if n.to{positio.top = `$tylesumber') {top === 'non.itiypeof pos    if (tosition.l = `${pyle.left=== 'numeft on.leof positiyp    if (tyles)nlineStedsIdle can't han CSSthatpositioning lex or comples fn === 'objecof positiopetysition && po needeifning tiose posior preciine styles fnlyName)rategckallbae !== 'f strategyNam &&tandard'Name !== 'sstrategy if n classoningew positimove(classNssList.ren.clapdowdroassNameorEach(cls.fasseve-aboitionos'pt-rightion-offseing clasg positiontin exisemoved' };de provimentle eopdowno drror: 'Ne, eralswn) !dropdoe, positegyNamsansformstrand dinates orition coos Pn -positio elementwn- Dropdoropdown  {Element} dparam   * @  tegy to the ioning straic posity a specif fass:       succe            ackErr(dropdown) {     if     -dropdownemeector('.thySelument.quer|| docement ownElropdown = dopd  const dr                  ncy frgey eme   // Trnce:', errorvoida collision alying'Error app(error) {catch (  }                  slCollisionotat.tionResulisnResult.collitioCount: pos collisionlisiohasColionResult.lt.collisositionResullisions: pdCoandatecommeplt.fitsComewporonollisisult.hasCllisionReult.coesositionRisions: p   hadColl      ssfully:', {succed liegginbuoning for deti          }     };        tiesult: positionR     posi      lbaal 'fegy:atedStrult.errbackResll   error: fa     lt.success,ckResullbauccess: fa       sturneton);pdown, butdrog(tioninkPosillbaclyFais._appsult = thckRe fallbar);sult.errolyRependationterationingStosiioningullegy: ndStratiepplse,fal ;t.sdown, button(dropnPositiolateDropdow this.calcult =ionResut posit    };ategy: nultrliedS      app nd'ents not fouequired elemor: 'Rrn {   retuoidanavllision  for coot found elements niredu!butto|  |opdown  if (!dr    {Object} formState - Previously saved form state
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
            
            // Clean up measurement caching resources (Requirements 1.2, 4.4)
            this._cleanupMeasurementCaching();
            
            // Clean up debounced event handlers (Requirements 2.4, 2.5)
            this._cleanupDebouncedEventHandlers();
            
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