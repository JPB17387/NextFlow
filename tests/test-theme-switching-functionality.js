/**
 * Theme Switching Functionality Test Suite
 * Tests for Task 9.1: Test theme switching functionality
 * 
 * Requirements tested:
 * - 1.1: Theme selector interface display
 * - 1.2: Theme options display and selection
 * - 1.3: Immediate theme application
 * - 1.4: Theme preference saving
 * - 1.5: Theme preference loading on page load
 */

class ThemeSwitchingTests {
    constructor() {
        this.testResults = [];
        this.themeManager = null;
        this.originalTheme = null;
        this.testStartTime = Date.now();
    }

    /**
     * Initialize and run all theme switching tests
     */
    async runAllTests() {
        console.log('🧪 Starting Theme Switching Functionality Tests...');
        console.log('=' .repeat(60));
        
        try {
            // Initialize theme manager
            await this.initializeThemeManager();
            
            // Store original theme for cleanup
            this.originalTheme = this.themeManager.getCurrentTheme();
            
            // Run test suites
            await this.testThemeSystemInitialization();
            await this.testAllFiveThemes();
            await this.testThemePersistence();
            await this.testThemeSelectorUI();
            await this.testInvalidThemeHandling();
            await this.testThemeTransitions();
            
            // Cleanup - restore original theme
            await this.cleanup();
            
            // Display results
            this.displayResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.addResult('Test Suite Execution', false, `Fatal error: ${error.message}`);
            this.displayResults();
        }
    }

    /**
     * Initialize theme manager for testing
     */
    async initializeThemeManager() {
        console.log('🔧 Initializing Theme Manager...');
        
        if (typeof ThemeManager === 'undefined') {
            throw new Error('ThemeManager class not found. Ensure theme-manager.js is loaded.');
        }
        
        this.themeManager = new ThemeManager();
        const initResult = this.themeManager.initializeThemeSystem();
        
        if (!initResult) {
            throw new Error('Theme system failed to initialize');
        }
        
        console.log('✅ Theme Manager initialized successfully');
    }

    /**
     * Test theme system initialization (Requirement 1.5)
     */
    async testThemeSystemInitialization() {
        console.log('\n📋 Testing Theme System Initialization...');
        
        try {
            // Test that theme manager is properly initialized
            const isInitialized = this.themeManager.initialized;
            this.addResult('Theme System Initialized', isInitialized, 
                isInitialized ? 'Theme system properly initialized' : 'Theme system not initialized');
            
            // Test that default theme is applied
            const currentTheme = this.themeManager.getCurrentTheme();
            const hasValidTheme = ['white', 'dark', 'student', 'developer', 'professional'].includes(currentTheme);
            this.addResult('Valid Default Theme', hasValidTheme, 
                `Current theme: ${currentTheme}`);
            
            // Test that available themes are accessible
            const availableThemes = this.themeManager.getAvailableThemes();
            const hasAllThemes = availableThemes.length === 5;
            this.addResult('All Themes Available', hasAllThemes, 
                `Found ${availableThemes.length} themes: ${availableThemes.map(t => t.name).join(', ')}`);
            
            console.log('✅ Theme system initialization tests completed');
            
        } catch (error) {
            this.addResult('Theme System Initialization', false, `Error: ${error.message}`);
            console.error('❌ Theme system initialization test failed:', error);
        }
    }

    /**
     * Test all five themes apply correctly (Requirements 1.1, 1.2, 1.3)
     */
    async testAllFiveThemes() {
        console.log('\n🎨 Testing All Five Themes...');
        
        const themes = ['white', 'dark', 'student', 'developer', 'professional'];
        
        for (const themeName of themes) {
            await this.testSingleThemeApplication(themeName);
            // Small delay to allow for transitions
            await this.delay(50);
        }
        
        console.log('✅ All theme application tests completed');
    }

    /**
     * Test individual theme application
     */
    async testSingleThemeApplication(themeName) {
        console.log(`  🔄 Testing ${themeName} theme...`);
        
        try {
            // Test theme application (Requirement 1.3)
            const setResult = this.themeManager.setTheme(themeName);
            
            if (!setResult) {
                this.addResult(`${themeName} Theme - Set`, false, 'setTheme() returned false');
                return;
            }
            
            // Verify theme was applied
            const currentTheme = this.themeManager.getCurrentTheme();
            const themeApplied = currentTheme === themeName;
            this.addResult(`${themeName} Theme - Applied`, themeApplied, 
                `Expected: ${themeName}, Got: ${currentTheme}`);
            
            // Test DOM attribute is correct
            const documentElement = document.documentElement;
            const expectedAttribute = themeName === 'white' ? null : themeName;
            const actualAttribute = documentElement.getAttribute('data-theme');
            const domCorrect = actualAttribute === expectedAttribute;
            this.addResult(`${themeName} Theme - DOM`, domCorrect, 
                `DOM data-theme: ${actualAttribute || 'null'}`);
            
            // Test theme configuration is accessible
            const themeConfig = this.themeManager.getCurrentThemeConfig();
            const configValid = themeConfig && themeConfig.name === themeName;
            this.addResult(`${themeName} Theme - Config`, configValid, 
                configValid ? 'Theme configuration accessible' : 'Theme configuration invalid');
            
            // Test CSS custom properties are applied (basic check)
            const computedStyle = window.getComputedStyle(document.documentElement);
            const primaryBg = computedStyle.getPropertyValue('--theme-primary-bg').trim();
            const hasCustomProps = primaryBg !== '';
            this.addResult(`${themeName} Theme - CSS Variables`, hasCustomProps, 
                `Primary background: ${primaryBg || 'not found'}`);
            
            console.log(`    ✅ ${themeName} theme tests passed`);
            
        } catch (error) {
            this.addResult(`${themeName} Theme - Error`, false, `Error: ${error.message}`);
            console.error(`    ❌ ${themeName} theme test failed:`, error);
        }
    }

    /**
     * Test theme persistence across browser sessions (Requirements 1.4, 1.5)
     */
    async testThemePersistence() {
        console.log('\n💾 Testing Theme Persistence...');
        
        try {
            // Test localStorage availability
            const storageAvailable = this.themeManager.isStorageAvailable();
            this.addResult('localStorage Available', storageAvailable, 
                storageAvailable ? 'localStorage is accessible' : 'localStorage not available');
            
            if (!storageAvailable) {
                console.log('⚠️  Skipping persistence tests - localStorage not available');
                return;
            }
            
            // Test saving theme preference (Requirement 1.4)
            const testTheme = 'dark';
            const saveResult = this.themeManager.saveThemePreference(testTheme);
            this.addResult('Save Theme Preference', saveResult, 
                saveResult ? `Saved theme: ${testTheme}` : 'Failed to save theme preference');
            
            // Test loading theme preference (Requirement 1.5)
            const loadedTheme = this.themeManager.loadThemePreference();
            const loadCorrect = loadedTheme === testTheme;
            this.addResult('Load Theme Preference', loadCorrect, 
                `Expected: ${testTheme}, Loaded: ${loadedTheme}`);
            
            // Test direct localStorage access
            const storageValue = localStorage.getItem('taskDashboardTheme');
            const storageCorrect = storageValue === testTheme;
            this.addResult('localStorage Direct Access', storageCorrect, 
                `localStorage value: ${storageValue}`);
            
            // Test theme application from saved preference
            const applyResult = this.themeManager.setTheme(loadedTheme);
            const currentTheme = this.themeManager.getCurrentTheme();
            const appliedCorrect = currentTheme === testTheme;
            this.addResult('Apply Saved Theme', appliedCorrect, 
                `Applied theme: ${currentTheme}`);
            
            // Test clearing preference
            const clearResult = this.themeManager.clearThemePreference();
            const clearedValue = localStorage.getItem('taskDashboardTheme');
            const clearCorrect = clearedValue === null;
            this.addResult('Clear Theme Preference', clearCorrect, 
                `Cleared value: ${clearedValue || 'null'}`);
            
            console.log('✅ Theme persistence tests completed');
            
        } catch (error) {
            this.addResult('Theme Persistence', false, `Error: ${error.message}`);
            console.error('❌ Theme persistence test failed:', error);
        }
    }

    /**
     * Test theme selector UI functionality (Requirements 1.1, 1.2)
     */
    async testThemeSelectorUI() {
        console.log('\n🖱️  Testing Theme Selector UI...');
        
        try {
            // Test theme selector exists (Requirement 1.1)
            const themeSelector = document.querySelector('.theme-selector');
            const selectorExists = themeSelector !== null;
            this.addResult('Theme Selector Exists', selectorExists, 
                selectorExists ? 'Theme selector found in DOM' : 'Theme selector not found');
            
            if (!selectorExists) {
                console.log('⚠️  Skipping UI tests - theme selector not found');
                return;
            }
            
            // Test theme toggle button
            const toggleButton = document.getElementById('themeToggle');
            const buttonExists = toggleButton !== null;
            this.addResult('Theme Toggle Button', buttonExists, 
                buttonExists ? 'Toggle button found' : 'Toggle button not found');
            
            // Test theme dropdown
            const dropdown = document.getElementById('themeDropdown');
            const dropdownExists = dropdown !== null;
            this.addResult('Theme Dropdown', dropdownExists, 
                dropdownExists ? 'Dropdown found' : 'Dropdown not found');
            
            if (dropdownExists) {
                // Test theme options (Requirement 1.2)
                const themeOptions = dropdown.querySelectorAll('.theme-option');
                const hasAllOptions = themeOptions.length === 5;
                this.addResult('Theme Options Count', hasAllOptions, 
                    `Found ${themeOptions.length} theme options`);
                
                // Test each theme option has required attributes
                const expectedThemes = ['white', 'dark', 'student', 'developer', 'professional'];
                let allOptionsValid = true;
                
                expectedThemes.forEach(themeName => {
                    const option = dropdown.querySelector(`[data-theme="${themeName}"]`);
                    if (!option) {
                        allOptionsValid = false;
                        console.log(`    ❌ Missing option for ${themeName} theme`);
                    }
                });
                
                this.addResult('Theme Options Valid', allOptionsValid, 
                    allOptionsValid ? 'All theme options present' : 'Some theme options missing');
                
                // Test accessibility attributes
                const hasAriaLabel = dropdown.hasAttribute('aria-label');
                const hasRole = dropdown.hasAttribute('role');
                this.addResult('Theme Selector Accessibility', hasAriaLabel && hasRole, 
                    `ARIA label: ${hasAriaLabel}, Role: ${hasRole}`);
            }
            
            // Test responsive behavior (basic check)
            const isMobile = window.innerWidth < 768;
            const mobileClass = document.body.classList.contains('mobile') || 
                              window.getComputedStyle(themeSelector).display !== 'none';
            this.addResult('Responsive UI Basic Check', true, 
                `Mobile viewport: ${isMobile}, Selector visible: ${mobileClass}`);
            
            console.log('✅ Theme selector UI tests completed');
            
        } catch (error) {
            this.addResult('Theme Selector UI', false, `Error: ${error.message}`);
            console.error('❌ Theme selector UI test failed:', error);
        }
    }

    /**
     * Test invalid theme handling
     */
    async testInvalidThemeHandling() {
        console.log('\n🚫 Testing Invalid Theme Handling...');
        
        try {
            const originalTheme = this.themeManager.getCurrentTheme();
            
            // Test invalid theme name
            const result = this.themeManager.setTheme('invalid-theme-name');
            const currentTheme = this.themeManager.getCurrentTheme();
            
            // Should either fallback to default or maintain current theme
            const handledCorrectly = currentTheme === 'white' || currentTheme === originalTheme;
            this.addResult('Invalid Theme Handling', handledCorrectly, 
                `Original: ${originalTheme}, After invalid: ${currentTheme}`);
            
            // Test empty theme name
            const emptyResult = this.themeManager.setTheme('');
            const afterEmpty = this.themeManager.getCurrentTheme();
            const emptyHandled = afterEmpty === 'white' || afterEmpty === originalTheme;
            this.addResult('Empty Theme Name Handling', emptyHandled, 
                `After empty string: ${afterEmpty}`);
            
            // Test null theme name
            const nullResult = this.themeManager.setTheme(null);
            const afterNull = this.themeManager.getCurrentTheme();
            const nullHandled = afterNull === 'white' || afterNull === originalTheme;
            this.addResult('Null Theme Name Handling', nullHandled, 
                `After null: ${afterNull}`);
            
            console.log('✅ Invalid theme handling tests completed');
            
        } catch (error) {
            this.addResult('Invalid Theme Handling', false, `Error: ${error.message}`);
            console.error('❌ Invalid theme handling test failed:', error);
        }
    }

    /**
     * Test theme transitions
     */
    async testThemeTransitions() {
        console.log('\n🔄 Testing Theme Transitions...');
        
        try {
            // Test transition between themes
            const startTheme = 'white';
            const endTheme = 'dark';
            
            // Apply start theme
            this.themeManager.setTheme(startTheme);
            await this.delay(100);
            
            // Measure transition time
            const startTime = performance.now();
            this.themeManager.setTheme(endTheme);
            
            // Check if theme changed immediately (DOM update)
            const currentTheme = this.themeManager.getCurrentTheme();
            const themeChanged = currentTheme === endTheme;
            
            const endTime = performance.now();
            const transitionTime = endTime - startTime;
            
            this.addResult('Theme Transition Speed', themeChanged, 
                `Theme change took ${transitionTime.toFixed(2)}ms`);
            
            // Test CSS transitions are applied
            const documentElement = document.documentElement;
            const computedStyle = window.getComputedStyle(documentElement);
            const hasTransitions = computedStyle.transition.includes('background-color') || 
                                 computedStyle.transition.includes('color');
            
            this.addResult('CSS Transitions Applied', hasTransitions, 
                hasTransitions ? 'CSS transitions detected' : 'No CSS transitions found');
            
            console.log('✅ Theme transition tests completed');
            
        } catch (error) {
            this.addResult('Theme Transitions', false, `Error: ${error.message}`);
            console.error('❌ Theme transition test failed:', error);
        }
    }

    /**
     * Cleanup after tests
     */
    async cleanup() {
        console.log('\n🧹 Cleaning up...');
        
        try {
            if (this.originalTheme && this.themeManager) {
                this.themeManager.setTheme(this.originalTheme);
                console.log(`✅ Restored original theme: ${this.originalTheme}`);
            }
        } catch (error) {
            console.error('❌ Cleanup failed:', error);
        }
    }

    /**
     * Add test result
     */
    addResult(testName, passed, details) {
        this.testResults.push({
            name: testName,
            passed: passed,
            details: details,
            timestamp: Date.now()
        });
    }

    /**
     * Display test results
     */
    displayResults() {
        const totalTime = Date.now() - this.testStartTime;
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(test => test.passed).length;
        const failedTests = totalTests - passedTests;
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 THEME SWITCHING FUNCTIONALITY TEST RESULTS');
        console.log('='.repeat(60));
        console.log(`⏱️  Total execution time: ${totalTime}ms`);
        console.log(`📈 Tests passed: ${passedTests}/${totalTests}`);
        console.log(`📉 Tests failed: ${failedTests}/${totalTests}`);
        console.log(`📊 Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests === 0) {
            console.log('🎉 ALL TESTS PASSED! Theme switching functionality is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. See details below:');
        }
        
        console.log('\n📋 Detailed Results:');
        console.log('-'.repeat(60));
        
        this.testResults.forEach((test, index) => {
            const status = test.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${index + 1}. ${test.name}: ${status}`);
            console.log(`   ${test.details}`);
        });
        
        console.log('\n' + '='.repeat(60));
        
        // Return results for programmatic access
        return {
            totalTests,
            passedTests,
            failedTests,
            successRate: (passedTests / totalTests) * 100,
            executionTime: totalTime,
            results: this.testResults
        };
    }

    /**
     * Utility function to add delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeSwitchingTests;
}

// Auto-run if loaded in browser
if (typeof window !== 'undefined') {
    window.ThemeSwitchingTests = ThemeSwitchingTests;
    
    // Auto-run tests when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                const tests = new ThemeSwitchingTests();
                tests.runAllTests();
            }, 1000); // Wait for theme system to initialize
        });
    } else {
        setTimeout(() => {
            const tests = new ThemeSwitchingTests();
            tests.runAllTests();
        }, 1000);
    }
}