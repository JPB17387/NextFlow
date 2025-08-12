/**
 * Accessibility Compliance Test Suite
 * Tests for Task 9.2: Test accessibility compliance across themes
 * 
 * Requirements tested:
 * - 2.3: Dark theme contrast ratios meet WCAG AA standards
 * - 4.3: Student theme maintains high readability with appropriate contrast
 * - 5.4: Developer theme maintains excellent readability for extended use
 * - 6.4: Professional theme ensures interface looks appropriate in corporate settings
 */

class AccessibilityTestSuite {
    constructor() {
        this.testResults = [];
        this.themeManager = null;
        this.logElement = document.getElementById('testLog');
        this.contrastThreshold = 4.5; // WCAG AA standard
        this.init();
    }

    init() {
        this.log('Initializing Accessibility Test Suite...');
        
        if (typeof ThemeManager !== 'undefined') {
            this.themeManager = new ThemeManager();
            this.themeManager.initializeThemeSystem();
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
        const container = document.getElementById('accessibilityScore');
        container.innerHTML = `ERROR: ${message}`;
        container.className = 'accessibility-score score-poor';
    }

    async runAllTests() {
        this.log('Starting comprehensive accessibility tests...');
        
        try {
            await this.runContrastTests();
            await this.runScreenReaderTests();
            await this.runKeyboardTests();
            
            this.calculateAccessibilityScore();
            this.log('All accessibility tests completed');
            
        } catch (error) {
            this.log(`ERROR during test execution: ${error.message}`);
            this.displayError(`Test execution failed: ${error.message}`);
        }
    }

    // Contrast ratio testing
    async runContrastTests() {
        this.log('Running contrast ratio tests...');
        const resultsElement = document.getElementById('contrastResults');
        let results = '';
        
        const themes = ['white', 'dark', 'student', 'developer', 'professional'];
        
        for (const themeName of themes) {
            this.themeManager.setTheme(themeName);
            await this.delay(100); // Allow theme to apply
            
            const themeResults = await this.testThemeContrast(themeName);
            results += this.formatContrastResults(themeName, themeResults);
        }
        
        resultsElement.innerHTML = results;
        this.log('Contrast ratio tests completed');
    }

    async testThemeContrast(themeName) {
        const results = [];
        
        // Test primary text on primary background
        const primaryBg = this.getComputedColor('--theme-primary-bg');
        const primaryText = this.getComputedColor('--theme-text-primary');
        const primaryRatio = this.calculateContrastRatio(primaryText, primaryBg);
        
        results.push({
            name: 'Primary Text on Primary Background',
            foreground: primaryText,
            background: primaryBg,
            ratio: primaryRatio,
            passes: primaryRatio >= this.contrastThreshold
        });
        
        // Test secondary text on primary background
        const secondaryText = this.getComputedColor('--theme-text-secondary');
        const secondaryRatio = this.calculateContrastRatio(secondaryText, primaryBg);
        
        results.push({
            name: 'Secondary Text on Primary Background',
            foreground: secondaryText,
            background: primaryBg,
            ratio: secondaryRatio,
            passes: secondaryRatio >= this.contrastThreshold
        });
        
        // Test accent color on primary background
        const accentColor = this.getComputedColor('--theme-accent');
        const accentRatio = this.calculateContrastRatio(accentColor, primaryBg);
        
        results.push({
            name: 'Accent Color on Primary Background',
            foreground: accentColor,
            background: primaryBg,
            ratio: accentRatio,
            passes: accentRatio >= this.contrastThreshold
        });
        
        // Test header text on header background
        const headerBg = this.getComputedColor('--theme-header-bg-start');
        const headerText = this.getComputedColor('--theme-header-text');
        const headerRatio = this.calculateContrastRatio(headerText, headerBg);
        
        results.push({
            name: 'Header Text on Header Background',
            foreground: headerText,
            background: headerBg,
            ratio: headerRatio,
            passes: headerRatio >= this.contrastThreshold
        });
        
        return results;
    }

    getComputedColor(cssVariable) {
        const computedStyle = window.getComputedStyle(document.documentElement);
        const color = computedStyle.getPropertyValue(cssVariable).trim();
        return color || '#000000'; // Fallback to black if not found
    }

    calculateContrastRatio(color1, color2) {
        const lum1 = this.getLuminance(color1);
        const lum2 = this.getLuminance(color2);
        
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        
        return (brightest + 0.05) / (darkest + 0.05);
    }

    getLuminance(color) {
        // Convert color to RGB values
        const rgb = this.hexToRgb(color) || this.parseRgb(color);
        if (!rgb) return 0;
        
        // Convert to relative luminance
        const rsRGB = rgb.r / 255;
        const gsRGB = rgb.g / 255;
        const bsRGB = rgb.b / 255;
        
        const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
        const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
        const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    parseRgb(rgb) {
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        return match ? {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3])
        } : null;
    }

    formatContrastResults(themeName, results) {
        let html = `<h3>${themeName.charAt(0).toUpperCase() + themeName.slice(1)} Theme</h3>`;
        
        results.forEach(result => {
            const statusClass = result.passes ? 'test-pass' : 'test-fail';
            const status = result.passes ? '✓ PASS' : '✗ FAIL';
            
            html += `
                <div class="${statusClass}">
                    <strong>${result.name}</strong> - ${status}
                    <div class="contrast-sample" style="background: ${result.background}; color: ${result.foreground};">
                        Sample text with this color combination
                    </div>
                    <div class="contrast-ratio">
                        Contrast Ratio: ${result.ratio.toFixed(2)}:1 
                        (Required: ${this.contrastThreshold}:1)
                    </div>
                </div>
            `;
        });
        
        return html;
    }

    // Screen reader compatibility tests
    async runScreenReaderTests() {
        this.log('Running screen reader compatibility tests...');
        const resultsElement = document.getElementById('screenReaderResults');
        let results = '';
        
        // Test ARIA live regions
        const liveRegionTest = this.testAriaLiveRegions();
        results += this.formatTestResult('ARIA Live Regions', liveRegionTest.passed, liveRegionTest.details);
        
        // Test theme change announcements
        const themeAnnouncementTest = await this.testThemeChangeAnnouncements();
        results += this.formatTestResult('Theme Change Announcements', themeAnnouncementTest.passed, themeAnnouncementTest.details);
        
        // Test semantic structure
        const semanticTest = this.testSemanticStructure();
        results += this.formatTestResult('Semantic Structure', semanticTest.passed, semanticTest.details);
        
        // Test ARIA labels and descriptions
        const ariaLabelsTest = this.testAriaLabels();
        results += this.formatTestResult('ARIA Labels and Descriptions', ariaLabelsTest.passed, ariaLabelsTest.details);
        
        resultsElement.innerHTML = results;
        this.log('Screen reader compatibility tests completed');
    }

    testAriaLiveRegions() {
        const liveRegions = document.querySelectorAll('[aria-live]');
        const hasLiveRegions = liveRegions.length > 0;
        
        let validRegions = 0;
        liveRegions.forEach(region => {
            const liveValue = region.getAttribute('aria-live');
            if (['polite', 'assertive', 'off'].includes(liveValue)) {
                validRegions++;
            }
        });
        
        return {
            passed: hasLiveRegions && validRegions === liveRegions.length,
            details: `Found ${liveRegions.length} live regions, ${validRegions} valid`
        };
    }

    async testThemeChangeAnnouncements() {
        // Test if theme changes are announced to screen readers
        const originalTheme = this.themeManager.getCurrentTheme();
        
        // Listen for theme change events
        let eventFired = false;
        const eventListener = () => { eventFired = true; };
        document.addEventListener('themeChanged', eventListener);
        
        // Change theme
        this.themeManager.setTheme('dark');
        await this.delay(100);
        
        // Restore original theme
        this.themeManager.setTheme(originalTheme);
        
        // Clean up
        document.removeEventListener('themeChanged', eventListener);
        
        return {
            passed: eventFired,
            details: eventFired ? 'Theme change events are fired' : 'No theme change events detected'
        };
    }

    testSemanticStructure() {
        const semanticElements = [
            'header', 'main', 'section', 'nav', 'footer',
            'h1', 'h2', 'h3', 'button', 'form', 'label'
        ];
        
        let foundElements = 0;
        let totalElements = 0;
        
        semanticElements.forEach(tag => {
            const elements = document.querySelectorAll(tag);
            if (elements.length > 0) {
                foundElements++;
            }
            totalElements++;
        });
        
        const percentage = (foundElements / totalElements) * 100;
        
        return {
            passed: percentage >= 70, // At least 70% of semantic elements should be present
            details: `${foundElements}/${totalElements} semantic elements found (${percentage.toFixed(1)}%)`
        };
    }

    testAriaLabels() {
        const interactiveElements = document.querySelectorAll('button, input, select, textarea, [role="button"], [role="listbox"]');
        let labeledElements = 0;
        
        interactiveElements.forEach(element => {
            const hasLabel = element.hasAttribute('aria-label') ||
                           element.hasAttribute('aria-labelledby') ||
                           element.hasAttribute('aria-describedby') ||
                           (element.tagName === 'INPUT' && document.querySelector(`label[for="${element.id}"]`));
            
            if (hasLabel) {
                labeledElements++;
            }
        });
        
        const percentage = interactiveElements.length > 0 ? (labeledElements / interactiveElements.length) * 100 : 100;
        
        return {
            passed: percentage >= 90, // At least 90% should have proper labels
            details: `${labeledElements}/${interactiveElements.length} interactive elements properly labeled (${percentage.toFixed(1)}%)`
        };
    }

    // Keyboard navigation tests
    async runKeyboardTests() {
        this.log('Running keyboard navigation tests...');
        const resultsElement = document.getElementById('keyboardResults');
        let results = '';
        
        // Test tab order
        const tabOrderTest = this.testTabOrder();
        results += this.formatTestResult('Tab Order', tabOrderTest.passed, tabOrderTest.details);
        
        // Test focus visibility
        const focusVisibilityTest = this.testFocusVisibility();
        results += this.formatTestResult('Focus Visibility', focusVisibilityTest.passed, focusVisibilityTest.details);
        
        // Test theme selector keyboard navigation
        const themeSelectorTest = await this.testThemeSelectorKeyboard();
        results += this.formatTestResult('Theme Selector Keyboard Navigation', themeSelectorTest.passed, themeSelectorTest.details);
        
        resultsElement.innerHTML = results;
        this.log('Keyboard navigation tests completed');
    }

    testTabOrder() {
        const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        let validTabOrder = true;
        let previousTabIndex = -1;
        
        focusableElements.forEach(element => {
            const tabIndex = parseInt(element.getAttribute('tabindex')) || 0;
            if (tabIndex > 0 && tabIndex < previousTabIndex) {
                validTabOrder = false;
            }
            if (tabIndex > 0) {
                previousTabIndex = tabIndex;
            }
        });
        
        return {
            passed: validTabOrder && focusableElements.length > 0,
            details: `${focusableElements.length} focusable elements found, tab order ${validTabOrder ? 'valid' : 'invalid'}`
        };
    }

    testFocusVisibility() {
        const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        let visibleFocusCount = 0;
        
        focusableElements.forEach(element => {
            // Temporarily focus the element to test visibility
            element.focus();
            const computedStyle = window.getComputedStyle(element);
            const hasOutline = computedStyle.outline !== 'none' && computedStyle.outline !== '';
            const hasBoxShadow = computedStyle.boxShadow !== 'none';
            const hasBorder = computedStyle.border !== 'none';
            
            if (hasOutline || hasBoxShadow || hasBorder) {
                visibleFocusCount++;
            }
        });
        
        const percentage = focusableElements.length > 0 ? (visibleFocusCount / focusableElements.length) * 100 : 100;
        
        return {
            passed: percentage >= 90,
            details: `${visibleFocusCount}/${focusableElements.length} elements have visible focus indicators (${percentage.toFixed(1)}%)`
        };
    }

    async testThemeSelectorKeyboard() {
        const themeToggle = document.getElementById('themeToggle');
        const themeDropdown = document.getElementById('themeDropdown');
        
        if (!themeToggle || !themeDropdown) {
            return {
                passed: false,
                details: 'Theme selector elements not found'
            };
        }
        
        // Test if theme toggle is focusable
        themeToggle.focus();
        const isFocused = document.activeElement === themeToggle;
        
        // Test if dropdown options are keyboard accessible
        const themeOptions = themeDropdown.querySelectorAll('.theme-option');
        let keyboardAccessible = true;
        
        themeOptions.forEach(option => {
            const tabIndex = option.getAttribute('tabindex');
            if (tabIndex === null || parseInt(tabIndex) < -1) {
                keyboardAccessible = false;
            }
        });
        
        return {
            passed: isFocused && keyboardAccessible,
            details: `Toggle focusable: ${isFocused}, Options accessible: ${keyboardAccessible}`
        };
    }

    // Calculate overall accessibility score
    calculateAccessibilityScore() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(test => test.passed).length;
        const score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        
        const scoreElement = document.getElementById('accessibilityScore');
        let scoreClass = 'score-poor';
        let scoreText = 'Poor';
        
        if (score >= 90) {
            scoreClass = 'score-excellent';
            scoreText = 'Excellent';
        } else if (score >= 75) {
            scoreClass = 'score-good';
            scoreText = 'Good';
        } else if (score >= 60) {
            scoreClass = 'score-warning';
            scoreText = 'Needs Improvement';
        }
        
        scoreElement.className = `accessibility-score ${scoreClass}`;
        scoreElement.innerHTML = `
            Accessibility Score: ${score.toFixed(1)}% (${scoreText})
            <br><small>${passedTests}/${totalTests} tests passed</small>
        `;
    }

    // Utility functions
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
function runContrastTests() {
    if (window.accessibilityTests) {
        window.accessibilityTests.runContrastTests();
    }
}

function runScreenReaderTests() {
    if (window.accessibilityTests) {
        window.accessibilityTests.runScreenReaderTests();
    }
}

function runKeyboardTests() {
    if (window.accessibilityTests) {
        window.accessibilityTests.runKeyboardTests();
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
    window.accessibilityTests = new AccessibilityTestSuite();
});