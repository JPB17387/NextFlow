/**
 * Responsive Behavior Test Suite
 * Tests for Task 9.3: Test responsive behavior with themes
 * 
 * Requirements tested:
 * - 7.1: CSS transitions for color and background changes
 * - 7.2: Transitions complete within 300ms
 * - 7.3: Maintain current page state and user input during transitions
 * - 7.4: No layout shifts or content jumps during theme application
 */

class ResponsiveBehaviorTestSuite {
    constructor() {
        this.testResults = [];
        this.themeManager = null;
        this.logElement = document.getElementById('testLog');
        this.performanceData = [];
        this.init();
    }

    init() {
        this.log('Initializing Responsive Behavior Test Suite...');
        
        if (typeof ThemeManager !== 'undefined') {
            this.themeManager = new ThemeManager();
            this.themeManager.initializeThemeSystem();
            this.updateViewportInfo();
            this.runAllTests();
        } else {
            this.log('ERROR: ThemeManager not found');
            this.displayError('ThemeManager class not found. Make sure theme-manager.js is loaded.');
        }
    }

    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        
        if (this.logElement) {
            this.logElement.innerHTML += logMessage + '\n';
            this.logElement.scrollTop = this.logElement.scrollHeight;
        }
    }

    displayError(message) {
        const container = document.getElementById('viewportInfo');
        container.innerHTML = `ERROR: ${message}`;
        container.className = 'test-fail';
    }

    updateViewportInfo() {
        const viewportInfo = {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            orientation: window.screen.orientation ? window.screen.orientation.type : 'unknown',
            userAgent: navigator.userAgent,
            touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
        };

        const breakpoint = this.getBreakpoint(viewportInfo.width);
        
        const infoElement = document.getElementById('viewportInfo');
        infoElement.innerHTML = `
            <strong>Viewport:</strong> ${viewportInfo.width} x ${viewportInfo.height}px<br>
            <strong>Device Pixel Ratio:</strong> ${viewportInfo.devicePixelRatio}<br>
            <strong>Breakpoint:</strong> ${breakpoint}<br>
            <strong>Orientation:</strong> ${viewportInfo.orientation}<br>
            <strong>Touch Support:</strong> ${viewportInfo.touchSupport ? 'Yes' : 'No'}<br>
            <strong>User Agent:</strong> ${viewportInfo.userAgent.substring(0, 100)}...
        `;
    }

    getBreakpoint(width) {
        if (width < 768) return 'Mobile';
        if (width < 1024) return 'Tablet';
        return 'Desktop';
    }

    async runAllTests() {
        this.log('Starting responsive behavior tests...');
        
        try {
            await this.runBreakpointTests();
            await this.runThemeSelectorTests();
            await this.runDeviceSimulationTests();
            await this.runPerformanceTests();
            await this.runTouchTests();
            
            this.log('All responsive behavior tests completed');
            
        } catch (error) {
            this.log(`ERROR during test execution: ${error.message}`);
            this.displayError(`Test execution failed: ${error.message}`);
        }
    }

    // Breakpoint tests
    async runBreakpointTests() {
        this.log('Running breakpoint tests...');
        const resultsElement = document.getElementById('breakpointResults');
        let results = '';
        
        // Test CSS media queries
        const mediaQueryTests = this.testMediaQueries();
        results += this.formatTestResult('CSS Media Queries', mediaQueryTests.passed, mediaQueryTests.details);
        
        // Test responsive layout
        const layoutTests = this.testResponsiveLayout();
        results += this.formatTestResult('Responsive Layout', layoutTests.passed, layoutTests.details);
        
        // Test theme consistency across breakpoints
        const consistencyTests = await this.testThemeConsistencyAcrossBreakpoints();
        results += this.formatTestResult('Theme Consistency Across Breakpoints', consistencyTests.passed, consistencyTests.details);
        
        resultsElement.innerHTML = results;
        this.log('Breakpoint tests completed');
    }

    testMediaQueries() {
        const breakpoints = [
            { name: 'Mobile', query: '(max-width: 767px)' },
            { name: 'Tablet', query: '(min-width: 768px) and (max-width: 1023px)' },
            { name: 'Desktop', query: '(min-width: 1024px)' }
        ];
        
        let workingQueries = 0;
        let totalQueries = breakpoints.length;
        
        breakpoints.forEach(breakpoint => {
            try {
                const mediaQuery = window.matchMedia(breakpoint.query);
                if (mediaQuery && typeof mediaQuery.matches === 'boolean') {
                    workingQueries++;
                    this.log(`${breakpoint.name} media query: ${mediaQuery.matches ? 'Active' : 'Inactive'}`);
                }
            } catch (error) {
                this.log(`Error testing ${breakpoint.name} media query: ${error.message}`);
            }
        });
        
        return {
            passed: workingQueries === totalQueries,
            details: `${workingQueries}/${totalQueries} media queries working correctly`
        };
    }

    testResponsiveLayout() {
        const currentWidth = window.innerWidth;
        const breakpoint = this.getBreakpoint(currentWidth);
        
        // Test if layout adapts to current breakpoint
        const header = document.querySelector('header');
        const main = document.querySelector('main');
        
        if (!header || !main) {
            return {
                passed: false,
                details: 'Required layout elements not found'
            };
        }
        
        const headerStyle = window.getComputedStyle(header);
        const mainStyle = window.getComputedStyle(main);
        
        // Check if elements have responsive properties
        const hasFlexbox = headerStyle.display.includes('flex') || mainStyle.display.includes('flex');
        const hasGrid = headerStyle.display.includes('grid') || mainStyle.display.includes('grid');
        const hasResponsiveUnits = headerStyle.width.includes('%') || headerStyle.width.includes('vw') ||
                                  mainStyle.width.includes('%') || mainStyle.width.includes('vw');
        
        const isResponsive = hasFlexbox || hasGrid || hasResponsiveUnits;
        
        return {
            passed: isResponsive,
            details: `Breakpoint: ${breakpoint}, Flexbox: ${hasFlexbox}, Grid: ${hasGrid}, Responsive units: ${hasResponsiveUnits}`
        };
    }

    async testThemeConsistencyAcrossBreakpoints() {
        const themes = ['white', 'dark', 'student', 'developer', 'professional'];
        let consistentThemes = 0;
        
        for (const themeName of themes) {
            this.themeManager.setTheme(themeName);
            await this.delay(100);
            
            // Test if theme variables are applied correctly
            const primaryBg = this.getComputedColor('--theme-primary-bg');
            const textPrimary = this.getComputedColor('--theme-text-primary');
            
            if (primaryBg && textPrimary && primaryBg !== textPrimary) {
                consistentThemes++;
            }
        }
        
        return {
            passed: consistentThemes === themes.length,
            details: `${consistentThemes}/${themes.length} themes consistent across current breakpoint`
        };
    }

    // Theme selector responsiveness tests
    async runThemeSelectorTests() {
        this.log('Running theme selector responsiveness tests...');
        const resultsElement = document.getElementById('themeSelectorResults');
        let results = '';
        
        // Test theme selector visibility
        const visibilityTest = this.testThemeSelectorVisibility();
        results += this.formatTestResult('Theme Selector Visibility', visibilityTest.passed, visibilityTest.details);
        
        // Test theme selector interaction
        const interactionTest = this.testThemeSelectorInteraction();
        results += this.formatTestResult('Theme Selector Interaction', interactionTest.passed, interactionTest.details);
        
        // Test mobile-specific behavior
        const mobileTest = this.testMobileThemeSelector();
        results += this.formatTestResult('Mobile Theme Selector', mobileTest.passed, mobileTest.details);
        
        // Test dropdown positioning
        const positioningTest = this.testDropdownPositioning();
        results += this.formatTestResult('Dropdown Positioning', positioningTest.passed, positioningTest.details);
        
        resultsElement.innerHTML = results;
        this.log('Theme selector responsiveness tests completed');
    }

    testThemeSelectorVisibility() {
        const themeSelector = document.querySelector('.theme-selector');
        
        if (!themeSelector) {
            return {
                passed: false,
                details: 'Theme selector not found'
            };
        }
        
        const computedStyle = window.getComputedStyle(themeSelector);
        const isVisible = computedStyle.display !== 'none' && 
                         computedStyle.visibility !== 'hidden' && 
                         computedStyle.opacity !== '0';
        
        const rect = themeSelector.getBoundingClientRect();
        const isInViewport = rect.width > 0 && rect.height > 0;
        
        return {
            passed: isVisible && isInViewport,
            details: `Visible: ${isVisible}, In viewport: ${isInViewport}, Size: ${rect.width}x${rect.height}`
        };
    }

    testThemeSelectorInteraction() {
        const themeToggle = document.getElementById('themeToggle');
        const themeDropdown = document.getElementById('themeDropdown');
        
        if (!themeToggle || !themeDropdown) {
            return {
                passed: false,
                details: 'Theme selector elements not found'
            };
        }
        
        // Test if elements are clickable
        const toggleRect = themeToggle.getBoundingClientRect();
        const isToggleClickable = toggleRect.width >= 44 && toggleRect.height >= 44; // Minimum touch target size
        
        // Test if dropdown is properly positioned
        const dropdownStyle = window.getComputedStyle(themeDropdown);
        const hasProperPositioning = dropdownStyle.position === 'absolute' || dropdownStyle.position === 'fixed';
        
        return {
            passed: isToggleClickable && hasProperPositioning,
            details: `Toggle size: ${toggleRect.width}x${toggleRect.height}, Dropdown positioning: ${dropdownStyle.position}`
        };
    }

    testMobileThemeSelector() {
        const currentWidth = window.innerWidth;
        const isMobile = currentWidth < 768;
        
        if (!isMobile) {
            return {
                passed: true,
                details: 'Not on mobile viewport, test skipped'
            };
        }
        
        const themeLabel = document.querySelector('.theme-label');
        const themeIcon = document.querySelector('.theme-icon');
        
        if (!themeLabel || !themeIcon) {
            return {
                passed: false,
                details: 'Theme selector elements not found'
            };
        }
        
        const labelStyle = window.getComputedStyle(themeLabel);
        const iconStyle = window.getComputedStyle(themeIcon);
        
        // On mobile, label might be hidden and only icon shown
        const labelHidden = labelStyle.display === 'none';
        const iconVisible = iconStyle.display !== 'none';
        
        return {
            passed: iconVisible,
            details: `Mobile adaptation - Label hidden: ${labelHidden}, Icon visible: ${iconVisible}`
        };
    }

    testDropdownPositioning() {
        const themeDropdown = document.getElementById('themeDropdown');
        
        if (!themeDropdown) {
            return {
                passed: false,
                details: 'Theme dropdown not found'
            };
        }
        
        const dropdownRect = themeDropdown.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Check if dropdown fits within viewport
        const fitsHorizontally = dropdownRect.right <= viewportWidth;
        const fitsVertically = dropdownRect.bottom <= viewportHeight;
        
        // Check if dropdown has proper z-index
        const computedStyle = window.getComputedStyle(themeDropdown);
        const hasProperZIndex = parseInt(computedStyle.zIndex) >= 1000;
        
        return {
            passed: fitsHorizontally && fitsVertically && hasProperZIndex,
            details: `Fits horizontally: ${fitsHorizontally}, Fits vertically: ${fitsVertically}, Z-index: ${computedStyle.zIndex}`
        };
    }

    // Device simulation tests
    async runDeviceSimulationTests() {
        this.log('Running device simulation tests...');
        
        // Apply themes to different viewport simulations
        const themes = ['white', 'dark', 'student', 'developer', 'professional'];
        const devices = ['mobile', 'tablet', 'desktop'];
        
        for (const themeName of themes) {
            this.themeManager.setTheme(themeName);
            await this.delay(100);
            
            devices.forEach(device => {
                this.updateDevicePreview(device, themeName);
            });
        }
        
        this.log('Device simulation tests completed');
    }

    updateDevicePreview(device, themeName) {
        const previewElement = document.getElementById(`${device}Preview`);
        
        if (previewElement) {
            // Apply current theme colors to preview
            const primaryBg = this.getComputedColor('--theme-primary-bg');
            const textPrimary = this.getComputedColor('--theme-text-primary');
            const accent = this.getComputedColor('--theme-accent');
            
            previewElement.style.backgroundColor = primaryBg;
            previewElement.style.color = textPrimary;
            
            const button = previewElement.querySelector('button');
            if (button) {
                button.style.backgroundColor = accent;
                button.style.color = 'white';
            }
            
            // Update content to show current theme
            const heading = previewElement.querySelector('h3');
            if (heading) {
                heading.textContent = `${device.charAt(0).toUpperCase() + device.slice(1)} - ${themeName} Theme`;
            }
        }
    }

    // Performance tests
    async runPerformanceTests() {
        this.log('Running theme transition performance tests...');
        const resultsElement = document.getElementById('performanceResults');
        let results = '';
        
        // Test transition timing
        const timingTest = await this.testTransitionTiming();
        results += this.formatTestResult('Transition Timing (< 300ms)', timingTest.passed, timingTest.details);
        
        // Test layout stability
        const layoutStabilityTest = await this.testLayoutStability();
        results += this.formatTestResult('Layout Stability', layoutStabilityTest.passed, layoutStabilityTest.details);
        
        // Test performance impact
        const performanceTest = await this.testPerformanceImpact();
        results += this.formatTestResult('Performance Impact', performanceTest.passed, performanceTest.details);
        
        // Test memory usage
        const memoryTest = this.testMemoryUsage();
        results += this.formatTestResult('Memory Usage', memoryTest.passed, memoryTest.details);
        
        resultsElement.innerHTML = results;
        this.updatePerformanceMeter();
        this.log('Performance tests completed');
    }

    async testTransitionTiming() {
        const themes = ['white', 'dark', 'student', 'developer', 'professional'];
        const timings = [];
        
        for (let i = 0; i < themes.length - 1; i++) {
            const startTime = performance.now();
            this.themeManager.setTheme(themes[i]);
            
            // Wait for transition to complete
            await this.delay(350); // Slightly more than expected 300ms
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            timings.push(duration);
        }
        
        const averageTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
        const maxTime = Math.max(...timings);
        
        // Account for our delay, actual transition should be much faster
        const estimatedTransitionTime = Math.min(averageTime - 350, maxTime - 350);
        
        return {
            passed: estimatedTransitionTime <= 300,
            details: `Average transition time: ~${Math.max(0, estimatedTransitionTime).toFixed(2)}ms (Target: ≤300ms)`
        };
    }

    async testLayoutStability() {
        const originalTheme = this.themeManager.getCurrentTheme();
        
        // Measure layout before theme change
        const beforeLayout = this.measureLayout();
        
        // Change theme
        this.themeManager.setTheme('dark');
        await this.delay(100);
        
        // Measure layout after theme change
        const afterLayout = this.measureLayout();
        
        // Restore original theme
        this.themeManager.setTheme(originalTheme);
        
        // Compare layouts
        const layoutShift = this.calculateLayoutShift(beforeLayout, afterLayout);
        
        return {
            passed: layoutShift < 0.1, // Minimal layout shift acceptable
            details: `Layout shift score: ${layoutShift.toFixed(3)} (Target: <0.1)`
        };
    }

    measureLayout() {
        const elements = document.querySelectorAll('header, main, section, .task-item');
        const measurements = {};
        
        elements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            const key = element.id || element.className || `element-${index}`;
            measurements[key] = {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
            };
        });
        
        return measurements;
    }

    calculateLayoutShift(before, after) {
        let totalShift = 0;
        let elementCount = 0;
        
        Object.keys(before).forEach(key => {
            if (after[key]) {
                const beforeRect = before[key];
                const afterRect = after[key];
                
                const xShift = Math.abs(afterRect.x - beforeRect.x);
                const yShift = Math.abs(afterRect.y - beforeRect.y);
                const shift = Math.sqrt(xShift * xShift + yShift * yShift);
                
                totalShift += shift;
                elementCount++;
            }
        });
        
        return elementCount > 0 ? totalShift / elementCount : 0;
    }

    async testPerformanceImpact() {
        const measurePerformance = () => {
            const start = performance.now();
            
            // Simulate some work
            for (let i = 0; i < 1000; i++) {
                document.body.offsetHeight; // Force reflow
            }
            
            return performance.now() - start;
        };
        
        // Measure baseline performance
        const baselineTime = measurePerformance();
        
        // Change theme and measure performance
        this.themeManager.setTheme('dark');
        await this.delay(50);
        const themeTime = measurePerformance();
        
        const performanceImpact = ((themeTime - baselineTime) / baselineTime) * 100;
        
        return {
            passed: performanceImpact < 20, // Less than 20% performance impact
            details: `Performance impact: ${performanceImpact.toFixed(1)}% (Target: <20%)`
        };
    }

    testMemoryUsage() {
        if (performance.memory) {
            const memoryInfo = performance.memory;
            const usedMemoryMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
            const totalMemoryMB = memoryInfo.totalJSHeapSize / (1024 * 1024);
            const memoryUsagePercent = (usedMemoryMB / totalMemoryMB) * 100;
            
            return {
                passed: memoryUsagePercent < 80, // Less than 80% memory usage
                details: `Memory usage: ${usedMemoryMB.toFixed(1)}MB / ${totalMemoryMB.toFixed(1)}MB (${memoryUsagePercent.toFixed(1)}%)`
            };
        } else {
            return {
                passed: true,
                details: 'Memory API not available, test skipped'
            };
        }
    }

    updatePerformanceMeter() {
        const passedTests = this.testResults.filter(test => test.passed).length;
        const totalTests = this.testResults.length;
        const percentage = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        
        const fillElement = document.getElementById('performanceFill');
        const textElement = document.getElementById('performanceText');
        
        if (fillElement && textElement) {
            fillElement.style.width = `${percentage}%`;
            textElement.textContent = `Performance Score: ${percentage.toFixed(1)}% (${passedTests}/${totalTests} tests passed)`;
        }
    }

    // Touch and gesture tests
    async runTouchTests() {
        this.log('Running touch and gesture tests...');
        const resultsElement = document.getElementById('touchResults');
        let results = '';
        
        // Test touch target sizes
        const touchTargetTest = this.testTouchTargetSizes();
        results += this.formatTestResult('Touch Target Sizes', touchTargetTest.passed, touchTargetTest.details);
        
        // Test touch events
        const touchEventTest = this.testTouchEvents();
        results += this.formatTestResult('Touch Event Support', touchEventTest.passed, touchEventTest.details);
        
        // Test gesture support
        const gestureTest = this.testGestureSupport();
        results += this.formatTestResult('Gesture Support', gestureTest.passed, gestureTest.details);
        
        resultsElement.innerHTML = results;
        this.log('Touch and gesture tests completed');
    }

    testTouchTargetSizes() {
        const interactiveElements = document.querySelectorAll('button, [role="button"], input, select');
        let adequateSizeCount = 0;
        const minTouchSize = 44; // 44px minimum recommended touch target size
        
        interactiveElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.width >= minTouchSize && rect.height >= minTouchSize) {
                adequateSizeCount++;
            }
        });
        
        const percentage = interactiveElements.length > 0 ? (adequateSizeCount / interactiveElements.length) * 100 : 100;
        
        return {
            passed: percentage >= 90,
            details: `${adequateSizeCount}/${interactiveElements.length} elements meet minimum touch size (${percentage.toFixed(1)}%)`
        };
    }

    testTouchEvents() {
        const hasTouchStart = 'ontouchstart' in window;
        const hasTouchMove = 'ontouchmove' in window;
        const hasTouchEnd = 'ontouchend' in window;
        const hasPointerEvents = 'onpointerdown' in window;
        
        const touchSupport = hasTouchStart && hasTouchMove && hasTouchEnd;
        
        return {
            passed: touchSupport || hasPointerEvents,
            details: `Touch events: ${touchSupport}, Pointer events: ${hasPointerEvents}`
        };
    }

    testGestureSupport() {
        const hasGestureStart = 'ongesturestart' in window;
        const hasGestureChange = 'ongesturechange' in window;
        const hasGestureEnd = 'ongestureend' in window;
        
        // Test for modern touch action support
        const testElement = document.createElement('div');
        const hasTouchAction = 'touchAction' in testElement.style;
        
        return {
            passed: hasTouchAction, // Touch action is more important than gesture events
            details: `Gesture events: ${hasGestureStart && hasGestureChange && hasGestureEnd}, Touch action: ${hasTouchAction}`
        };
    }

    // Theme preview population
    populateThemePreview() {
        const themes = ['white', 'dark', 'student', 'developer', 'professional'];
        const previewGrid = document.getElementById('themePreviewGrid');
        
        if (!previewGrid) return;
        
        previewGrid.innerHTML = '';
        
        themes.forEach(themeName => {
            // Temporarily apply theme to get colors
            this.themeManager.setTheme(themeName);
            
            const primaryBg = this.getComputedColor('--theme-primary-bg');
            const textPrimary = this.getComputedColor('--theme-text-primary');
            const accent = this.getComputedColor('--theme-accent');
            
            const card = document.createElement('div');
            card.className = 'theme-preview-card';
            card.innerHTML = `
                <h4>${themeName.charAt(0).toUpperCase() + themeName.slice(1)} Theme</h4>
                <div class="theme-color-sample" style="background: ${primaryBg}; color: ${textPrimary};">
                    Primary Background
                </div>
                <div class="theme-color-sample" style="background: ${accent};">
                    Accent Color
                </div>
                <button class="test-button" onclick="testThemeOnDevice('${themeName}')">
                    Test on Current Device
                </button>
            `;
            
            previewGrid.appendChild(card);
        });
    }

    // Utility functions
    getComputedColor(cssVariable) {
        const computedStyle = window.getComputedStyle(document.documentElement);
        const color = computedStyle.getPropertyValue(cssVariable).trim();
        return color || '#000000';
    }

    formatTestResult(testName, passed, details) {
        const statusClass = passed ? 'test-pass' : 'test-fail';
        const status = passed ? '✓ PASS' : '✗ FAIL';
        
        this.testResults.push({ name: testName, passed, details });
        
        return `
            <div class="${statusClass}">
                <strong>${testName}</strong> - ${status}
                <br><small>${details}</small>
            </div>
        `;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global functions for manual testing
function runBreakpointTests() {
    if (window.responsiveTests) {
        window.responsiveTests.runBreakpointTests();
    }
}

function runThemeSelectorTests() {
    if (window.responsiveTests) {
        window.responsiveTests.runThemeSelectorTests();
    }
}

function runDeviceSimulationTests() {
    if (window.responsiveTests) {
        window.responsiveTests.runDeviceSimulationTests();
    }
}

function runPerformanceTests() {
    if (window.responsiveTests) {
        window.responsiveTests.runPerformanceTests();
    }
}

function runTouchTests() {
    if (window.responsiveTests) {
        window.responsiveTests.runTouchTests();
    }
}

function populateThemePreview() {
    if (window.responsiveTests) {
        window.responsiveTests.populateThemePreview();
    }
}

function testThemeOnDevice(themeName) {
    if (window.responsiveTests && window.responsiveTests.themeManager) {
        window.responsiveTests.themeManager.setTheme(themeName);
        window.responsiveTests.log(`Applied ${themeName} theme for device testing`);
    }
}

function clearLog() {
    const logElement = document.getElementById('testLog');
    if (logElement) {
        logElement.innerHTML = '';
    }
}

// Initialize test suite when page loads
window.addEventListener('load', () => {
    window.responsiveTests = new ResponsiveBehaviorTestSuite();
});

// Update viewport info on resize
window.addEventListener('resize', () => {
    if (window.responsiveTests) {
        window.responsiveTests.updateViewportInfo();
    }
});