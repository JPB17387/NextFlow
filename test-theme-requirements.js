// Theme Manager Requirements Test Suite
// Tests all requirements for task 3: Build theme management JavaScript module

class ThemeRequirementsTest {
    constructor() {
        this.testResults = [];
        this.manager = null;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, message, type };
        this.testResults.push(logEntry);
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    async runAllTests() {
        this.log('Starting Theme Manager Requirements Test Suite');
        
        // Initialize theme manager
        if (typeof themeManager === 'undefined') {
            this.log('Theme manager not available', 'error');
            return false;
        }
        
        this.manager = themeManager;
        
        // Test all requirements
        await this.testRequirement1_3();
        await this.testRequirement1_4();
        await this.testRequirement1_5();
        await this.testRequirement8_1();
        await this.testRequirement8_2();
        await this.testRequirement8_3();
        await this.testRequirement8_4();
        await this.testRequirement8_5();
        
        // Additional functionality tests
        await this.testErrorHandling();
        await this.testUtilityFunctions();
        
        this.log('Test suite completed');
        this.generateReport();
        
        return this.testResults.filter(r => r.type === 'error').length === 0;
    }

    async testRequirement1_3() {
        this.log('Testing Requirement 1.3: Theme application');
        
        try {
            // Initialize theme system
            const initResult = this.manager.initializeThemeSystem();
            if (!initResult) {
                this.log('Theme system initialization failed', 'error');
                return;
            }

            // Test applying each theme
            const themes = ['white', 'dark', 'student', 'developer', 'professional'];
            
            for (const theme of themes) {
                const result = this.manager.setTheme(theme);
                if (!result) {
                    this.log(`Failed to apply theme: ${theme}`, 'error');
                    continue;
                }
                
                const currentTheme = this.manager.getCurrentTheme();
                if (currentTheme !== theme) {
                    this.log(`Theme not applied correctly. Expected: ${theme}, Got: ${currentTheme}`, 'error');
                } else {
                    this.log(`Successfully applied theme: ${theme}`, 'success');
                }
                
                // Check DOM attribute
                const dataTheme = document.documentElement.getAttribute('data-theme');
                const expectedAttr = theme === 'white' ? null : theme;
                
                if (dataTheme !== expectedAttr) {
                    this.log(`DOM attribute incorrect for ${theme}. Expected: ${expectedAttr}, Got: ${dataTheme}`, 'error');
                } else {
                    this.log(`DOM attribute correct for theme: ${theme}`, 'success');
                }
            }
            
        } catch (error) {
            this.log(`Error in requirement 1.3 test: ${error.message}`, 'error');
        }
    }

    async testRequirement1_4() {
        this.log('Testing Requirement 1.4: Theme preference saving');
        
        try {
            // Test saving theme preference
            const testTheme = 'dark';
            const saveResult = this.manager.saveThemePreference(testTheme);
            
            if (!saveResult && this.manager.isStorageAvailable()) {
                this.log('Failed to save theme preference when storage is available', 'error');
            } else if (saveResult) {
                this.log('Successfully saved theme preference', 'success');
                
                // Verify it was saved
                const savedTheme = this.manager.loadThemePreference();
                if (savedTheme !== testTheme) {
                    this.log(`Saved theme incorrect. Expected: ${testTheme}, Got: ${savedTheme}`, 'error');
                } else {
                    this.log('Theme preference correctly saved and loaded', 'success');
                }
            } else {
                this.log('Storage not available, save correctly returned false', 'success');
            }
            
        } catch (error) {
            this.log(`Error in requirement 1.4 test: ${error.message}`, 'error');
        }
    }

    async testRequirement1_5() {
        this.log('Testing Requirement 1.5: Automatic theme loading');
        
        try {
            // Save a theme preference
            const testTheme = 'student';
            this.manager.saveThemePreference(testTheme);
            
            // Simulate page reload by reinitializing
            const initResult = this.manager.initializeThemeSystem();
            if (!initResult) {
                this.log('Theme system reinitialization failed', 'error');
                return;
            }
            
            const currentTheme = this.manager.getCurrentTheme();
            if (currentTheme !== testTheme) {
                this.log(`Theme not automatically loaded. Expected: ${testTheme}, Got: ${currentTheme}`, 'error');
            } else {
                this.log('Theme automatically loaded on initialization', 'success');
            }
            
        } catch (error) {
            this.log(`Error in requirement 1.5 test: ${error.message}`, 'error');
        }
    }

    async testRequirement8_1() {
        this.log('Testing Requirement 8.1: Save preference to localStorage');
        
        try {
            if (!this.manager.isStorageAvailable()) {
                this.log('localStorage not available, skipping test', 'warning');
                return;
            }
            
            const testTheme = 'professional';
            const result = this.manager.setTheme(testTheme);
            
            if (!result) {
                this.log('Failed to set theme', 'error');
                return;
            }
            
            // Check if it was saved to localStorage
            const savedValue = localStorage.getItem(this.manager.STORAGE_KEY);
            if (savedValue !== testTheme) {
                this.log(`Theme not saved to localStorage. Expected: ${testTheme}, Got: ${savedValue}`, 'error');
            } else {
                this.log('Theme preference correctly saved to localStorage', 'success');
            }
            
        } catch (error) {
            this.log(`Error in requirement 8.1 test: ${error.message}`, 'error');
        }
    }

    async testRequirement8_2() {
        this.log('Testing Requirement 8.2: Automatic application of saved preference');
        
        try {
            if (!this.manager.isStorageAvailable()) {
                this.log('localStorage not available, skipping test', 'warning');
                return;
            }
            
            // Save a theme preference directly to localStorage
            const testTheme = 'developer';
            localStorage.setItem(this.manager.STORAGE_KEY, testTheme);
            
            // Load preference
            const loadedTheme = this.manager.loadThemePreference();
            if (loadedTheme !== testTheme) {
                this.log(`Failed to load saved preference. Expected: ${testTheme}, Got: ${loadedTheme}`, 'error');
            } else {
                this.log('Successfully loaded saved theme preference', 'success');
            }
            
        } catch (error) {
            this.log(`Error in requirement 8.2 test: ${error.message}`, 'error');
        }
    }

    async testRequirement8_3() {
        this.log('Testing Requirement 8.3: Default to white theme when no preference');
        
        try {
            // Clear any saved preference
            this.manager.clearThemePreference();
            
            // Load preference (should be null)
            const loadedTheme = this.manager.loadThemePreference();
            if (loadedTheme !== null) {
                this.log(`Expected null preference, got: ${loadedTheme}`, 'error');
                return;
            }
            
            // Initialize theme system (should default to white)
            this.manager.initializeThemeSystem();
            const currentTheme = this.manager.getCurrentTheme();
            
            if (currentTheme !== this.manager.DEFAULT_THEME) {
                this.log(`Did not default to white theme. Got: ${currentTheme}`, 'error');
            } else {
                this.log('Correctly defaulted to white theme when no preference saved', 'success');
            }
            
        } catch (error) {
            this.log(`Error in requirement 8.3 test: ${error.message}`, 'error');
        }
    }

    async testRequirement8_4() {
        this.log('Testing Requirement 8.4: Graceful fallback when localStorage unavailable');
        
        try {
            // Mock localStorage unavailability
            const originalIsStorageAvailable = this.manager.isStorageAvailable;
            this.manager.isStorageAvailable = () => false;
            
            // Try to save theme (should fail gracefully)
            const saveResult = this.manager.saveThemePreference('dark');
            if (saveResult) {
                this.log('Save should have failed when storage unavailable', 'error');
            } else {
                this.log('Correctly failed to save when storage unavailable', 'success');
            }
            
            // Try to load theme (should return null gracefully)
            const loadResult = this.manager.loadThemePreference();
            if (loadResult !== null) {
                this.log('Load should have returned null when storage unavailable', 'error');
            } else {
                this.log('Correctly returned null when storage unavailable', 'success');
            }
            
            // Restore original function
            this.manager.isStorageAvailable = originalIsStorageAvailable;
            
        } catch (error) {
            this.log(`Error in requirement 8.4 test: ${error.message}`, 'error');
        }
    }

    async testRequirement8_5() {
        this.log('Testing Requirement 8.5: Reset to default when browser data cleared');
        
        try {
            if (!this.manager.isStorageAvailable()) {
                this.log('localStorage not available, skipping test', 'warning');
                return;
            }
            
            // Set a theme and save it
            this.manager.setTheme('dark');
            
            // Simulate browser data clearing by removing the key
            localStorage.removeItem(this.manager.STORAGE_KEY);
            
            // Initialize theme system (should default to white)
            this.manager.initializeThemeSystem();
            const currentTheme = this.manager.getCurrentTheme();
            
            if (currentTheme !== this.manager.DEFAULT_THEME) {
                this.log(`Did not reset to default theme after data cleared. Got: ${currentTheme}`, 'error');
            } else {
                this.log('Correctly reset to default theme after browser data cleared', 'success');
            }
            
        } catch (error) {
            this.log(`Error in requirement 8.5 test: ${error.message}`, 'error');
        }
    }

    async testErrorHandling() {
        this.log('Testing error handling functionality');
        
        try {
            // Test invalid theme handling
            const invalidResult = this.manager.setTheme('invalid-theme');
            if (invalidResult) {
                this.log('Should have failed for invalid theme', 'error');
            } else {
                this.log('Correctly handled invalid theme', 'success');
            }
            
            // Verify fallback to default theme
            const currentTheme = this.manager.getCurrentTheme();
            if (currentTheme !== this.manager.DEFAULT_THEME) {
                this.log(`Should have fallen back to default theme, got: ${currentTheme}`, 'error');
            } else {
                this.log('Correctly fell back to default theme for invalid input', 'success');
            }
            
        } catch (error) {
            this.log(`Error in error handling test: ${error.message}`, 'error');
        }
    }

    async testUtilityFunctions() {
        this.log('Testing utility functions');
        
        try {
            // Test getAvailableThemes
            const themes = this.manager.getAvailableThemes();
            if (!Array.isArray(themes) || themes.length !== 5) {
                this.log(`Expected 5 themes, got: ${themes.length}`, 'error');
            } else {
                this.log('getAvailableThemes returns correct number of themes', 'success');
            }
            
            // Test getCurrentTheme
            const currentTheme = this.manager.getCurrentTheme();
            if (typeof currentTheme !== 'string') {
                this.log('getCurrentTheme should return a string', 'error');
            } else {
                this.log('getCurrentTheme returns correct type', 'success');
            }
            
            // Test getStatus
            const status = this.manager.getStatus();
            if (typeof status !== 'object' || !status.hasOwnProperty('initialized')) {
                this.log('getStatus should return object with initialized property', 'error');
            } else {
                this.log('getStatus returns correct format', 'success');
            }
            
        } catch (error) {
            this.log(`Error in utility functions test: ${error.message}`, 'error');
        }
    }

    generateReport() {
        const successCount = this.testResults.filter(r => r.type === 'success').length;
        const errorCount = this.testResults.filter(r => r.type === 'error').length;
        const warningCount = this.testResults.filter(r => r.type === 'warning').length;
        
        this.log(`\n=== TEST REPORT ===`);
        this.log(`Total Tests: ${this.testResults.length}`);
        this.log(`Successes: ${successCount}`);
        this.log(`Errors: ${errorCount}`);
        this.log(`Warnings: ${warningCount}`);
        
        if (errorCount === 0) {
            this.log('All requirements PASSED! ✅', 'success');
        } else {
            this.log(`${errorCount} requirements FAILED! ❌`, 'error');
        }
        
        return {
            total: this.testResults.length,
            success: successCount,
            errors: errorCount,
            warnings: warningCount,
            passed: errorCount === 0
        };
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.ThemeRequirementsTest = ThemeRequirementsTest;
}